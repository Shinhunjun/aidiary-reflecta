import React from "react";
import { motion } from "framer-motion";
import "./PersonaCard.css";

const PersonaCard = ({ persona, isSelected, onSelect, onDelete, showDetails = false }) => {
  const getCategoryColor = (category) => {
    const colors = {
      supportive: "#ec4899", // Pink
      coach: "#f59e0b", // Amber
      analytical: "#3b82f6", // Blue
      creative: "#a855f7", // Purple
      mindfulness: "#10b981", // Green
      balanced: "#8b5cf6", // Violet
    };
    return colors[category] || "#8b5cf6";
  };

  const getCategoryLabel = (category) => {
    const labels = {
      supportive: "Emotional Support",
      coach: "Goal Achievement",
      analytical: "Problem Solving",
      creative: "Creative Thinking",
      mindfulness: "Mindfulness",
      balanced: "All-Rounder",
    };
    return labels[category] || category;
  };

  return (
    <motion.div
      className={`persona-card ${isSelected ? "selected" : ""}`}
      onClick={onSelect}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      style={{
        borderColor: isSelected ? getCategoryColor(persona.category) : "#e5e7eb",
      }}
    >
      <div className="persona-card-header">
        <div
          className="persona-icon"
          style={{ backgroundColor: `${getCategoryColor(persona.category)}20` }}
        >
          <span style={{ fontSize: "2rem" }}>{persona.icon}</span>
        </div>
        {isSelected && (
          <div className="selected-badge">
            <span>✓</span>
          </div>
        )}
      </div>

      <div className="persona-card-body">
        <h3 className="persona-name">{persona.displayName}</h3>
        <div
          className="persona-category"
          style={{
            backgroundColor: `${getCategoryColor(persona.category)}15`,
            color: getCategoryColor(persona.category),
          }}
        >
          {getCategoryLabel(persona.category)}
        </div>
        <p className="persona-description">{persona.description}</p>

        {showDetails && (
          <div className="persona-details">
            <p className="persona-prompt-preview">
              {persona.systemPrompt.substring(0, 150)}...
            </p>
          </div>
        )}
      </div>

      {!persona.isDefault && (
        <>
          <div className="persona-custom-badge">
            <span>Custom</span>
          </div>
          {onDelete && (
            <button
              className="persona-delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(persona._id);
              }}
              title="Delete persona"
            >
              🗑️
            </button>
          )}
        </>
      )}
    </motion.div>
  );
};

export default PersonaCard;
