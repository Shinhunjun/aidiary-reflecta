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
            {/* Children Summary Section */}
            {childrenSummary && (
              <div className="children-summary-section">
                <h3 className="summary-title">Sub-Goals Progress Overview</h3>

                {loadingChildrenSummary ? (
                  <div className="loading-spinner">Loading summary...</div>
                ) : (
                  <>
                    {/* Overall Summary */}
                    {childrenSummary.summary && (
                      <div className="overall-summary">
                        <h4>Overall Progress Analysis</h4>
                        <p>{childrenSummary.summary}</p>
                        <div className="summary-stats">
                          <span>
                            📝 {childrenSummary.totalEntries} total journal
                            entries
                          </span>
                          <span>
                            🎯 {childrenSummary.childGoalsSummaries?.length}{" "}
                            active sub-goals
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Individual Child Goals - Show only selected sub-goal */}
                    {filteredChildrenSummaries &&
                      filteredChildrenSummaries.length > 0 && (
                        <div className="child-goals-grid">
                          {filteredChildrenSummaries.map(
                            (child, index) => (
                              <div
                                key={child.goalId || index}
                                className="child-goal-card"
                                style={{
                                  borderLeft: `4px solid ${getMoodColor(
                                    child.dominantMood || child.latestMood
                                  )}`,
                                }}
                              >
                                <div className="child-goal-header">
                                  <h4>{child.goalText}</h4>
                                  <span className="entry-count">
                                    {child.entryCount} entries
                                  </span>
                                </div>

                                <p className="child-goal-summary">
                                  {child.summary}
                                </p>

                                {(child.dominantMood || child.latestMood) && (
                                  <div className="mood-indicator">
                                    <span
                                      className="mood-dot"
                                      style={{
                                        backgroundColor: getMoodColor(
                                          child.dominantMood || child.latestMood
                                        ),
                                      }}
                                    />
                                    <span className="mood-label">
                                      Latest mood: {child.dominantMood || child.latestMood}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      )}

                    {(!filteredChildrenSummaries ||
                      filteredChildrenSummaries.length === 0) && (
                      <div className="no-data-message">
                        No data available for this sub-goal yet. Start journaling to see
                        progress insights!
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Journal Summary Section */}
            {journalSummary && (
              <div className="journal-summary-section">
                <h3 className="summary-title">Journal Insights</h3>

                {loadingJournalSummary ? (
                  <div className="loading-spinner">Loading insights...</div>
                ) : (
                  <>
                    {journalSummary.summary && (
                      <div className="insights-summary">
                        <p>{journalSummary.summary}</p>
                        <div className="insights-stats">
                          <span>📝 {journalSummary.entryCount} entries</span>
                          {journalSummary.dateRange && (
                            <span>
                              📅 {journalSummary.dateRange.start} to{" "}
                              {journalSummary.dateRange.end}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Mood Distribution */}
                    {journalSummary.moodDistribution &&
                      Object.keys(journalSummary.moodDistribution).length >
                        0 && (
                        <div className="mood-distribution">
                          <h4>Mood Distribution</h4>
                          <div className="mood-bars">
                            {Object.entries(journalSummary.moodDistribution)
                              .sort(([, a], [, b]) => b - a)
                              .map(([mood, count]) => (
                                <div key={mood} className="mood-bar-container">
                                  <span className="mood-name">{mood}</span>
                                  <div className="mood-bar-wrapper">
                                    <div
                                      className="mood-bar"
                                      style={{
                                        width: `${
                                          (count / journalSummary.entryCount) *
                                          100
                                        }%`,
                                        backgroundColor: getMoodColor(mood),
                                      }}
                                    />
                                    <span className="mood-count">{count}</span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                    {/* Word Cloud */}
                    {journalSummary.wordCloud &&
                      journalSummary.wordCloud.length > 0 && (
                        <div className="word-cloud-section">
                          <h4>Word Cloud - Most Frequent Terms</h4>
                          <WordCloud words={journalSummary.wordCloud} />
                        </div>
                      )}

                    {/* Key Themes */}
                    {journalSummary.keyThemes &&
                      journalSummary.keyThemes.length > 0 && (
                        <div className="key-themes">
                          <h4>Key Themes</h4>
                          <div className="themes-list">
                            {journalSummary.keyThemes.map((theme, index) => (
                              <span key={index} className="theme-tag">
                                {theme}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    {!journalSummary.summary && (
                      <div className="no-data-message">
                        No journal entries found for this goal yet. Start
                        journaling to see insights!
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

            {!childrenSummary && !journalSummary && !journalEntries?.length && (
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
