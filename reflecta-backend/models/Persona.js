const mongoose = require("mongoose");

const personaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    systemPrompt: {
      type: String,
      required: true,
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // null for default personas, set for custom user personas
    },
    category: {
      type: String,
      enum: [
        "supportive",
        "coach",
        "analytical",
        "creative",
        "mindfulness",
        "balanced",
      ],
      required: true,
    },
    color: {
      type: String,
      default: "#8b5cf6", // Default purple
    },
    icon: {
      type: String,
      default: "💜",
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
personaSchema.index({ isDefault: 1 });
personaSchema.index({ userId: 1 });
personaSchema.index({ category: 1 });

module.exports = mongoose.model("Persona", personaSchema);
