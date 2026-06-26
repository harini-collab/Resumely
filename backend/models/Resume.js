const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // --- Raw & Extracted Data ---
    rawText: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      default: null,
    },
    fileType: {
      type: String,
      enum: ["pdf", "text"],
      default: "text",
    },
    storage: {
      provider: { type: String, default: "local" },
      bucket: String,
      key: String,
      url: String,
    },

    // --- Parsed Resume Content ---
    extractedData: {
      skills: [{ type: String, lowercase: true }],
      education: [
        {
          degree: String,
          institution: String,
          year: String,
        },
      ],
      experience: [
        {
          role: String,
          company: String,
          duration: String,
          description: String,
        },
      ],
      projects: [
        {
          name: String,
          description: String,
          technologies: [String],
        },
      ],
      links: {
        github: String,
        linkedin: String,
        portfolio: String,
        other: [String],
      },
      name: String,
      email: String,
      phone: String,
      summary: String,
    },

    // --- Job Target ---
    jobTarget: {
      rawInput: String,
      normalizedRole: String,
      displayName: String,
    },

    // --- Scoring Results ---
    scores: {
      resumeScore: { type: Number, min: 0, max: 100, default: 0 },
      jobScore: { type: Number, min: 0, max: 100, default: 0 },
      completenessScore: { type: Number, min: 0, max: 100, default: 0 },
      experienceScore: { type: Number, min: 0, max: 100, default: 0 },
      skillScore: { type: Number, min: 0, max: 100, default: 0 },
    },

    // --- Skill Analysis ---
    skillAnalysis: {
      matched: [String],
      missing: [String],
      extra: [String],
      matchPercentage: Number,
    },

    // --- Feedback ---
    feedback: {
      strengths: [String],
      weaknesses: [String],
      rejectionReasons: [String],
      suggestions: [String],
      aiSuggestions: [String], // OpenAI generated
    },

    // --- Version tracking for progress ---
    version: {
      type: Number,
      default: 1,
    },
    label: {
      type: String,
      default: "Resume",
    },
    isAnalyzed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for efficient progress queries
resumeSchema.index({ userId: 1, createdAt: -1 });
resumeSchema.index({ userId: 1, version: 1 });
resumeSchema.index({ userId: 1, isAnalyzed: 1, createdAt: -1 });
resumeSchema.index({ "jobTarget.normalizedRole": 1 });

// Virtual: overall score summary
resumeSchema.virtual("overallScore").get(function () {
  const s = this.scores;
  if (!s) return 0;
  return Math.round(
    (s.resumeScore * 0.3 + s.jobScore * 0.4 + s.completenessScore * 0.2 + s.experienceScore * 0.1)
  );
});

module.exports = mongoose.model("Resume", resumeSchema);
