const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  id: String,
  text: String,
  sender: {
    type: String,
    enum: ["user", "bot"],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const chatSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    selectedPersonaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Persona",
      default: null, // null means using default persona
    },
    messages: [messageSchema],
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
chatSessionSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model("ChatSession", chatSessionSchema);
