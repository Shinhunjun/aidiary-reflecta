import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useJournal } from "../contexts/JournalContext";
import { useSearchParams } from "react-router-dom";
import apiService from "../services/api";
import Chat from "./Chat";
import "./Journal.css";

const Journal = () => {
  const { user } = useAuth();
  const { journalEntries, updateJournalEntries, refreshTrigger } = useJournal();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("chat");
  const [currentEntry, setCurrentEntry] = useState({
    title: "",
    content: "",
    mood: "neutral",
    tags: [],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMood, setFilterMood] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid"); // grid or timeline

  // Load journal entries from API
  const loadJournalEntries = useCallback(async () => {
    if (!user?.id) return;

    try {
      const entries = await apiService.getJournalEntries();
      updateJournalEntries(entries);
    } catch (error) {
      console.error("Error loading journal entries:", error);
      // Fallback to localStorage if API fails
      const userEntries = JSON.parse(
        localStorage.getItem(`journal_${user.id}`) || "[]"
      );
      const aiEntries = JSON.parse(
        localStorage.getItem("journalEntries") || "[]"
      );
      // Filter AI entries by current user ID
      const userAiEntries = aiEntries.filter(
        (entry) => entry.userId === user.id
      );
      const allEntries = [...userEntries, ...userAiEntries];
      allEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
      updateJournalEntries(allEntries);
    }
  }, [user?.id, updateJournalEntries]);

  useEffect(() => {
    loadJournalEntries();
  }, [user?.id, loadJournalEntries]);

  // Listen for refresh trigger from context
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadJournalEntries();
    }
  }, [refreshTrigger, user?.id, loadJournalEntries]);

  // Listen for URL changes to refresh data when coming from diary conversion
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "entries") {
      // Refresh data when switching to entries tab (especially after diary conversion)
      loadJournalEntries();
    }
  }, [searchParams, user?.id, loadJournalEntries]);

  // URL 파라미터 처리
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "entries") {
      setActiveTab("entries");
    }
  }, [searchParams]);

  const handleSaveEntry = async () => {
    if (!currentEntry.title.trim() || !currentEntry.content.trim()) {
      alert("Please fill in both title and content.");
      return;
    }

    setIsSaving(true);

    try {
      const newEntry = await apiService.saveJournalEntry({
        title: currentEntry.title,
        content: currentEntry.content,
        mood: currentEntry.mood,
        tags: currentEntry.tags,
        isAIGenerated: false,
      });

      updateJournalEntries([newEntry.entry, ...journalEntries]);

      // Also save to localStorage as backup
      const updatedEntries = [newEntry.entry, ...journalEntries];
      localStorage.setItem(
        `journal_${user?.id}`,
        JSON.stringify(updatedEntries)
      );

      // Automatically trigger risk detection for the saved entry
      try {
        await apiService.analyzeJournalRisk(newEntry.entry._id);
        console.log("Risk analysis completed for journal entry");
      } catch (riskError) {
        console.error("Risk analysis failed (non-critical):", riskError);
        // Don't block the save flow if risk analysis fails
      }

      // Reset form
      setCurrentEntry({
        title: "",
        content: "",
        mood: "neutral",
        tags: [],
      });

      // Show success message with goal mapping info
      if (newEntry.goalMapping && newEntry.goalMapping.goalId) {
        alert(
          `✅ Journal entry saved successfully!\n\n🎯 Automatically linked to your goal with ${Math.round(
            newEntry.goalMapping.confidence * 100
          )}% confidence.\n\nReason: ${newEntry.goalMapping.reason}`
        );
      } else {
        alert("Journal entry saved successfully!");
      }
    } catch (error) {
      console.error("Error saving journal entry:", error);
      alert("Failed to save journal entry. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTagAdd = (e) => {
    if (e.key === "Enter" && e.target.value.trim()) {
      const newTag = e.target.value.trim();
      if (!currentEntry.tags.includes(newTag)) {
        setCurrentEntry((prev) => ({
          ...prev,
          tags: [...prev.tags, newTag],
        }));
      }
      e.target.value = "";
    }
  };

  const handleTagRemove = (tagToRemove) => {
    setCurrentEntry((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMoodEmoji = (mood) => {
    const moodEmojis = {
      happy: "😊",
      sad: "😢",
      excited: "🤩",
      calm: "😌",
      anxious: "😰",
      grateful: "🙏",
      neutral: "😐",
    };
    return moodEmojis[mood] || "😐";
  };

  // Filter and sort entries
  const getFilteredAndSortedEntries = () => {
    let filtered = [...journalEntries];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (entry) =>
          entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.tags?.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    // Apply mood filter
    if (filterMood !== "all") {
      filtered = filtered.filter((entry) => entry.mood === filterMood);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.date) - new Date(a.date);
        case "oldest":
          return new Date(a.date) - new Date(b.date);
        case "mood":
          return (a.mood || "").localeCompare(b.mood || "");
        default:
          return 0;
      }
    });

    return filtered;
  };

  // Group entries by date for timeline view
  const groupEntriesByDate = (entries) => {
    const grouped = {};
    entries.forEach((entry) => {
      const date = new Date(entry.date);
      const monthYear = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      });
      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      grouped[monthYear].push(entry);
    });
    return grouped;
  };

  const filteredEntries = getFilteredAndSortedEntries();
  const groupedEntries = groupEntriesByDate(filteredEntries);

  return (
    <div className="journal-container">
      <div className="journal-header">
        <h1>Journal Writing</h1>
        <p>Reflect on your thoughts, experiences, and emotions</p>
      </div>

      <div className="journal-tabs">
        <button
          className={`tab-button ${activeTab === "chat" ? "active" : ""}`}
          onClick={() => setActiveTab("chat")}
        >
          🤖 AI Chat
        </button>
        <button
          className={`tab-button ${activeTab === "write" ? "active" : ""}`}
          onClick={() => setActiveTab("write")}
        >
          ✍️ Write Entry
        </button>
        <button
          className={`tab-button ${activeTab === "entries" ? "active" : ""}`}
          onClick={() => setActiveTab("entries")}
        >
          📖 My Entries
        </button>
      </div>

      <div className="journal-content">
        {activeTab === "chat" && (
          <div className="chat-tab">
            <Chat />
          </div>
        )}

        {activeTab === "write" && (
          <div className="write-entry">
            <div className="entry-form">
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  type="text"
                  id="title"
                  value={currentEntry.title}
                  onChange={(e) =>
                    setCurrentEntry((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="What's on your mind today?"
                  className="entry-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="mood">How are you feeling?</label>
                <select
                  id="mood"
                  value={currentEntry.mood}
                  onChange={(e) =>
                    setCurrentEntry((prev) => ({
                      ...prev,
                      mood: e.target.value,
                    }))
                  }
                  className="mood-select"
                >
                  <option value="happy">😊 Happy</option>
                  <option value="excited">🤩 Excited</option>
                  <option value="calm">😌 Calm</option>
                  <option value="neutral">😐 Neutral</option>
                  <option value="anxious">😰 Anxious</option>
                  <option value="sad">😢 Sad</option>
                  <option value="grateful">🙏 Grateful</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="content">Your thoughts</label>
                <textarea
                  id="content"
                  value={currentEntry.content}
                  onChange={(e) =>
                    setCurrentEntry((prev) => ({
                      ...prev,
                      content: e.target.value,
                    }))
                  }
                  placeholder="Write about your day, thoughts, feelings, or anything you'd like to reflect on..."
                  className="entry-textarea"
                  rows="8"
                />
              </div>

              <div className="form-group">
                <label htmlFor="tags">Tags (press Enter to add)</label>
                <input
                  type="text"
                  id="tags"
                  onKeyPress={handleTagAdd}
                  placeholder="Add tags to categorize your entry..."
                  className="entry-input"
                />
                <div className="tags-container">
                  {currentEntry.tags.map((tag, index) => (
                    <span key={index} className="tag">
                      {tag}
                      <button
                        onClick={() => handleTagRemove(tag)}
                        className="tag-remove"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSaveEntry}
                disabled={
                  isSaving ||
                  !currentEntry.title.trim() ||
                  !currentEntry.content.trim()
                }
                className="save-button"
              >
                {isSaving ? "Saving..." : "Save Entry"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "entries" && (
          <div className="entries-list">
            {/* Filter and Search Controls */}
            <div className="entries-controls">
              <div className="search-bar">
                <input
                  type="text"
                  placeholder="Search entries by title, content, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="filter-controls">
                <select
                  value={filterMood}
                  onChange={(e) => setFilterMood(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Moods</option>
                  <option value="happy">😊 Happy</option>
                  <option value="excited">🤩 Excited</option>
                  <option value="calm">😌 Calm</option>
                  <option value="neutral">😐 Neutral</option>
                  <option value="anxious">😰 Anxious</option>
                  <option value="sad">😢 Sad</option>
                  <option value="grateful">🙏 Grateful</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="filter-select"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="mood">Sort by Mood</option>
                </select>

                <div className="view-toggle">
                  <button
                    className={viewMode === "grid" ? "active" : ""}
                    onClick={() => setViewMode("grid")}
                    title="Grid View"
                  >
                    ⊞
                  </button>
                  <button
                    className={viewMode === "timeline" ? "active" : ""}
                    onClick={() => setViewMode("timeline")}
                    title="Timeline View"
                  >
                    ☰
                  </button>
                </div>
              </div>

              <div className="entries-count">
                Showing {filteredEntries.length} of {journalEntries.length} entries
              </div>
            </div>

            {journalEntries.length === 0 ? (
              <div className="empty-state">
                <h3>No entries yet</h3>
                <p>Start writing your first journal entry to see it here.</p>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="empty-state">
                <h3>No matching entries</h3>
                <p>Try adjusting your search or filters.</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="entries-grid">
                {filteredEntries.map((entry) => (
                  <div
                    key={entry._id || entry.id}
                    className="entry-card"
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <div className="entry-header">
                      <h3>{entry.title}</h3>
                      <span className="mood-emoji">
                        {getMoodEmoji(entry.mood)}
                      </span>
                    </div>
                    <p className="entry-preview">
                      {entry.content.length > 150
                        ? `${entry.content.substring(0, 150)}...`
                        : entry.content}
                    </p>
                    <div className="entry-meta">
                      <span className="entry-date">
                        {formatDate(entry.date)}
                      </span>
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="entry-tags">
                          {entry.tags.map((tag, index) => (
                            <span key={index} className="tag-small">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {entry.isAIGenerated && (
                        <span className="ai-badge">AI Generated</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="entries-timeline">
                {Object.entries(groupedEntries).map(([monthYear, entries]) => (
                  <div key={monthYear} className="timeline-section">
                    <h3 className="timeline-month">{monthYear}</h3>
                    <div className="timeline-entries">
                      {entries.map((entry) => (
                        <div
                          key={entry._id || entry.id}
                          className="timeline-entry"
                          onClick={() => setSelectedEntry(entry)}
                        >
                          <div className="timeline-date-marker">
                            <div className="timeline-dot" />
                            <span className="timeline-date">
                              {new Date(entry.date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                          <div className="timeline-content">
                            <div className="timeline-header">
                              <h4>{entry.title}</h4>
                              <span className="mood-emoji">
                                {getMoodEmoji(entry.mood)}
                              </span>
                            </div>
                            <p className="timeline-preview">
                              {entry.content.length > 120
                                ? `${entry.content.substring(0, 120)}...`
                                : entry.content}
                            </p>
                            <div className="timeline-meta">
                              {entry.tags && entry.tags.length > 0 && (
                                <div className="entry-tags">
                                  {entry.tags.slice(0, 3).map((tag, index) => (
                                    <span key={index} className="tag-small">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {entry.isAIGenerated && (
                                <span className="ai-badge">AI Generated</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <div className="modal-overlay" onClick={() => setSelectedEntry(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedEntry.title}</h2>
              <button
                className="close-button"
                onClick={() => setSelectedEntry(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="entry-detail-meta">
                <span className="mood-display">
                  {getMoodEmoji(selectedEntry.mood)} {selectedEntry.mood}
                </span>
                <span className="date-display">
                  {formatDate(selectedEntry.date)}
                </span>
                {selectedEntry.isAIGenerated && (
                  <span className="ai-badge-large">AI Generated</span>
                )}
              </div>
              <div className="entry-content">
                {selectedEntry.content.split("\n").map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
              {selectedEntry.tags && selectedEntry.tags.length > 0 && (
                <div className="entry-tags-detail">
                  {selectedEntry.tags.map((tag, index) => (
                    <span key={index} className="tag-detail">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Journal;
