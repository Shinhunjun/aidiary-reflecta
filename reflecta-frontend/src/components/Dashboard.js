import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import apiService from "../services/api";
import GoalSummaryModal from "./GoalSummaryModal";
import EmotionalJourneyMap from "./EmotionalJourneyMap";
import ReflectionWordCloud from "./ReflectionWordCloud";
import CompletionRings from "./CompletionRings";
import PageTour from "./PageTour";
import HelpButton from "./HelpButton";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [goals, setGoals] = useState(null);
  const [goalId, setGoalId] = useState(null); // Store the Goal document _id
  const [journalStats, setJournalStats] = useState({ total: 0, thisWeek: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [selectedGoalText, setSelectedGoalText] = useState("");
  const [journalSummary, setJournalSummary] = useState(null);
  const [childrenSummary, setChildrenSummary] = useState(null);
  const [journalEntries, setJournalEntries] = useState([]);
  const [loadingJournalSummary, setLoadingJournalSummary] = useState(false);
  const [loadingChildrenSummary, setLoadingChildrenSummary] = useState(false);
  const [loadingJournalEntries, setLoadingJournalEntries] = useState(false);
  // Main goal AI summaries for dashboard display
  const [mainGoalJournalSummary, setMainGoalJournalSummary] = useState(null);
  const [mainGoalChildrenSummary, setMainGoalChildrenSummary] = useState(null);
  const [loadingMainSummaries, setLoadingMainSummaries] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);

        // Load goals
        const goalsResponse = await apiService.getGoals();
        if (Array.isArray(goalsResponse) && goalsResponse.length > 0) {
          setGoals(goalsResponse[0].mandalartData);
          setGoalId(goalsResponse[0]._id); // Store the Goal document _id
        } else if (goalsResponse && goalsResponse.mandalartData) {
          setGoals(goalsResponse.mandalartData);
          setGoalId(goalsResponse._id); // Store the Goal document _id
        }

        // Load journal entries
        const journals = await apiService.getJournalEntries();
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const thisWeekCount = journals.filter(
          (j) => new Date(j.date) > weekAgo
        ).length;
        setJournalStats({ total: journals.length, thisWeek: thisWeekCount });
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [user?.id]);

  // Fetch journal summary when goal is selected
  useEffect(() => {
    const fetchJournalSummary = async () => {
      if (!selectedGoalId) {
        setJournalSummary(null);
        return;
      }

      try {
        setLoadingJournalSummary(true);
        // Use goalId (MongoDB _id) instead of selectedGoalId (mandalart ID)
        const summary = await apiService.getGoalJournalSummary(goalId);
        setJournalSummary(summary);
      } catch (error) {
        console.error("Failed to fetch journal summary:", error);
        setJournalSummary(null);
      } finally {
        setLoadingJournalSummary(false);
      }
    };

    fetchJournalSummary();
  }, [selectedGoalId, goalId]);

  // Fetch children summary when goal is selected
  useEffect(() => {
    const fetchChildrenSummary = async () => {
      if (!selectedGoalId) {
        setChildrenSummary(null);
        return;
      }

      try {
        setLoadingChildrenSummary(true);
        // Use goalId (MongoDB _id) instead of selectedGoalId (mandalart ID)
        const summary = await apiService.getGoalChildrenSummary(goalId);
        setChildrenSummary(summary);
      } catch (error) {
        console.error("Failed to fetch children summary:", error);
        setChildrenSummary(null);
      } finally {
        setLoadingChildrenSummary(false);
      }
    };

    fetchChildrenSummary();
  }, [selectedGoalId, goalId]);

  // Fetch journal entries when goal is selected
  useEffect(() => {
    const fetchJournalEntries = async () => {
      if (!selectedGoalId) {
        setJournalEntries([]);
        return;
      }

      try {
        setLoadingJournalEntries(true);
        const entries = await apiService.getGoalJournals(selectedGoalId);
        setJournalEntries(entries || []);
      } catch (error) {
        console.error("Failed to fetch journal entries:", error);
        setJournalEntries([]);
      } finally {
        setLoadingJournalEntries(false);
      }
    };

    fetchJournalEntries();
  }, [selectedGoalId]);

  // Fetch main goal AI summaries for dashboard display
  useEffect(() => {
    const fetchMainGoalSummaries = async () => {
      if (!goalId) {
        setMainGoalJournalSummary(null);
        setMainGoalChildrenSummary(null);
        return;
      }

      try {
        setLoadingMainSummaries(true);

        // Fetch both summaries in parallel
        const [journalSum, childrenSum] = await Promise.all([
          apiService.getGoalJournalSummary(goalId),
          apiService.getGoalChildrenSummary(goalId)
        ]);

        setMainGoalJournalSummary(journalSum);
        setMainGoalChildrenSummary(childrenSum);
      } catch (error) {
        console.error("Failed to fetch main goal summaries:", error);
        setMainGoalJournalSummary(null);
        setMainGoalChildrenSummary(null);
      } finally {
        setLoadingMainSummaries(false);
      }
    };

    fetchMainGoalSummaries();
  }, [goalId]);

  const handleGoalClick = (goal) => {
    setSelectedGoalId(goal.id);
    setSelectedGoalText(goal.text);
    setShowSummaryModal(true);
  };

  const calculateGoalStats = () => {
    if (!goals || !goals.subGoals) {
      return { primary: 0, secondary: 0, completed: 0 };
    }

    const primaryGoals = goals.subGoals.filter((g) => g && g.text);
    const secondaryGoals = primaryGoals.reduce((count, goal) => {
      if (!goal.subGoals) return count;
      return count + goal.subGoals.filter((sg) => sg && sg.text).length;
    }, 0);

    return {
      primary: primaryGoals.length,
      secondary: secondaryGoals,
      completed: 0,
    };
  };

  const goalStats = calculateGoalStats();

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Goal Progress Dashboard</h1>
        <p>Track your journey towards achieving your goals</p>
      </header>

      <main className="dashboard-main">
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <h3>{goalStats.primary}</h3>
              <p>Primary Goals</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <h3>{goalStats.secondary}</h3>
              <p>Sub-Goals</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📝</div>
            <div className="stat-content">
              <h3>{journalStats.total}</h3>
              <p>Total Journals</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>{journalStats.thisWeek}</h3>
              <p>Journals This Week</p>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          <div className="dashboard-section">
            <h2>Your Goals Overview</h2>
            {goals && goals.text ? (
              <div className="goal-overview">
                <div className="main-goal-card">
                  <h3>{goals.text}</h3>
                  {goals.description && <p>{goals.description}</p>}
                </div>

                {goals.subGoals && goals.subGoals.filter((g) => g && g.text).length > 0 ? (
                  <div className="goals-grid">
                    {goals.subGoals
                      .filter((g) => g && g.text)
                      .map((goal) => (
                        <div
                          key={goal.id}
                          className="goal-card"
                          onClick={() => handleGoalClick(goal)}
                        >
                          <h4>{goal.text}</h4>
                          {goal.description && (
                            <p className="goal-description">
                              {goal.description}
                            </p>
                          )}
                          <div className="goal-meta">
                            <span>
                              {goal.subGoals?.filter((sg) => sg && sg.text)
                                .length || 0}{" "}
                              sub-goals
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>No primary goals yet. Start breaking down your main goal!</p>
                    <button
                      onClick={() => navigate("/goal-setting")}
                      className="action-button"
                    >
                      Add Primary Goals
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-state">
                <h3>No goals yet</h3>
                <p>Start your journey by setting your first goal.</p>
                <button
                  onClick={() => navigate("/goal-setting")}
                  className="action-button"
                >
                  Set Your Main Goal
                </button>
              </div>
            )}
          </div>

          {/* Progress Visualizations - Show for main goal */}
          {goals && goalId && (
            <>
              <div className="dashboard-section">
                <h2>🤖 AI Goal Progress Summary</h2>
                <p className="section-subtitle">
                  AI-powered insights on your goal journey
                </p>
                {loadingMainSummaries ? (
                  <div className="loading-placeholder">
                    <p>Loading AI insights...</p>
                  </div>
                ) : mainGoalJournalSummary || mainGoalChildrenSummary ? (
                  <div className="ai-summary-container">
                    {/* Journal Summary Section */}
                    {mainGoalJournalSummary?.summary && (
                      <div className="ai-summary-card">
                        <h3>📝 Journal Insights</h3>
                        <p className="ai-summary-text">{mainGoalJournalSummary.summary}</p>
                        <div className="summary-meta">
                          {mainGoalJournalSummary.entryCount && (
                            <span>📊 {mainGoalJournalSummary.entryCount} entries</span>
                          )}
                          {mainGoalJournalSummary.dateRange && (
                            <span>
                              📅 {mainGoalJournalSummary.dateRange.start} to {mainGoalJournalSummary.dateRange.end}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Children Summary Section */}
                    {mainGoalChildrenSummary?.summary && (
                      <div className="ai-summary-card">
                        <h3>🎯 Sub-Goals Progress</h3>
                        <p className="ai-summary-text">{mainGoalChildrenSummary.summary}</p>
                        <div className="summary-meta">
                          {mainGoalChildrenSummary.totalEntries && (
                            <span>📝 {mainGoalChildrenSummary.totalEntries} total entries</span>
                          )}
                          {mainGoalChildrenSummary.childGoalsSummaries && (
                            <span>
                              🎯 {mainGoalChildrenSummary.childGoalsSummaries.length} active sub-goals
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>Start journaling to see AI-generated progress insights!</p>
                  </div>
                )}
              </div>

              <div className="dashboard-section">
                <h2>💭 Your Emotional Journey</h2>
                <EmotionalJourneyMap goalId={goalId} />
              </div>

              <div className="dashboard-section">
                <h2>☁️ Words of Your Journey</h2>
                <ReflectionWordCloud goalId={goalId} />
              </div>
            </>
          )}
        </div>
      </main>

      {/* Goal Summary Modal */}
      <GoalSummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        goalText={selectedGoalText}
        selectedGoalId={selectedGoalId}
        journalSummary={journalSummary}
        childrenSummary={childrenSummary}
        journalEntries={journalEntries}
        loadingJournalSummary={loadingJournalSummary}
        loadingChildrenSummary={loadingChildrenSummary}
        loadingJournalEntries={loadingJournalEntries}
      />

      {/* Page Tour for Demo Users */}
      <PageTour
        page="dashboard"
        pageTotalSteps={10}
        pageStartStep={21}
        steps={[
          {
            icon: "👋",
            title: "Welcome to Your Dashboard!",
            description: "You've completed the full journey! This is your personal growth command center where all your reflections, goals, and progress come together. See AI-powered insights, track emotional patterns, and discover what makes each goal unique.",
            selector: null,
          },
          {
            icon: "📊",
            title: "Stats Overview",
            description: "At a glance, see your primary goals, sub-goals, total journal entries, and this week's entries. These numbers tell the story of your commitment to personal growth and consistent reflection.",
            selector: ".stats-overview",
          },
          {
            icon: "🎯",
            title: "Your Goals Overview",
            description: "Your Mandalart goal structure displayed as clickable cards. Each card represents a sub-goal from your goal-setting page. Click any card to see detailed AI summaries and journal entries specific to that goal!",
            selector: ".goals-grid",
          },
          {
            icon: "💡",
            title: "Click a Sub-Goal",
            description: "Try clicking 'Career Excellence' or any other sub-goal card! A modal will open showing AI progress analysis, distinctive word clouds (words unique to that goal), and all related journal entries. This is where goal mapping pays off!",
            selector: ".goal-card",
          },
          {
            icon: "🤖",
            title: "AI Progress Summary",
            description: "See AI-generated insights about your overall progress! The system analyzes all your journal entries and creates summaries showing patterns, achievements, and areas for growth. These summaries are cached for 7 days to save API costs.",
            selector: ".ai-summary-container",
          },
          {
            icon: "💭",
            title: "Emotional Journey",
            description: "This chart visualizes your mood patterns over time. See how your emotional state fluctuates as you work toward your goals. Notice correlations between moods and progress - maybe you're happiest when achieving milestones!",
            selector: ".dashboard-section",
          },
          {
            icon: "☁️",
            title: "Words of Your Journey",
            description: "Two word clouds compare your vocabulary: 'All Time' shows words from all entries, 'Last 3 Months' shows recent themes. Notice how your focus evolves! Toggle between views to see what's consistent vs. what's changing.",
            selector: ".dashboard-section",
          },
          {
            icon: "🔍",
            title: "Distinctive Word Clouds",
            description: "When you click a sub-goal card, its word cloud shows ONLY words unique to that goal - common words appearing across all goals are filtered out! This comparative filtering reveals what makes each goal distinct (e.g., 'network' for Career, 'workout' for Health).",
            selector: null,
          },
          {
            icon: "🔄",
            title: "The Complete Loop",
            description: "You've seen the full cycle: Set goals with Mandalart → Chat with AI → Convert to journal → Map to goals → View analytics! Every journal entry enriches your dashboard. Every goal you set gives context to your reflections. It's a continuous growth system.",
            selector: null,
          },
          {
            icon: "🎉",
            title: "Tour Complete!",
            description: "Congratulations! You now understand how Reflecta helps you grow through structured reflection. Try exploring on your own - journal about your progress, set new sub-goals, or review past insights. Your personal growth journey starts here!",
            selector: null,
          },
        ]}
      />

      {/* Help Button - Always show for demo users */}
      {user?.email === 'demo@reflecta.com' && (
        <HelpButton page="dashboard" />
      )}
    </div>
  );
};

export default Dashboard;
