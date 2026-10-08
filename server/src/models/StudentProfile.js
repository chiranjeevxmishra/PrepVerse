import mongoose from 'mongoose';

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    // Step 1: Academic & Target
    targetRole: {
      type: String,
      required: true,
      enum: [
        'Software Development Engineer (SDE)',
        'Frontend Engineer',
        'Backend Engineer',
        'Full-Stack Developer',
        'Data Analyst / Engineer',
      ],
      default: 'Software Development Engineer (SDE)',
    },
    graduationYear: {
      type: Number,
      required: true,
      min: 2024,
      max: 2030,
      default: 2026,
    },
    targetCompanies: {
      type: [String],
      default: ['Product Companies', 'High-Growth Startups'],
    },
    languages: {
      type: [String],
      default: ['JavaScript', 'C++'],
    },

    // Step 2: Self-Assessed Confidence (Scale 1 to 5)
    selfAssessment: {
      dsa: { type: Number, min: 1, max: 5, default: 3 },
      oop: { type: Number, min: 1, max: 5, default: 3 },
      dbms: { type: Number, min: 1, max: 5, default: 3 },
      os: { type: Number, min: 1, max: 5, default: 3 },
      networking: { type: Number, min: 1, max: 5, default: 3 },
      interview: { type: Number, min: 1, max: 5, default: 3 },
      communication: { type: Number, min: 1, max: 5, default: 3 },
    },

    // Step 3: Practical Background & Commitment
    projectsCount: {
      type: Number,
      min: 0,
      default: 1,
    },
    dailyPrepTimeHours: {
      type: Number,
      min: 1,
      max: 12,
      default: 2,
    },

    // Calculated Placement Readiness Metrics (Populated by Assessment Engine)
    readinessScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null, // null until diagnostic assessment completed
    },
    categoryScores: {
      dsa: { type: Number, default: 0 },
      oop: { type: Number, default: 0 },
      dbms: { type: Number, default: 0 },
      os: { type: Number, default: 0 },
      networking: { type: Number, default: 0 },
      fundamentals: { type: Number, default: 0 },
    },
    strongAreas: {
      type: [String],
      default: [],
    },
    weakAreas: {
      type: [String],
      default: [],
    },
    recommendations: [
      {
        category: String,
        action: String,
        priority: {
          type: String,
          enum: ['High', 'Medium', 'Low'],
          default: 'Medium',
        },
      },
    ],

    // Progress Engine Tracking
    tasksCompletedCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);
export default StudentProfile;
