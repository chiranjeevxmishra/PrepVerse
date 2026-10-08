import mongoose from 'mongoose';

const assessmentQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      validate: [
        (val) => val.length >= 2,
        'Question must have at least 2 options',
      ],
    },
    correctAnswer: {
      type: Number,
      required: true, // 0-indexed index of options array
      select: false, // Never expose to client when taking test
    },
    category: {
      type: String,
      required: true,
      enum: ['DSA', 'OOP', 'DBMS', 'OS', 'Networking', 'Fundamentals'],
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium',
    },
    explanation: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const AssessmentQuestion = mongoose.model(
  'AssessmentQuestion',
  assessmentQuestionSchema
);
export default AssessmentQuestion;
