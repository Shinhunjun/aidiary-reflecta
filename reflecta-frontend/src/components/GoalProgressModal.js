import React, { useState, useEffect } from "react";
import apiService from "../services/api";
import "./GoalProgressModal.css";

const GoalProgressModal = ({
  isOpen,
  onClose,
  goal,
  subGoal = null,
  onProgressSaved,
}) => {
  const [progressData, setProgressData] = useState({
    title: "",
    description: "",
    progressType: "checkin",
    mood: "neutral",
    difficulty: "medium",
    timeSpent: 0,
    notes: "",
    tags: [],
    isMilestone: false,
    milestoneTitle: "",
    milestoneCategory: "custom",
    completionPercentage: 0,
    celebrationEmoji: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [progressHistory, setProgressHistory] = useState([]);
  const [aiSummary, setAiSummary] = useState(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  const resolvedGoalId = goal?.mandalartData?.id || goal?.id || null;
  const resolvedGoalText =
    goal?.mandalartData?.text || goal?.text || "Selected Goal";

  useEffect(() => {
    if (isOpen && resolvedGoalId) {
      loadProgressHistory();
      if (subGoal) {
        loadAISummary();
      }
    }
  }, [isOpen, resolvedGoalId, subGoal]);

  const loadProgressHistory = async () => {
    if (!resolvedGoalId) return;

    try {
      const history = await apiService.getGoalProgress(resolvedGoalId);
      setProgressHistory(history);
    } catch (error) {
      console.error("Error loading progress history:", error);
    }
  };

  const loadAISummary = async () => {
    if (!goal?._id || !subGoal?.id) return;

    setIsLoadingSummary(true);
    try {
      const summaryData = await apiService.getGoalChildrenSummary(goal._id);

      if (summaryData && summaryData.childGoalsSummaries) {
        // Find the summary for this specific sub-goal
        const subGoalSummary = summaryData.childGoalsSummaries.find(
          (s) => s.goalId === subGoal.id
        );
        setAiSummary(subGoalSummary || null);
      }
    } catch (error) {
      console.error("Error loading AI summary:", error);
      setAiSummary(null);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProgressData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTagAdd = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const tag = e.target.value.trim();
      if (tag && !progressData.tags.includes(tag)) {
        setProgressData((prev) => ({
          ...prev,
          tags: [...prev.tags, tag],
        }));
        e.target.value = "";
      }
    }
  };

  const handleTagRemove = (tagToRemove) => {
    setProgressData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!progressData.title.trim() || !progressData.description.trim()) {
      alert("Please fill in both title and description.");
      return;
    }

    setIsSaving(true);
    try {
      await apiService.saveGoalProgress(resolvedGoalId, {
        ...progressData,
        subGoalId: subGoal?.id || null,
      });

      // Reset form
      setProgressData({
        title: "",
        description: "",
        progressType: "checkin",
        mood: "neutral",
        difficulty: "medium",
        timeSpent: 0,
        notes: "",
        tags: [],
        isMilestone: false,
        milestoneTitle: "",
        milestoneCategory: "custom",
        completionPercentage: 0,
        celebrationEmoji: "",
      });

      // Reload history
      await loadProgressHistory();

      if (onProgressSaved) {
        onProgressSaved();
      }

      alert("Progress saved successfully!");
    } catch (error) {
      console.error("Error saving progress:", error);
      alert("Failed to save progress. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content goal-progress-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>
            {subGoal
              ? `Progress for: ${subGoal.text}`
              : `Progress for: ${resolvedGoalText}`}
          </h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="progress-tabs">
            <div className="tab-content">
              {/* AI Summary Section */}
              {subGoal && (
                <div className="ai-summary-section">
                  {isLoadingSummary ? (
                    <div className="summary-loading">
                      <p>Loading AI insights...</p>
                    </div>
                  ) : aiSummary ? (
                    <div className="ai-summary-card">
                      <div className="summary-header">
                        <h3>🤖 AI Progress Analysis</h3>
                        <span className="entry-badge">
                          {aiSummary.entryCount} {aiSummary.entryCount === 1 ? 'entry' : 'entries'}
                        </span>
                      </div>
                      <p className="summary-text">{aiSummary.summary}</p>

                      {aiSummary.dateRange && (
                        <div className="summary-meta">
                          <span className="date-range">
                            📅 {new Date(aiSummary.dateRange.start).toLocaleDateString()} - {new Date(aiSummary.dateRange.end).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      {aiSummary.moodDistribution && Object.keys(aiSummary.moodDistribution).length > 0 && (
                        <div className="mood-summary">
                          <span className="mood-label">Mood patterns:</span>
                          {Object.entries(aiSummary.moodDistribution)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 3)
                            .map(([mood, count]) => (
                              <span key={mood} className="mood-chip">
                                {mood} ({count})
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="ai-summary-empty">
                      <p>💡 Start journaling to see AI-powered insights about your progress!</p>
                    </div>
                  )}
                </div>
              )}

              {/* Progress Form */}
              <form onSubmit={handleSubmit} className="progress-form">
                <div className="form-group">
                  <label htmlFor="title">Progress Title *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={progressData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Completed first milestone"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description *</label>
                  <textarea
                    id="description"
                    name="description"
                    value={progressData.description}
                    onChange={handleInputChange}
                    placeholder="Describe what you accomplished..."
                    rows="4"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="progressType">Type</label>
                    <select
                      id="progressType"
                      name="progressType"
                      value={progressData.progressType}
                      onChange={handleInputChange}
                    >
                      <option value="checkin">Check-in</option>
                      <option value="milestone">Milestone</option>
                      <option value="completion">Completion</option>
                      <option value="reflection">Reflection</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="mood">Mood</label>
                    <select
                      id="mood"
                      name="mood"
                      value={progressData.mood}
                      onChange={handleInputChange}
                    >
                      <option value="happy">😊 Happy</option>
                      <option value="excited">🤩 Excited</option>
                      <option value="calm">😌 Calm</option>
                      <option value="neutral">😐 Neutral</option>
                      <option value="anxious">😰 Anxious</option>
                      <option value="sad">😢 Sad</option>
                      <option value="grateful">🙏 Grateful</option>
                      <option value="reflective">🤔 Reflective</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="difficulty">Difficulty</label>
                    <select
                      id="difficulty"
                      name="difficulty"
                      value={progressData.difficulty}
                      onChange={handleInputChange}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="timeSpent">Time Spent (minutes)</label>
                    <input
                      type="number"
                      id="timeSpent"
                      name="timeSpent"
                      value={progressData.timeSpent}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="notes">Additional Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={progressData.notes}
                    onChange={handleInputChange}
                    placeholder="Any additional thoughts or observations..."
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="tags">Tags (press Enter to add)</label>
                  <input
                    type="text"
                    id="tags"
                    onKeyPress={handleTagAdd}
                    placeholder="Add tags to categorize your progress..."
                  />
                  <div className="tags-container">
                    {progressData.tags.map((tag, index) => (
                      <span key={index} className="tag">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleTagRemove(tag)}
                          className="tag-remove"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Milestone Tracking Section */}
                <div className="milestone-section">
                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="isMilestone"
                        checked={progressData.isMilestone}
                        onChange={(e) =>
                          setProgressData((prev) => ({
                            ...prev,
                            isMilestone: e.target.checked,
                          }))
                        }
                      />
                      <span>Mark as Milestone</span>
                    </label>
                  </div>

                  {progressData.isMilestone && (
                    <div className="milestone-fields">
                      <div className="form-group">
                        <label htmlFor="milestoneTitle">Milestone Title</label>
                        <input
                          type="text"
                          id="milestoneTitle"
                          name="milestoneTitle"
                          value={progressData.milestoneTitle}
                          onChange={handleInputChange}
                          placeholder="e.g., First Quarter Complete!"
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="milestoneCategory">Category</label>
                          <select
                            id="milestoneCategory"
                            name="milestoneCategory"
                            value={progressData.milestoneCategory}
                            onChange={handleInputChange}
                          >
                            <option value="quarter">25% - Quarter</option>
                            <option value="half">50% - Half</option>
                            <option value="three-quarter">75% - Three Quarter</option>
                            <option value="complete">100% - Complete</option>
                            <option value="custom">Custom</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label htmlFor="completionPercentage">
                            Completion %
                          </label>
                          <input
                            type="number"
                            id="completionPercentage"
                            name="completionPercentage"
                            value={progressData.completionPercentage}
                            onChange={handleInputChange}
                            min="0"
                            max="100"
                            placeholder="0-100"
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="celebrationEmoji">
                          Celebration Emoji (optional)
                        </label>
                        <input
                          type="text"
                          id="celebrationEmoji"
                          name="celebrationEmoji"
                          value={progressData.celebrationEmoji}
                          onChange={handleInputChange}
                          placeholder="🎉 Choose an emoji to celebrate!"
                          maxLength="2"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="save-progress-button"
                >
                  {isSaving ? "Saving..." : "Save Progress"}
                </button>
              </form>

              {/* Progress History */}
              {progressHistory.length > 0 && (
                <div className="progress-history">
                  <h3>Recent Progress</h3>
                  <div className="history-list">
                    {progressHistory.map((progress, index) => (
                      <div key={index} className="history-item">
                        <div className="history-header">
                          <h4>{progress.title}</h4>
                          <span className="progress-type">
                            {progress.progressType}
                          </span>
                        </div>
                        <p className="history-description">
                          {progress.description}
                        </p>
                        <div className="history-meta">
                          <span className="history-date">
                            {new Date(progress.date).toLocaleDateString()}
                          </span>
                          <span className="history-mood">
                            {progress.mood} {progress.difficulty}
                          </span>
                          {progress.timeSpent > 0 && (
                            <span className="history-time">
                              {progress.timeSpent} min
                            </span>
                          )}
                        </div>
                        {progress.tags && progress.tags.length > 0 && (
                          <div className="history-tags">
                            {progress.tags.map((tag, tagIndex) => (
                              <span key={tagIndex} className="tag-small">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalProgressModal;
