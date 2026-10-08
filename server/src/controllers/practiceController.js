import mongoose from 'mongoose';
import {
  completePracticeSession,
  getPracticeSession,
  isValidPracticeCategory,
  listPracticeSessions,
  startPracticeSession,
  submitPracticeAnswer,
} from '../services/practiceService.js';

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];
const DURATIONS = [10, 15, 20];
const MAX_ANSWER_LENGTH = 4000;

export const startSession = async (req, res, next) => {
  try {
    const { category, difficulty, durationMinutes } = req.body || {};
    if (!isValidPracticeCategory(category)) {
      return res.status(400).json({ success: false, message: 'Choose a supported practice category.' });
    }
    if (!DIFFICULTIES.includes(difficulty)) {
      return res.status(400).json({ success: false, message: 'Choose Beginner, Intermediate, or Advanced difficulty.' });
    }
    if (!DURATIONS.includes(durationMinutes)) {
      return res.status(400).json({ success: false, message: 'Duration must be 10, 15, or 20 minutes.' });
    }
    const result = await startPracticeSession({ userId: req.user._id, category, difficulty, durationMinutes });
    return res.status(201).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const submitAnswer = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid practice session ID.' });
    }
    const { questionId, answer } = req.body || {};
    if (typeof questionId !== 'string' || !questionId.trim() || questionId.length > 100) {
      return res.status(400).json({ success: false, message: 'Provide a valid current question ID.' });
    }
    if (typeof answer !== 'string' || !answer.trim()) {
      return res.status(400).json({ success: false, message: 'Answer cannot be empty.' });
    }
    if (answer.length > MAX_ANSWER_LENGTH) {
      return res.status(413).json({ success: false, message: `Answer must be ${MAX_ANSWER_LENGTH} characters or fewer.` });
    }
    const result = await submitPracticeAnswer({ userId: req.user._id, sessionId: id, questionId: questionId.trim(), answer });
    if (!result) return res.status(404).json({ success: false, message: 'Practice session not found.' });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const completeSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid practice session ID.' });
    }
    const session = await completePracticeSession({ userId: req.user._id, sessionId: id });
    if (!session) return res.status(404).json({ success: false, message: 'Practice session not found.' });
    return res.status(200).json({ success: true, session });
  } catch (error) {
    next(error);
  }
};

export const getSessions = async (req, res, next) => {
  try {
    const sessions = await listPracticeSessions(req.user._id);
    return res.status(200).json({ success: true, count: sessions.length, sessions });
  } catch (error) {
    next(error);
  }
};

export const getSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid practice session ID.' });
    }
    const session = await getPracticeSession({ userId: req.user._id, sessionId: id });
    if (!session) return res.status(404).json({ success: false, message: 'Practice session not found.' });
    return res.status(200).json({ success: true, session });
  } catch (error) {
    next(error);
  }
};
