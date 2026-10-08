import mongoose from 'mongoose';
import {
  addRecommendationToPreparationPlan,
  analyzeJobDescription,
  deleteJobAnalysis,
  getJobAnalysis,
  listJobAnalyses,
} from '../services/jobAnalysisService.js';

const MAX_DESCRIPTION_LENGTH = 12000;

const validateOptionalText = (value, field, maxLength) => {
  if (value === undefined) return null;
  if (typeof value !== 'string') return `${field} must be text.`;
  if (value.trim().length > maxLength) return `${field} must be ${maxLength} characters or fewer.`;
  return null;
};

export const analyzeJob = async (req, res, next) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ success: false, message: 'Provide a job description to analyze.' });
    }
    const description = body.description ?? body.rawDescription;
    if (typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Job description cannot be empty.' });
    }
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      return res.status(413).json({ success: false, message: `Job description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.` });
    }
    const titleError = validateOptionalText(body.title, 'Role title', 160);
    const companyError = validateOptionalText(body.company, 'Company', 120);
    if (titleError || companyError) {
      return res.status(400).json({ success: false, message: titleError || companyError });
    }

    const title = body.title?.trim() || description.trim().split(/\r?\n/).find(Boolean)?.trim().slice(0, 160) || '';
    const analysis = await analyzeJobDescription({
      userId: req.user._id,
      title,
      company: body.company?.trim() || '',
      description: description.trim(),
    });
    return res.status(201).json({ success: true, analysis });
  } catch (error) {
    next(error);
  }
};

export const getAnalyses = async (req, res, next) => {
  try {
    const analyses = await listJobAnalyses(req.user._id);
    return res.status(200).json({ success: true, count: analyses.length, analyses });
  } catch (error) {
    next(error);
  }
};

export const getAnalysis = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid job analysis ID.' });
    }
    const analysis = await getJobAnalysis(req.user._id, req.params.id);
    if (!analysis) return res.status(404).json({ success: false, message: 'Job analysis not found.' });
    return res.status(200).json({ success: true, analysis });
  } catch (error) {
    next(error);
  }
};

export const removeAnalysis = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid job analysis ID.' });
    }
    const analysis = await deleteJobAnalysis(req.user._id, req.params.id);
    if (!analysis) return res.status(404).json({ success: false, message: 'Job analysis not found.' });
    return res.status(200).json({ success: true, message: 'Job analysis deleted.' });
  } catch (error) {
    next(error);
  }
};

export const addRecommendationToPlan = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid job analysis ID.' });
    }
    const recommendationIndex = Number(req.params.recommendationIndex);
    if (!Number.isInteger(recommendationIndex) || recommendationIndex < 0) {
      return res.status(400).json({ success: false, message: 'Invalid recommendation index.' });
    }
    const result = await addRecommendationToPreparationPlan({
      userId: req.user._id,
      analysisId: req.params.id,
      recommendationIndex,
    });
    return res.status(result.alreadyAdded ? 200 : 201).json({
      success: true,
      message: result.alreadyAdded ? 'Recommendation is already in today’s plan.' : 'Recommendation added to today’s plan.',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};
