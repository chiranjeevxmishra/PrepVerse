import mongoose from 'mongoose';

const answerEvaluationSchema = new mongoose.Schema(
  {
    score: { type: Number, min: 0, max: 100, default: null },
    technicalUnderstanding: { type: Number, min: 0, max: 100, default: null },
    coverage: { type: Number, min: 0, max: 100, default: null },
    clarity: { type: Number, min: 0, max: 100, default: null },
    matchedConcepts: { type: [String], default: [] },
    missingConcepts: { type: [String], default: [] },
    feedback: { type: String, default: '' },
  },
  { _id: false }
);

const practiceQuestionSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    question: { type: String, required: true },
    expectedConcepts: {
      type: [{ name: { type: String, required: true }, keywords: { type: [String], required: true } }],
      required: true,
    },
    answer: { type: String, trim: true, maxlength: 4000, default: '' },
    evaluation: { type: answerEvaluationSchema, default: () => ({}) },
    answeredAt: { type: Date, default: null },
  },
  { _id: false }
);

const practiceSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: {
      type: String,
      required: true,
      enum: ['DSA', 'DBMS', 'OS', 'Networking', 'OOP', 'JavaScript', 'Interview'],
    },
    difficulty: { type: String, required: true, enum: ['Beginner', 'Intermediate', 'Advanced'] },
    durationMinutes: { type: Number, required: true, enum: [10, 15, 20] },
    questions: { type: [practiceQuestionSchema], required: true },
    currentQuestionIndex: { type: Number, default: 0, min: 0 },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
    status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress', index: true },
    overallScore: { type: Number, min: 0, max: 100, default: null },
    categoryScores: {
      technicalUnderstanding: { type: Number, min: 0, max: 100, default: null },
      coverage: { type: Number, min: 0, max: 100, default: null },
      clarity: { type: Number, min: 0, max: 100, default: null },
    },
    strengths: { type: [String], default: [] },
    improvements: { type: [String], default: [] },
    recommendedNextSteps: { type: [String], default: [] },
  },
  { timestamps: true }
);

practiceSessionSchema.index({ user: 1, startedAt: -1 });

export const PracticeSession = mongoose.model('PracticeSession', practiceSessionSchema);
export default PracticeSession;
