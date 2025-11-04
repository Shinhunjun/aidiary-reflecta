const mongoose = require("mongoose");

const goalSummarySchema = new mongoose.Schema({
  goalId: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  summaryType: {
    type: String,
    enum: ["journal", "children", "wordcloud"],
    required: true,
  },
  summary: {
    type: String,
    required: true,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  entryCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  expiresAt: {
    type: Date,
    required: false, // Optional - demo user summaries are permanent (no expiresAt)
    index: true,
  },
});

// Compound index for efficient lookups
goalSummarySchema.index({ userId: 1, goalId: 1, summaryType: 1 });

// TTL index - MongoDB will automatically delete expired documents
goalSummarySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const GoalSummary = mongoose.model("GoalSummary", goalSummarySchema);

module.exports = GoalSummary;
