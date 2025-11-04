const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/User");
const Goal = require("./models/Goal");
const JournalEntry = require("./models/JournalEntry");

const moods = ["happy", "excited", "calm", "reflective", "grateful", "neutral", "anxious", "sad"];

// Journal templates for different goal categories
const journalTemplates = {
  health: [
    "Today I made progress on my health goals. I feel {mood} about the journey.",
    "Focused on my wellness today. This journey toward better health makes me feel {mood}.",
    "Taking another step toward my health objectives. Feeling {mood} about the progress.",
  ],
  career: [
    "Professional development continues. Today's work toward my career goals left me feeling {mood}.",
    "Made meaningful progress on my professional objectives today. I'm {mood} about where this is heading.",
    "Career-building activities today. The journey makes me feel {mood}.",
  ],
  learning: [
    "Learning something new today related to my goals. I feel {mood} about expanding my knowledge.",
    "Educational progress continues. Today's learning session left me feeling {mood}.",
    "Deepening my understanding today. This intellectual growth makes me {mood}.",
  ],
  relationships: [
    "Spent time nurturing important relationships today. I feel {mood} about these connections.",
    "Made efforts to strengthen my bonds with others. Feeling {mood} about where these relationships are going.",
    "Connection and communication today. These relationship-building moments make me feel {mood}.",
  ],
  finance: [
    "Working on financial goals today. The progress toward financial stability makes me {mood}.",
    "Taking steps toward better financial health. I'm {mood} about this journey.",
    "Financial planning and action today. Feeling {mood} about the path ahead.",
  ],
  creativity: [
    "Creative work today brought me closer to my artistic goals. I feel {mood} about expressing myself.",
    "Explored my creative side today. This artistic journey makes me {mood}.",
    "Made time for creative pursuits. Feeling {mood} about where this is taking me.",
  ],
  fitness: [
    "Physical training today. The commitment to fitness goals leaves me feeling {mood}.",
    "Body and mind working together today. I'm {mood} about this physical journey.",
    "Exercise and movement today. Feeling {mood} about getting stronger.",
  ],
  mindfulness: [
    "Practiced mindfulness today. The inner peace from meditation makes me feel {mood}.",
    "Quiet moments of reflection today. This spiritual practice leaves me {mood}.",
    "Centered myself through mindful practices. Feeling {mood} about this inner journey.",
  ],
  default: [
    "Made progress on my goals today. I feel {mood} about the journey forward.",
    "Another day of growth and development. Feeling {mood} about where I'm heading.",
    "Continuing to work toward what matters most. This journey makes me {mood}.",
  ],
};

const getTemplateForGoal = (goalTitle) => {
  const title = goalTitle.toLowerCase();

  if (title.includes("health") || title.includes("wellness")) return journalTemplates.health;
  if (title.includes("career") || title.includes("professional") || title.includes("work")) return journalTemplates.career;
  if (title.includes("learn") || title.includes("study") || title.includes("education")) return journalTemplates.learning;
  if (title.includes("relationship") || title.includes("family") || title.includes("friend")) return journalTemplates.relationships;
  if (title.includes("financ") || title.includes("money") || title.includes("wealth")) return journalTemplates.finance;
  if (title.includes("creativ") || title.includes("art") || title.includes("music")) return journalTemplates.creativity;
  if (title.includes("fitness") || title.includes("exercise") || title.includes("workout")) return journalTemplates.fitness;
  if (title.includes("mindful") || title.includes("meditat") || title.includes("spiritual")) return journalTemplates.mindfulness;

  return journalTemplates.default;
};

const createJournalsForSubGoals = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Find demo user
    const demoUser = await User.findOne({ email: "demo@reflecta.com" });
    if (!demoUser) {
      console.log("❌ Demo user not found");
      process.exit(1);
    }
    console.log("✅ Found demo user:", demoUser.email);

    // Find demo user's goal
    const goal = await Goal.findOne({ userId: demoUser._id });
    if (!goal) {
      console.log("❌ No goals found for demo user");
      process.exit(1);
    }

    console.log("\n📊 Analyzing goal structure...");
    console.log(`Core Goal: ${goal.mandalartData.text || goal.mandalartData.title}`);
    console.log(`Level 1 sub-goals: ${goal.mandalartData.subGoals?.length || 0}`);

    // Collect all sub-goals (level 2 - the 64 tasks)
    const allSubGoals = [];
    if (goal.mandalartData?.subGoals) {
      goal.mandalartData.subGoals.forEach((level1Goal, l1Index) => {
        if (level1Goal?.subGoals && Array.isArray(level1Goal.subGoals) && level1Goal.subGoals.length > 0) {
          level1Goal.subGoals.forEach((level2Goal, l2Index) => {
            if (level2Goal?.id && (level2Goal?.text || level2Goal?.title)) {
              allSubGoals.push({
                id: level2Goal.id,
                title: level2Goal.text || level2Goal.title,
                parentTitle: level1Goal.text || level1Goal.title || "Unknown Goal",
                category: level1Goal.category || "default",
              });
            }
          });
        }
      });
    }

    console.log(`Total actionable sub-goals: ${allSubGoals.length}`);

    // Check existing journals
    const existingJournals = await JournalEntry.find({ userId: demoUser._id });
    const existingGoalIds = new Set(
      existingJournals.map(j => j.relatedGoalId).filter(id => id !== null)
    );

    console.log(`Existing journal entries: ${existingJournals.length}`);
    console.log(`Sub-goals already covered: ${existingGoalIds.size}`);

    // Find sub-goals without journals
    const uncoveredSubGoals = allSubGoals.filter(
      sg => !existingGoalIds.has(sg.id)
    );

    if (uncoveredSubGoals.length === 0) {
      console.log("\n✅ All sub-goals already have journal entries!");
      await mongoose.connection.close();
      return;
    }

    console.log(`\n📝 Creating journals for ${uncoveredSubGoals.length} uncovered sub-goals...`);

    // Create journals
    const newJournals = [];
    const now = new Date();

    uncoveredSubGoals.forEach((subGoal, index) => {
      const mood = moods[index % moods.length];
      const templates = getTemplateForGoal(subGoal.parentTitle);
      const template = templates[index % templates.length];
      const content = template.replace("{mood}", mood);

      // Spread journals over past 30 days
      const daysAgo = Math.floor(Math.random() * 30);
      const entryDate = new Date(now);
      entryDate.setDate(entryDate.getDate() - daysAgo);

      // Generate title from sub-goal
      const title = `Progress on: ${subGoal.title.substring(0, 50)}${subGoal.title.length > 50 ? '...' : ''}`;

      newJournals.push({
        userId: demoUser._id,
        title: title,
        content: content,
        mood: mood,
        date: entryDate,
        relatedGoalId: subGoal.id,
        relatedGoalType: "sub-sub", // Level 2 sub-goals are the actionable tasks
        isAIGenerated: false,
        createdAt: entryDate,
        updatedAt: entryDate,
      });
    });

    // Insert journals
    await JournalEntry.insertMany(newJournals);
    console.log(`✅ Created ${newJournals.length} new journal entries`);

    // Summary
    const totalJournals = existingJournals.length + newJournals.length;
    console.log("\n📊 Final Summary:");
    console.log(`   - Total sub-goals: ${allSubGoals.length}`);
    console.log(`   - Total journal entries: ${totalJournals}`);
    console.log(`   - Coverage: ${allSubGoals.length} / ${allSubGoals.length} (100%)`);

    await mongoose.connection.close();
    console.log("\n✅ Done!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

createJournalsForSubGoals();
