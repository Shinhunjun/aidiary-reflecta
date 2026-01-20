const { GoogleGenerativeAI } = require("@google/generative-ai");
const JournalEntry = require("../models/JournalEntry");
const Goal = require("../models/Goal");

/**
 * Gemini Live Service - Manages function calling for voice journaling
 * Provides function declarations and execution for journal operations
 */

// Initialize Gemini AI
let genAI = null;

const initializeGemini = () => {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("Gemini API key not configured");
    return null;
  }
  
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

/**
 * Function declarations for Gemini Live API
 * These define what actions the AI can perform during conversation
 */
const functionDeclarations = [
  {
    name: "create_journal_entry",
    description: "Create a new journal entry with title, content, mood, and tags. Use this when the user wants to save their reflection or daily thoughts.",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "A brief, descriptive title for the journal entry"
        },
        content: {
          type: "string",
          description: "The main content of the journal entry, capturing the user's thoughts and reflections"
        },
        mood: {
          type: "string",
          enum: ["happy", "sad", "excited", "calm", "anxious", "grateful", "neutral", "reflective"],
          description: "The user's current mood or emotional state"
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Relevant tags or categories for this entry (e.g., 'work', 'exercise', 'relationships')"
        }
      },
      required: ["title", "content", "mood"]
    }
  },
  {
    name: "search_journals",
    description: "Search through past journal entries by keywords, date range, mood, or tags. Use this when the user wants to recall previous reflections.",
    parameters: {
      type: "object",
      properties: {
        keyword: {
          type: "string",
          description: "Keyword to search for in journal titles or content"
        },
        startDate: {
          type: "string",
          description: "Start date for search range (ISO format: YYYY-MM-DD)"
        },
        endDate: {
          type: "string",
          description: "End date for search range (ISO format: YYYY-MM-DD)"
        },
        mood: {
          type: "string",
          enum: ["happy", "sad", "excited", "calm", "anxious", "grateful", "neutral", "reflective"],
          description: "Filter by specific mood"
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Filter by specific tags"
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return (default: 5)"
        }
      }
    }
  },
  {
    name: "get_goal_progress",
    description: "Get the user's current goals and their progress. Use this when discussing goals or tracking achievements.",
    parameters: {
      type: "object",
      properties: {
        goalId: {
          type: "string",
          description: "Optional specific goal ID to get progress for. If not provided, returns all goals."
        }
      }
    }
  }
];

/**
 * Execute function calls from Gemini
 */
const executeFunctionCall = async (functionCall, userId) => {
  const { name, args } = functionCall;
  
  console.log(`Executing function: ${name}`, args);

  try {
    switch (name) {
      case "create_journal_entry":
        return await createJournalEntry(userId, args);
      
      case "search_journals":
        return await searchJournals(userId, args);
      
      case "get_goal_progress":
        return await getGoalProgress(userId, args);
      
      default:
        return { error: `Unknown function: ${name}` };
    }
  } catch (error) {
    console.error(`Error executing ${name}:`, error);
    return { error: error.message };
  }
};

/**
 * Create a new journal entry
 */
const createJournalEntry = async (userId, { title, content, mood, tags = [] }) => {
  try {
    const entry = new JournalEntry({
      userId,
      title,
      content,
      mood,
      tags,
      date: new Date(),
      isAIGenerated: true // Mark as generated through voice conversation
    });

    await entry.save();

    return {
      success: true,
      message: "Journal entry created successfully",
      entry: {
        id: entry._id,
        title: entry.title,
        mood: entry.mood,
        date: entry.date
      }
    };
  } catch (error) {
    throw new Error(`Failed to create journal entry: ${error.message}`);
  }
};

/**
 * Search journal entries
 */
const searchJournals = async (userId, { keyword, startDate, endDate, mood, tags, limit = 5 }) => {
  try {
    const query = { userId };

    // Text search
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { content: { $regex: keyword, $options: "i" } }
      ];
    }

    // Date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Mood filter
    if (mood) {
      query.mood = mood;
    }

    // Tags filter
    if (tags && tags.length > 0) {
      query.tags = { $in: tags };
    }

    const entries = await JournalEntry.find(query)
      .sort({ date: -1 })
      .limit(limit)
      .select("title content mood tags date");

    return {
      success: true,
      count: entries.length,
      entries: entries.map(entry => ({
        id: entry._id,
        title: entry.title,
        excerpt: entry.content.substring(0, 150) + "...",
        mood: entry.mood,
        tags: entry.tags,
        date: entry.date
      }))
    };
  } catch (error) {
    throw new Error(`Failed to search journals: ${error.message}`);
  }
};

/**
 * Get goal progress
 */
const getGoalProgress = async (userId, { goalId } = {}) => {
  try {
    const query = { userId };
    if (goalId) {
      query["mandalartData.id"] = goalId;
    }

    const goals = await Goal.find(query);

    if (goals.length === 0) {
      return {
        success: true,
        message: "No goals found. User hasn't set up goals yet.",
        goals: []
      };
    }

    // Flatten goal structure for easier reporting
    const goalsSummary = goals.map(goal => {
      const main = goal.mandalartData;
      return {
        id: main.id,
        title: main.text,
        description: main.description || "",
        subGoals: (main.subGoals || []).filter(Boolean).map(sg => ({
          id: sg.id,
          title: sg.text,
          description: sg.description || ""
        }))
      };
    });

    return {
      success: true,
      goals: goalsSummary
    };
  } catch (error) {
    throw new Error(`Failed to get goal progress: ${error.message}`);
  }
};

/**
 * Get user context for conversation
 * Provides recent journals and goals to inform AI responses
 */
const getUserContext = async (userId) => {
  try {
    // Get recent journals
    const recentJournals = await JournalEntry.find({ userId })
      .sort({ date: -1 })
      .limit(3)
      .select("title mood date");

    // Get user goals
    const goals = await Goal.find({ userId });
    const goalTitles = goals.map(g => g.mandalartData?.text).filter(Boolean);

    return {
      recentJournals: recentJournals.map(j => ({
        title: j.title,
        mood: j.mood,
        date: j.date
      })),
      goals: goalTitles
    };
  } catch (error) {
    console.error("Error getting user context:", error);
    return { recentJournals: [], goals: [] };
  }
};

module.exports = {
  initializeGemini,
  functionDeclarations,
  executeFunctionCall,
  getUserContext
};
