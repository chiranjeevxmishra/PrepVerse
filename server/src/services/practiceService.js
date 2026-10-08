import { PRACTICE_CATEGORIES, selectPracticeQuestions } from '../config/practiceQuestionBank.js';
import PracticeSession from '../models/PracticeSession.js';

const QUESTION_COUNT_BY_DURATION = { 10: 3, 15: 4, 20: 5 };

const CATEGORY_NEXT_STEPS = {
  DSA: 'Review the missing DSA concepts, then solve one related problem and explain its complexity.',
  DBMS: 'Review the missing DBMS concepts, then practice a query or schema example.',
  OS: 'Review the missing OS concepts and explain them with a process or memory example.',
  Networking: 'Review the missing networking concepts and trace a request or protocol exchange.',
  OOP: 'Review the missing OOP concepts and demonstrate them in a small class design.',
  JavaScript: 'Review the missing JavaScript concepts and write a small runnable example.',
  Interview: 'Practice a concise answer using a specific situation, your actions, and the outcome.',
};

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const containsTerm = (text, term) => {
  const escaped = escapeRegex(term.toLowerCase());
  return new RegExp(`(^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`, 'i').test(text);
};

export const evaluatePracticeAnswer = ({ answer, expectedConcepts }) => {
  const normalizedAnswer = answer.trim().toLowerCase();
  const wordCount = normalizedAnswer.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)?.length || 0;
  const matchedConcepts = expectedConcepts
    .filter((item) => item.keywords.some((keyword) => containsTerm(normalizedAnswer, keyword)))
    .map((item) => item.name);
  const missingConcepts = expectedConcepts
    .filter((item) => !matchedConcepts.includes(item.name))
    .map((item) => item.name);
  const coverage = expectedConcepts.length ? Math.round((matchedConcepts.length / expectedConcepts.length) * 100) : 0;
  const clarity = wordCount === 0 ? 0 : wordCount >= 30 ? 90 : wordCount >= 15 ? 80 : wordCount >= 8 ? 65 : 45;
  const technicalUnderstanding = Math.round(coverage * 0.85 + clarity * 0.15);
  const score = Math.round(technicalUnderstanding * 0.6 + coverage * 0.25 + clarity * 0.15);
  const feedback = missingConcepts.length
    ? `You covered ${matchedConcepts.length} of ${expectedConcepts.length} target concepts. Consider adding: ${missingConcepts.join(', ')}.`
    : 'You covered the target concepts. Add a concrete example or trade-off to make the explanation more specific.';

  return { score, technicalUnderstanding, coverage, clarity, matchedConcepts, missingConcepts, feedback };
};

const toQuestionResponse = (session, questionIndex) => {
  const question = session.questions[questionIndex];
  if (!question) return null;
  const result = {
    questionId: question.questionId,
    question: question.question,
    category: session.category,
    difficulty: session.difficulty,
    questionNumber: questionIndex + 1,
    totalQuestions: session.questions.length,
  };
  if (question.answer) {
    result.answer = question.answer;
    result.evaluation = question.evaluation;
  }
  return result;
};

export const toPracticeSessionResponse = (session) => ({
  id: session._id,
  category: session.category,
  difficulty: session.difficulty,
  durationMinutes: session.durationMinutes,
  status: session.status,
  currentQuestionIndex: session.currentQuestionIndex,
  totalQuestions: session.questions.length,
  startedAt: session.startedAt,
  completedAt: session.completedAt,
  overallScore: session.overallScore,
  categoryScores: session.categoryScores,
  strengths: session.strengths,
  improvements: session.improvements,
  recommendedNextSteps: session.recommendedNextSteps,
  questions: session.questions.map((_, index) => toQuestionResponse(session, index)),
});

export const startPracticeSession = async ({ userId, category, difficulty, durationMinutes }) => {
  const count = QUESTION_COUNT_BY_DURATION[durationMinutes];
  const rotation = await PracticeSession.countDocuments({ user: userId, category, difficulty });
  const selected = selectPracticeQuestions({ category, difficulty, count, rotation });
  if (selected.length !== count) {
    const error = new Error('No practice questions are available for this selection.');
    error.statusCode = 422;
    throw error;
  }

  const session = await PracticeSession.create({
    user: userId,
    category,
    difficulty,
    durationMinutes,
    questions: selected,
  });
  const sessionSummary = toPracticeSessionResponse(session);
  delete sessionSummary.questions;
  return {
    session: sessionSummary,
    currentQuestion: toQuestionResponse(session, 0),
  };
};

export const submitPracticeAnswer = async ({ userId, sessionId, questionId, answer }) => {
  const session = await PracticeSession.findOne({ _id: sessionId, user: userId });
  if (!session) return null;
  if (session.status !== 'in_progress') {
    const error = new Error('This practice session is already complete.');
    error.statusCode = 409;
    throw error;
  }
  const question = session.questions[session.currentQuestionIndex];
  if (!question || question.questionId !== questionId) {
    const error = new Error('Answer the current question in this session.');
    error.statusCode = 409;
    throw error;
  }
  question.answer = answer.trim();
  question.evaluation = evaluatePracticeAnswer({ answer: question.answer, expectedConcepts: question.expectedConcepts });
  question.answeredAt = new Date();
  session.currentQuestionIndex += 1;
  await session.save();

  return {
    evaluation: question.evaluation,
    questionNumber: session.currentQuestionIndex,
    totalQuestions: session.questions.length,
    isLastQuestion: session.currentQuestionIndex === session.questions.length,
    nextQuestion: toQuestionResponse(session, session.currentQuestionIndex),
  };
};

export const completePracticeSession = async ({ userId, sessionId }) => {
  const session = await PracticeSession.findOne({ _id: sessionId, user: userId });
  if (!session) return null;
  if (session.status === 'completed') return toPracticeSessionResponse(session);

  for (const question of session.questions) {
    if (!question.answer) {
      question.evaluation = {
        score: 0,
        technicalUnderstanding: 0,
        coverage: 0,
        clarity: 0,
        matchedConcepts: [],
        missingConcepts: question.expectedConcepts.map((item) => item.name),
        feedback: 'No answer was submitted for this question.',
      };
    }
  }

  const average = (key) => Math.round(
    session.questions.reduce((sum, question) => sum + question.evaluation[key], 0) / session.questions.length
  );
  const categoryScores = {
    technicalUnderstanding: average('technicalUnderstanding'),
    coverage: average('coverage'),
    clarity: average('clarity'),
  };
  session.overallScore = Math.round(
    categoryScores.technicalUnderstanding * 0.6 + categoryScores.coverage * 0.25 + categoryScores.clarity * 0.15
  );

  const matched = [...new Set(session.questions.flatMap((question) => question.evaluation.matchedConcepts))];
  const missing = [...new Set(session.questions.flatMap((question) => question.evaluation.missingConcepts))];
  session.strengths = matched.slice(0, 5).map((name) => `Mentioned ${name}`);
  session.improvements = [
    ...session.questions.flatMap((question, index) => question.answer
      ? question.evaluation.missingConcepts.map((name) => `Question ${index + 1}: include ${name}.`)
      : [`Question ${index + 1} was unanswered.`]),
  ].slice(0, 5);
  session.recommendedNextSteps = missing.length
    ? [`Review these ${session.category} concepts: ${missing.slice(0, 3).join(', ')}.`, CATEGORY_NEXT_STEPS[session.category]]
    : [CATEGORY_NEXT_STEPS[session.category]];
  session.status = 'completed';
  session.completedAt = new Date();
  await session.save();
  return toPracticeSessionResponse(session);
};

export const listPracticeSessions = async (userId) => {
  const sessions = await PracticeSession.find({ user: userId }).sort({ startedAt: -1 }).limit(50);
  return sessions.map((session) => ({
    id: session._id,
    category: session.category,
    difficulty: session.difficulty,
    durationMinutes: session.durationMinutes,
    status: session.status,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    overallScore: session.overallScore,
    totalQuestions: session.questions.length,
  }));
};

export const getPracticeSession = async ({ userId, sessionId }) => {
  const session = await PracticeSession.findOne({ _id: sessionId, user: userId });
  return session ? toPracticeSessionResponse(session) : null;
};

export const isValidPracticeCategory = (category) => PRACTICE_CATEGORIES.includes(category);

export default {
  startPracticeSession,
  submitPracticeAnswer,
  completePracticeSession,
  listPracticeSessions,
  getPracticeSession,
};
