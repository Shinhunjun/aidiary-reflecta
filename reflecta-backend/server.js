const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map(origin => origin.trim());

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());

// Helper utilities for progress summaries
const PERIOD_OPTIONS = ["weekly", "monthly", "quarterly", "yearly"];

const getPeriodBounds = (period = "weekly") => {
  const now = new Date();
  let start;

  switch (period) {
    case "weekly": {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday start
      start = new Date(now.getFullYear(), now.getMonth(), diff);
      break;
    }
    case "monthly":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "quarterly": {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), currentQuarter * 3, 1);
      break;
    }
    case "yearly":
      start = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  }

  start.setHours(0, 0, 0, 0);
  return { start, end: now };
};

const getTimelineFormat = (period = "weekly") => {
  switch (period) {
    case "weekly":
    case "monthly":
      return "%Y-%m-%d";
    case "quarterly":
      return "%Y-%m-%d";
    case "yearly":
      return "%Y-%m";
    default:
      return "%Y-%m-%d";
  }
};

// Helper function: Analyze journal content and map to goals using GPT
const analyzeGoalMapping = async (userId, content) => {
  try {
    // Get all user goals
    const Goal = require("./models/Goal");
    const goals = await Goal.find({ userId });
    const flattenedGoals = [];

    goals.forEach((goal) => {
      if (goal.mandalartData) {
        flattenedGoals.push({
          id: goal.mandalartData.id,
          text: goal.mandalartData.text,
          type: "main",
          description: goal.mandalartData.description || "",
        });

        if (goal.mandalartData.subGoals) {
          goal.mandalartData.subGoals.forEach((subGoal) => {
            if (subGoal && subGoal.text) {
              flattenedGoals.push({
                id: subGoal.id,
                text: subGoal.text,
                type: "sub",
                description: subGoal.description || "",
              });

              if (subGoal.subGoals) {
                subGoal.subGoals.forEach((subSubGoal) => {
                  if (subSubGoal && subSubGoal.text) {
                    flattenedGoals.push({
                      id: subSubGoal.id,
                      text: subSubGoal.text,
                      type: "sub-sub",
                      description: subSubGoal.description || "",
                    });
                  }
                });
              }
            }
          });
        }
      }
    });

    if (flattenedGoals.length === 0) {
      return { relatedGoalId: null, relatedGoalType: null, confidence: 0 };
    }

    // Check if OpenAI API is configured
    if (
      !process.env.OPENAI_API_KEY ||
      process.env.OPENAI_API_KEY === "your_openai_api_key_here"
    ) {
      console.log("OpenAI API key not configured, skipping goal mapping");
      return { relatedGoalId: null, relatedGoalType: null, confidence: 0 };
    }

    // Create goals context for GPT
    const goalsContext = flattenedGoals
      .map(
        (goal) =>
          `- ${goal.type.toUpperCase()}: "${goal.text}" (ID: ${goal.id})${
            goal.description ? ` - ${goal.description}` : ""
          }`
      )
      .join("\n");

    const systemPrompt = `You are an AI assistant that analyzes diary entries and matches them to user goals.

User's Goals:
${goalsContext}

Analyze the following diary content and determine if it relates to any of the user's goals. Consider:
1. Direct mentions of goal topics
2. Related activities or progress
3. Emotional connections to goals
4. Indirect references to goal themes

Return your analysis in this exact JSON format:
{
  "relatedGoalId": "goal-id-if-found-or-null",
  "relatedGoalType": "main-or-sub-or-sub-sub-or-null",
  "confidence": 0.0-1.0,
  "reason": "brief explanation"
}

Only match if confidence is above 0.3. Be conservative.`;

    const response = await fetch(
      process.env.OPENAI_API_URL ||
        "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: content },
          ],
          max_tokens: 300,
          temperature: 0.3,
        }),
      }
    );

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return { relatedGoalId: null, relatedGoalType: null, confidence: 0 };
    }

    const aiResponse = data.choices[0].message.content;
    const analysis = JSON.parse(aiResponse);

    // Only return mapping if confidence is above threshold
    if (analysis.confidence >= 0.3) {
      return {
        relatedGoalId: analysis.relatedGoalId,
        relatedGoalType: analysis.relatedGoalType,
        confidence: analysis.confidence,
        reason: analysis.reason,
      };
    }

    return { relatedGoalId: null, relatedGoalType: null, confidence: 0 };
  } catch (error) {
    console.error("Error in analyzeGoalMapping:", error);
    return { relatedGoalId: null, relatedGoalType: null, confidence: 0 };
  }
};

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/reflecta", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Models
const User = require("./models/User");
const Goal = require("./models/Goal");
const JournalEntry = require("./models/JournalEntry");
const ChatSession = require("./models/ChatSession");
const GoalProgress = require("./models/GoalProgress");
const RiskAlert = require("./models/RiskAlert");
const GoalSummary = require("./models/GoalSummary");
const Persona = require("./models/Persona");

// Middleware and Services
const { requireRole, canAccessStudent, canModifyAlert } = require("./middleware/authorization");
const riskDetectionService = require("./services/riskDetectionService");

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "fallback_secret",
    (err, user) => {
      if (err) {
        return res.status(403).json({ error: "Invalid or expired token" });
      }
      req.user = user;
      next();
    }
  );
};

// Routes

// Auth Routes
app.post(
  "/api/auth/register",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("name").trim().isLength({ min: 1 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user (default role is 'student')
      const user = new User({
        email,
        password: hashedPassword,
        name,
        role: "student",
      });

      await user.save();

      // Generate JWT
      const token = jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET || "fallback_secret",
        { expiresIn: "7d" }
      );

      res.status(201).json({
        message: "User created successfully",
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Counselor registration with secret code
app.post(
  "/api/auth/register-counselor",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("name").trim().isLength({ min: 1 }),
    body("secretCode").trim().isLength({ min: 1 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name, secretCode } = req.body;

      // Verify secret code
      if (secretCode !== "trustmatter!") {
        return res.status(403).json({ error: "Invalid secret code" });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create counselor user
      const user = new User({
        email,
        password: hashedPassword,
        name,
        role: "counselor",
      });

      await user.save();

      // Generate JWT with role
      const token = jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET || "fallback_secret",
        { expiresIn: "7d" }
      );

      res.status(201).json({
        message: "Counselor account created successfully",
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Counselor registration error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.post(
  "/api/auth/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 1 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Generate JWT with role
      const token = jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET || "fallback_secret",
        { expiresIn: "7d" }
      );

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get current user info
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Goals Routes
app.get("/api/goals", authenticateToken, async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.userId });
    res.json(goals);
  } catch (error) {
    console.error("Get goals error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/goals", authenticateToken, async (req, res) => {
  try {
    const { mandalartData } = req.body;

    let goal = await Goal.findOne({ userId: req.user.userId });

    if (goal) {
      goal.mandalartData = mandalartData;
      goal.updatedAt = new Date();
    } else {
      goal = new Goal({
        userId: req.user.userId,
        mandalartData,
      });
    }

    await goal.save();
    res.json({ message: "Goals saved successfully", goal });
  } catch (error) {
    console.error("Save goals error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Journal Routes
app.get("/api/journal", authenticateToken, async (req, res) => {
  try {
    const entries = await JournalEntry.find({ userId: req.user.userId }).sort({
      date: -1,
    });
    res.json(entries);
  } catch (error) {
    console.error("Get journal entries error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get specific journal entry
app.get("/api/journal/:id", authenticateToken, async (req, res) => {
  try {
    const entry = await JournalEntry.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!entry) {
      return res.status(404).json({ error: "Journal entry not found" });
    }

    res.json(entry);
  } catch (error) {
    console.error("Get journal entry error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post(
  "/api/journal",
  authenticateToken,
  [
    body("title").trim().isLength({ min: 1 }),
    body("content").trim().isLength({ min: 1 }),
    body("mood").isIn([
      "happy",
      "sad",
      "excited",
      "calm",
      "anxious",
      "grateful",
      "neutral",
      "reflective",
    ]),
    body("tags").isArray(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        title,
        content,
        mood,
        tags,
        isAIGenerated = false,
        relatedGoalId,
        relatedGoalType,
      } = req.body;

      // If no goal mapping provided, use GPT to analyze the content for ALL entries
      let finalRelatedGoalId = relatedGoalId || null;
      let finalRelatedGoalType = relatedGoalType || null;
      let mappingConfidence = 0;
      let mappingReason = "";

      if (!finalRelatedGoalId) {
        try {
          console.log("Analyzing goal mapping for journal entry...");
          const mapping = await analyzeGoalMapping(req.user.userId, content);

          if (mapping.relatedGoalId) {
            finalRelatedGoalId = mapping.relatedGoalId;
            finalRelatedGoalType = mapping.relatedGoalType;
            mappingConfidence = mapping.confidence;
            mappingReason = mapping.reason;
            console.log(
              `Mapped journal to goal ${finalRelatedGoalId} with confidence ${mappingConfidence}`
            );
          } else {
            console.log("No suitable goal mapping found");
          }
        } catch (error) {
          console.error("Error analyzing goal mapping:", error);
        }
      }

      const entry = new JournalEntry({
        userId: req.user.userId,
        title,
        content,
        mood,
        tags: tags || [],
        date: new Date(),
        isAIGenerated,
        relatedGoalId: finalRelatedGoalId,
        relatedGoalType: finalRelatedGoalType,
      });

      await entry.save();

      // Also create a GoalProgress record if the entry is mapped to a goal
      // This enables dashboard visualizations to display journal-based progress
      if (finalRelatedGoalId) {
        try {
          // Estimate reading/writing time based on content length (rough: 200 chars/min)
          const estimatedTimeSpent = Math.max(
            5,
            Math.ceil(content.length / 200)
          );

          const progress = new GoalProgress({
            userId: req.user.userId,
            goalId: finalRelatedGoalId,
            subGoalId:
              finalRelatedGoalType === "sub" ||
              finalRelatedGoalType === "sub-sub"
                ? finalRelatedGoalId
                : null,
            progressType: "reflection",
            title: title,
            description: content.substring(0, 200), // First 200 chars
            date: new Date(),
            mood: mood,
            tags: tags || [],
            isAIGenerated: isAIGenerated,
            notes: content,
            timeSpent: estimatedTimeSpent,
            isMilestone: false,
          });

          await progress.save();
          console.log(
            `Created GoalProgress record for journal entry: ${entry._id}`
          );
        } catch (progressError) {
          console.error("Error creating GoalProgress record:", progressError);
          // Don't fail the journal save if progress creation fails
        }
      }

      res.status(201).json({
        message: "Journal entry saved successfully",
        entry,
        goalMapping: finalRelatedGoalId
          ? {
              goalId: finalRelatedGoalId,
              goalType: finalRelatedGoalType,
              confidence: mappingConfidence,
              reason: mappingReason,
            }
          : null,
      });
    } catch (error) {
      console.error("Save journal entry error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Goal Progress Routes
app.get("/api/goals/:goalId/progress", authenticateToken, async (req, res) => {
  try {
    const { goalId } = req.params;
    const progress = await GoalProgress.find({
      userId: req.user.userId,
      goalId: goalId,
    }).sort({ date: -1 });

    res.json(progress);
  } catch (error) {
    console.error("Get goal progress error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get(
  "/api/goals/:goalId/progress/summary",
  authenticateToken,
  async (req, res) => {
    try {
      const { goalId } = req.params;
      const periodParam = (req.query.period || "weekly").toLowerCase();
      const period = PERIOD_OPTIONS.includes(periodParam)
        ? periodParam
        : "weekly";

      const { start, end } = getPeriodBounds(period);

      const matchStage = {
        userId: mongoose.Types.ObjectId.isValid(req.user.userId)
          ? new mongoose.Types.ObjectId(req.user.userId)
          : req.user.userId,
        goalId,
      };

      if (start && end) {
        matchStage.date = { $gte: start, $lte: end };
      }

      const basePipeline = [{ $match: matchStage }];

      console.log("Progress summary request", {
        userId: req.user.userId,
        goalId,
        period,
        range: { start, end },
      });

      const [totals = null] = await GoalProgress.aggregate([
        ...basePipeline,
        {
          $group: {
            _id: null,
            totalEntries: { $sum: 1 },
            totalTime: { $sum: "$timeSpent" },
            lastActivity: { $max: "$date" },
          },
        },
      ]);

      console.log("Progress totals", totals);

      const typeBreakdown = await GoalProgress.aggregate([
        ...basePipeline,
        {
          $group: {
            _id: "$progressType",
            count: { $sum: 1 },
            lastEntry: { $max: "$date" },
          },
        },
        { $sort: { count: -1 } },
      ]);

      console.log("Progress type breakdown", typeBreakdown);

      const subGoalAggregation = await GoalProgress.aggregate([
        ...basePipeline,
        {
          $addFields: {
            subGoalKey: { $ifNull: ["$subGoalId", "__main__"] },
          },
        },
        {
          $group: {
            _id: "$subGoalKey",
            count: { $sum: 1 },
            totalTime: { $sum: "$timeSpent" },
            lastEntry: { $max: "$date" },
          },
        },
        { $sort: { count: -1 } },
      ]);

      console.log("Sub-goal aggregation", subGoalAggregation);

      const timelineFormat = getTimelineFormat(period);
      const timeline = await GoalProgress.aggregate([
        ...basePipeline,
        {
          $group: {
            _id: {
              bucket: {
                $dateToString: { format: timelineFormat, date: "$date" },
              },
              type: "$progressType",
            },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: "$_id.bucket",
            total: { $sum: "$count" },
            breakdown: {
              $push: { type: "$_id.type", count: "$count" },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      console.log("Timeline aggregation", timeline);

      // Build label map for goals/sub-goals
      const goalDoc = await Goal.findOne({
        userId: req.user.userId,
        "mandalartData.id": goalId,
      });

      const goalLabelMap = {};
      if (goalDoc?.mandalartData) {
        const traverse = (node, depth = 0) => {
          if (!node || !node.id) return;
          goalLabelMap[node.id] = node.text || "Unnamed Goal";
          if (Array.isArray(node.subGoals)) {
            node.subGoals
              .filter(Boolean)
              .forEach((child) => traverse(child, depth + 1));
          }
        };
        traverse(goalDoc.mandalartData);
      }

      const subGoals = subGoalAggregation.map((entry) => {
        const isMain = entry._id === "__main__";
        return {
          id: isMain ? goalId : entry._id,
          label: isMain
            ? goalLabelMap[goalId] || "Main Goal"
            : goalLabelMap[entry._id] || "Sub Goal",
          count: entry.count,
          totalTime: entry.totalTime,
          lastEntry: entry.lastEntry,
        };
      });

      res.json({
        goalId,
        period,
        range: {
          start: start?.toISOString() || null,
          end: end?.toISOString() || null,
        },
        totals: totals || {
          totalEntries: 0,
          totalTime: 0,
          lastActivity: null,
        },
        progressTypes: typeBreakdown.map((item) => ({
          type: item._id,
          count: item.count,
          lastEntry: item.lastEntry,
        })),
        subGoals,
        timeline: timeline.map((item) => ({
          bucket: item._id,
          total: item.total,
          breakdown: item.breakdown,
        })),
      });
    } catch (error) {
      console.error("Get goal progress summary error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.post(
  "/api/goals/:goalId/progress",
  authenticateToken,
  [
    body("title").trim().isLength({ min: 1 }),
    body("description").trim().isLength({ min: 1 }),
    body("progressType").isIn([
      "milestone",
      "checkin",
      "completion",
      "reflection",
    ]),
    body("mood")
      .optional()
      .isIn([
        "happy",
        "sad",
        "excited",
        "calm",
        "anxious",
        "grateful",
        "neutral",
        "reflective",
      ]),
    body("difficulty").optional().isIn(["easy", "medium", "hard"]),
    body("timeSpent").optional().isNumeric(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { goalId } = req.params;
      const {
        subGoalId,
        progressType,
        title,
        description,
        mood = "neutral",
        tags = [],
        difficulty = "medium",
        timeSpent = 0,
        notes,
        isAIGenerated = false,
      } = req.body;

      const progress = new GoalProgress({
        userId: req.user.userId,
        goalId,
        subGoalId,
        progressType,
        title,
        description,
        mood,
        tags,
        difficulty,
        timeSpent,
        notes,
        isAIGenerated,
      });

      await progress.save();
      res
        .status(201)
        .json({ message: "Goal progress saved successfully", progress });
    } catch (error) {
      console.error("Save goal progress error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Advanced Analytics Endpoint
app.get(
  "/api/goals/:goalId/progress/analytics",
  authenticateToken,
  async (req, res) => {
    try {
      const { goalId } = req.params;
      const userId = mongoose.Types.ObjectId.isValid(req.user.userId)
        ? new mongoose.Types.ObjectId(req.user.userId)
        : req.user.userId;

      // Get all progress entries for velocity calculation
      const allProgress = await GoalProgress.find({
        userId,
        goalId,
      }).sort({ date: 1 });

      // Calculate velocity (progress per week)
      const velocityData = [];
      if (allProgress.length > 0) {
        const startDate = new Date(allProgress[0].date);
        const endDate = new Date();
        const weeksDiff = Math.ceil(
          (endDate - startDate) / (7 * 24 * 60 * 60 * 1000)
        );

        for (let i = 0; i < weeksDiff; i++) {
          const weekStart = new Date(startDate);
          weekStart.setDate(weekStart.getDate() + i * 7);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 7);

          const weekProgress = allProgress.filter((p) => {
            const pDate = new Date(p.date);
            return pDate >= weekStart && pDate < weekEnd;
          });

          velocityData.push({
            week: i + 1,
            weekStart: weekStart.toISOString(),
            count: weekProgress.length,
            timeSpent: weekProgress.reduce((sum, p) => sum + (p.timeSpent || 0), 0),
            completionPercentage:
              weekProgress.reduce((sum, p) => sum + (p.completionPercentage || 0), 0) /
              (weekProgress.length || 1),
          });
        }
      }

      // Get goal structure for completion calculation
      const goalDoc = await Goal.findOne({
        userId,
        "mandalartData.id": goalId,
      });

      let totalSubGoals = 0;
      let completedSubGoals = 0;
      if (goalDoc?.mandalartData) {
        const countGoals = (node) => {
          if (!node) return;
          totalSubGoals++;
          if (node.completed) completedSubGoals++;
          if (Array.isArray(node.subGoals)) {
            node.subGoals.filter(Boolean).forEach(countGoals);
          }
        };
        if (Array.isArray(goalDoc.mandalartData.subGoals)) {
          goalDoc.mandalartData.subGoals.filter(Boolean).forEach(countGoals);
        }
      }

      const overallCompletion =
        totalSubGoals > 0 ? (completedSubGoals / totalSubGoals) * 100 : 0;

      // Mood correlation with progress type
      const moodCorrelation = await GoalProgress.aggregate([
        { $match: { userId, goalId } },
        {
          $group: {
            _id: { mood: "$mood", progressType: "$progressType" },
            count: { $sum: 1 },
            avgTimeSpent: { $avg: "$timeSpent" },
            avgCompletion: { $avg: "$completionPercentage" },
          },
        },
        { $sort: { count: -1 } },
      ]);

      // Difficulty distribution
      const difficultyStats = await GoalProgress.aggregate([
        { $match: { userId, goalId } },
        {
          $group: {
            _id: "$difficulty",
            count: { $sum: 1 },
            avgTimeSpent: { $avg: "$timeSpent" },
            avgCompletion: { $avg: "$completionPercentage" },
          },
        },
      ]);

      // Milestone tracking
      const milestones = await GoalProgress.find({
        userId,
        goalId,
        isMilestone: true,
      }).sort({ date: -1 });

      // Activity heatmap data (for calendar view)
      const heatmapData = await GoalProgress.aggregate([
        { $match: { userId, goalId } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$date" },
            },
            count: { $sum: 1 },
            totalTime: { $sum: "$timeSpent" },
            types: { $addToSet: "$progressType" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Predicted completion date based on velocity
      let predictedCompletion = null;
      if (velocityData.length > 1 && overallCompletion < 100) {
        const recentVelocity = velocityData.slice(-4); // Last 4 weeks
        const avgWeeklyProgress =
          recentVelocity.reduce((sum, w) => sum + w.completionPercentage, 0) /
          recentVelocity.length;
        if (avgWeeklyProgress > 0) {
          const remainingPercentage = 100 - overallCompletion;
          const weeksToComplete = remainingPercentage / avgWeeklyProgress;
          const predicted = new Date();
          predicted.setDate(predicted.getDate() + weeksToComplete * 7);
          predictedCompletion = predicted.toISOString();
        }
      }

      res.json({
        goalId,
        overallCompletion: Math.round(overallCompletion * 10) / 10,
        totalSubGoals,
        completedSubGoals,
        velocityData,
        moodCorrelation: moodCorrelation.map((item) => ({
          mood: item._id.mood,
          progressType: item._id.progressType,
          count: item.count,
          avgTimeSpent: Math.round(item.avgTimeSpent || 0),
          avgCompletion: Math.round((item.avgCompletion || 0) * 10) / 10,
        })),
        difficultyStats: difficultyStats.map((item) => ({
          difficulty: item._id,
          count: item.count,
          avgTimeSpent: Math.round(item.avgTimeSpent || 0),
          avgCompletion: Math.round((item.avgCompletion || 0) * 10) / 10,
        })),
        milestones: milestones.map((m) => ({
          id: m._id,
          title: m.milestoneTitle || m.title,
          category: m.milestoneCategory,
          date: m.date,
          completionPercentage: m.completionPercentage,
          emoji: m.celebrationEmoji,
        })),
        heatmapData: heatmapData.map((item) => ({
          date: item._id,
          count: item.count,
          totalTime: item.totalTime,
          types: item.types,
        })),
        predictedCompletion,
      });
    } catch (error) {
      console.error("Get goal analytics error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// AI-Powered Insights Endpoint
app.get(
  "/api/goals/:goalId/progress/insights",
  authenticateToken,
  async (req, res) => {
    try {
      const { goalId } = req.params;
      const userId = mongoose.Types.ObjectId.isValid(req.user.userId)
        ? new mongoose.Types.ObjectId(req.user.userId)
        : req.user.userId;

      // Get progress data
      const progressEntries = await GoalProgress.find({
        userId,
        goalId,
      })
        .sort({ date: -1 })
        .limit(50);

      if (progressEntries.length === 0) {
        return res.json({
          insights: [],
          message: "Not enough data to generate insights yet.",
        });
      }

      const insights = [];

      // Pattern 1: Best performing time of day
      const timePatterns = {};
      progressEntries.forEach((entry) => {
        const hour = new Date(entry.date).getHours();
        const timeOfDay =
          hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
        if (!timePatterns[timeOfDay]) {
          timePatterns[timeOfDay] = { count: 0, totalCompletion: 0 };
        }
        timePatterns[timeOfDay].count++;
        timePatterns[timeOfDay].totalCompletion += entry.completionPercentage || 0;
      });

      let bestTime = null;
      let maxAvg = 0;
      Object.keys(timePatterns).forEach((time) => {
        const avg = timePatterns[time].totalCompletion / timePatterns[time].count;
        if (avg > maxAvg) {
          maxAvg = avg;
          bestTime = time;
        }
      });

      if (bestTime) {
        insights.push({
          type: "pattern",
          category: "timing",
          title: `You're most productive in the ${bestTime}`,
          description: `Your ${bestTime} check-ins show ${Math.round(maxAvg)}% higher completion rates.`,
          icon: bestTime === "morning" ? "🌅" : bestTime === "afternoon" ? "☀️" : "🌙",
          confidence: timePatterns[bestTime].count >= 5 ? "high" : "medium",
        });
      }

      // Pattern 2: Mood-productivity correlation
      const moodStats = {};
      progressEntries.forEach((entry) => {
        if (entry.mood && entry.completionPercentage > 0) {
          if (!moodStats[entry.mood]) {
            moodStats[entry.mood] = { count: 0, totalCompletion: 0 };
          }
          moodStats[entry.mood].count++;
          moodStats[entry.mood].totalCompletion += entry.completionPercentage;
        }
      });

      const sortedMoods = Object.entries(moodStats)
        .map(([mood, data]) => ({
          mood,
          avgCompletion: data.totalCompletion / data.count,
          count: data.count,
        }))
        .sort((a, b) => b.avgCompletion - a.avgCompletion);

      if (sortedMoods.length > 0 && sortedMoods[0].count >= 3) {
        const bestMood = sortedMoods[0];
        const moodEmojis = {
          happy: "😊",
          excited: "🎉",
          calm: "😌",
          grateful: "🙏",
          neutral: "😐",
          anxious: "😰",
          sad: "😢",
          reflective: "🤔",
        };
        insights.push({
          type: "correlation",
          category: "mood",
          title: `Your best work happens when you're ${bestMood.mood}`,
          description: `Progress entries logged while feeling ${bestMood.mood} show ${Math.round(bestMood.avgCompletion)}% completion on average.`,
          icon: moodEmojis[bestMood.mood] || "💡",
          confidence: bestMood.count >= 5 ? "high" : "medium",
        });
      }

      // Pattern 3: Consistency streak
      const sortedByDate = [...progressEntries].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );
      let currentStreak = 1;
      let maxStreak = 1;
      for (let i = 1; i < sortedByDate.length; i++) {
        const prevDate = new Date(sortedByDate[i - 1].date);
        const currDate = new Date(sortedByDate[i].date);
        const dayDiff = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));
        if (dayDiff <= 2) {
          // Allow 1 day gap
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 1;
        }
      }

      if (maxStreak >= 3) {
        insights.push({
          type: "achievement",
          category: "consistency",
          title: `${maxStreak}-day streak achieved!`,
          description: `You've maintained consistent progress for ${maxStreak} days. Keep the momentum going!`,
          icon: "🔥",
          confidence: "high",
        });
      }

      // Pattern 4: Time investment efficiency
      const entriesWithTime = progressEntries.filter((e) => e.timeSpent > 0);
      if (entriesWithTime.length >= 5) {
        const avgTimePerEntry =
          entriesWithTime.reduce((sum, e) => sum + e.timeSpent, 0) /
          entriesWithTime.length;
        const avgCompletionPerEntry =
          entriesWithTime.reduce((sum, e) => sum + (e.completionPercentage || 0), 0) /
          entriesWithTime.length;
        const efficiency = avgCompletionPerEntry / avgTimePerEntry;

        insights.push({
          type: "metric",
          category: "efficiency",
          title: `Average ${Math.round(avgTimePerEntry)} minutes per check-in`,
          description: `Your time investment is ${efficiency > 0.5 ? "highly efficient" : "moderate"}. ${Math.round(avgCompletionPerEntry)}% progress per session.`,
          icon: "⏱️",
          confidence: "high",
        });
      }

      // Pattern 5: Difficulty preference
      const difficultyCount = {
        easy: 0,
        medium: 0,
        hard: 0,
      };
      progressEntries.forEach((entry) => {
        if (entry.difficulty) {
          difficultyCount[entry.difficulty]++;
        }
      });
      const totalWithDifficulty = Object.values(difficultyCount).reduce(
        (a, b) => a + b,
        0
      );
      if (totalWithDifficulty >= 5) {
        const sortedDifficulty = Object.entries(difficultyCount).sort(
          (a, b) => b[1] - a[1]
        );
        const preference = sortedDifficulty[0][0];
        const percentage = Math.round(
          (sortedDifficulty[0][1] / totalWithDifficulty) * 100
        );
        insights.push({
          type: "preference",
          category: "difficulty",
          title: `You prefer ${preference} difficulty tasks`,
          description: `${percentage}% of your progress entries are marked as ${preference} difficulty.`,
          icon: preference === "hard" ? "💪" : preference === "medium" ? "⚖️" : "✅",
          confidence: percentage >= 60 ? "high" : "medium",
        });
      }

      // Recommendation: Based on gaps
      const now = new Date();
      const lastEntry = new Date(progressEntries[0].date);
      const daysSinceLastEntry = Math.floor((now - lastEntry) / (1000 * 60 * 60 * 24));

      if (daysSinceLastEntry >= 3) {
        insights.push({
          type: "recommendation",
          category: "consistency",
          title: "Time for a check-in!",
          description: `It's been ${daysSinceLastEntry} days since your last progress update. Regular check-ins help maintain momentum.`,
          icon: "📝",
          confidence: "high",
        });
      }

      res.json({
        goalId,
        insights,
        dataPoints: progressEntries.length,
        analyzedPeriod: {
          start: sortedByDate[0]?.date,
          end: sortedByDate[sortedByDate.length - 1]?.date,
        },
      });
    } catch (error) {
      console.error("Get goal insights error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Emotional Journey endpoint for subjective progress visualization
app.get(
  "/api/goals/:goalId/emotional-journey",
  authenticateToken,
  async (req, res) => {
    try {
      const { goalId } = req.params;
      const userId = mongoose.Types.ObjectId.isValid(req.user.userId)
        ? new mongoose.Types.ObjectId(req.user.userId)
        : req.user.userId;

      // Get progress entries with mood and notes
      const progressEntries = await GoalProgress.find({
        userId,
        goalId,
      })
        .sort({ date: 1 }) // Ascending order for journey timeline
        .lean();

      if (progressEntries.length === 0) {
        return res.json({
          journey: [],
          moodTrend: null,
          significantMoments: [],
          emotionalSummary: null,
        });
      }

      // Map mood to numeric values for trend analysis
      const moodValues = {
        happy: 8,
        excited: 9,
        grateful: 8.5,
        calm: 7,
        neutral: 5,
        reflective: 6,
        anxious: 3,
        sad: 2,
      };

      // Process journey data
      const journey = progressEntries.map((entry) => ({
        date: entry.date,
        mood: entry.mood,
        moodValue: moodValues[entry.mood] || 5,
        title: entry.title,
        description: entry.description,
        notes: entry.notes,
        isMilestone: entry.isMilestone,
        milestoneTitle: entry.milestoneTitle,
        celebrationEmoji: entry.celebrationEmoji,
        completionPercentage: entry.completionPercentage || 0,
        timeSpent: entry.timeSpent || 0,
        tags: entry.tags || [],
      }));

      // Identify significant moments (milestones or high-impact entries)
      const significantMoments = progressEntries
        .filter((entry) => {
          return (
            entry.isMilestone ||
            (entry.notes && entry.notes.length > 100) ||
            (entry.completionPercentage && entry.completionPercentage >= 75) ||
            entry.celebrationEmoji
          );
        })
        .map((entry) => ({
          date: entry.date,
          title: entry.milestoneTitle || entry.title,
          description: entry.description,
          notes: entry.notes,
          type: entry.isMilestone ? "milestone" : "significant",
          emoji: entry.celebrationEmoji || "⭐",
          mood: entry.mood,
        }))
        .slice(-10); // Last 10 significant moments

      // Calculate mood trend
      const recentMoodValues = journey.slice(-10).map((e) => e.moodValue);
      const earlyMoodValues = journey.slice(0, 10).map((e) => e.moodValue);
      const recentAvg =
        recentMoodValues.reduce((a, b) => a + b, 0) / recentMoodValues.length;
      const earlyAvg =
        earlyMoodValues.reduce((a, b) => a + b, 0) / earlyMoodValues.length || recentAvg;

      let moodTrendDirection = "stable";
      let moodTrendMessage = "Your emotional state has been consistent";

      if (recentAvg > earlyAvg + 1) {
        moodTrendDirection = "improving";
        moodTrendMessage = "Your mood has been improving over time - that's beautiful growth! 🌱";
      } else if (recentAvg < earlyAvg - 1) {
        moodTrendDirection = "declining";
        moodTrendMessage = "You've been facing some challenges lately. Remember, difficult days are part of the journey.";
      } else {
        moodTrendMessage = "You've maintained steady emotional balance throughout this goal 🌊";
      }

      // Generate emotional summary
      const moodCounts = {};
      progressEntries.forEach((entry) => {
        if (entry.mood) {
          moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
        }
      });
      const dominantMood = Object.entries(moodCounts).sort(
        (a, b) => b[1] - a[1]
      )[0];

      const moodEmojis = {
        happy: "😊",
        excited: "🎉",
        calm: "😌",
        grateful: "🙏",
        neutral: "😐",
        anxious: "😰",
        sad: "😢",
        reflective: "🤔",
      };

      const emotionalSummary = {
        dominantMood: dominantMood ? dominantMood[0] : "neutral",
        dominantMoodEmoji: dominantMood ? moodEmojis[dominantMood[0]] : "😐",
        dominantMoodPercentage: dominantMood
          ? Math.round((dominantMood[1] / progressEntries.length) * 100)
          : 0,
        moodDistribution: moodCounts,
        totalEntries: progressEntries.length,
        milestonesCount: significantMoments.filter((m) => m.type === "milestone")
          .length,
      };

      res.json({
        goalId,
        journey,
        moodTrend: {
          direction: moodTrendDirection,
          message: moodTrendMessage,
          recentAverage: recentAvg,
          earlyAverage: earlyAvg,
        },
        significantMoments,
        emotionalSummary,
      });
    } catch (error) {
      console.error("Get emotional journey error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Narrative Timeline endpoint for storytelling visualization
app.get(
  "/api/goals/:goalId/narrative-timeline",
  authenticateToken,
  async (req, res) => {
    try {
      const { goalId } = req.params;
      const userId = mongoose.Types.ObjectId.isValid(req.user.userId)
        ? new mongoose.Types.ObjectId(req.user.userId)
        : req.user.userId;

      // Get progress entries sorted by significance
      const progressEntries = await GoalProgress.find({
        userId,
        goalId,
      })
        .sort({ date: -1 })
        .lean();

      if (progressEntries.length === 0) {
        return res.json({
          timeline: [],
          story: {
            beginning: null,
            recentMilestones: [],
            currentState: null,
          },
        });
      }

      // Calculate significance score for each entry
      const timeline = progressEntries.map((entry) => {
        let significanceScore = 0;

        // Milestones are highly significant
        if (entry.isMilestone) significanceScore += 10;

        // Long, thoughtful notes
        if (entry.notes && entry.notes.length > 150) significanceScore += 5;
        else if (entry.notes && entry.notes.length > 50) significanceScore += 3;

        // High completion percentage
        if (entry.completionPercentage >= 90) significanceScore += 4;
        else if (entry.completionPercentage >= 50) significanceScore += 2;

        // Long time investment
        if (entry.timeSpent >= 120) significanceScore += 3;
        else if (entry.timeSpent >= 60) significanceScore += 2;

        // Celebration emoji present
        if (entry.celebrationEmoji) significanceScore += 2;

        // Rich description
        if (entry.description && entry.description.length > 100)
          significanceScore += 2;

        return {
          ...entry,
          significanceScore,
          displaySize: significanceScore >= 10 ? "large" : significanceScore >= 5 ? "medium" : "small",
        };
      });

      // Create narrative structure
      const story = {
        beginning: progressEntries[progressEntries.length - 1], // First ever entry
        recentMilestones: timeline
          .filter((entry) => entry.isMilestone)
          .slice(0, 5), // Last 5 milestones
        currentState: {
          lastEntry: progressEntries[0],
          totalTime: progressEntries.reduce((sum, e) => sum + (e.timeSpent || 0), 0),
          entryCount: progressEntries.length,
          daysSinceStart: Math.floor(
            (new Date() - new Date(progressEntries[progressEntries.length - 1].date)) /
              (1000 * 60 * 60 * 24)
          ),
        },
      };

      res.json({
        goalId,
        timeline,
        story,
      });
    } catch (error) {
      console.error("Get narrative timeline error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Goal Related Journal Entries Routes
app.get("/api/goals/:goalId/journals", authenticateToken, async (req, res) => {
  try {
    const { goalId } = req.params;
    const userId = req.user.userId;
    console.log("Getting journals for goalId:", goalId, "userId:", userId);

    // Find the goal structure to get child goal IDs
    const goal = await Goal.findOne({
      userId: userId,
      $or: [
        { "mandalartData.id": goalId },
        { "mandalartData.subGoals.id": goalId },
      ]
    });

    let goalIds = [goalId]; // Start with the requested goal

    if (goal) {
      // Find if this is a sub-goal with children
      const findGoalAndChildren = (data, id) => {
        if (data.id === id) {
          if (data.subGoals && data.subGoals.length > 0) {
            return data.subGoals.filter(sg => sg && sg.id).map(sg => sg.id);
          }
          return [];
        }
        if (data.subGoals) {
          for (const sg of data.subGoals) {
            if (sg) {
              const result = findGoalAndChildren(sg, id);
              if (result !== null) return result;
            }
          }
        }
        return null;
      };

      const childIds = findGoalAndChildren(goal.mandalartData, goalId);
      if (childIds && childIds.length > 0) {
        goalIds = [goalId, ...childIds];
        console.log("Including child goal IDs:", childIds);
      }
    }

    // Fetch journals for the goal and all its children
    let journals = await JournalEntry.find({
      userId: userId,
      relatedGoalId: { $in: goalIds },
    }).sort({ date: -1 });

    // If no goal-specific journals found, return all user journals
    // This handles the case where journals weren't mapped to goals yet
    if (journals.length === 0) {
      console.log("No goal-specific journals found, returning all user journals");
      journals = await JournalEntry.find({ userId: userId })
        .sort({ date: -1 })
        .limit(50); // Limit to most recent 50 entries
    }

    console.log(`Found ${journals.length} journals for goal and its children`);
    res.json(journals);
  } catch (error) {
    console.error("Get goal journals error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get AI-powered summary of journals for a goal
app.get("/api/goals/:goalId/journals/summary", authenticateToken, async (req, res) => {
  try {
    const { goalId } = req.params;
    const userId = req.user.userId;

    // Check for cached summary (valid for 7 days)
    const cachedSummary = await GoalSummary.findOne({
      userId,
      goalId,
      summaryType: "journal",
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (cachedSummary) {
      console.log(`Using cached journal summary for goal ${goalId}`);
      return res.json({
        ...cachedSummary.metadata,
        summary: cachedSummary.summary,
        entryCount: cachedSummary.entryCount,
        cached: true
      });
    }

    // Get journals for this goal
    let journals = await JournalEntry.find({
      userId: userId,
      relatedGoalId: goalId,
    }).sort({ date: -1 }).limit(20); // Last 20 entries

    // If no goal-specific journals found, use all user journals
    if (journals.length === 0) {
      console.log("No goal-specific journals found for summary, using all user journals");
      journals = await JournalEntry.find({ userId: userId })
        .sort({ date: -1 })
        .limit(20); // Last 20 entries
    }

    if (journals.length === 0) {
      return res.json({
        summary: "No journal entries found yet. Start journaling to see insights!",
        entryCount: 0,
        dateRange: null,
        moodDistribution: {},
        keyThemes: [],
      });
    }

    // Get goal info
    const goal = await Goal.findOne({
      userId: userId,
      $or: [
        { "mandalartData.id": goalId },
        { "mandalartData.subGoals.id": goalId },
        { "mandalartData.subGoals.subGoals.id": goalId }
      ]
    });

    let goalText = "this goal";
    if (goal) {
      // Find the specific goal text
      const findGoalText = (data, id) => {
        if (data.id === id) return data.text;
        if (data.subGoals) {
          for (const sg of data.subGoals) {
            if (sg && sg.id === id) return sg.text;
            if (sg && sg.subGoals) {
              for (const ssg of sg.subGoals) {
                if (ssg && ssg.id === id) return ssg.text;
              }
            }
          }
        }
        return null;
      };
      goalText = findGoalText(goal.mandalartData, goalId) || goalText;
    }

    // Calculate basic stats
    const dateRange = {
      start: journals[journals.length - 1].date,
      end: journals[0].date,
    };

    const moodDistribution = journals.reduce((acc, j) => {
      acc[j.mood] = (acc[j.mood] || 0) + 1;
      return acc;
    }, {});

    // Generate word cloud data
    const allText = journals.map(j => `${j.title} ${j.content}`).join(' ').toLowerCase();
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'me', 'him', 'us', 'them', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'am', 'im', 'ive', 'id', 'ill', 'dont', 'didnt', 'doesnt', 'hasnt', 'havent', 'hadnt', 'wont', 'wouldnt', 'shouldnt', 'couldnt', 'cant', 'isnt', 'arent', 'wasnt', 'werent', 'just', 'really', 'very', 'much', 'more', 'most', 'some', 'any', 'all', 'each', 'every', 'other', 'another', 'such', 'own', 'same', 'so', 'than', 'too', 'also', 'well', 'only', 'like', 'dear', 'diary', 'yours', 'truly', 'user']);

    const words = allText.match(/\b[a-z]{3,}\b/g) || [];
    const wordFreq = {};
    words.forEach(word => {
      if (!stopWords.has(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });

    // Get top 50 words for word cloud
    const wordCloudData = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([text, value]) => ({ text, value }));

    // Prepare content for AI
    const journalContents = journals.map((j, idx) => {
      return `Entry ${idx + 1} (${j.date.toISOString().split('T')[0]}, Mood: ${j.mood}):\n${j.content}`;
    }).join('\n\n');

    // Call OpenAI for summary
    try {
      const openaiResponse = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are a reflective journal analyst. Summarize the user's journal entries related to their goal "${goalText}". Focus on:
1. Overall progress and journey towards the goal
2. Emotional patterns and mindset changes
3. Key achievements and challenges
4. Recurring themes or insights
5. Actionable observations

Keep the summary concise (3-4 paragraphs), supportive, and insightful.`
            },
            {
              role: "user",
              content: `Here are ${journals.length} journal entries related to the goal "${goalText}":\n\n${journalContents}\n\nPlease provide a thoughtful summary.`
            }
          ],
          max_tokens: 500,
          temperature: 0.7,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        }
      );

      const aiSummary = openaiResponse.data.choices[0].message.content;

      // Extract key themes using simple keyword analysis
      const allContent = journals.map(j => j.content.toLowerCase()).join(' ');
      const commonWords = ['goal', 'progress', 'learning', 'challenge', 'achievement', 'development', 'growth', 'improvement', 'struggle', 'success'];
      const keyThemes = commonWords.filter(word => allContent.includes(word));

      const responseData = {
        summary: aiSummary,
        entryCount: journals.length,
        dateRange,
        moodDistribution,
        keyThemes: keyThemes.slice(0, 5),
        wordCloud: wordCloudData,
        goalText,
      };

      // Cache the summary for 7 days
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await GoalSummary.create({
        userId,
        goalId,
        summaryType: "journal",
        summary: aiSummary,
        entryCount: journals.length,
        metadata: {
          dateRange,
          moodDistribution,
          keyThemes: keyThemes.slice(0, 5),
          wordCloud: wordCloudData,
          goalText,
        },
        expiresAt,
      });
      console.log(`Cached journal summary for goal ${goalId} (expires in 7 days)`);

      res.json(responseData);

    } catch (openaiError) {
      console.error("OpenAI API error:", openaiError.response?.data || openaiError.message);

      // Fallback: Basic summary without AI
      const moodList = Object.entries(moodDistribution)
        .sort((a, b) => b[1] - a[1])
        .map(([mood, count]) => `${mood} (${count})`)
        .join(', ');

      const fallbackSummary = `You have written ${journals.length} journal entries related to "${goalText}" from ${dateRange.start.toLocaleDateString()} to ${dateRange.end.toLocaleDateString()}. Your mood distribution: ${moodList}. Keep up the journaling to track your progress!`;

      res.json({
        summary: fallbackSummary,
        entryCount: journals.length,
        dateRange,
        moodDistribution,
        keyThemes: [],
        goalText,
      });
    }

  } catch (error) {
    console.error("Get goal journal summary error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get aggregated AI summary for a sub-goal including all its child sub-sub-goals
app.get("/api/goals/:goalId/children/summary", authenticateToken, async (req, res) => {
  try {
    const { goalId } = req.params;
    const userId = req.user.userId;

    // Check for cached summary (valid for 7 days)
    const cachedSummary = await GoalSummary.findOne({
      userId,
      goalId,
      summaryType: "children",
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (cachedSummary) {
      console.log(`Using cached children summary for goal ${goalId}`);
      return res.json({
        ...cachedSummary.metadata,
        summary: cachedSummary.summary,
        totalEntries: cachedSummary.entryCount,
        cached: true
      });
    }

    // Get goal structure to find child goals
    const goal = await Goal.findOne({
      userId: userId,
      $or: [
        { "mandalartData.id": goalId },
        { "mandalartData.subGoals.id": goalId },
      ]
    });

    if (!goal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    // Find the specific sub-goal and its children
    let targetGoal = null;
    let childGoalIds = [];

    const findGoalAndChildren = (data, id) => {
      if (data.id === id) {
        targetGoal = data;
        if (data.subGoals) {
          childGoalIds = data.subGoals.filter(sg => sg && sg.id).map(sg => sg.id);
        }
        return true;
      }
      if (data.subGoals) {
        for (const sg of data.subGoals) {
          if (sg && findGoalAndChildren(sg, id)) {
            return true;
          }
        }
      }
      return false;
    };

    findGoalAndChildren(goal.mandalartData, goalId);

    if (!targetGoal) {
      return res.status(404).json({ error: "Specific goal not found in structure" });
    }

    if (childGoalIds.length === 0) {
      return res.json({
        summary: `This goal "${targetGoal.text}" has no sub-goals yet. Progress tracking is at the individual goal level.`,
        goalText: targetGoal.text,
        childGoalsCount: 0,
        totalEntries: 0,
        childGoalsSummaries: [],
      });
    }

    // Get all journals for child goals
    const journals = await JournalEntry.find({
      userId: userId,
      relatedGoalId: { $in: childGoalIds },
    }).sort({ date: -1 }).limit(50); // Max 50 entries for aggregation

    if (journals.length === 0) {
      return res.json({
        summary: `No journal entries found for the sub-goals under "${targetGoal.text}". Start journaling to track progress!`,
        goalText: targetGoal.text,
        childGoalsCount: childGoalIds.length,
        totalEntries: 0,
        childGoalsSummaries: [],
      });
    }

    // Group journals by child goal
    const journalsByGoal = {};
    childGoalIds.forEach(id => {
      const childGoal = targetGoal.subGoals.find(sg => sg && sg.id === id);
      if (childGoal) {
        journalsByGoal[id] = {
          goalText: childGoal.text,
          entries: journals.filter(j => j.relatedGoalId === id)
        };
      }
    });

    // Create summary for each child goal
    const childSummaries = Object.entries(journalsByGoal)
      .filter(([_, data]) => data.entries.length > 0)
      .map(([id, data]) => {
        const entries = data.entries;
        const moodDist = entries.reduce((acc, j) => {
          acc[j.mood] = (acc[j.mood] || 0) + 1;
          return acc;
        }, {});

        const latestEntry = entries[0];
        const oldestEntry = entries[entries.length - 1];

        return {
          goalId: id,
          goalText: data.goalText,
          entryCount: entries.length,
          dateRange: {
            start: oldestEntry.date,
            end: latestEntry.date,
          },
          moodDistribution: moodDist,
          latestMood: latestEntry.mood,
        };
      });

    // Prepare all content for overall AI summary
    const summaryByGoal = childSummaries.map(cs => {
      const goalsForAI = journalsByGoal[cs.goalId].entries.slice(0, 3); // Top 3 for each
      const contentSample = goalsForAI.map(j =>
        `[${j.date.toISOString().split('T')[0]}] ${j.content.substring(0, 150)}`
      ).join(' ... ');
      return `\n${cs.goalText} (${cs.entryCount} entries): ${contentSample}`;
    }).join('\n');

    // Call OpenAI for aggregated summary
    try {
      const openaiResponse = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are analyzing progress across multiple sub-goals under a parent goal "${targetGoal.text}". Provide an overview of:
1. Overall progress across all sub-goals
2. Which areas show the most development
3. Common patterns or themes across the sub-goals
4. Areas that need more attention
5. Key achievements and challenges

Keep it concise (3-4 paragraphs), motivational, and actionable.`
            },
            {
              role: "user",
              content: `Analyze progress for "${targetGoal.text}" across ${childSummaries.length} sub-goals with a total of ${journals.length} journal entries:\n${summaryByGoal}`
            }
          ],
          max_tokens: 600,
          temperature: 0.7,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        }
      );

      const aiSummary = openaiResponse.data.choices[0].message.content;

      const responseData = {
        summary: aiSummary,
        goalText: targetGoal.text,
        childGoalsCount: childGoalIds.length,
        totalEntries: journals.length,
        childGoalsSummaries: childSummaries,
      };

      // Cache the summary for 7 days
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await GoalSummary.create({
        userId,
        goalId,
        summaryType: "children",
        summary: aiSummary,
        entryCount: journals.length,
        metadata: {
          goalText: targetGoal.text,
          childGoalsCount: childGoalIds.length,
          childGoalsSummaries: childSummaries,
        },
        expiresAt,
      });
      console.log(`Cached children summary for goal ${goalId} (expires in 7 days)`);

      res.json(responseData);

    } catch (openaiError) {
      console.error("OpenAI API error:", openaiError.response?.data || openaiError.message);

      // Fallback summary
      const activeGoals = childSummaries.length;
      const fallbackSummary = `You have ${journals.length} journal entries across ${activeGoals} sub-goals under "${targetGoal.text}". The most active areas are: ${childSummaries.slice(0, 3).map(cs => cs.goalText).join(', ')}. Keep up the consistent progress!`;

      res.json({
        summary: fallbackSummary,
        goalText: targetGoal.text,
        childGoalsCount: childGoalIds.length,
        totalEntries: journals.length,
        childGoalsSummaries: childSummaries,
      });
    }

  } catch (error) {
    console.error("Get aggregated children summary error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 임시 테스트용 API (인증 없음)
app.get("/api/test/goals/:goalId/journals", async (req, res) => {
  try {
    const { goalId } = req.params;
    console.log("Test API - Getting journals for goalId:", goalId);

    const journals = await JournalEntry.find({
      relatedGoalId: goalId,
    }).sort({ date: -1 });

    console.log("Test API - Found journals:", journals.length);
    res.json(journals);
  } catch (error) {
    console.error("Test API - Get goal journals error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Test API - Get all journals (for debugging)
app.get("/api/test/journals", async (req, res) => {
  try {
    const journals = await JournalEntry.find({}).sort({ date: -1 });
    console.log("Test API - Found all journals:", journals.length);
    res.json(journals);
  } catch (error) {
    console.error("Test API - Get all journals error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Test API - Get all goals (for debugging)
app.get("/api/test/goals", async (req, res) => {
  try {
    const goals = await Goal.find({}).sort({ createdAt: -1 });
    console.log("Test API - Found all goals:", goals.length);
    res.json(goals);
  } catch (error) {
    console.error("Test API - Get all goals error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Test API - Get all users (for debugging)
app.get("/api/test/users", async (req, res) => {
  try {
    const users = await User.find({})
      .select("_id name email createdAt")
      .sort({ createdAt: -1 });
    console.log("Test API - Found all users:", users.length);
    res.json(users);
  } catch (error) {
    console.error("Test API - Get all users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Convert conversation to diary with goal mapping
app.post("/api/convert-to-diary", authenticateToken, async (req, res) => {
  try {
    const { conversationText } = req.body;

    if (!conversationText) {
      return res.status(400).json({ error: "Conversation text is required" });
    }

    // Get user's goals structure
    const goals = await Goal.find({ userId: req.user.userId });
    const flattenedGoals = [];

    goals.forEach((goal) => {
      if (goal.mandalartData) {
        // Main goal
        flattenedGoals.push({
          id: goal.mandalartData.id,
          text: goal.mandalartData.text,
          type: "main",
          description: goal.mandalartData.description || "",
          completed: goal.mandalartData.completed || false,
        });

        // Sub-goals
        if (goal.mandalartData.subGoals) {
          goal.mandalartData.subGoals.forEach((subGoal) => {
            if (subGoal && subGoal.text) {
              flattenedGoals.push({
                id: subGoal.id,
                text: subGoal.text,
                type: "sub",
                parentId: goal.mandalartData.id,
                description: subGoal.description || "",
                completed: subGoal.completed || false,
              });

              // Sub-sub-goals
              if (subGoal.subGoals) {
                subGoal.subGoals.forEach((subSubGoal) => {
                  if (subSubGoal && subSubGoal.text) {
                    flattenedGoals.push({
                      id: subSubGoal.id,
                      text: subSubGoal.text,
                      type: "sub-sub",
                      parentId: subGoal.id,
                      grandParentId: goal.mandalartData.id,
                      description: subSubGoal.description || "",
                      completed: subSubGoal.completed || false,
                    });
                  }
                });
              }
            }
          });
        }
      }
    });

    // Create goals context for GPT with clear hierarchy
    const goalsContext = flattenedGoals
      .map((goal) => {
        let prefix = "";
        if (goal.type === "main") prefix = "MAIN GOAL";
        else if (goal.type === "sub") prefix = "  SUB GOAL";
        else if (goal.type === "sub-sub") prefix = "    SUB-SUB GOAL";

        return `${prefix}: "${goal.text}" (ID: ${goal.id})${
          goal.description ? ` - ${goal.description}` : ""
        }`;
      })
      .join("\n");

    const systemPrompt = `You are a helpful assistant that converts conversations into personal diary entries and matches them to user goals.

User's Goals (hierarchical structure):
${goalsContext}

IMPORTANT: When matching goals, prefer the most specific match. For example:
- If the conversation is about "tennis", match the SUB-SUB GOAL "tennis" (not the SUB GOAL "exercise")
- If the conversation is about "running", match the SUB-SUB GOAL "run" (not the SUB GOAL "exercise")
- Only match the SUB GOAL if there's no specific SUB-SUB GOAL that fits

IMPORTANT RULES:
- ONLY use the actual conversation content provided below
- DO NOT add, invent, or assume any information not mentioned in the conversation
- DO NOT make up details, feelings, or experiences that weren't explicitly shared
- Base the diary entry strictly on what the user actually said
- Create a natural, flowing diary entry that feels personal and reflective
- Use first person perspective ("I", "me", "my")
- Make it sound like a real diary entry, not a formal report
- Include the user's actual words and experiences naturally
- If the conversation is brief, expand it thoughtfully while staying true to the content

After creating the diary entry, analyze if it relates to any of the user's goals and return both the diary content and goal mapping.

CRITICAL: You MUST respond with ONLY valid JSON. Do not include any text before or after the JSON.

Your response must start with { and end with }. No other text allowed.

Return your response in this exact JSON format:
{
  "diaryContent": "the diary entry content here",
  "goalMapping": {
    "relatedGoalId": "goal-id-if-found-or-null",
    "relatedGoalType": "main-or-sub-or-sub-sub-or-null",
    "confidence": 0.0-1.0,
    "reason": "brief explanation of why this goal was matched or why no match was found"
  }
}

WARNING: If you include any text before or after the JSON, the system will fail to parse your response.

Only match goals if confidence is above 0.3. Be conservative - it's better to not match than to match incorrectly.`;

    // Check if OpenAI API key is available
    if (
      !process.env.OPENAI_API_KEY ||
      process.env.OPENAI_API_KEY === "your_openai_api_key_here"
    ) {
      return res.status(500).json({
        error:
          "OpenAI API key not configured. Please contact the administrator to set up the API key.",
      });
    }

    const response = await fetch(
      process.env.OPENAI_API_URL ||
        "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: conversationText },
          ],
          max_tokens: 800,
          temperature: 0.7,
        }),
      }
    );

    const data = await response.json();
    console.log("GPT API response:", data);

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Invalid GPT API response structure:", data);
      return res.json({
        diaryContent: `Dear Diary,\n\n${conversationText}\n\nYours truly,\n[User]`,
        goalMapping: {
          relatedGoalId: null,
          relatedGoalType: null,
          confidence: 0,
          reason: "Invalid AI response structure",
        },
      });
    }

    const aiResponse = data.choices[0].message.content;
    console.log("AI response content:", aiResponse);

    try {
      // Extract JSON from response if there's extra text
      let jsonString = aiResponse.trim();

      // Find JSON object in the response
      const jsonStart = jsonString.indexOf("{");
      const jsonEnd = jsonString.lastIndexOf("}");

      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        jsonString = jsonString.substring(jsonStart, jsonEnd + 1);
      }

      const analysis = JSON.parse(jsonString);
      console.log("Parsed analysis:", analysis);
      res.json(analysis);
    } catch (parseError) {
      console.error("Failed to parse GPT response:", aiResponse);
      res.json({
        diaryContent: `Dear Diary,\n\n${conversationText}\n\nYours truly,\n[User]`,
        goalMapping: {
          relatedGoalId: null,
          relatedGoalType: null,
          confidence: 0,
          reason: "Failed to parse AI analysis",
        },
      });
    }
  } catch (error) {
    console.error("Convert to diary error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GPT-based Goal Mapping API
app.post("/api/analyze-goal-mapping", authenticateToken, async (req, res) => {
  try {
    const { diaryContent } = req.body;

    if (!diaryContent) {
      return res.status(400).json({ error: "Diary content is required" });
    }

    // Get all goals structure
    const goals = await Goal.find({ userId: req.user.userId });
    const flattenedGoals = [];

    goals.forEach((goal) => {
      if (goal.mandalartData) {
        // Main goal
        flattenedGoals.push({
          id: goal.mandalartData.id,
          text: goal.mandalartData.text,
          type: "main",
          description: goal.mandalartData.description || "",
          completed: goal.mandalartData.completed || false,
        });

        // Sub-goals
        if (goal.mandalartData.subGoals) {
          goal.mandalartData.subGoals.forEach((subGoal) => {
            if (subGoal && subGoal.text) {
              flattenedGoals.push({
                id: subGoal.id,
                text: subGoal.text,
                type: "sub",
                parentId: goal.mandalartData.id,
                description: subGoal.description || "",
                completed: subGoal.completed || false,
              });

              // Sub-sub-goals
              if (subGoal.subGoals) {
                subGoal.subGoals.forEach((subSubGoal) => {
                  if (subSubGoal && subSubGoal.text) {
                    flattenedGoals.push({
                      id: subSubGoal.id,
                      text: subSubGoal.text,
                      type: "sub-sub",
                      parentId: subGoal.id,
                      grandParentId: goal.mandalartData.id,
                      description: subSubGoal.description || "",
                      completed: subSubGoal.completed || false,
                    });
                  }
                });
              }
            }
          });
        }
      }
    });

    if (flattenedGoals.length === 0) {
      return res.json({
        relatedGoalId: null,
        relatedGoalType: null,
        confidence: 0,
        reason: "No goals found",
      });
    }

    // Create goals context for GPT
    const goalsContext = flattenedGoals
      .map(
        (goal) =>
          `- ${goal.type.toUpperCase()}: "${goal.text}" (ID: ${goal.id})${
            goal.description ? ` - ${goal.description}` : ""
          }`
      )
      .join("\n");

    const systemPrompt = `You are an AI assistant that analyzes diary entries and matches them to user goals.

User's Goals:
${goalsContext}

Analyze the following diary content and determine if it relates to any of the user's goals. Consider:
1. Direct mentions of goal topics
2. Related activities or progress
3. Emotional connections to goals
4. Indirect references to goal themes

Return your analysis in this exact JSON format:
{
  "relatedGoalId": "goal-id-if-found-or-null",
  "relatedGoalType": "main-or-sub-or-sub-sub-or-null",
  "confidence": 0.0-1.0,
  "reason": "brief explanation of why this goal was matched or why no match was found"
}

Only match if confidence is above 0.3. Be conservative - it's better to not match than to match incorrectly.`;

    // Check if OpenAI API key is available
    if (
      !process.env.OPENAI_API_KEY ||
      process.env.OPENAI_API_KEY === "your_openai_api_key_here"
    ) {
      return res.status(500).json({
        error:
          "OpenAI API key not configured. Please contact the administrator to set up the API key.",
      });
    }

    const response = await fetch(
      process.env.OPENAI_API_URL ||
        "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: diaryContent },
          ],
          max_tokens: 300,
          temperature: 0.3,
        }),
      }
    );

    const data = await response.json();
    console.log("GPT API response:", data);

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Invalid GPT API response structure:", data);
      return res.json({
        relatedGoalId: null,
        relatedGoalType: null,
        confidence: 0,
        reason: "Invalid AI response structure",
      });
    }

    const aiResponse = data.choices[0].message.content;
    console.log("AI response content:", aiResponse);

    try {
      const analysis = JSON.parse(aiResponse);
      console.log("Parsed analysis:", analysis);
      res.json(analysis);
    } catch (parseError) {
      console.error("Failed to parse GPT response:", aiResponse);
      res.json({
        relatedGoalId: null,
        relatedGoalType: null,
        confidence: 0,
        reason: "Failed to parse AI analysis",
      });
    }
  } catch (error) {
    console.error("Goal mapping analysis error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ============================================
// Persona Routes (for AI Chat Personalities)
// ============================================

// Get all personas (default + user's custom personas)
app.get("/api/personas", authenticateToken, async (req, res) => {
  try {
    // Get all default personas + user's custom personas
    const personas = await Persona.find({
      $or: [
        { isDefault: true },
        { userId: req.user.userId }
      ]
    }).sort({ isDefault: -1, createdAt: -1 });

    res.json(personas);
  } catch (error) {
    console.error("Get personas error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get a single persona by ID
app.get("/api/personas/:id", authenticateToken, async (req, res) => {
  try {
    const persona = await Persona.findById(req.params.id);

    if (!persona) {
      return res.status(404).json({ error: "Persona not found" });
    }

    // Check access: either default persona or user's own custom persona
    if (!persona.isDefault && persona.userId?.toString() !== req.user.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(persona);
  } catch (error) {
    console.error("Get persona error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create a custom persona
app.post("/api/personas", authenticateToken, async (req, res) => {
  try {
    const {
      name,
      displayName,
      description,
      systemPrompt,
      category,
      color,
      icon,
      avatarUrl
    } = req.body;

    // Validate required fields
    if (!name || !displayName || !description || !systemPrompt || !category) {
      return res.status(400).json({
        error: "Missing required fields: name, displayName, description, systemPrompt, category"
      });
    }

    // Check if persona name already exists for this user
    const existingPersona = await Persona.findOne({
      name,
      userId: req.user.userId
    });

    if (existingPersona) {
      return res.status(400).json({
        error: "You already have a persona with this name"
      });
    }

    // Create new custom persona
    const persona = new Persona({
      name,
      displayName,
      description,
      systemPrompt,
      category,
      color: color || "#8b5cf6",
      icon: icon || "✨",
      avatarUrl: avatarUrl || "",
      isDefault: false,
      userId: req.user.userId
    });

    await persona.save();
    res.status(201).json(persona);
  } catch (error) {
    console.error("Create persona error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update a custom persona
app.put("/api/personas/:id", authenticateToken, async (req, res) => {
  try {
    const persona = await Persona.findById(req.params.id);

    if (!persona) {
      return res.status(404).json({ error: "Persona not found" });
    }

    // Can only update own custom personas (not default personas)
    if (persona.isDefault) {
      return res.status(403).json({ error: "Cannot modify default personas" });
    }

    if (persona.userId?.toString() !== req.user.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Update allowed fields
    const {
      displayName,
      description,
      systemPrompt,
      category,
      color,
      icon,
      avatarUrl
    } = req.body;

    if (displayName) persona.displayName = displayName;
    if (description) persona.description = description;
    if (systemPrompt) persona.systemPrompt = systemPrompt;
    if (category) persona.category = category;
    if (color) persona.color = color;
    if (icon) persona.icon = icon;
    if (avatarUrl !== undefined) persona.avatarUrl = avatarUrl;

    await persona.save();
    res.json(persona);
  } catch (error) {
    console.error("Update persona error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a custom persona
app.delete("/api/personas/:id", authenticateToken, async (req, res) => {
  try {
    const persona = await Persona.findById(req.params.id);

    if (!persona) {
      return res.status(404).json({ error: "Persona not found" });
    }

    // Can only delete own custom personas (not default personas)
    if (persona.isDefault) {
      return res.status(403).json({ error: "Cannot delete default personas" });
    }

    if (persona.userId?.toString() !== req.user.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    await Persona.findByIdAndDelete(req.params.id);
    res.json({ message: "Persona deleted successfully" });
  } catch (error) {
    console.error("Delete persona error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Chat Routes
app.get("/api/chat", authenticateToken, async (req, res) => {
  try {
    const session = await ChatSession.findOne({ userId: req.user.userId }).sort(
      { updatedAt: -1 }
    );
    res.json(session || { messages: [] });
  } catch (error) {
    console.error("Get chat session error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/chat", authenticateToken, async (req, res) => {
  try {
    const { messages } = req.body;

    let session = await ChatSession.findOne({ userId: req.user.userId });

    if (session) {
      session.messages = messages;
      session.updatedAt = new Date();
    } else {
      session = new ChatSession({
        userId: req.user.userId,
        messages,
      });
    }

    await session.save();
    res.json({ message: "Chat session saved successfully", session });
  } catch (error) {
    console.error("Save chat session error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all goals with full structure for GPT analysis
app.get("/api/goals/full-structure", authenticateToken, async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.userId });

    // Flatten all goals and sub-goals for easier analysis
    const flattenedGoals = [];

    goals.forEach((goal) => {
      if (goal.mandalartData) {
        // Main goal
        flattenedGoals.push({
          id: goal.mandalartData.id,
          text: goal.mandalartData.text,
          type: "main",
          description: goal.mandalartData.description || "",
          completed: goal.mandalartData.completed || false,
        });

        // Sub-goals
        if (goal.mandalartData.subGoals) {
          goal.mandalartData.subGoals.forEach((subGoal) => {
            if (subGoal && subGoal.text) {
              flattenedGoals.push({
                id: subGoal.id,
                text: subGoal.text,
                type: "sub",
                parentId: goal.mandalartData.id,
                description: subGoal.description || "",
                completed: subGoal.completed || false,
              });

              // Sub-sub-goals
              if (subGoal.subGoals) {
                subGoal.subGoals.forEach((subSubGoal) => {
                  if (subSubGoal && subSubGoal.text) {
                    flattenedGoals.push({
                      id: subSubGoal.id,
                      text: subSubGoal.text,
                      type: "sub-sub",
                      parentId: subGoal.id,
                      grandParentId: goal.mandalartData.id,
                      description: subSubGoal.description || "",
                      completed: subSubGoal.completed || false,
                    });
                  }
                });
              }
            }
          });
        }
      }
    });

    res.json(flattenedGoals);
  } catch (error) {
    console.error("Get full goals structure error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// AI assistant for goal suggestions (Mandalart)
app.post("/api/goals/ai-suggestions", authenticateToken, async (req, res) => {
  try {
    const { description, dueDate } = req.body;

    if (!description || !description.trim()) {
      return res
        .status(400)
        .json({ error: "Goal description is required for AI suggestions." });
    }

    if (
      !process.env.OPENAI_API_KEY ||
      process.env.OPENAI_API_KEY === "your_openai_api_key_here"
    ) {
      return res.status(500).json({
        error:
          "OpenAI API key not configured. Please contact the administrator to set up the API key.",
      });
    }

    const systemPrompt = `You are a personal goal-setting coach specializing in the Mandalart method. A Mandalart breaks a main goal into 8 primary objectives, and each primary objective into 8 secondary objectives.

The user will provide a goal description. Your task is to:
1. Rephrase the user's goal into a clear, concise main goal for the central square.
2. Suggest 8 distinct, actionable primary objectives that directly contribute to the main goal.
3. Format your response clearly, with the main goal first, followed by the 8 primary objectives. Use bullet points for objectives.`;

    const userPrompt = `Help me break down this goal into a Mandalart: "${description.trim()}"${
      dueDate
        ? ` with a due date of ${new Date(dueDate).toLocaleDateString()}`
        : ""
    }`;

    const response = await fetch(
      process.env.OPENAI_API_URL ||
        "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 800,
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      console.error("Goal suggestion API failed:", response.status, response.statusText);
      return res
        .status(500)
        .json({ error: "Failed to generate AI goal suggestions." });
    }

    const data = await response.json();
    const suggestion = data?.choices?.[0]?.message?.content;

    if (!suggestion) {
      return res
        .status(500)
        .json({ error: "AI did not return a suggestion. Please try again." });
    }

    res.json({ suggestion });
  } catch (error) {
    console.error("Goal AI suggestion error:", error);
    res
      .status(500)
      .json({ error: "Internal server error while generating suggestions." });
  }
});

// Enhanced Chat API with goal context and persona support
app.post("/api/chat/enhanced", authenticateToken, async (req, res) => {
  try {
    const { message, personaId } = req.body;

    // Get selected persona or use default
    let selectedPersona;
    if (personaId) {
      selectedPersona = await Persona.findById(personaId);
      // Verify user has access to this persona (either default or their own)
      if (selectedPersona && !selectedPersona.isDefault && selectedPersona.userId?.toString() !== req.user.userId) {
        selectedPersona = null; // Fallback to default
      }
    }

    // If no persona specified or invalid persona, get default "Empathetic Listener"
    if (!selectedPersona) {
      selectedPersona = await Persona.findOne({
        isDefault: true,
        name: "empathetic-listener"
      });
    }

    // Fallback if default persona doesn't exist (shouldn't happen after seeding)
    if (!selectedPersona) {
      return res.status(500).json({
        error: "No persona found. Please run seed script: node seedDefaultPersonas.js"
      });
    }

    // Get user's goals and recent progress for context
    const goals = await Goal.find({ userId: req.user.userId });
    const recentProgress = await GoalProgress.find({
      userId: req.user.userId,
    })
      .sort({ date: -1 })
      .limit(5);

    // Build goal context with progress information
    let goalContext = "";
    if (goals.length > 0) {
      goalContext = "\n\nUser's current goals and recent progress:\n";
      for (const goal of goals) {
        goalContext += `- Main Goal: ${goal.mandalartData.text}\n`;
        if (goal.mandalartData.completed) {
          goalContext += `  ✅ COMPLETED!\n`;
        }

        // Get recent progress for this goal
        const goalProgress = recentProgress.filter(
          (p) => p.goalId === goal.mandalartData.id
        );
        if (goalProgress.length > 0) {
          goalContext += `  Recent progress:\n`;
          goalProgress.slice(0, 3).forEach((progress) => {
            goalContext += `    • ${
              progress.title
            } (${progress.date.toLocaleDateString()})\n`;
          });
        }

        // Check sub-goals
        if (Array.isArray(goal.mandalartData.subGoals)) {
          const validSubGoals = goal.mandalartData.subGoals.filter(
            (sg) => sg && sg.text
          );
          if (validSubGoals.length > 0) {
            const completedSubGoals = validSubGoals.filter(
              (sg) => sg.completed
            ).length;
            goalContext += `  Sub-goals progress: ${completedSubGoals}/${validSubGoals.length} completed\n`;
          }
        }
        goalContext += "\n";
      }
    }

    // Use persona's system prompt with goal context appended
    const systemPrompt = `${selectedPersona.systemPrompt}${goalContext}`;

    const response = await fetch(
      process.env.OPENAI_API_URL ||
        "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      }
    );

    const data = await response.json();
    const aiMessage = data.choices[0].message.content;

    // Save to chat session
    let session = await ChatSession.findOne({ userId: req.user.userId });
    if (!session) {
      session = new ChatSession({
        userId: req.user.userId,
        messages: [],
        selectedPersonaId: selectedPersona._id
      });
    } else {
      // Update selected persona if changed
      session.selectedPersonaId = selectedPersona._id;
    }

    session.messages.push(
      {
        id: `user-${Date.now()}`,
        text: message,
        sender: "user",
        timestamp: new Date(),
      },
      {
        id: `bot-${Date.now()}`,
        text: aiMessage,
        sender: "bot",
        timestamp: new Date(),
      }
    );

    await session.save();

    res.json({
      message: aiMessage,
      persona: {
        id: selectedPersona._id,
        name: selectedPersona.displayName,
        icon: selectedPersona.icon
      }
    });
  } catch (error) {
    console.error("Enhanced chat error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// AI Progress Summary endpoint
app.get(
  "/api/goals/:goalId/ai-summary",
  authenticateToken,
  async (req, res) => {
    try {
      const { goalId } = req.params;
      const period = req.query.period || "weekly";

      // Get goal progress data
      const { start, end } = getPeriodBounds(period);
      const progressEntries = await GoalProgress.find({
        userId: req.user.userId,
        goalId,
        date: { $gte: start, $lte: end },
      }).sort({ date: -1 });

      // Get related journal entries
      const journalEntries = await JournalEntry.find({
        userId: req.user.userId,
        relatedGoalId: goalId,
        date: { $gte: start, $lte: end },
      }).sort({ date: -1 });

      // Prepare context for AI
      const progressSummary = progressEntries
        .map(
          (p) =>
            `${p.date.toLocaleDateString()}: ${p.title} - ${p.description}`
        )
        .join("\n");

      const journalSummary = journalEntries
        .slice(0, 5)
        .map((j) => `${j.date.toLocaleDateString()}: ${j.content.substring(0, 200)}...`)
        .join("\n");

      const prompt = `You are a personal growth coach analyzing a user's progress on their goal.

Period: ${period}
Progress Entries (${progressEntries.length}):
${progressSummary || "No progress entries yet"}

Related Journal Entries (${journalEntries.length}):
${journalSummary || "No journal entries yet"}

Please provide:
1. A brief, encouraging summary of their progress (2-3 sentences)
2. Key achievements this period (bullet points)
3. Areas for improvement (bullet points)
4. Recommended next steps (bullet points)

Format your response as JSON:
{
  "summary": "...",
  "achievements": ["...", "..."],
  "improvements": ["...", "..."],
  "nextSteps": ["...", "..."]
}`;

      const response = await fetch(process.env.OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          response_format: { type: "json_object" },
        }),
      });

      const data = await response.json();
      const aiSummary = JSON.parse(data.choices[0].message.content);

      res.json({
        ...aiSummary,
        stats: {
          progressCount: progressEntries.length,
          journalCount: journalEntries.length,
          period,
        },
      });
    } catch (error) {
      console.error("AI summary error:", error);
      res.status(500).json({ error: "Failed to generate AI summary" });
    }
  }
);

// Word Cloud data endpoint with 7-day caching
app.get(
  "/api/goals/:goalId/wordcloud",
  authenticateToken,
  async (req, res) => {
    try {
      const { goalId } = req.params;
      const userId = req.user.userId;
      const timeRange = req.query.timeRange || "all"; // 'all', 'recent', 'comparison'

      // Check for cached word cloud (valid for 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const cachedWordCloud = await GoalSummary.findOne({
        userId,
        goalId,
        summaryType: "wordcloud",
        createdAt: { $gte: sevenDaysAgo },
        "metadata.timeRange": timeRange,
      }).sort({ createdAt: -1 });

      if (cachedWordCloud && cachedWordCloud.metadata.wordCloudData) {
        console.log(`Using cached word cloud for goal ${goalId}, timeRange: ${timeRange}`);

        // Return cached data in the format expected by frontend
        if (timeRange === 'comparison') {
          return res.json({
            current: cachedWordCloud.metadata.wordCloudData.current || [],
            past: cachedWordCloud.metadata.wordCloudData.past || [],
          });
        } else {
          return res.json({
            current: cachedWordCloud.metadata.wordCloudData.current || [],
            past: [],
          });
        }
      }

      // No cache - generate word cloud
      console.log(`Generating new word cloud for goal ${goalId}, timeRange: ${timeRange}`);

      // Helper function to extract words from journal entries
      const extractWords = (entries) => {
        if (!entries || entries.length === 0) return [];

        const stopWords = new Set([
          "that", "this", "with", "from", "have", "been", "were", "your",
          "will", "would", "could", "should", "about", "there", "their",
          "which", "when", "where", "what", "more", "some", "into", "just",
          "only", "very", "much", "than",
        ]);

        const allText = entries
          .map((entry) => `${entry.title || ""} ${entry.content || ""}`)
          .join(" ")
          .toLowerCase()
          .replace(/[^a-z\s]/g, "")
          .split(/\s+/)
          .filter((word) => word.length > 3 && !stopWords.has(word));

        const wordFreq = {};
        allText.forEach((word) => {
          wordFreq[word] = (wordFreq[word] || 0) + 1;
        });

        return Object.entries(wordFreq)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 40)
          .map(([word, count]) => ({ word, count }));
      };

      // Fetch journal entries based on timeRange
      let currentWords = [];
      let pastWords = [];

      if (timeRange === "comparison") {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const recentEntries = await JournalEntry.find({
          userId,
          relatedGoalId: goalId,
          date: { $gte: threeMonthsAgo },
        });

        const pastEntries = await JournalEntry.find({
          userId,
          relatedGoalId: goalId,
          date: { $gte: sixMonthsAgo, $lt: threeMonthsAgo },
        });

        currentWords = extractWords(recentEntries);
        pastWords = extractWords(pastEntries);
      } else if (timeRange === "recent") {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const recentEntries = await JournalEntry.find({
          userId,
          relatedGoalId: goalId,
          date: { $gte: threeMonthsAgo },
        });

        currentWords = extractWords(recentEntries);
      } else {
        // 'all' - all time
        const allEntries = await JournalEntry.find({
          userId,
          relatedGoalId: goalId,
        });

        currentWords = extractWords(allEntries);
      }

      // Cache the word cloud for 7 days
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await GoalSummary.create({
        userId,
        goalId,
        summaryType: "wordcloud",
        summary: `Word cloud for ${timeRange} timeRange`,
        metadata: {
          timeRange,
          wordCloudData: {
            current: currentWords,
            past: pastWords,
          },
        },
        expiresAt,
      });

      console.log(`Cached word cloud for goal ${goalId}, timeRange: ${timeRange} (expires in 7 days)`);

      // Return response
      if (timeRange === 'comparison') {
        res.json({ current: currentWords, past: pastWords });
      } else {
        res.json({ current: currentWords, past: [] });
      }
    } catch (error) {
      console.error("Word cloud error:", error);
      res.status(500).json({ error: "Failed to generate word cloud" });
    }
  }
);

// Progress Chart data endpoint
app.get(
  "/api/goals/:goalId/chart-data",
  authenticateToken,
  async (req, res) => {
    try {
      const { goalId } = req.params;
      const period = req.query.period || "weekly";

      const { start, end } = getPeriodBounds(period);

      const progressEntries = await GoalProgress.find({
        userId: req.user.userId,
        goalId,
        date: { $gte: start, $lte: end },
      }).sort({ date: 1 });

      // Group by date
      const dailyData = {};
      progressEntries.forEach((entry) => {
        const dateKey = entry.date.toISOString().split("T")[0];
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = {
            date: dateKey,
            count: 0,
            timeSpent: 0,
            entries: [],
          };
        }
        dailyData[dateKey].count += 1;
        dailyData[dateKey].timeSpent += entry.timeSpent || 0;
        dailyData[dateKey].entries.push(entry);
      });

      const chartData = Object.values(dailyData).map((day) => ({
        date: day.date,
        count: day.count,
        timeSpent: day.timeSpent,
        avgMood: day.entries.reduce((acc, e) => acc + (e.mood === "happy" ? 5 : e.mood === "excited" ? 4 : e.mood === "calm" ? 3 : e.mood === "neutral" ? 2 : 1), 0) / day.entries.length,
      }));

      res.json({ chartData, period });
    } catch (error) {
      console.error("Chart data error:", error);
      res.status(500).json({ error: "Failed to generate chart data" });
    }
  }
);

// ============================================================================
// PRIVACY SETTINGS & COUNSELOR DASHBOARD ENDPOINTS
// ============================================================================

// Get current user's privacy settings
app.get("/api/privacy-settings", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("privacySettings role");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      privacySettings: user.privacySettings || {},
      role: user.role,
    });
  } catch (error) {
    console.error("Privacy settings fetch error:", error);
    res.status(500).json({ error: "Failed to fetch privacy settings" });
  }
});

// Update privacy settings (students only)
app.put("/api/privacy-settings", authenticateToken, async (req, res) => {
  try {
    const { riskMonitoring, assignedCounselors } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Only students can update privacy settings
    if (user.role !== "student") {
      return res.status(403).json({
        error: "Only students can update privacy settings",
      });
    }

    // Update privacy settings
    if (riskMonitoring !== undefined) {
      user.privacySettings = user.privacySettings || {};
      user.privacySettings.riskMonitoring = {
        enabled: riskMonitoring.enabled,
        shareLevel: riskMonitoring.shareLevel || "summary",
        consentDate: riskMonitoring.enabled ? new Date() : user.privacySettings.riskMonitoring?.consentDate,
      };
    }

    if (assignedCounselors !== undefined) {
      user.privacySettings = user.privacySettings || {};
      user.privacySettings.assignedCounselors = assignedCounselors;
    }

    await user.save();

    res.json({
      message: "Privacy settings updated successfully",
      privacySettings: user.privacySettings,
    });
  } catch (error) {
    console.error("Privacy settings update error:", error);
    res.status(500).json({ error: "Failed to update privacy settings" });
  }
});

// Get list of available counselors (for student to select)
app.get("/api/counselors", authenticateToken, async (req, res) => {
  try {
    const counselors = await User.find({ role: "counselor" })
      .select("name email counselorProfile")
      .lean();

    res.json({ counselors });
  } catch (error) {
    console.error("Counselors fetch error:", error);
    res.status(500).json({ error: "Failed to fetch counselors" });
  }
});

// Get risk alerts for counselor dashboard
app.get(
  "/api/counselor/alerts",
  authenticateToken,
  requireRole("counselor"),
  async (req, res) => {
    try {
      const { status, riskLevel, limit = 50, offset = 0 } = req.query;

      // Build query - all counselors can see all alerts
      const query = {};

      if (status) {
        query.status = status;
      }

      if (riskLevel) {
        query.riskLevel = riskLevel;
      }

      // Fetch alerts
      const alerts = await RiskAlert.find(query)
        .populate("studentId", "name email studentProfile")
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset))
        .lean();

      // Get total count
      const total = await RiskAlert.countDocuments(query);

      // Get statistics - all alerts
      const stats = await RiskAlert.aggregate([
        {
          $match: {},
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            new: {
              $sum: { $cond: [{ $eq: ["$status", "new"] }, 1, 0] },
            },
            critical: {
              $sum: { $cond: [{ $eq: ["$riskLevel", "critical"] }, 1, 0] },
            },
            high: {
              $sum: { $cond: [{ $eq: ["$riskLevel", "high"] }, 1, 0] },
            },
            medium: {
              $sum: { $cond: [{ $eq: ["$riskLevel", "medium"] }, 1, 0] },
            },
            low: {
              $sum: { $cond: [{ $eq: ["$riskLevel", "low"] }, 1, 0] },
            },
          },
        },
      ]);

      res.json({
        alerts,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
        },
        stats: stats[0] || {
          total: 0,
          new: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        },
      });
    } catch (error) {
      console.error("Counselor alerts fetch error:", error);
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  }
);

// Get specific alert details
app.get(
  "/api/counselor/alerts/:alertId",
  authenticateToken,
  requireRole("counselor"),
  async (req, res) => {
    try {
      const { alertId } = req.params;
      const counselorId = req.user.userId;

      const alert = await RiskAlert.findOne({
        _id: alertId,
        "assignedCounselors.counselorId": counselorId,
      })
        .populate("studentId", "name email studentProfile")
        .populate("assignedCounselors.counselorId", "name email")
        .populate("counselorNotes.counselorId", "name")
        .lean();

      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }

      res.json({ alert });
    } catch (error) {
      console.error("Alert fetch error:", error);
      res.status(500).json({ error: "Failed to fetch alert" });
    }
  }
);

// Update alert status
app.patch(
  "/api/counselor/alerts/:alertId/status",
  authenticateToken,
  requireRole("counselor"),
  canModifyAlert,
  async (req, res) => {
    try {
      const { status, followUpDate } = req.body;

      const alert = req.alert;

      if (status) {
        alert.status = status;
      }

      if (followUpDate) {
        alert.followUpDate = new Date(followUpDate);
      }

      if (status === "resolved") {
        alert.resolvedAt = new Date();
      }

      await alert.save();

      res.json({
        message: "Alert status updated",
        alert,
      });
    } catch (error) {
      console.error("Alert status update error:", error);
      res.status(500).json({ error: "Failed to update alert status" });
    }
  }
);

// Add counselor note to alert
app.post(
  "/api/counselor/alerts/:alertId/notes",
  authenticateToken,
  requireRole("counselor"),
  canModifyAlert,
  async (req, res) => {
    try {
      const { note, action } = req.body;

      if (!note) {
        return res.status(400).json({ error: "Note is required" });
      }

      const alert = req.alert;

      alert.counselorNotes.push({
        counselorId: req.user.userId,
        note,
        action,
        createdAt: new Date(),
      });

      await alert.save();

      res.json({
        message: "Note added successfully",
        alert,
      });
    } catch (error) {
      console.error("Add note error:", error);
      res.status(500).json({ error: "Failed to add note" });
    }
  }
);

// Get student overview for counselor (with privacy filtering)
app.get(
  "/api/counselor/students/:studentId",
  authenticateToken,
  requireRole("counselor"),
  canAccessStudent,
  async (req, res) => {
    try {
      const { studentId } = req.params;
      const shareLevel = req.student.shareLevel;

      // Fetch student info
      const student = await User.findById(studentId)
        .select("name email studentProfile createdAt")
        .lean();

      // Fetch recent alerts
      const recentAlerts = await RiskAlert.find({
        studentId,
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      // Fetch mood trend (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      let moodTrend = null;
      let journalCount = 0;

      if (shareLevel === "moderate" || shareLevel === "detailed") {
        const journals = await JournalEntry.find({
          userId: studentId,
          date: { $gte: thirtyDaysAgo },
        })
          .select("mood date")
          .sort({ date: 1 })
          .lean();

        journalCount = journals.length;

        // Calculate mood trend
        const moodScores = {
          happy: 5,
          excited: 5,
          grateful: 4,
          calm: 4,
          neutral: 3,
          reflective: 3,
          anxious: 2,
          sad: 1,
        };

        const scores = journals.map((j) => moodScores[j.mood] || 3);
        const avgScore = scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : null;

        moodTrend = {
          averageScore: avgScore,
          totalEntries: journals.length,
          moodDistribution: journals.reduce((acc, j) => {
            acc[j.mood] = (acc[j.mood] || 0) + 1;
            return acc;
          }, {}),
        };
      }

      // Response based on share level
      const response = {
        student,
        alerts: {
          recent: recentAlerts.map((alert) => ({
            id: alert._id,
            riskLevel: alert.riskLevel,
            status: alert.status,
            createdAt: alert.createdAt,
            summary:
              shareLevel === "summary"
                ? alert.aiAnalysis.summary
                : shareLevel === "moderate"
                ? alert.aiAnalysis.summary
                : alert.aiAnalysis,
          })),
          total: recentAlerts.length,
        },
        shareLevel,
      };

      if (shareLevel === "moderate" || shareLevel === "detailed") {
        response.moodTrend = moodTrend;
        response.journalCount = journalCount;
      }

      res.json(response);
    } catch (error) {
      console.error("Student overview fetch error:", error);
      res.status(500).json({ error: "Failed to fetch student overview" });
    }
  }
);

// Trigger risk analysis for journal entry (called automatically after journal save)
app.post(
  "/api/journal/:entryId/analyze-risk",
  authenticateToken,
  async (req, res) => {
    try {
      const { entryId } = req.params;
      const userId = req.user.userId;

      // Check if risk monitoring is enabled
      const user = await User.findById(userId).select("privacySettings");
      if (!user?.privacySettings?.riskMonitoring?.enabled) {
        return res.json({
          message: "Risk monitoring not enabled",
          analyzed: false,
        });
      }

      // Trigger analysis
      const riskAlert = await riskDetectionService.analyzeJournalEntry(
        userId,
        entryId
      );

      if (riskAlert) {
        res.json({
          message: "Risk detected and alert created",
          analyzed: true,
          riskLevel: riskAlert.riskLevel,
          alertId: riskAlert._id,
        });
      } else {
        res.json({
          message: "No significant risk detected",
          analyzed: true,
        });
      }
    } catch (error) {
      console.error("Risk analysis error:", error);
      res.status(500).json({ error: "Failed to analyze risk" });
    }
  }
);

// Trigger mood pattern analysis (can be called periodically via cron)
app.post(
  "/api/analyze-mood-patterns",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.userId;

      // Check if risk monitoring is enabled
      const user = await User.findById(userId).select("privacySettings");
      if (!user?.privacySettings?.riskMonitoring?.enabled) {
        return res.json({
          message: "Risk monitoring not enabled",
          analyzed: false,
        });
      }

      // Trigger analysis
      const riskAlert = await riskDetectionService.analyzeMoodPattern(userId);

      if (riskAlert) {
        res.json({
          message: "Risk pattern detected and alert created",
          analyzed: true,
          riskLevel: riskAlert.riskLevel,
          alertId: riskAlert._id,
        });
      } else {
        res.json({
          message: "No concerning patterns detected",
          analyzed: true,
        });
      }
    } catch (error) {
      console.error("Mood pattern analysis error:", error);
      res.status(500).json({ error: "Failed to analyze mood patterns" });
    }
  }
);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
