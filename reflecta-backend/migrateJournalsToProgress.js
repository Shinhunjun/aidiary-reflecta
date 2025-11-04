/**
 * Migration Script: Migrate existing journal entries to GoalProgress
 *
 * This script:
 * 1. Finds all journal entries without relatedGoalId
 * 2. Uses GPT to analyze and map them to goals
 * 3. Updates JournalEntry records with goal mappings
 * 4. Creates corresponding GoalProgress records
 *
 * Usage: node migrateJournalsToProgress.js
 */

require("dotenv").config({ path: ".env.development" });
const mongoose = require("mongoose");

// Models
const JournalEntry = require("./models/JournalEntry");
const Goal = require("./models/Goal");
const GoalProgress = require("./models/GoalProgress");

// Helper function: Analyze journal content and map to goals using GPT
const analyzeGoalMapping = async (userId, content) => {
  try {
    // Get all user goals
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

// Main migration function
async function migrateJournals() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/reflecta"
    );
    console.log("✅ Connected to MongoDB");

    // Find all journal entries without relatedGoalId
    console.log("\nFinding journal entries to migrate...");
    const entriesToMigrate = await JournalEntry.find({
      $or: [{ relatedGoalId: null }, { relatedGoalId: { $exists: false } }],
    }).sort({ date: -1 });

    console.log(`Found ${entriesToMigrate.length} journal entries to migrate`);

    if (entriesToMigrate.length === 0) {
      console.log("No entries to migrate!");
      await mongoose.disconnect();
      return;
    }

    let stats = {
      total: entriesToMigrate.length,
      mapped: 0,
      unmapped: 0,
      progressCreated: 0,
      errors: 0,
    };

    console.log("\nStarting migration...");
    console.log("This may take a while due to GPT API rate limits.");
    console.log("Progress will be logged every 10 entries.\n");

    for (let i = 0; i < entriesToMigrate.length; i++) {
      const entry = entriesToMigrate[i];

      try {
        // Analyze and get goal mapping
        const mapping = await analyzeGoalMapping(entry.userId, entry.content);

        if (mapping.relatedGoalId) {
          // Update journal entry with goal mapping
          entry.relatedGoalId = mapping.relatedGoalId;
          entry.relatedGoalType = mapping.relatedGoalType;
          await entry.save();

          stats.mapped++;

          // Create GoalProgress record
          const estimatedTimeSpent = Math.max(
            5,
            Math.ceil(entry.content.length / 200)
          );

          const progress = new GoalProgress({
            userId: entry.userId,
            goalId: mapping.relatedGoalId,
            subGoalId:
              mapping.relatedGoalType === "sub" ||
              mapping.relatedGoalType === "sub-sub"
                ? mapping.relatedGoalId
                : null,
            progressType: "reflection",
            title: entry.title,
            description: entry.content.substring(0, 200),
            date: entry.date,
            mood: entry.mood,
            tags: entry.tags || [],
            isAIGenerated: entry.isAIGenerated,
            notes: entry.content,
            timeSpent: estimatedTimeSpent,
            isMilestone: false,
          });

          await progress.save();
          stats.progressCreated++;

          if ((i + 1) % 10 === 0) {
            console.log(`Progress: ${i + 1}/${stats.total} entries processed`);
            console.log(
              `  Mapped: ${stats.mapped}, Unmapped: ${stats.unmapped}, Errors: ${stats.errors}`
            );
          }
        } else {
          stats.unmapped++;
        }

        // Add small delay to respect OpenAI rate limits (3 RPM for free tier)
        await new Promise((resolve) => setTimeout(resolve, 20000)); // 20 second delay
      } catch (error) {
        console.error(`Error processing entry ${entry._id}:`, error.message);
        stats.errors++;
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Migration Complete!");
    console.log("=".repeat(60));
    console.log(`Total entries processed: ${stats.total}`);
    console.log(`Successfully mapped to goals: ${stats.mapped}`);
    console.log(`Not mapped (no suitable goal): ${stats.unmapped}`);
    console.log(`GoalProgress records created: ${stats.progressCreated}`);
    console.log(`Errors: ${stats.errors}`);
    console.log("=".repeat(60));

    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("Migration failed:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run migration
console.log("=".repeat(60));
console.log("Journal to GoalProgress Migration Script");
console.log("=".repeat(60));
console.log("\nThis script will:");
console.log("1. Analyze all journal entries without goal mappings");
console.log("2. Use GPT to map them to your goals");
console.log("3. Create GoalProgress records for dashboard visualizations");
console.log("\n⚠️  WARNING: This uses OpenAI API and may incur costs!");
console.log("⚠️  Rate limit: ~3 requests per minute (free tier)");
console.log("⚠️  Estimated time: ~20 seconds per entry");
console.log("\nPress Ctrl+C to cancel, or wait 5 seconds to continue...\n");

setTimeout(() => {
  migrateJournals();
}, 5000);
