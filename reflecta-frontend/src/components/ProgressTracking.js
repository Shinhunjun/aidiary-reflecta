import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import apiService from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import ProgressAnalytics from "./ProgressAnalytics";
import ProgressCalendar from "./ProgressCalendar";
import CompletionRings from "./CompletionRings";
import MilestoneTimeline from "./MilestoneTimeline";
import GoalSummaryModal from "./GoalSummaryModal";
import EmotionalJourneyMap from "./EmotionalJourneyMap";
import ReflectionWordCloud from "./ReflectionWordCloud";
import "./ProgressTracking.css";

const PERIOD_OPTIONS = [
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "quarterly", label: "Quarterly" },
  { key: "yearly", label: "Yearly" },
];

const ProgressTracking = () => {
  const { user } = useAuth();
  const [goalPackages, setGoalPackages] = useState([]);
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [focusedSubGoalId, setFocusedSubGoalId] = useState(null);
  const [summary, setSummary] = useState(null);
  const [period, setPeriod] = useState("weekly");
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState("");
  const [journalSummary, setJournalSummary] = useState(null);
  const [loadingJournalSummary, setLoadingJournalSummary] = useState(false);
  const [childrenSummary, setChildrenSummary] = useState(null);
  const [loadingChildrenSummary, setLoadingChildrenSummary] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [selectedGoalText, setSelectedGoalText] = useState("");

  useEffect(() => {
    const loadGoals = async () => {
      try {
        setLoadingGoals(true);
        const data = await apiService.getGoals();
        const packages = Array.isArray(data) ? data : data ? [data] : [];
        setGoalPackages(packages);

        if (packages.length > 0 && packages[0].mandalartData?.id) {
          setSelectedGoalId(packages[0].mandalartData.id);
        }
      } catch (err) {
        console.error("Failed to load goals:", err);
        setError("Failed to load goals. Please try again later.");
      } finally {
        setLoadingGoals(false);
      }
    };

    if (user?.id) {
      loadGoals();
    }
  }, [user?.id]);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!selectedGoalId) return;

      try {
        setLoadingSummary(true);
        setError("");
        const data = await apiService.getGoalProgressSummary(
          selectedGoalId,
          period
        );
        setSummary(data);
      } catch (err) {
        console.error("Failed to load progress summary:", err);
        setError("Unable to load progress summary. Please try again.");
        setSummary(null);
      } finally {
        setLoadingSummary(false);
      }
    };

    fetchSummary();
  }, [selectedGoalId, period]);

  useEffect(() => {
    const fetchJournalSummary = async () => {
      if (!selectedGoalId) return;

      try {
        setLoadingJournalSummary(true);
        const data = await apiService.getGoalJournalSummary(selectedGoalId);
        setJournalSummary(data);
      } catch (err) {
        console.error("Failed to load journal summary:", err);
        setJournalSummary(null);
      } finally {
        setLoadingJournalSummary(false);
      }
    };

    fetchJournalSummary();
  }, [selectedGoalId]);

  useEffect(() => {
    const fetchChildrenSummary = async () => {
      if (!selectedGoalId) return;

      try {
        setLoadingChildrenSummary(true);
        const data = await apiService.getGoalChildrenSummary(selectedGoalId);
        setChildrenSummary(data);
      } catch (err) {
        console.error("Failed to load children summary:", err);
        setChildrenSummary(null);
      } finally {
        setLoadingChildrenSummary(false);
      }
    };

    fetchChildrenSummary();
  }, [selectedGoalId]);

  const goalLookup = useMemo(() => {
    const map = new Map();

    const traverse = (node, parentId = null) => {
      if (!node || !node.id) return;
      map.set(node.id, { text: node.text || "Unnamed goal", parentId });
      if (Array.isArray(node.subGoals)) {
        node.subGoals.filter(Boolean).forEach((child) =>
          traverse(child, node.id)
        );
      }
    };

    goalPackages.forEach((pkg) => {
      if (pkg?.mandalartData) {
        traverse(pkg.mandalartData);
      }
    });

    return map;
  }, [goalPackages]);

  const activeGoalTitle = useMemo(() => {
    if (!selectedGoalId) return "Select a goal";
    return goalLookup.get(selectedGoalId)?.text || "Selected Goal";
  }, [goalLookup, selectedGoalId]);

  const focusedSubSummary = useMemo(() => {
    if (!summary || !focusedSubGoalId) return null;
    return summary.subGoals?.find((item) => item.id === focusedSubGoalId);
  }, [summary, focusedSubGoalId]);

  const renderGoalNode = (node, rootGoalId, depth = 0) => {
    if (!node || !node.id || !node.text) return null;
    const isRoot = depth === 0;
    const isSelectedRoot = selectedGoalId === node.id;
    const isFocused = focusedSubGoalId === node.id;

    const handleClick = (e) => {
      e.preventDefault();
      e.stopPropagation();

      console.log('Goal clicked:', node.text, 'ID:', node.id, 'isRoot:', isRoot);

      // Set the goal text for modal display
      setSelectedGoalText(node.text);

      if (isRoot) {
        setSelectedGoalId(node.id);
        setFocusedSubGoalId(null);
      } else {
        setSelectedGoalId(rootGoalId);
        setFocusedSubGoalId(node.id);
      }

      // Open the modal
      setShowSummaryModal(true);
    };

    return (
      <div
        key={node.id}
        className={`goal-tree-item depth-${depth} ${
          isRoot && isSelectedRoot ? "active" : ""
        } ${!isRoot && isFocused ? "focused" : ""}`}
        onClick={handleClick}
      >
        <div className="goal-tree-label">
          <span className="goal-dot" aria-hidden />
          <span>{node.text}</span>
        </div>
        {Array.isArray(node.subGoals) && node.subGoals.filter(Boolean).length > 0 && (
          <div className="goal-tree-children">
            {node.subGoals
              .filter(Boolean)
              .map((child) => renderGoalNode(child, rootGoalId, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderGoalSidebar = () => {
    if (loadingGoals) {
      return <div className="sidebar-placeholder">Loading goals...</div>;
    }

    if (!goalPackages.length) {
      return (
        <div className="sidebar-placeholder">
          No goals found yet. Head over to the goal setting page to get started!
        </div>
      );
    }

    return goalPackages.map((pkg) => {
      const node = pkg.mandalartData;
      if (!node?.id) return null;
      return (
        <div key={node.id} className="goal-tree-root">
          {renderGoalNode(node, node.id)}
        </div>
      );
    });
  };

  const renderSummaryContent = () => {
    if (loadingSummary) {
      return <div className="summary-placeholder">Loading summary...</div>;
    }

    if (!summary) {
      return (
        <div className="summary-placeholder">
          Select a goal to see progress insights.
        </div>
      );
    }

    const { totals, progressTypes = [], subGoals = [], timeline = [] } = summary;
    const totalEntries = totals?.totalEntries || 0;
    const totalTime = totals?.totalTime || 0;
    const lastActivity = totals?.lastActivity
      ? new Date(totals.lastActivity).toLocaleString()
      : "No activity yet";

    return (
      <>
        <section className="summary-cards">
          <div className="summary-card">
            <span className="summary-label">Entries</span>
            <span className="summary-value">{totalEntries}</span>
            <span className="summary-hint">Logs during this {period}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Focused Time</span>
            <span className="summary-value">{Math.round(totalTime)} min</span>
            <span className="summary-hint">Total recorded time</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Last Update</span>
            <span className="summary-value small">{lastActivity}</span>
            <span className="summary-hint">Most recent log</span>
          </div>
        </section>

        {focusedSubSummary && (
          <section className="focus-card">
            <h4>Focused Sub-goal</h4>
            <p className="focus-name">
              {goalLookup.get(focusedSubSummary.id)?.text || "Sub-goal"}
            </p>
            <div className="focus-metrics">
              <div>
                <span className="metric-label">Entries</span>
                <span className="metric-value">{focusedSubSummary.count}</span>
              </div>
              <div>
                <span className="metric-label">Time</span>
                <span className="metric-value">
                  {Math.round(focusedSubSummary.totalTime)} min
                </span>
              </div>
              <div>
                <span className="metric-label">Last entry</span>
                <span className="metric-value">
                  {focusedSubSummary.lastEntry
                    ? new Date(focusedSubSummary.lastEntry).toLocaleString()
                    : "N/A"}
                </span>
              </div>
            </div>
          </section>
        )}

        <section className="summary-section">
          <header>
            <h4>Sub-goal Contributions</h4>
          </header>
          {subGoals.length === 0 ? (
            <div className="summary-placeholder small">
              No progress entries found for this period.
            </div>
          ) : (
            <ul className="subgoal-list">
              {subGoals.map((item) => (
                <li key={item.id} className="subgoal-item">
                  <div>
                    <p className="subgoal-name">
                      {goalLookup.get(item.id)?.text || item.label}
                    </p>
                    <span className="subgoal-hint">
                      Last update: {item.lastEntry ? new Date(item.lastEntry).toLocaleString() : "N/A"}
                    </span>
                  </div>
                  <div className="subgoal-stats">
                    <span>{item.count} entries</span>
                    <span>{Math.round(item.totalTime)} min</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="summary-section">
          <header>
            <h4>Progress Types</h4>
          </header>
          {progressTypes.length === 0 ? (
            <div className="summary-placeholder small">No activity recorded.</div>
          ) : (
            <div className="type-grid">
              {progressTypes.map((item) => (
                <div key={item.type} className="type-card">
                  <span className="type-label">{item.type}</span>
                  <span className="type-count">{item.count}</span>
                  <span className="type-hint">
                    Last entry: {item.lastEntry ? new Date(item.lastEntry).toLocaleDateString() : "N/A"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="summary-section">
          <header>
            <h4>Timeline</h4>
          </header>
          {timeline.length === 0 ? (
            <div className="summary-placeholder small">No timeline data.</div>
          ) : (
            <ul className="timeline-list">
              {timeline.map((item) => (
                <li key={item.bucket}>
                  <div className="timeline-date">{item.bucket}</div>
                  <div className="timeline-bar">
                    <div className="timeline-total">{item.total} entries</div>
                    <div className="timeline-breakdown">
                      {item.breakdown.map((detail) => (
                        <span key={detail.type}>
                          {detail.type}: {detail.count}
                        </span>
                      ))}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>


        {/* Enhanced Analytics Components */}
        <section className="analytics-section">
          <CompletionRings
            goalId={selectedGoalId}
            mandalartData={goalPackages.find(pkg => pkg.mandalartData?.id === selectedGoalId)?.mandalartData}
            apiService={apiService}
          />
        </section>

        {/* NEW: Subjective Progress Visualizations */}
        <section className="analytics-section">
          <EmotionalJourneyMap goalId={selectedGoalId} />
        </section>

        <section className="analytics-section">
          <ReflectionWordCloud goalId={selectedGoalId} />
        </section>

        <section className="analytics-section">
          <ProgressCalendar
            goalId={selectedGoalId}
            apiService={apiService}
          />
        </section>

        <section className="analytics-section">
          <ProgressAnalytics
            goalId={selectedGoalId}
            apiService={apiService}
          />
        </section>

        <section className="analytics-section">
          <MilestoneTimeline
            goalId={selectedGoalId}
            apiService={apiService}
          />
        </section>
      </>
    );
  };

  return (
    <div className="progress-tracking-wrapper">
      <div className="progress-tracking-header">
        <div>
          <h2>{activeGoalTitle}</h2>
          <p>Stay on top of your goals with weekly, monthly, and yearly insights.</p>
        </div>
        <div className="progress-period-switcher">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.key}
              className={option.key === period ? "active" : ""}
              onClick={() => setPeriod(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="progress-tracking-layout">
        <aside className="progress-sidebar">
          <div className="sidebar-header">
            <h3>Your Goals</h3>
            <Link to="/goal-setting">Manage Goals →</Link>
          </div>
          <div className="sidebar-content">{renderGoalSidebar()}</div>
        </aside>

        <main className="progress-content">
          {error && <div className="error-banner">{error}</div>}
          {renderSummaryContent()}
        </main>
      </div>

      {/* Goal Summary Modal */}
      <GoalSummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        goalText={selectedGoalText}
        journalSummary={journalSummary}
        childrenSummary={childrenSummary}
        loadingJournalSummary={loadingJournalSummary}
        loadingChildrenSummary={loadingChildrenSummary}
      />
    </div>
  );
};

export default ProgressTracking;
