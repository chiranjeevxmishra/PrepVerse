import mongoose from 'mongoose';

const assessmentAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'AssessmentQuestion',
          required: true,
        },
        selectedOption: {
          type: Number,
          required: true,
        },
        isCorrect: {
          type: Boolean,
          required: true,
        },
      },
    ],
    score: {
      type: Number,
      required: true,
    },
    correctCount: {
      type: Number,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    categoryScores: {
      type: Map,
      of: Number,
    },
    overallReadiness: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const AssessmentAttempt = mongoose.model(
  'AssessmentAttempt',
  assessmentAttemptSchema
);
export default AssessmentAttempt;
