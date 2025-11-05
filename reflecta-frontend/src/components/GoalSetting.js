import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTour } from "../contexts/TourContext";
import apiService from "../services/api";
import GoalProgressModal from "./GoalProgressModal";
import PageTour from "./PageTour";
import HelpButton from "./HelpButton";
import "./GoalSetting.css";

// Helper to create an empty Mandalart grid
const createEmptyMandalart = (idPrefix = "goal") => {
  const centralGoal = {
    id: `${idPrefix}-center`,
    text: "",
    completed: false,
    description: "",
    dueDate: null,
    subGoals: Array(9).fill(null), // Always 9 sub-goals for 3x3 grid
  };
  return {
    ...centralGoal,
    subGoals: centralGoal.subGoals.map((_, i) => ({
      id: `${idPrefix}-${i + 1}`,
      text: "",
      completed: false,
      description: "",
      dueDate: null,
      subGoals: Array(9).fill(null), // Nested sub-goals for primary objectives
    })),
  };
};

const GoalSetting = () => {
  const { user } = useAuth();
  const { tourActive, currentTourStep } = useTour();

  // Main state for the entire Mandalart structure
  const [mainMandalart, setMainMandalart] = useState(
    createEmptyMandalart("main")
  );
  const [isLoading, setIsLoading] = useState(true);

  // State for the currently displayed 3x3 grid (can be main or a sub-mandalart)
  const [currentMandalart, setCurrentMandalart] = useState(mainMandalart);

  // History stack for navigating back up the Mandalart tree
  // Input states for adding/editing goals
  const [newGoalText, setNewGoalText] = useState("");
  const [editingGoalId, setEditingGoalId] = useState(null); // ID of the goal being edited
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [goalDescription, setGoalDescription] = useState(""); // Used by AI
  const [newGoalDescription, setNewGoalDescription] = useState("");
  const [newGoalDueDate, setNewGoalDueDate] = useState("");
  const [aiTargetParentId, setAiTargetParentId] = useState(null);
  const [aiTargetCellIndex, setAiTargetCellIndex] = useState(null);
  const [manualInputTarget, setManualInputTarget] = useState(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [selectedSubGoal, setSelectedSubGoal] = useState(null);
  const [expandedGoal, setExpandedGoal] = useState(null); // For overlay expansion
  const [expandedGoalColorIndex, setExpandedGoalColorIndex] = useState(null);
  const [expandedGoalParent, setExpandedGoalParent] = useState(null);
  const [showProgressOverlay, setShowProgressOverlay] = useState(false);
  const [progressAnalytics, setProgressAnalytics] = useState(null);
  const safeSubGoals =
    (mainMandalart?.subGoals || []).filter((_, index) => index !== 4);
  const primaryGoalsCount = safeSubGoals.filter(
    (goal) => goal && goal.text
  ).length;
  const secondaryGoalsCount = safeSubGoals.reduce((count, goal) => {
    if (!goal || !goal.subGoals) return count;
    return (
      count +
      goal.subGoals.filter((subGoal) => subGoal && subGoal.text).length
    );
  }, 0);
  const emptyPrimarySlots = Math.max(0, 8 - primaryGoalsCount);
  const firstGoalNeedingDetail = safeSubGoals.find(
    (goal) =>
      goal &&
      goal.text &&
      (!goal.subGoals ||
        goal.subGoals.filter((subGoal) => subGoal && subGoal.text).length === 0)
  );

  // Goal Journals Modal states
  const [showJournalsModal, setShowJournalsModal] = useState(false);
  const [selectedGoalForJournals, setSelectedGoalForJournals] = useState(null);
  const [goalJournals, setGoalJournals] = useState([]);
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [showJournalDetail, setShowJournalDetail] = useState(false);
  const openManualGoalModal = () => {
    setEditingGoalId(null);
    setNewGoalText("");
    setNewGoalDescription("");
    setNewGoalDueDate("");
    setManualInputTarget({ parentId: currentMandalart.id, cellIndex: null });
    setShowManualInput(true);
  };

  const openGoalAssistant = () => {
    setGoalDescription("");
    setNewGoalDueDate("");
    setShowAIAssistant(true);
  };

  // Load goals from API
  useEffect(() => {
    const loadGoals = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        const response = await apiService.getGoals();
        console.log("Goals API response:", response);

        if (Array.isArray(response) && response.length > 0) {
          // Use the first goal's mandalartData
          const goal = response[0];
          if (goal.mandalartData) {
            setMainMandalart(goal.mandalartData);
            console.log("Loaded mandalart data:", goal.mandalartData);
          }
        } else if (response && response.mandalartData) {
          // Fallback for single goal response
          setMainMandalart(response.mandalartData);
          console.log(
            "Loaded mandalart data (single):",
            response.mandalartData
          );
        } else {
          console.log("No goals found, using empty mandalart");
        }
      } catch (error) {
        console.error("Error loading goals:", error);
        // Fallback to localStorage if API fails
        const savedMandalart = localStorage.getItem(`mandalart_${user.id}`);
        if (savedMandalart) {
          setMainMandalart(JSON.parse(savedMandalart));
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadGoals();
  }, [user?.id]);

  // Save goals to API
  useEffect(() => {
    const saveGoals = async () => {
      if (!user?.id || isLoading) return;

      try {
        await apiService.saveGoals(mainMandalart);
        // Also save to localStorage as backup
        localStorage.setItem(
          `mandalart_${user.id}`,
          JSON.stringify(mainMandalart)
        );
      } catch (error) {
        console.error("Error saving goals:", error);
        // Fallback to localStorage only
        localStorage.setItem(
          `mandalart_${user.id}`,
          JSON.stringify(mainMandalart)
        );
      }
    };

    // Debounce saves to avoid too many API calls
    const timeoutId = setTimeout(saveGoals, 1000);
    return () => clearTimeout(timeoutId);
  }, [mainMandalart, user?.id, isLoading]);

  // Update expandedGoal when mainMandalart changes
  useEffect(() => {
    if (expandedGoal) {
      const updatedExpanded = findGoalById(mainMandalart, expandedGoal.id);
      if (updatedExpanded) {
        setExpandedGoal(updatedExpanded);
        const parentInfo = findGoalParentInfo(mainMandalart, updatedExpanded.id);
        if (parentInfo) {
          setExpandedGoalColorIndex(
            mapSubGoalIndexToColor(parentInfo.index)
          );
          setExpandedGoalParent({
            parentId: parentInfo.parent.id,
            cellIndex: parentInfo.index,
          });
        } else {
          setExpandedGoalColorIndex(null);
          setExpandedGoalParent(null);
        }
      }
    }
  }, [mainMandalart, expandedGoal]);

  // Update currentMandalart when mainMandalart changes
  useEffect(() => {
    setCurrentMandalart((prevCurrent) => {
      const updatedCurrent = findGoalById(mainMandalart, prevCurrent.id);
      return updatedCurrent || mainMandalart;
    });
  }, [mainMandalart]);

  // Load progress analytics
  useEffect(() => {
    const loadProgressAnalytics = async () => {
      if (!mainMandalart?.id || !showProgressOverlay) return;

      try {
        const data = await apiService.getGoalProgressAnalytics(mainMandalart.id);
        setProgressAnalytics(data);
      } catch (err) {
        console.error("Failed to load progress analytics:", err);
      }
    };

    loadProgressAnalytics();
  }, [mainMandalart?.id, showProgressOverlay]);

  // Helper function to calculate completion percentage for a goal
  const getGoalCompletionPercentage = (goal) => {
    if (!goal) return 0;
    if (!goal.subGoals || goal.subGoals.length === 0) {
      return goal.completed ? 100 : 0;
    }
    const completedSubGoals = goal.subGoals.filter(sg => sg && sg.completed).length;
    return Math.round((completedSubGoals / goal.subGoals.length) * 100);
  };

  // Function to update a goal anywhere in the mainMandalart tree
  const updateGoalInTree = (tree, targetId, updates) => {
    if (!tree) return null;

    if (tree.id === targetId) {
      return { ...tree, ...updates };
    }

    if (tree.subGoals) {
      const updatedSubGoals = tree.subGoals.map((subGoal) =>
        updateGoalInTree(subGoal, targetId, updates)
      );
      return { ...tree, subGoals: updatedSubGoals };
    }
    return tree;
  };

  // Function to add/edit a goal
  const handleSaveGoal = (
    targetParentId = null,
    targetCellIndex = null,
    goalText = null
  ) => {
    const textToUse = goalText || newGoalText.trim();
    if (!textToUse) return;

    console.log("handleSaveGoal called with:", {
      targetParentId,
      targetCellIndex,
      goalText: textToUse,
    });

    const newGoal = {
      id: editingGoalId || `goal-${Date.now()}`,
      text: textToUse,
      completed: false,
      description: newGoalDescription.trim(),
      dueDate: null,
      subGoals: Array(9).fill(null), // Initialize with empty sub-goals
    };

    setMainMandalart((prevMain) => {
      const updatedMain = JSON.parse(JSON.stringify(prevMain)); // Deep copy

      if (editingGoalId) {
        // Editing an existing goal
        const result = updateGoalInTree(updatedMain, editingGoalId, {
          text: newGoalText.trim(),
          description: newGoalDescription.trim(),
          dueDate: null,
        });
        // Save to API with updated data
        setTimeout(() => saveGoalsToAPI(result), 100);
        return result;
      } else if (targetParentId !== null && targetCellIndex !== null) {
        // Adding a sub-goal to a specific cell
        console.log("Adding sub-goal to specific cell:", targetCellIndex);
        const parentGoal = findGoalById(updatedMain, targetParentId);
        console.log("Parent goal found:", parentGoal);
        if (parentGoal && parentGoal.subGoals) {
          // Ensure we have exactly 9 sub-goals
          while (parentGoal.subGoals.length < 9) {
            parentGoal.subGoals.push(null);
          }
          console.log("Setting sub-goal at index:", targetCellIndex);
          parentGoal.subGoals[targetCellIndex] = newGoal;
          console.log("Sub-goal set successfully");
        }
        // Save to API with updated data
        setTimeout(() => saveGoalsToAPI(updatedMain), 100);
        return updatedMain;
      } else if (mainMandalart.text === "") {
        // Adding the very first main goal
        setTimeout(() => saveGoalsToAPI(newGoal), 100);
        return newGoal;
      } else {
        // Determine the correct parent goal based on context
        let parentGoal;
        if (expandedGoal) {
          // If we're in an expanded overlay, use the expanded goal
          parentGoal = findGoalById(updatedMain, expandedGoal.id);
        } else {
          // If we're in the main mandalart, use the current mandalart
          parentGoal = findGoalById(updatedMain, currentMandalart.id);
        }

        if (parentGoal && parentGoal.subGoals) {
          // Ensure we have exactly 9 sub-goals
          while (parentGoal.subGoals.length < 9) {
            parentGoal.subGoals.push(null);
          }
          const firstEmptyIndex = parentGoal.subGoals.findIndex(
            (sg) => !sg || !sg.text
          );
          if (firstEmptyIndex !== -1) {
            parentGoal.subGoals[firstEmptyIndex] = newGoal;
          } else {
            alert(
              "All sub-goal slots are full. Please zoom in or delete an existing goal."
            );
          }
        }
        // Save to API with updated data
        setTimeout(() => saveGoalsToAPI(updatedMain), 100);
      }
      return updatedMain;
    });

    setNewGoalText("");
    setNewGoalDescription("");
    setNewGoalDueDate("");
    setEditingGoalId(null);
    setShowManualInput(false);

    // After saving, ensure currentMandalart reflects the change
    setCurrentMandalart(
      (prevCurrent) =>
        findGoalById(mainMandalart, prevCurrent.id) || mainMandalart
    );
  };

  // Function to save goals to API
  const saveGoalsToAPI = async (mandalartData = null) => {
    try {
      const dataToSave = mandalartData ?? mainMandalart;
      if (!dataToSave) {
        return;
      }
      console.log("Saving goals to API:", dataToSave);
      await apiService.saveGoals(dataToSave);
      console.log("Goals saved successfully to API");
    } catch (error) {
      console.error("Error saving goals to API:", error);
      alert("Failed to save goals. Please try again.");
    }
  };

  // Function to find a goal by ID in the tree
  const findGoalById = (tree, id) => {
    if (!tree || !id) return null;
    if (tree.id === id) return tree;

    if (tree.subGoals) {
      for (const subGoal of tree.subGoals) {
        const found = findGoalById(subGoal, id);
        if (found) return found;
      }
    }
    return null;
  };

  const mapSubGoalIndexToColor = (index) => {
    if (index === null || index === undefined) {
      return null;
    }
    if (index < 4) {
      return index;
    }
    if (index >= 4 && index <= 7) {
      return index + 1;
    }
    if (index === 8) {
      return 8;
    }
    return null;
  };

  const findGoalParentInfo = (tree, targetId) => {
    if (!tree || !tree.subGoals) {
      return null;
    }

    for (let i = 0; i < tree.subGoals.length; i++) {
      const child = tree.subGoals[i];
      if (!child) {
        continue;
      }
      if (child.id === targetId) {
        return { parent: tree, index: i };
      }
      const found = findGoalParentInfo(child, targetId);
      if (found) {
        return found;
      }
    }

    return null;
  };

  const getNextChildSlot = (parentGoal, preferredIndex = null) => {
    if (!parentGoal) {
      return preferredIndex ?? 0;
    }

    const subGoalsArray = parentGoal.subGoals || [];
    if (
      preferredIndex !== null &&
      preferredIndex !== undefined
    ) {
      return preferredIndex;
    }

    const emptyIndex = subGoalsArray.findIndex(
      (child) => !child || !child.text
    );
    if (emptyIndex !== -1) {
      return emptyIndex;
    }

    return subGoalsArray.length;
  };

  const openManualInputForChild = (parentGoal, preferredIndex = null) => {
    if (!parentGoal) return;
    const targetIndex = getNextChildSlot(parentGoal, preferredIndex);
    setEditingGoalId(null);
    setNewGoalText("");
    setNewGoalDescription("");
    setNewGoalDueDate("");
    setManualInputTarget({
      parentId: parentGoal.id,
      cellIndex: targetIndex,
    });
    setShowManualInput(true);
  };

  const openAIAssistantForChild = (parentGoal, preferredIndex = null) => {
    if (!parentGoal) return;
    const targetIndex = getNextChildSlot(parentGoal, preferredIndex);
    setEditingGoalId(null);
    setNewGoalText("");
    setGoalDescription("");
    setNewGoalDescription("");
    setNewGoalDueDate("");
    setAiTargetParentId(parentGoal.id);
    setAiTargetCellIndex(targetIndex);
    setShowAIAssistant(true);
  };

  const overlayDirectionClasses = [
    "overlay-direction-top-left",
    "overlay-direction-top",
    "overlay-direction-top-right",
    "overlay-direction-left",
    "overlay-direction-center",
    "overlay-direction-right",
    "overlay-direction-bottom-left",
    "overlay-direction-bottom",
    "overlay-direction-bottom-right",
  ];

  // Navigation: Zoom into a sub-mandalart (overlay mode)
  const zoomIn = (
    goal,
    colorIndexOverride = null,
    parentGoalId = null,
    parentCellIndex = null
  ) => {
    if (goal) {
      // Ensure the goal has subGoals structure
      if (!goal.subGoals) {
        goal.subGoals = Array(9).fill(null);
      }
      let derivedColorIndex = colorIndexOverride;
      if (derivedColorIndex === null) {
        const parentInfo = findGoalParentInfo(mainMandalart, goal.id);
        if (parentInfo) {
          derivedColorIndex = mapSubGoalIndexToColor(parentInfo.index);
        }
      }
      setExpandedGoalColorIndex(derivedColorIndex);
      setExpandedGoal(goal);
      setExpandedGoalParent(
        parentGoalId !== null && parentGoalId !== undefined
          ? { parentId: parentGoalId, cellIndex: parentCellIndex }
          : null
      );
    }
  };

  // Navigation: Close expanded overlay
  const zoomOut = () => {
    setExpandedGoal(null);
    setExpandedGoalColorIndex(null);
    setExpandedGoalParent(null);
  };

  // Tour mode: Auto-expand grid for specific steps
  useEffect(() => {
    if (!tourActive || !currentTourStep) return;
    if (currentTourStep.pageId !== 'goal-setting') return;

    // Step 5: Auto-expand first sub-goal to show 3x3 detail grid
    if (currentTourStep.stepIndex === 5 && mainMandalart?.subGoals) {
      const firstGoalWithText = mainMandalart.subGoals.find(
        (g) => g && g.text && g.id !== mainMandalart.id
      );
      if (firstGoalWithText && !expandedGoal) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          zoomIn(firstGoalWithText, 0, mainMandalart.id, 0);
        }, 300);
      }
    }

    // Step 7 or later: Close expanded view if still open
    if (currentTourStep.stepIndex >= 7 && expandedGoal) {
      setTimeout(() => {
        zoomOut();
      }, 300);
    }
  }, [tourActive, currentTourStep, mainMandalart, expandedGoal]);

  // Toggle goal completion function removed

  // Handle progress tracking
  const handleProgressClick = (goalId, subGoalId = null) => {
    const goal = findGoalById(mainMandalart, goalId);
    if (goal) {
      setSelectedGoal(goal);
      setSelectedSubGoal(
        subGoalId && goal.subGoals
          ? goal.subGoals.find((sg) => sg && sg.id === subGoalId)
          : null
      );
      setShowProgressModal(true);
    }
  };

  // Handle journals viewing
  const handleJournalsClick = async (goalId, subGoalId = null) => {
    try {
      const targetGoalId = subGoalId || goalId;
      const journals = await apiService.getGoalJournals(targetGoalId);

      setSelectedGoalForJournals({ goalId, subGoalId });
      setGoalJournals(journals);
      setShowJournalsModal(true);
    } catch (error) {
      console.error("Error loading goal journals:", error);
      alert("Failed to load journals for this goal.");
    }
  };

  // Handle journal detail view
  const handleJournalClick = (journal) => {
    setSelectedJournal(journal);
    setShowJournalDetail(true);
  };

  // Delete a goal
  const handleDeleteGoal = (goalId, parentId = null, cellIndex = null) => {
    if (
      window.confirm(
        "Are you sure you want to delete this goal and all its sub-goals?"
      )
    ) {
      if (parentId === null) {
        // Deleting the main goal
        const resetMandalart = createEmptyMandalart("main");
        setMainMandalart(resetMandalart);
        setCurrentMandalart(resetMandalart);
        setExpandedGoal(null);
        setExpandedGoalParent(null);
        // Save to API
        saveGoalsToAPI(resetMandalart);
      } else {
        // Deleting a sub-goal
        setMainMandalart((prevMain) => {
          const updatedMain = JSON.parse(JSON.stringify(prevMain));
          const parentGoal = findGoalById(updatedMain, parentId);
          if (parentGoal && parentGoal.subGoals) {
            // Ensure we have exactly 9 sub-goals
            while (parentGoal.subGoals.length < 9) {
              parentGoal.subGoals.push(null);
            }
            parentGoal.subGoals[cellIndex] = null; // Replace with null to show empty cell

            if (expandedGoal) {
              if (expandedGoal.id === goalId) {
                setExpandedGoal(null);
                setExpandedGoalParent(null);
              } else if (expandedGoal.id === parentGoal.id) {
                const refreshedExpanded = findGoalById(
                  updatedMain,
                  expandedGoal.id
                );
                setExpandedGoal(refreshedExpanded);
              }
            }
          }
          setTimeout(() => saveGoalsToAPI(updatedMain), 0);
          return updatedMain;
        });
      }
    }
  };

  // AI Assistant Logic (adapted for Mandalart)
  const getAIGoalSuggestion = async () => {
    if (!goalDescription.trim()) {
      alert("Please describe what you want to achieve first.");
      return;
    }

    setIsLoadingAI(true);
    setAiSuggestion("");

    try {
      const useMockAPI = process.env.REACT_APP_MOCK_API === "true";

      if (useMockAPI) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setAiSuggestion(
          `Based on your goal "${goalDescription}", here's a SMART goal suggestion:\n\n**Specific**: ${goalDescription}\n**Measurable**: Define clear metrics to track progress\n**Achievable**: Break it down into smaller, manageable steps\n**Relevant**: Ensure it aligns with your long-term vision\n**Time-bound**: Set a realistic deadline\n\nSuggested primary objectives:\n1. Objective A\n2. Objective B\n3. Objective C\n4. Objective D\n5. Objective E\n6. Objective F\n7. Objective G\n8. Objective H`
        );
      } else {
        const response = await apiService.generateGoalSuggestions({
          description: goalDescription.trim(),
          dueDate: newGoalDueDate || null,
        });
        setAiSuggestion(response.suggestion);
      }
    } catch (error) {
      console.error("Error getting AI suggestion:", error);
      setAiSuggestion(
        "I'm having trouble connecting right now. Please try again later or set your goal manually."
      );
    } finally {
      setIsLoadingAI(false);
    }
  };

  const applyAISuggestion = () => {
    if (aiSuggestion) {
      const lines = aiSuggestion
        .split("\n")
        .filter((line) => line.trim() !== "");
      let mainGoalText = "";
      const primaryObjectives = [];

      // Parse AI suggestion
      if (lines.length > 0) {
        mainGoalText = lines[0].replace(/^(Main Goal:|Goal:)\s*/i, "").trim();
        for (let i = 1; i < lines.length; i++) {
          const objText = lines[i].replace(/^-?\s*\d+\.\s*/, "").trim();
          if (objText) primaryObjectives.push(objText);
        }
      }

      setMainMandalart((prevMain) => {
        const updatedMain = JSON.parse(JSON.stringify(prevMain)); // Deep copy
        const targetGoal = findGoalById(updatedMain, aiTargetParentId);

        if (targetGoal) {
          // Ensure we have exactly 9 sub-goals
          while (targetGoal.subGoals.length < 9) {
            targetGoal.subGoals.push(null);
          }
          targetGoal.subGoals[aiTargetCellIndex] = {
            id: `${targetGoal.id}-${aiTargetCellIndex + 1}`,
            text: mainGoalText || goalDescription,
            completed: false,
            description: newGoalDescription.trim(),
            dueDate: newGoalDueDate || null,
            subGoals: primaryObjectives.map((objText, i) => ({
              id: `${targetGoal.id}-${aiTargetCellIndex + 1}-${i + 1}`,
              text: objText,
              completed: false,
              description: "",
              dueDate: null,
              subGoals: Array(8).fill(null),
            })),
          };
        }
        return updatedMain;
      });

      setShowAIAssistant(false);
      setAiSuggestion("");
      setGoalDescription("");
      setAiTargetParentId(null);
      setAiTargetCellIndex(null);
      // Update currentMandalart to reflect the change
      setCurrentMandalart(
        (prevCurrent) =>
          findGoalById(mainMandalart, prevCurrent.id) || mainMandalart
      );
    }
  };
  return (
    <div className="mandalart-container">
      {/* Header hidden for cleaner view */}
      {/* <div className="mandalart-page-header">
        <div className="mandalart-breadcrumbs">
          <Link to="/">Home</Link>
          <span className="separator">/</span>
          <span className="current">Goal Setting</span>
        </div>
        <div className="mandalart-header">
          <div className="mandalart-title-group">
            <h1>Mandalart Goal Setting</h1>
            <p>Visualize and break down your goals hierarchically</p>
          </div>
          <div className="mandalart-header-actions">
            <Link to="/journal" className="mandalart-outline-btn">
              📓 Open Journal
            </Link>
            <button
              type="button"
              className={`mandalart-outline-btn ${showProgressOverlay ? 'active' : ''}`}
              onClick={() => setShowProgressOverlay(!showProgressOverlay)}
              title="Toggle progress overlay"
            >
              {showProgressOverlay ? '📊 Hide Progress' : '📊 Show Progress'}
            </button>
            <button
              type="button"
              className="mandalart-solid-btn"
              onClick={openGoalAssistant}
            >
              🤖 AI Breakdown
            </button>
            <button
              type="button"
              className="mandalart-outline-btn"
              onClick={openManualGoalModal}
            >
              ✍️ Add Manually
            </button>
          </div>
        </div>
      </div> */}

      {mainMandalart.text === "" ? (
        <div className="initial-goal-setup">
          <h3>Start Your Mandalart</h3>
          <p className="mandalart-empty-text">
            Outline your core vision to unlock the eight focus areas that will surround it.
          </p>
          <input
            type="text"
            value={newGoalText}
            onChange={(e) => setNewGoalText(e.target.value)}
            placeholder="Define your main life goal..."
          />
          <div className="mandalart-empty-actions">
            <button onClick={() => handleSaveGoal()} className="mandalart-btn">
              Set Main Goal
            </button>
            <button
              onClick={() => {
                setGoalDescription("");
                setShowAIAssistant(true);
              }}
              className="mandalart-btn secondary"
            >
              🤖 Let AI Suggest
            </button>
          </div>
        </div>
      ) : (
        <>
          {showManualInput && (
            <div className="mandalart-input-modal">
              <div className="mandalart-input-panel">
                <h3>Add/Edit Goal</h3>
                <div className="mandalart-input-group">
                  <label>Goal Text</label>
                  <input
                    type="text"
                    value={newGoalText}
                    onChange={(e) => setNewGoalText(e.target.value)}
                    placeholder="Enter your goal..."
                  />
                </div>
                <div className="mandalart-input-group">
                  <label>Description (optional)</label>
                  <textarea
                    value={newGoalDescription}
                    onChange={(e) => setNewGoalDescription(e.target.value)}
                    placeholder="Add more details about this goal..."
                    rows="3"
                  />
                </div>
                <div className="mandalart-input-actions">
                  <button
                    onClick={() => {
                      setShowManualInput(false);
                      setManualInputTarget(null);
                    }}
                    className="mandalart-btn secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const targetParentId =
                        manualInputTarget?.parentId || currentMandalart.id;
                      const targetCellIndex =
                        manualInputTarget && manualInputTarget.cellIndex !== undefined
                          ? manualInputTarget.cellIndex
                          : null;
                      handleSaveGoal(targetParentId, targetCellIndex);
                      setManualInputTarget(null);
                    }}
                    className="mandalart-btn"
                  >
                    {editingGoalId ? "Update Goal" : "Add Goal"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mandalart-content-shell">
            <div className="mandalart-grid-panel">
              <div className="mandalart-grid-toolbar">
                <div>
                  <h3>Your Goal Canvas</h3>
                  <p>Click a primary goal to zoom in and break it into actionable steps.</p>
                </div>
                <div className="mandalart-toolbar-actions">
                  <button
                    className="mandalart-ghost-btn"
                    onClick={() => openManualInputForChild(currentMandalart)}
                  >
                    + Manual Sub-goal
                  </button>
                  <button
                    className="mandalart-primary-btn"
                    onClick={() => openAIAssistantForChild(currentMandalart)}
                  >
                    🤖 AI Assist
                  </button>
                </div>
              </div>

              <div className="mandalart-grid-surface">
                <div className="mandalart-grid">
                  {Array.from({ length: 9 }, (_, mainIndex) => {
                    const isCenter = mainIndex === 4;
                    const subGoalIndex = mainIndex < 4 ? mainIndex : mainIndex - 1;
                    const goal = isCenter
                      ? currentMandalart
                      : currentMandalart.subGoals[subGoalIndex] || null;
                    const colorIndex =
                      !isCenter && goal
                        ? mapSubGoalIndexToColor(subGoalIndex)
                        : null;
                    const colorClass =
                      colorIndex !== null ? `mandalart-color-${colorIndex}` : "";

                    if (isCenter) {
                      return (
                        <div
                          key="main-center-goal"
                          className={`mandalart-cell center ${
                            goal && goal.text ? "has-goal" : "empty"
                          }`}
                          onClick={() => {
                            if (goal && goal.text) {
                              setEditingGoalId(goal.id);
                              setNewGoalText(goal.text);
                              setNewGoalDescription(goal.description);
                              setNewGoalDueDate(goal.dueDate);
                              setManualInputTarget(null);
                              setShowManualInput(true);
                            } else {
                              setEditingGoalId(null);
                              setNewGoalText("");
                              setGoalDescription("");
                              setShowAIAssistant(true);
                              setAiTargetParentId(currentMandalart.id);
                              setAiTargetCellIndex(null);
                            }
                          }}
                        >
                          <div className="mandalart-cell-actions">
                            {goal && goal.text && (
                              <button
                                className="mandalart-cell-action-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingGoalId(goal.id);
                                  setNewGoalText(goal.text);
                                  setNewGoalDescription(goal.description);
                                  setNewGoalDueDate(goal.dueDate);
                                  setManualInputTarget(null);
                                  setShowManualInput(true);
                                }}
                                title="Edit Main Goal"
                              >
                                ✏️
                              </button>
                            )}
                          </div>
                          <div className="mandalart-cell-content">
                            <div className="mandalart-cell-text">
                              {goal && goal.text
                                ? goal.text
                                : "Click to set main goal"}
                            </div>
                            {goal && goal.description && (
                              <div className="mandalart-cell-description">
                                {goal.description}
                              </div>
                            )}
                          </div>
                          {goal && goal.text && showProgressOverlay && (
                            <div className="progress-overlay">
                              <div className="progress-percentage">
                                {getGoalCompletionPercentage(goal)}%
                              </div>
                              <div
                                className="progress-bar"
                                style={{
                                  width: `${getGoalCompletionPercentage(goal)}%`,
                                  background: getGoalCompletionPercentage(goal) === 100
                                    ? '#00b894'
                                    : `linear-gradient(90deg, #6c5ce7 0%, #a29bfe 100%)`
                                }}
                              ></div>
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={`primary-goal-${mainIndex}`}
                        className={`mandalart-cell outer ${
                          goal && goal.text ? "has-goal" : "empty"
                        } ${goal && goal.text ? colorClass : ""} overlay-direction-${
                          ["top-left", "top", "top-right", "left", "center", "right", "bottom-left", "bottom", "bottom-right"][
                            mainIndex
                          ]
                        }`}
                        data-main-index={mainIndex}
                        onClick={() => {
                          if (goal && goal.text) {
                            zoomIn(goal, null, currentMandalart.id, subGoalIndex);
                          }
                        }}
                      >
                        <div className="mandalart-cell-actions">
                          {goal && goal.text ? (
                            <>
                              <button
                                className="mandalart-cell-action-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingGoalId(goal.id);
                                  setNewGoalText(goal.text);
                                  setNewGoalDescription(goal.description);
                                  setNewGoalDueDate(goal.dueDate);
                                  setManualInputTarget(null);
                                  setShowManualInput(true);
                                }}
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                className="mandalart-cell-action-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleJournalsClick(goal.id);
                                }}
                                title="View Related Journals"
                              >
                                📝
                              </button>
                              <button
                                className="mandalart-cell-action-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleProgressClick(goal.id);
                                }}
                                title="Track Progress"
                              >
                                📈
                              </button>
                              <button
                                className="mandalart-cell-action-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteGoal(
                                    goal.id,
                                    currentMandalart.id,
                                    subGoalIndex
                                  );
                                }}
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </>
                          ) : (
                            <button
                              className="mandalart-cell-action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingGoalId(null);
                                setNewGoalText("");
                                setGoalDescription("");
                                setShowAIAssistant(true);
                                setAiTargetParentId(currentMandalart.id);
                                setAiTargetCellIndex(subGoalIndex);
                              }}
                              title="Add Goal"
                            >
                              ➕
                            </button>
                          )}
                        </div>
                        <div className="mandalart-cell-content">
                          <div className="mandalart-cell-text">
                            {goal && goal.text ? goal.text : "Add Goal"}
                          </div>
                          {goal && goal.description && (
                            <div className="mandalart-cell-description">
                              {goal.description}
                            </div>
                          )}
                        </div>
                        {goal && goal.text && showProgressOverlay && (
                          <div className="progress-overlay">
                            <div className="progress-percentage">
                              {getGoalCompletionPercentage(goal)}%
                            </div>
                            <div
                              className="progress-bar"
                              style={{
                                width: `${getGoalCompletionPercentage(goal)}%`,
                                background: getGoalCompletionPercentage(goal) === 100
                                  ? '#00b894'
                                  : `linear-gradient(90deg, #6c5ce7 0%, #a29bfe 100%)`
                              }}
                            ></div>
                          </div>
                        )}
                        {goal && goal.text && (
                          <div className="mandalart-expand-indicator">Expand</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mandalart-grid-hint">
                Tip: Expand a goal to explore its details, or use the quick actions above to add new ideas.
              </div>
            </div>

            {/* Sidebar hidden for cleaner view */}
            {/* <aside className="mandalart-sidebar">
              <div className="mandalart-sidebar-card">
                <h4>Progress Snapshot</h4>
                <ul className="mandalart-stat-list">
                  <li>
                    <span className="mandalart-stat-label">Primary goals</span>
                    <span className="mandalart-stat-value">
                      {primaryGoalsCount}/8
                    </span>
                  </li>
                  <li>
                    <span className="mandalart-stat-label">Supporting steps</span>
                    <span className="mandalart-stat-value">
                      {secondaryGoalsCount}
                    </span>
                  </li>
                  <li>
                    <span className="mandalart-stat-label">Open slots</span>
                    <span className="mandalart-stat-value">
                      {emptyPrimarySlots}
                    </span>
                  </li>
                </ul>
              </div>
              <div className="mandalart-sidebar-card mandalart-sidebar-tips">
                <h4>Next Suggested Step</h4>
                <p>
                  {firstGoalNeedingDetail
                    ? `Add supporting actions for "${firstGoalNeedingDetail.text}" to keep momentum.`
                    : "All primary goals are supported. Continue refining or revisit your journal insights."}
                </p>
                <ul className="mandalart-tips-list">
                  <li>Use AI Assist to turn broad ideas into weekly actions.</li>
                  <li>Capture quick reflections after each update to track momentum.</li>
                  <li>Review your dashboard frequently to celebrate progress.</li>
                </ul>
                <Link to="/journal?tab=entries" className="mandalart-link">
                  Open Journal Workspace
                </Link>
              </div>
            </aside> */}
          </div>
        </>
      )}

      {/* AI Assistant Modal */}
      {showAIAssistant && (
        <div className="mandalart-input-modal">
          <div className="mandalart-input-panel">
            <h3>Get AI Help with Your Goal</h3>
            <div className="mandalart-input-group">
              <label>What do you want to achieve?</label>
              <textarea
                value={goalDescription}
                onChange={(e) => setGoalDescription(e.target.value)}
                placeholder={`Add a sub-goal for "${
                  expandedGoal
                    ? expandedGoal.text
                    : currentMandalart.text || "your main goal"
                }"`}
                rows="3"
              />
            </div>
            <div className="mandalart-input-actions">
              <button
                onClick={() => setShowAIAssistant(false)}
                className="mandalart-btn secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Use the existing handleSaveGoal function with proper target parameters
                  const goalText = goalDescription.trim();
                  setNewGoalText(goalText);
                  setNewGoalDescription("");
                  setNewGoalDueDate(null);

                  // Call handleSaveGoal with the target parameters
                  handleSaveGoal(
                    aiTargetParentId || currentMandalart.id,
                    aiTargetCellIndex !== undefined ? aiTargetCellIndex : 0,
                    goalText
                  );

                  // Reset form and close modal
                  setGoalDescription("");
                  setShowAIAssistant(false);
                }}
                className="mandalart-btn secondary"
                disabled={!goalDescription.trim()}
              >
                + Add Goal Directly
              </button>
              <button
                onClick={() => getAIGoalSuggestion(currentMandalart.id)}
                disabled={isLoadingAI || !goalDescription.trim()}
                className="mandalart-btn"
              >
                {isLoadingAI ? "Getting Suggestion..." : "🤖 Get AI Suggestion"}
              </button>
            </div>

            {aiSuggestion && (
              <div className="ai-suggestion">
                <h5>AI Suggestion:</h5>
                <div className="suggestion-content">
                  {aiSuggestion.split("\n").map((line, index) => (
                    <p
                      key={index}
                      className={line.includes("**") ? "bold-line" : ""}
                    >
                      {line.replace(/\*\*/g, "")}
                    </p>
                  ))}
                </div>
                <div className="mandalart-input-actions">
                  <button
                    onClick={() => setShowAIAssistant(false)}
                    className="mandalart-btn secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() =>
                      applyAISuggestion(aiTargetParentId || currentMandalart.id)
                    }
                    className="mandalart-btn"
                  >
                    Apply This Goal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expanded Goal Overlay */}
      {expandedGoal && (
        <div className="mandalart-overlay">
          <div className="mandalart-overlay-content">
            <div className="mandalart-overlay-header">
              <h3>{expandedGoal.text || "Sub-goals"}</h3>
              <button
                onClick={zoomOut}
                className="mandalart-overlay-close"
                title="Close"
              >
                ✕
              </button>
            </div>

            <div className="mandalart-overlay-grid">
              {Array.from({ length: 9 }, (_, cellIndex) => {
                if (cellIndex === 4) {
                  const subGoalCount =
                    expandedGoal.subGoals?.filter((child) => child && child.text)
                      .length || 0;
                  return (
                    <div
                      key="overlay-center"
                      className={`overlay-main-cell ${
                        expandedGoalColorIndex !== null
                          ? `mandalart-color-${expandedGoalColorIndex}`
                          : "overlay-main-default"
                      }`}
                    >
                      <div className="overlay-main-cell-header">
                        <h3>{expandedGoal.text || "Untitled Goal"}</h3>
                        <div className="overlay-main-cell-actions">
                          <button
                            className="overlay-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingGoalId(expandedGoal.id);
                              setNewGoalText(expandedGoal.text || "");
                              setNewGoalDescription(expandedGoal.description || "");
                              setNewGoalDueDate(expandedGoal.dueDate || null);
                              setManualInputTarget(null);
                              setShowManualInput(true);
                            }}
                            title="Edit Goal"
                          >
                            ✏️
                          </button>
                          <button
                            className="overlay-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleJournalsClick(expandedGoal.id);
                            }}
                            title="View Related Journals"
                          >
                            📝
                          </button>
                          <button
                            className="overlay-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProgressClick(expandedGoal.id);
                            }}
                            title="Track Progress"
                          >
                            📈
                          </button>
                          {expandedGoalParent && (
                            <button
                              className="overlay-action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteGoal(
                                  expandedGoal.id,
                                  expandedGoalParent.parentId,
                                  expandedGoalParent.cellIndex
                                );
                              }}
                              title="Delete Goal"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                      {expandedGoal.description && (
                        <p className="overlay-main-cell-description">
                          {expandedGoal.description}
                        </p>
                      )}
                      <div className="overlay-main-cell-meta">
                        <span>
                          {expandedGoal.dueDate
                            ? `Due by ${new Date(
                                expandedGoal.dueDate
                              ).toLocaleDateString()}`
                            : "No due date"}
                        </span>
                        <span>{subGoalCount} / 8 sub-goals</span>
                      </div>
                      <div className="overlay-main-cell-footer">
                        <button
                          className="overlay-secondary-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            openManualInputForChild(expandedGoal);
                          }}
                        >
                          + Manual Sub-goal
                        </button>
                        <button
                          className="overlay-primary-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            openAIAssistantForChild(expandedGoal);
                          }}
                        >
                          🤖 AI Assist
                        </button>
                      </div>
                    </div>
                  );
                }

                const subGoalIndex = cellIndex < 4 ? cellIndex : cellIndex - 1;
                const childGoal =
                  expandedGoal.subGoals?.[subGoalIndex] || null;
                const childColorIndex =
                  expandedGoalColorIndex !== null
                    ? expandedGoalColorIndex
                    : mapSubGoalIndexToColor(subGoalIndex);
                const colorClass =
                  childGoal && childColorIndex !== null
                    ? `mandalart-color-${childColorIndex}`
                    : "";
                const directionClass = overlayDirectionClasses[cellIndex];
                const filledSubGoals =
                  childGoal?.subGoals?.filter((node) => node && node.text) || [];
                const visibleSubGoals = filledSubGoals.slice(0, 3);
                const remainingSubGoals =
                  filledSubGoals.length - visibleSubGoals.length;

                return (
                  <div
                    key={`overlay-cell-${cellIndex}`}
                    className={`overlay-sub-cell ${directionClass} ${
                      childGoal ? "has-goal" : "empty"
                    } ${colorClass}`}
                    onClick={() => {
                      if (childGoal) {
                        zoomIn(childGoal, null, expandedGoal.id, subGoalIndex);
                      } else {
                        openManualInputForChild(expandedGoal, subGoalIndex);
                      }
                    }}
                  >
                    {childGoal ? (
                      <>
                        <div className="overlay-sub-cell-header">
                          <h5>{childGoal.text}</h5>
                          <div className="overlay-sub-cell-actions">
                            <button
                              className="overlay-action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingGoalId(childGoal.id);
                                setNewGoalText(childGoal.text);
                                setNewGoalDescription(childGoal.description || "");
                                setNewGoalDueDate(childGoal.dueDate || null);
                                setManualInputTarget(null);
                                setShowManualInput(true);
                              }}
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              className="overlay-action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleJournalsClick(expandedGoal.id, childGoal.id);
                              }}
                              title="Journals"
                            >
                              📝
                            </button>
                            <button
                              className="overlay-action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleProgressClick(expandedGoal.id, childGoal.id);
                              }}
                              title="Progress"
                            >
                              📈
                            </button>
                            <button
                              className="overlay-action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteGoal(childGoal.id, expandedGoal.id, subGoalIndex);
                              }}
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                        {childGoal.description && (
                          <p className="overlay-sub-cell-description">
                            {childGoal.description}
                          </p>
                        )}
                        {visibleSubGoals.length > 0 && (
                          <div className="overlay-sub-cell-chips">
                            {visibleSubGoals.map((subChild) => (
                              <button
                                key={subChild.id}
                                className="overlay-sub-chip"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  zoomIn(
                                    subChild,
                                    childColorIndex,
                                    childGoal.id,
                                    childGoal.subGoals.indexOf(subChild)
                                  );
                                }}
                              >
                                {subChild.text}
                              </button>
                            ))}
                            {remainingSubGoals > 0 && (
                              <span className="overlay-sub-chip more">
                                +{remainingSubGoals}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="overlay-sub-cell-footer">
                          <button
                            className="overlay-secondary-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              openManualInputForChild(childGoal);
                            }}
                          >
                            + Manual
                          </button>
                          <button
                            className="overlay-primary-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAIAssistantForChild(childGoal);
                            }}
                          >
                            🤖 AI
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="overlay-sub-cell-empty">
                        <span>Set a sub-goal here</span>
                        <div className="overlay-sub-cell-empty-actions">
                          <button
                            className="overlay-secondary-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              openManualInputForChild(expandedGoal, subGoalIndex);
                            }}
                          >
                            + Manual
                          </button>
                          <button
                            className="overlay-primary-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAIAssistantForChild(expandedGoal, subGoalIndex);
                            }}
                          >
                            🤖 AI
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Goal Progress Modal */}
      <GoalProgressModal
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        goal={selectedGoal}
        subGoal={selectedSubGoal}
        onProgressSaved={() => {
          // Optionally refresh data or show success message
        }}
      />

      {/* Goal Journals Modal */}
      {showJournalsModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowJournalsModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                Related Journals -{" "}
                {selectedGoalForJournals?.subGoalId ? "Sub-goal" : "Main Goal"}
              </h2>
              <button
                className="close-button"
                onClick={() => setShowJournalsModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {goalJournals.length === 0 ? (
                <p>No related journals found for this goal.</p>
              ) : (
                <div className="journals-list">
                  {goalJournals.map((journal) => (
                    <div
                      key={journal._id}
                      className="journal-item"
                      onClick={() => handleJournalClick(journal)}
                    >
                      <h4>{journal.title}</h4>
                      <p className="journal-preview">
                        {journal.content.substring(0, 100)}...
                      </p>
                      <div className="journal-meta">
                        <span className="journal-date">
                          {new Date(journal.date).toLocaleDateString()}
                        </span>
                        <span className="journal-mood">{journal.mood}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Journal Detail Modal */}
      {showJournalDetail && selectedJournal && (
        <div
          className="modal-overlay"
          onClick={() => setShowJournalDetail(false)}
        >
          <div
            className="modal-content journal-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{selectedJournal.title}</h2>
              <button
                className="close-button"
                onClick={() => setShowJournalDetail(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="journal-detail-meta">
                <span className="journal-date">
                  {new Date(selectedJournal.date).toLocaleDateString()}
                </span>
                <span className="journal-mood">{selectedJournal.mood}</span>
                {selectedJournal.tags && selectedJournal.tags.length > 0 && (
                  <div className="journal-tags">
                    {selectedJournal.tags.map((tag, index) => (
                      <span key={index} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="journal-content">{selectedJournal.content}</div>
            </div>
          </div>
        </div>
      )}

      {/* Page Tour for Goal Setting */}
      <PageTour
        page="goal-setting"
        navigateToNext="chat"
        pageTotalSteps={9}
        pageStartStep={0}
        steps={[
          {
            icon: "👋",
            title: "Welcome to Goal Setting!",
            description: "This is where you'll create your goals using the Mandalart framework - a powerful technique that breaks down one main goal into 8 sub-goals, and each sub-goal into 8 actionable tasks (64 tasks total). Let's set up your roadmap to success!",
            selector: null,
          },
          {
            icon: "🎯",
            title: "The Mandalart Grid",
            description: "This 3x3 grid is your goal planning canvas. The center cell is for your main goal, and the 8 surrounding cells are for your sub-goals. Each sub-goal can be expanded to reveal another 3x3 grid of actionable tasks.",
            selector: ".mandalart-grid",
          },
          {
            icon: "⭐",
            title: "Set Your Main Goal",
            description: "The center cell holds your ultimate objective - what you want to achieve. Click on it to enter your main goal. Make it meaningful and specific! For this demo, our main goal is already set: 'Achieve Holistic Personal Growth'.",
            selector: ".mandalart-cell.center",
          },
          {
            icon: "🤖",
            title: "AI Goal Assistant",
            description: "Stuck on what sub-goals to create? Our AI can analyze your main goal and suggest 8 relevant sub-goals automatically. It's like having a personal goal-setting coach! Click this button to see AI suggestions.",
            selector: ".mandalart-primary-btn",
          },
          {
            icon: "📝",
            title: "Sub-Goal Cells",
            description: "These 8 surrounding cells are your sub-goals - the major categories that support your main goal. Examples: 'Career Excellence', 'Physical Health', 'Mental Wellness'. Each sub-goal breaks down into 8 specific action items.",
            selector: ".mandalart-cell:not(.center):not(.empty)",
            waitForElement: true,
          },
          {
            icon: "🔍",
            title: "Expand a Sub-Goal",
            description: "Watch as we automatically expand the first sub-goal to show its 8 actionable tasks! This is where you define concrete steps - specific actions like 'Network with industry leaders' or 'Complete certification'. The tour will open this for you automatically.",
            selector: ".expanded-goal-overlay",
            waitForElement: true,
          },
          {
            icon: "✅",
            title: "64 Action Tasks",
            description: "Here's the expanded 3x3 grid showing action-level tasks for this sub-goal! These are the specific things you'll do. 8 sub-goals × 8 tasks each = 64 actionable items! That's the power of Mandalart. The center shows the sub-goal, surrounded by 8 tasks.",
            selector: ".expanded-goal-overlay .mandalart-grid",
            waitForElement: true,
          },
          {
            icon: "💾",
            title: "Save Your Goals",
            description: "Once you've defined your goals and tasks, save them to your account. Your goals will be linked to your journal entries, so you can track progress over time and see AI-powered insights about your journey.",
            selector: ".mandalart-solid-btn",
          },
          {
            icon: "📔",
            title: "Next: Start Journaling!",
            description: "Now that your goals are set, it's time to start journaling about your progress! You'll chat with an AI that helps you reflect on your experiences, then convert those conversations into structured journal entries mapped to your goals.",
            selector: null,
          },
        ]}
      />

      {/* Help Button for demo users */}
      {user?.email === 'demo@reflecta.com' && (
        <HelpButton page="goal-setting" />
      )}
    </div>
  );
};

export default GoalSetting;
