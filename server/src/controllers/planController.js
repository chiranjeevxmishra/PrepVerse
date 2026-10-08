import StudentProfile from '../models/StudentProfile.js';
import PreparationTask from '../models/PreparationTask.js';
import { getOrGenerateTodaysPlan, markTaskCompleted } from '../services/planService.js';
import mongoose from 'mongoose';

/**
 * @route   GET /api/v1/plan/today
 * @desc    Get or deterministically generate today's preparation plan
 * @access  Private
 */
export const getTodaysPlan = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id });
    const hasAssessment = profile?.readinessScore !== null && profile?.readinessScore !== undefined;
    const tasks = hasAssessment ? await getOrGenerateTodaysPlan(req.user, profile) : [];

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const percentComplete = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const totalMinutes = tasks.reduce((acc, t) => acc + (t.estimatedTimeMinutes || 0), 0);
    const completedMinutes = tasks
      .filter((t) => t.status === 'completed')
      .reduce((acc, t) => acc + (t.estimatedTimeMinutes || 0), 0);

    return res.status(200).json({
      success: true,
      date: new Date().toISOString().split('T')[0],
      tasks,
      stats: {
        totalTasks,
        completedTasks,
        percentComplete,
        totalMinutes,
        completedMinutes,
      },
      profile: {
        readinessScore: profile?.readinessScore ?? null,
        categoryScores: profile?.categoryScores ?? null,
        tasksCompletedCount: profile?.tasksCompletedCount || 0,
      },
      requiresAssessment: !hasAssessment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/v1/plan/tasks/:id/complete
 * @desc    Persist task completion without changing assessment-based readiness
 * @access  Private
 */
export const completeTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid task ID.' });
    }
    const result = await markTaskCompleted(req.user._id, id);

    return res.status(200).json({
      success: true,
      message: 'Task completion saved.',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/plan/history
 * @desc    Get historical completed tasks and progress stats
 * @access  Private
 */
export const getPlanHistory = async (req, res, next) => {
  try {
    const completedTasks = await PreparationTask.find({
      user: req.user._id,
      status: 'completed',
    })
      .sort({ completedAt: -1 })
      .limit(50);

    const profile = await StudentProfile.findOne({ user: req.user._id });

    return res.status(200).json({
      success: true,
      count: completedTasks.length,
      tasks: completedTasks,
      totalCompleted: profile?.tasksCompletedCount || completedTasks.length,
    });
  } catch (error) {
    next(error);
  }
};
