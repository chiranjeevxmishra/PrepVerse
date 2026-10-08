import StudentProfile from '../models/StudentProfile.js';
import { rankPeerMatches } from '../services/peerMatchingService.js';

const respondError = (res, status, message) => res.status(status).json({ success: false, message });
const uniqueStrings = (values, maxLength) => [...new Set(values.map((value) => value.trim()).filter(Boolean))]
  .map((value) => value.slice(0, maxLength));

export const getPeerProfile = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id }).select('targetRole learningInterests peerSkills');
    if (!profile) return res.status(200).json({ success: true, profile: null });
    return res.status(200).json({ success: true, profile: {
      targetRole: profile.targetRole,
      learningInterests: profile.learningInterests,
      peerSkills: profile.peerSkills,
    } });
  } catch (error) { return next(error); }
};

export const updatePeerProfile = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id });
    if (!profile) return respondError(res, 404, 'Complete onboarding before setting up your peer profile.');
    const rawInterests = req.body?.learningInterests;
    const rawSkills = req.body?.peerSkills;
    if (!Array.isArray(rawInterests) || rawInterests.length > 10) return respondError(res, 400, 'Provide up to 10 learning interests.');
    if (!Array.isArray(rawSkills) || rawSkills.length > 12) return respondError(res, 400, 'Provide up to 12 skill ratings.');
    if (rawInterests.some((item) => typeof item !== 'string' || item.trim().length > 40)) return respondError(res, 400, 'Each interest must be 40 characters or fewer.');
    if (rawSkills.some((skill) => !skill || typeof skill.name !== 'string' || !skill.name.trim() || skill.name.trim().length > 40 || !Number.isInteger(skill.score) || skill.score < 0 || skill.score > 100)) {
      return respondError(res, 400, 'Skills need a name and a whole-number rating from 0 to 100.');
    }
    const learningInterests = uniqueStrings(rawInterests, 40);
    const bySkill = new Map();
    rawSkills.forEach((skill) => bySkill.set(skill.name.trim().toLowerCase(), { name: skill.name.trim(), score: skill.score }));
    profile.learningInterests = learningInterests;
    profile.peerSkills = [...bySkill.values()];
    await profile.save();
    return res.status(200).json({ success: true, profile: {
      targetRole: profile.targetRole,
      learningInterests: profile.learningInterests,
      peerSkills: profile.peerSkills,
    } });
  } catch (error) { return next(error); }
};

export const getPeerMatches = async (req, res, next) => {
  try {
    const myProfile = await StudentProfile.findOne({ user: req.user._id });
    if (!myProfile) return respondError(res, 404, 'Complete onboarding before looking for peer matches.');
    const limitValue = Number.parseInt(req.query.limit, 10);
    const limit = Number.isInteger(limitValue) ? Math.min(20, Math.max(1, limitValue)) : 10;
    const candidates = await StudentProfile.find({ user: { $ne: req.user._id } })
      .populate('user', 'name avatar')
      .select('user targetRole learningInterests peerSkills categoryScores selfAssessment strongAreas weakAreas');
    const matches = rankPeerMatches(myProfile, candidates.filter((profile) => profile.user), limit);
    return res.status(200).json({ success: true, count: matches.length, matches,
      scoring: '16 points per complementary strength/learning-area pair, 15 for the same target role, and 7 per shared interest (up to three). Only positive scores are shown.' });
  } catch (error) { return next(error); }
};

export default { getPeerProfile, updatePeerProfile, getPeerMatches };
