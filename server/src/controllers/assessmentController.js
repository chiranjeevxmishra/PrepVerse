import AssessmentQuestion from '../models/AssessmentQuestion.js';
import AssessmentAttempt from '../models/AssessmentAttempt.js';
import StudentProfile from '../models/StudentProfile.js';
import User from '../models/User.js';
import { calculateReadinessScore } from '../services/readinessService.js';

/**
 * @route   GET /api/v1/assessment/questions
 * @desc    Fetch questions for initial diagnostic assessment (omits answers)
 * @access  Private
 */
export const getAssessmentQuestions = async (req, res, next) => {
  try {
    // Select questions while explicitly excluding correctAnswer and explanation
    const questions = await AssessmentQuestion.find()
      .select('-correctAnswer -explanation')
      .sort({ category: 1 });

    return res.status(200).json({
      success: true,
      count: questions.length,
      questions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/assessment/submit
 * @desc    Submit student assessment answers, grade, and compute readiness score
 * @access  Private
 */
export const submitAssessment = async (req, res, next) => {
  try {
    const { answers } = req.body; // [{ questionId, selectedOption }, ...]

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of answered questions.',
      });
    }

    // Retrieve all referenced questions from DB with correct answers
    const questionIds = answers.map((a) => a.questionId);
    const questionsInDb = await AssessmentQuestion.find({
      _id: { $in: questionIds },
    }).select('+correctAnswer +explanation');

    const questionMap = new Map();
    questionsInDb.forEach((q) => questionMap.set(q._id.toString(), q));

    // Grade answers and record results
    const gradedAnswers = [];
    const questionResults = [];
    let correctCount = 0;

    answers.forEach((ans) => {
      const q = questionMap.get(ans.questionId.toString());
      if (q) {
        const isCorrect = q.correctAnswer === ans.selectedOption;
        if (isCorrect) correctCount++;

        gradedAnswers.push({
          questionId: q._id,
          selectedOption: ans.selectedOption,
          isCorrect,
        });

        questionResults.push({
          questionId: q._id,
          category: q.category,
          isCorrect,
        });
      }
    });

    const totalQuestions = gradedAnswers.length;
    const testAccuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    // Fetch student's profile for self-assessment and practical project factors
    let profile = await StudentProfile.findOne({ user: req.user._id });
    if (!profile) {
      // Auto-create default profile if user skipped directly to assessment
      profile = await StudentProfile.create({
        user: req.user._id,
        targetRole: 'Software Development Engineer (SDE)',
        graduationYear: 2026,
      });
    }

    // Calculate deterministic Placement Readiness Score
    const calculatedMetrics = calculateReadinessScore({
      questionResults,
      selfAssessment: profile.selfAssessment || {},
      projectsCount: profile.projectsCount || 1,
      dailyPrepTimeHours: profile.dailyPrepTimeHours || 2,
    });

    // Update StudentProfile with computed readiness metrics
    profile.readinessScore = calculatedMetrics.overallReadiness;
    profile.categoryScores = calculatedMetrics.categoryScores;
    profile.strongAreas = calculatedMetrics.strongAreas;
    profile.weakAreas = calculatedMetrics.weakAreas;
    profile.recommendations = calculatedMetrics.recommendations;
    await profile.save();

    // Record assessment attempt
    const attempt = await AssessmentAttempt.create({
      user: req.user._id,
      answers: gradedAnswers,
      score: testAccuracy,
      correctCount,
      totalQuestions,
      categoryScores: calculatedMetrics.categoryScores,
      overallReadiness: calculatedMetrics.overallReadiness,
    });

    // Mark user assessment completed flag
    await User.findByIdAndUpdate(req.user._id, { hasCompletedAssessment: true });

    return res.status(200).json({
      success: true,
      message: 'Assessment completed and readiness score calculated.',
      attempt: {
        id: attempt._id,
        score: testAccuracy,
        correctCount,
        totalQuestions,
      },
      metrics: calculatedMetrics,
      profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/assessment/results
 * @desc    Get student's latest assessment results
 * @access  Private
 */
export const getLatestResults = async (req, res, next) => {
  try {
    const latestAttempt = await AssessmentAttempt.findOne({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('answers.questionId', 'question options category difficulty explanation');

    const profile = await StudentProfile.findOne({ user: req.user._id });

    if (!latestAttempt) {
      return res.status(404).json({
        success: false,
        message: 'No assessment attempts found for this student.',
      });
    }

    return res.status(200).json({
      success: true,
      attempt: latestAttempt,
      profile,
    });
  } catch (error) {
    next(error);
  }
};
