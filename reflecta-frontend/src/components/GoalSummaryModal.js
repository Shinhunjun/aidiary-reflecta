import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import WordCloud from "./WordCloud";
import "./GoalSummaryModal.css";

const GoalSummaryModal = ({
  isOpen,
  onClose,
  goalText,
  selectedGoalId,
  journalSummary,
  childrenSummary,
  journalEntries,
  loadingJournalSummary,
  loadingChildrenSummary,
  loadingJournalEntries,
}) => {
  if (!isOpen) return null;

  // Filter childrenSummary to show only the selected sub-goal
  const filteredChildrenSummaries = selectedGoalId && childrenSummary?.childGoalsSummaries
    ? childrenSummary.childGoalsSummaries.filter(child => child.goalId === selectedGoalId)
    : childrenSummary?.childGoalsSummaries || [];

  const getMoodEmoji = (mood) => {
    const moodEmojis = {
      happy: "😊",
      excited: "🤩",
      grateful: "🙏",
      calm: "😌",
      reflective: "🤔",
      neutral: "😐",
      anxious: "😰",
      sad: "😢",
      angry: "😠",
      stressed: "😫",
    };
    return moodEmojis[mood?.toLowerCase()] || "😐";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getMoodColor = (mood) => {
    const moodColors = {
      happy: "#4ade80",
      excited: "#fbbf24",
      grateful: "#a78bfa",
      calm: "#60a5fa",
      reflective: "#8b5cf6",
      neutral: "#94a3b8",
      anxious: "#fb923c",
      sad: "#f87171",
      angry: "#dc2626",
      stressed: "#ea580c",
    };
    return moodColors[mood?.toLowerCase()] || "#94a3b8";
  };

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="modal-content"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>{goalText}</h2>
            <button className="modal-close-btn" onClick={onClose}>
              ×
            </button>
          </div>

          <div className="modal-body">
            {/* Sub-Goal AI Summary Section */}
            {childrenSummary && (
              <div className="children-summary-section">
                <h3 className="summary-title">🎯 AI Progress Summary</h3>

                {loadingChildrenSummary ? (
                  <div className="loading-spinner">Loading summary...</div>
                ) : (
                  <>
                    {/* Selected Sub-Goal Summary - Show in same style as Overall Progress Analysis */}
                    {filteredChildrenSummaries &&
                      filteredChildrenSummaries.length > 0 && (
                        <>
                          {filteredChildrenSummaries.map((child, index) => (
                            <div key={child.goalId || index} className="overall-summary">
                              <h4>{child.goalText}</h4>
                              <p>{child.summary}</p>
                              <div className="summary-stats">
                                <span>📝 {child.entryCount} journal entries</span>
                                {child.dateRange && (
                                  <span>
                                    📅 {new Date(child.dateRange.start).toLocaleDateString()} - {new Date(child.dateRange.end).toLocaleDateString()}
                                  </span>
                                )}
                                {(child.dominantMood || child.latestMood) && (
                                  <span>
                                    😊 Latest mood: {child.dominantMood || child.latestMood}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </>
                      )}

                    {(!filteredChildrenSummaries ||
                      filteredChildrenSummaries.length === 0) && (
                      <div className="no-data-message">
                        No data available for this sub-goal yet. Start journaling to see
                        progress insights!
                      </div>
                    )}

                    {/* Word Cloud for Selected Sub-Goal */}
                    {filteredChildrenSummaries &&
                      filteredChildrenSummaries.length > 0 &&
                      filteredChildrenSummaries[0].wordCloud &&
                      filteredChildrenSummaries[0].wordCloud.length > 0 && (
                        <div className="word-cloud-section">
                          <h4>Word Cloud - Most Frequent Terms</h4>
                          <WordCloud words={filteredChildrenSummaries[0].wordCloud} />
                        </div>
                      )}
                  </>
                )}
              </div>
            )}


            {/* Journal Entries List */}
            {journalEntries && journalEntries.length > 0 && (
              <div className="journal-entries-section">
                <h3 className="summary-title">
                  Journal Entries ({journalEntries.length})
                </h3>

                {loadingJournalEntries ? (
                  <div className="loading-spinner">Loading entries...</div>
                ) : (
                  <div className="journal-entries-list">
                    {journalEntries.map((entry) => (
                      <div key={entry._id} className="journal-entry-card">
                        <div className="entry-card-header">
                          <div className="entry-card-title">
                            <span className="entry-mood-emoji">
                              {getMoodEmoji(entry.mood)}
                            </span>
                            <h4>{entry.title}</h4>
                          </div>
                          <span className="entry-card-date">
                            {formatDate(entry.date)}
                          </span>
                        </div>
                        <p className="entry-card-preview">
                          {entry.content.length > 150
                            ? `${entry.content.substring(0, 150)}...`
                            : entry.content}
                        </p>
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="entry-card-tags">
                            {entry.tags.slice(0, 3).map((tag, idx) => (
                              <span key={idx} className="entry-tag">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!childrenSummary && !journalEntries?.length && (
              <div className="no-data-message">
                No data available. Start journaling to see progress insights!
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GoalSummaryModal;
