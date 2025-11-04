import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PersonaCard from "./PersonaCard";
import PersonaCreator from "./PersonaCreator";
import apiService from "../services/api";
import "./PersonaSelector.css";

const PersonaSelector = ({ isOpen, onClose, currentPersonaId, onSelectPersona }) => {
  const [personas, setPersonas] = useState([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState(currentPersonaId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPersonas();
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedPersonaId(currentPersonaId);
  }, [currentPersonaId]);

  const fetchPersonas = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[PersonaSelector] Fetching personas...');
      const data = await apiService.getPersonas();
      console.log('[PersonaSelector] Fetched personas:', data.length, data);
      setPersonas(data);
    } catch (err) {
      console.error("[PersonaSelector] Failed to fetch personas:", err);
      setError("Failed to load personas. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (personaId) => {
    setSelectedPersonaId(personaId);
  };

  const handleConfirm = () => {
    if (selectedPersonaId) {
      onSelectPersona(selectedPersonaId);
      onClose();
    }
  };

  const handlePersonaCreated = (newPersona) => {
    setPersonas(prev => [...prev, newPersona]);
    setSelectedPersonaId(newPersona._id);
    setShowCreateForm(false);
  };

  const handleDeletePersona = async (personaId) => {
    const persona = personas.find(p => p._id === personaId);
    if (!persona) return;

    if (persona.isDefault) {
      alert("Cannot delete default personas");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${persona.displayName}"?`)) {
      return;
    }

    try {
      await apiService.deletePersona(personaId);
      setPersonas(prev => prev.filter(p => p._id !== personaId));

      // If deleted persona was selected, clear selection
      if (selectedPersonaId === personaId) {
        setSelectedPersonaId(null);
      }
    } catch (error) {
      console.error("Failed to delete persona:", error);
      alert("Failed to delete persona. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="persona-selector-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="persona-selector-modal"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="persona-selector-header">
            <div>
              <h2>Choose Your AI Companion</h2>
              <p className="persona-selector-subtitle">
                Select the personality that fits your mood today
              </p>
            </div>
            <button className="persona-close-btn" onClick={onClose}>
              ×
            </button>
          </div>

          <div className="persona-selector-body">
            {loading ? (
              <div className="persona-loading">
                <div className="loading-spinner"></div>
                <p>Loading personas...</p>
              </div>
            ) : error ? (
              <div className="persona-error">
                <p>{error}</p>
                <button onClick={fetchPersonas} className="retry-btn">
                  Retry
                </button>
              </div>
            ) : (
              <>
                <div className="personas-grid">
                  {personas.map((persona) => (
                    <PersonaCard
                      key={persona._id}
                      persona={persona}
                      isSelected={selectedPersonaId === persona._id}
                      onSelect={() => handleSelect(persona._id)}
                      onDelete={handleDeletePersona}
                    />
                  ))}
                </div>

                {personas.length === 0 && (
                  <div className="no-personas">
                    <p>No personas available</p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="persona-selector-footer">
            <button
              className="persona-btn persona-btn-secondary"
              onClick={() => setShowCreateForm(true)}
            >
              + Create Custom Persona
            </button>
            <div className="persona-footer-actions">
              <button
                className="persona-btn persona-btn-outline"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="persona-btn persona-btn-primary"
                onClick={handleConfirm}
                disabled={!selectedPersonaId}
              >
                Confirm Selection
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* PersonaCreator Modal */}
      <PersonaCreator
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onPersonaCreated={handlePersonaCreated}
      />
    </AnimatePresence>
  );
};

export default PersonaSelector;
