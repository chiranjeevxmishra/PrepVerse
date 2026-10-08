import StudentProfile from '../models/StudentProfile.js';
import User from '../models/User.js';

/**
 * @route   GET /api/v1/profile/me
 * @desc    Get currently logged in student profile
 * @access  Private
 */
export const getMyProfile = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id }).populate(
      'user',
      'name email avatar role hasCompletedOnboarding hasCompletedAssessment'
    );

    if (!profile) {
      return res.status(200).json({
        success: true,
        profile: null,
        hasCompletedOnboarding: false,
      });
    }

    return res.status(200).json({
      success: true,
      profile,
      hasCompletedOnboarding: true,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/profile/onboarding
 * @desc    Save initial onboarding information for student
 * @access  Private
 */
export const saveOnboarding = async (req, res, next) => {
  try {
    const {
      targetRole,
      graduationYear,
      targetCompanies,
      languages,
      selfAssessment,
      projectsCount,
      dailyPrepTimeHours,
    } = req.body;

    if (!targetRole || !graduationYear) {
      return res.status(400).json({
        success: false,
        message: 'Please provide target role and graduation year.',
      });
    }

    // Upsert student profile
    let profile = await StudentProfile.findOne({ user: req.user._id });

    if (profile) {
      profile.targetRole = targetRole;
      profile.graduationYear = graduationYear;
      if (targetCompanies) profile.targetCompanies = targetCompanies;
      if (languages) profile.languages = languages;
      if (selfAssessment) profile.selfAssessment = selfAssessment;
      if (projectsCount !== undefined) profile.projectsCount = projectsCount;
      if (dailyPrepTimeHours !== undefined) profile.dailyPrepTimeHours = dailyPrepTimeHours;
      await profile.save();
    } else {
      profile = await StudentProfile.create({
        user: req.user._id,
        targetRole,
        graduationYear,
        targetCompanies: targetCompanies || ['Product Companies'],
        languages: languages || ['JavaScript', 'C++'],
        selfAssessment: selfAssessment || {},
        projectsCount: projectsCount ?? 1,
        dailyPrepTimeHours: dailyPrepTimeHours ?? 2,
      });
    }

    // Update user onboarding completed flag
    await User.findByIdAndUpdate(req.user._id, { hasCompletedOnboarding: true });

    return res.status(200).json({
      success: true,
      message: 'Onboarding completed successfully.',
      profile,
    });
  } catch (error) {
    next(error);
  }
};
