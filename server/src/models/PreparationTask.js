import mongoose from 'mongoose';

const preparationTaskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['DSA', 'OOP', 'DBMS', 'OS', 'Networking', 'Interview', 'Projects', 'Fundamentals'],
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium',
    },
    priority: {
      type: String,
      required: true,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium',
    },
    estimatedTimeMinutes: {
      type: Number,
      required: true,
      min: 15,
      max: 180,
      default: 45,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    actionTip: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
    },
    completedAt: {
      type: Date,
      default: null,
    },
    date: {
      type: String, // Format: YYYY-MM-DD
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const PreparationTask = mongoose.model('PreparationTask', preparationTaskSchema);
export default PreparationTask;
