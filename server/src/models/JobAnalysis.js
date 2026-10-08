import mongoose from 'mongoose';

const jobSkillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    group: { type: String, enum: ['skill', 'topic', 'soft-skill'], required: true },
    status: { type: String, enum: ['strong', 'developing', 'needs_attention', 'unknown'], required: true },
    score: { type: Number, min: 0, max: 100, default: null },
    scoreSource: { type: String, default: null },
    contribution: { type: Number, min: 0, max: 1, required: true },
    explanation: { type: String, required: true },
  },
  { _id: false }
);

const jobRecommendationSchema = new mongoose.Schema(
  {
    skill: { type: String, required: true },
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ['DSA', 'OOP', 'DBMS', 'OS', 'Networking', 'Interview', 'Projects', 'Fundamentals'],
      required: true,
    },
    priority: { type: String, enum: ['High', 'Medium', 'Low'], required: true },
    estimatedTimeMinutes: { type: Number, min: 15, max: 180, required: true },
    reason: { type: String, required: true },
    actionTip: { type: String, required: true },
    preparationTask: { type: mongoose.Schema.Types.ObjectId, ref: 'PreparationTask', default: null },
  },
  { _id: false }
);

const jobAnalysisSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, trim: true, maxlength: 160, default: '' },
    company: { type: String, trim: true, maxlength: 120, default: '' },
    rawDescription: { type: String, required: true, maxlength: 12000 },
    extractedSkills: { type: [String], default: [] },
    extractedTopics: { type: [String], default: [] },
    requiredSkills: { type: [String], default: [] },
    skillMatches: { type: [jobSkillSchema], default: [] },
    readinessPercent: { type: Number, min: 0, max: 100, required: true },
    summary: {
      strong: { type: Number, default: 0 },
      developing: { type: Number, default: 0 },
      needsAttention: { type: Number, default: 0 },
      unknown: { type: Number, default: 0 },
    },
    readinessExplanation: { type: String, required: true },
    recommendations: { type: [jobRecommendationSchema], default: [] },
    analyzedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

jobAnalysisSchema.index({ user: 1, analyzedAt: -1 });

export const JobAnalysis = mongoose.model('JobAnalysis', jobAnalysisSchema);
export default JobAnalysis;
