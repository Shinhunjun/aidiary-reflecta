import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import apiService from "../services/api";
import "./PersonaCreator.css";

const PersonaCreator = ({ isOpen, onClose, onPersonaCreated }) => {
  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    description: "",
    systemPrompt: "",
    category: "balanced",
    color: "#8b5cf6",
    icon: "✨",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const categories = [
    { value: "supportive", label: "Emotional Support", color: "#ec4899" },
    { value: "coach", label: "Goal Achievement", color: "#f59e0b" },
    { value: "analytical", label: "Problem Solving", color: "#3b82f6" },
    { value: "creative", label: "Creative Thinking", color: "#a855f7" },
    { value: "mindfulness", label: "Mindfulness", color: "#10b981" },
    { value: "balanced", label: "All-Rounder", color: "#8b5cf6" },
  ];

  const emojiOptions = [
    "✨", "💫", "🌟", "⭐", "🌈", "🦄", "🐉", "🦋",
    "🌸", "🌺", "🌻", "🌼", "🍀", "🌿", "🌱", "🍃",
    "💖", "💝", "💗", "💓", "💕", "💞", "💘", "❤️",
    "🎭", "🎨", "🎪", "🎬", "🎮", "🎯", "🎲", "🎰",
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = "Display name is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length < 20) {
      newErrors.description = "Description must be at least 20 characters";
    }

    if (!formData.systemPrompt.trim()) {
      newErrors.systemPrompt = "System prompt is required";
    } else if (formData.systemPrompt.length < 50) {
      newErrors.systemPrompt = "System prompt must be at least 50 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Generate name from displayName if not provided
      const personaData = {
        ...formData,
        name: formData.name || formData.displayName.toLowerCase().replace(/\s+/g, '-'),
      };

      const newPersona = await apiService.createPersona(personaData);

      // Notify parent component
      if (onPersonaCreated) {
        onPersonaCreated(newPersona);
      }

      // Reset form and close
      resetForm();
      onClose();
    } catch (error) {
      console.error("Failed to create persona:", error);
      setErrors({ submit: error.message || "Failed to create persona. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      displayName: "",
      description: "",
      systemPrompt: "",
      category: "balanced",
      color: "#8b5cf6",
      icon: "✨",
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="persona-creator-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          className="persona-creator-modal"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="persona-creator-header">
            <div>
              <h2>Create Custom Persona</h2>
              <p className="persona-creator-subtitle">
                Design your own AI companion with unique personality
              </p>
            </div>
            <button className="persona-creator-close-btn" onClick={handleClose}>
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="persona-creator-form">
            <div className="persona-creator-body">
              {/* Icon & Display Name Row */}
              <div className="form-row">
                <div className="form-group icon-group">
                  <label>Icon</label>
                  <div className="icon-selector">
                    {emojiOptions.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className={`emoji-option ${formData.icon === emoji ? 'selected' : ''}`}
                        onClick={() => handleInputChange('icon', emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group flex-grow">
                  <label>Display Name *</label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    placeholder="e.g., Friendly Mentor"
                    maxLength={50}
                    className={errors.displayName ? 'error' : ''}
                  />
                  {errors.displayName && (
                    <span className="error-message">{errors.displayName}</span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe what makes this persona unique (min 20 characters)"
                  rows={3}
                  maxLength={200}
                  className={errors.description ? 'error' : ''}
                />
                <div className="char-count">{formData.description.length}/200</div>
                {errors.description && (
                  <span className="error-message">{errors.description}</span>
                )}
              </div>

              {/* Category & Color */}
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      handleInputChange('category', e.target.value);
                      const cat = categories.find(c => c.value === e.target.value);
                      if (cat) handleInputChange('color', cat.color);
                    }}
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Color</label>
                  <div className="color-input-wrapper">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => handleInputChange('color', e.target.value)}
                      className="color-input"
                    />
                    <span className="color-value">{formData.color}</span>
                  </div>
                </div>
              </div>

              {/* System Prompt */}
              <div className="form-group">
                <label>System Prompt * (How should the AI behave?)</label>
                <textarea
                  value={formData.systemPrompt}
                  onChange={(e) => handleInputChange('systemPrompt', e.target.value)}
                  placeholder="You are a [personality type] AI companion. You [key traits]. When conversing, you [style]. You help users by [approach]... (min 50 characters)"
                  rows={8}
                  maxLength={2000}
                  className={errors.systemPrompt ? 'error' : ''}
                />
                <div className="char-count">{formData.systemPrompt.length}/2000</div>
                {errors.systemPrompt && (
                  <span className="error-message">{errors.systemPrompt}</span>
                )}
              </div>

              {errors.submit && (
                <div className="submit-error">
                  {errors.submit}
                </div>
              )}
            </div>

            <div className="persona-creator-footer">
              <button
                type="button"
                className="persona-btn persona-btn-outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="persona-btn persona-btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Persona"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PersonaCreator;
