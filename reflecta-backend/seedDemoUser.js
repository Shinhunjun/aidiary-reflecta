const mongoose = require("mongoose");
require("dotenv").config();

// Import models
const User = require("./models/User");
const Goal = require("./models/Goal");
const GoalProgress = require("./models/GoalProgress");
const JournalEntry = require("./models/JournalEntry");

// Connect to MongoDB
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }
    await mongoose.connect(uri);
    console.log("✅ MongoDB Connected to:", uri.includes('mongodb+srv') ? 'MongoDB Atlas' : 'Local MongoDB');
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1);
  }
};

// Create demo user or get existing
const createDemoUser = async () => {
  try {
    let user = await User.findOne({ email: "demo@reflecta.com" });

    if (user) {
      console.log("✅ Demo user already exists:", user.email);
      return user;
    }

    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash("demo123", 10);

    user = new User({
      email: "demo@reflecta.com",
      password: hashedPassword,
      name: "Demo User",
      role: "student",
      studentProfile: {
        studentId: "DEMO2024",
        grade: "Senior",
        major: "Computer Science",
        enrollmentYear: 2021,
      },
    });

    await user.save();
    console.log("✅ Demo user created:", user.email);
    return user;
  } catch (error) {
    console.error("❌ Error creating demo user:", error);
    throw error;
  }
};

// Create Mandalart goals for demo
const createDemoGoals = async (userId) => {
  try {
    // Check if goals already exist
    const existingGoal = await Goal.findOne({ userId });
    if (existingGoal) {
      console.log("✅ Goals already exist for demo user");
      return existingGoal;
    }

    const mandalartData = {
      id: "main-center",
      text: "Achieve Holistic Personal Growth",
      completed: false,
      description: "Balance career, health, and personal development for a fulfilling life",
      dueDate: new Date("2025-12-31"),
      subGoals: [
        {
          id: "goal-1",
          text: "Career Excellence",
          completed: false,
          description: "Excel in my professional journey",
          dueDate: new Date("2025-06-30"),
          subGoals: [
            { id: "goal-1-1", text: "Complete Advanced React Course", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-1-2", text: "Build Portfolio Website", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-1-3", text: "Contribute to Open Source", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-1-4", text: "Attend Tech Conference", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-1-5", text: "Network with 10 Professionals", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-1-6", text: "Write Technical Blog Posts", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-1-7", text: "Learn System Design", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-1-8", text: "Prepare for Job Interviews", completed: false, description: "", dueDate: null, subGoals: [] },
          ],
        },
        {
          id: "goal-2",
          text: "Physical Health",
          completed: false,
          description: "Maintain a healthy and active lifestyle",
          dueDate: new Date("2025-12-31"),
          subGoals: [
            { id: "goal-2-1", text: "Exercise 4x per Week", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-2-2", text: "Drink 8 Glasses of Water Daily", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-2-3", text: "Run 5K Race", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-2-4", text: "Sleep 7-8 Hours", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-2-5", text: "Meal Prep on Sundays", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-2-6", text: "Join Yoga Class", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-2-7", text: "Annual Health Checkup", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-2-8", text: "Reduce Screen Time Before Bed", completed: false, description: "", dueDate: null, subGoals: [] },
          ],
        },
        {
          id: "goal-3",
          text: "Mental Wellness",
          completed: false,
          description: "Cultivate peace and emotional balance",
          dueDate: new Date("2025-12-31"),
          subGoals: [
            { id: "goal-3-1", text: "Meditate Daily (10 min)", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-3-2", text: "Journal 3x per Week", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-3-3", text: "Practice Gratitude", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-3-4", text: "Read Mental Health Books", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-3-5", text: "Limit Social Media to 30 min/day", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-3-6", text: "Connect with Friends Weekly", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-3-7", text: "Take Mental Health Days", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-3-8", text: "Learn Stress Management", completed: true, description: "", dueDate: null, subGoals: [] },
          ],
        },
        {
          id: "goal-4",
          text: "Learning & Growth",
          completed: false,
          description: "Expand knowledge and skills",
          dueDate: new Date("2025-12-31"),
          subGoals: [
            { id: "goal-4-1", text: "Read 24 Books This Year", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-4-2", text: "Learn a New Language", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-4-3", text: "Take Online Courses", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-4-4", text: "Attend Workshops", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-4-5", text: "Learn Musical Instrument", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-4-6", text: "Master a New Skill", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-4-7", text: "Listen to Educational Podcasts", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-4-8", text: "Join Learning Community", completed: false, description: "", dueDate: null, subGoals: [] },
          ],
        },
        null, // Center position (goal-5 is skipped)
        {
          id: "goal-6",
          text: "Financial Stability",
          completed: false,
          description: "Build secure financial future",
          dueDate: new Date("2025-12-31"),
          subGoals: [
            { id: "goal-6-1", text: "Create Monthly Budget", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-6-2", text: "Save 20% of Income", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-6-3", text: "Start Emergency Fund", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-6-4", text: "Learn About Investing", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-6-5", text: "Reduce Unnecessary Spending", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-6-6", text: "Track Expenses Daily", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-6-7", text: "Pay Off Student Loans", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-6-8", text: "Build Passive Income Stream", completed: false, description: "", dueDate: null, subGoals: [] },
          ],
        },
        {
          id: "goal-7",
          text: "Relationships",
          completed: false,
          description: "Nurture meaningful connections",
          dueDate: new Date("2025-12-31"),
          subGoals: [
            { id: "goal-7-1", text: "Call Parents Weekly", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-7-2", text: "Plan Monthly Friend Gatherings", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-7-3", text: "Write Thank You Notes", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-7-4", text: "Be Present in Conversations", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-7-5", text: "Celebrate Others' Achievements", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-7-6", text: "Resolve Conflicts Peacefully", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-7-7", text: "Join Social Groups", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-7-8", text: "Practice Active Listening", completed: true, description: "", dueDate: null, subGoals: [] },
          ],
        },
        {
          id: "goal-8",
          text: "Hobbies & Passions",
          completed: false,
          description: "Pursue creative and fun activities",
          dueDate: new Date("2025-12-31"),
          subGoals: [
            { id: "goal-8-1", text: "Photography Project", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-8-2", text: "Learn Cooking New Cuisines", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-8-3", text: "Start Gardening", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-8-4", text: "Create Art Weekly", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-8-5", text: "Hiking Adventures", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-8-6", text: "Board Game Nights", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-8-7", text: "Write Creative Stories", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-8-8", text: "Explore New Hobbies", completed: false, description: "", dueDate: null, subGoals: [] },
          ],
        },
        {
          id: "goal-9",
          text: "Contribution & Impact",
          completed: false,
          description: "Give back to community",
          dueDate: new Date("2025-12-31"),
          subGoals: [
            { id: "goal-9-1", text: "Volunteer Monthly", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-9-2", text: "Mentor Junior Students", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-9-3", text: "Donate to Charity", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-9-4", text: "Organize Community Event", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-9-5", text: "Share Knowledge Through Teaching", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-9-6", text: "Environmental Initiatives", completed: false, description: "", dueDate: null, subGoals: [] },
            { id: "goal-9-7", text: "Support Local Businesses", completed: true, description: "", dueDate: null, subGoals: [] },
            { id: "goal-9-8", text: "Random Acts of Kindness", completed: true, description: "", dueDate: null, subGoals: [] },
          ],
        },
      ],
    };

    const goal = new Goal({
      userId,
      mandalartData,
    });

    await goal.save();
    console.log("✅ Demo goals created successfully");
    return goal;
  } catch (error) {
    console.error("❌ Error creating demo goals:", error);
    throw error;
  }
};

// Create journal entries for demo with varied content
const createDemoJournalEntries = async (userId, goalId) => {
  try {
    const existingJournals = await JournalEntry.find({ userId });
    if (existingJournals.length > 0) {
      console.log(`✅ ${existingJournals.length} journal entries already exist for demo user`);
      return;
    }

    const now = new Date();
    const journalTemplates = [
      {
        title: "Morning Reflection - Starting Strong",
        content: "Woke up feeling energized today! Started with a 30-minute meditation session followed by a healthy breakfast. I'm excited to tackle my React project and continue learning about state management. Setting clear goals for the day helps me stay focused and productive.",
        mood: "happy",
        tags: ["morning", "meditation", "goals", "productivity"],
        relatedGoalIds: ["goal-3", "goal-1-1"],
        daysAgo: 2
      },
      {
        title: "Workout Achievement Unlocked!",
        content: "Completed my 4th workout this week! My body is getting stronger and I can feel the difference. The endorphins are real - feeling so accomplished right now. Physical health really does impact mental clarity. Tomorrow is yoga class and I'm looking forward to it.",
        mood: "excited",
        tags: ["exercise", "health", "achievement"],
        relatedGoalIds: ["goal-2", "goal-2-1"],
        daysAgo: 3
      },
      {
        title: "Tech Conference Insights",
        content: "Attended an amazing tech conference today! Learned so much about modern web architecture and connected with incredible developers. Got inspired to contribute to open source projects. Networking is challenging but rewarding. Made 3 new professional connections!",
        mood: "excited",
        tags: ["conference", "networking", "learning"],
        relatedGoalIds: ["goal-1", "goal-1-4"],
        daysAgo: 5
      },
      {
        title: "Quiet Evening of Gratitude",
        content: "Taking a moment to appreciate the little things. Grateful for my health, supportive friends, and the opportunity to learn new skills every day. Sometimes we need to slow down and recognize how far we've come. Journaling like this helps me stay grounded.",
        mood: "grateful",
        tags: ["gratitude", "reflection", "mindfulness"],
        relatedGoalIds: ["goal-3", "goal-3-3"],
        daysAgo: 7
      },
      {
        title: "Portfolio Website Launch!",
        content: "Finally launched my portfolio website today! 🚀 It took weeks of work but I'm so proud of the result. Used React, Framer Motion for animations, and deployed on Vercel. Now potential employers can see my projects. This is a major milestone in my career journey!",
        mood: "excited",
        tags: ["milestone", "portfolio", "achievement", "career"],
        relatedGoalIds: ["goal-1", "goal-1-2"],
        daysAgo: 10
      },
      {
        title: "Reading and Reflection",
        content: "Spent the afternoon reading 'Atomic Habits'. The concept of tiny improvements resonating with me. I realize I need to focus on building better systems rather than just setting goals. Started implementing a habit tracker for my daily routines.",
        mood: "reflective",
        tags: ["reading", "habits", "growth"],
        relatedGoalIds: ["goal-4", "goal-4-1"],
        daysAgo: 12
      },
      {
        title: "Challenging Day, But Persevered",
        content: "Today was tough. Struggled with a complex coding problem for hours. Felt frustrated and almost gave up. But then I took a break, went for a walk, and came back with fresh perspective. Finally solved it! Reminded me that challenges are opportunities for growth.",
        mood: "neutral",
        tags: ["challenge", "coding", "perseverance"],
        relatedGoalIds: ["goal-1", "goal-1-7"],
        daysAgo: 14
      },
      {
        title: "Family Time Matters",
        content: "Had a long video call with my parents today. We don't talk enough and I need to change that. They're so supportive of my goals and dreams. Family connections ground me and remind me of what truly matters beyond work and achievements.",
        mood: "grateful",
        tags: ["family", "relationships", "balance"],
        relatedGoalIds: ["goal-7", "goal-7-1"],
        daysAgo: 16
      },
      {
        title: "Meal Prep Sunday Success",
        content: "Spent the morning meal prepping for the week! Cooked 5 different healthy meals and portioned everything out. This habit saves so much time and helps me eat better. Learning to cook has been surprisingly enjoyable and therapeutic.",
        mood: "calm",
        tags: ["cooking", "health", "preparation"],
        relatedGoalIds: ["goal-2", "goal-2-5"],
        daysAgo: 18
      },
      {
        title: "Technical Blog Post Published!",
        content: "Published my first technical blog post about React hooks! Wrote 2,000 words explaining useState and useEffect with practical examples. Sharing knowledge feels amazing. Already got positive feedback from the developer community. This motivates me to write more!",
        mood: "excited",
        tags: ["writing", "blogging", "sharing", "react"],
        relatedGoalIds: ["goal-1", "goal-1-6"],
        daysAgo: 20
      },
      {
        title: "Meditation Progress",
        content: "Completed my 30th day of daily meditation! 🧘‍♂️ The consistency is building up. I notice I'm more patient, focused, and present in conversations. My stress levels are noticeably lower. This practice is transforming my mental health.",
        mood: "calm",
        tags: ["meditation", "mindfulness", "consistency"],
        relatedGoalIds: ["goal-3", "goal-3-1"],
        daysAgo: 21
      },
      {
        title: "Weekend Hiking Adventure",
        content: "Explored a new hiking trail today! The nature, fresh air, and physical challenge were exactly what I needed. Disconnected from technology for 4 hours and it felt liberating. These outdoor experiences recharge my creativity and energy.",
        mood: "happy",
        tags: ["hiking", "nature", "adventure", "outdoor"],
        relatedGoalIds: ["goal-8", "goal-8-5"],
        daysAgo: 23
      },
      {
        title: "Financial Planning Session",
        content: "Reviewed my finances and created a comprehensive budget plan. Identified areas where I can save more. Set up automatic transfers to my emergency fund. Financial stability reduces stress and gives me freedom to pursue my goals without worry.",
        mood: "neutral",
        tags: ["finance", "planning", "stability"],
        relatedGoalIds: ["goal-6", "goal-6-1"],
        daysAgo: 25
      },
      {
        title: "Mentoring Session Reflection",
        content: "Met with my mentee today and helped them debug a tricky problem. Teaching reinforces my own learning and seeing them succeed is incredibly rewarding. Giving back to the community through mentorship adds so much meaning to my journey.",
        mood: "grateful",
        tags: ["mentoring", "teaching", "community"],
        relatedGoalIds: ["goal-9", "goal-9-2"],
        daysAgo: 27
      },
      {
        title: "Evening Wind Down Routine",
        content: "Created a better evening routine: no screens after 9pm, reading for 30 minutes, then journaling. Already noticing better sleep quality. Small changes in daily habits compound over time. Excited to see the long-term benefits!",
        mood: "calm",
        tags: ["routine", "sleep", "habits"],
        relatedGoalIds: ["goal-2", "goal-2-8"],
        daysAgo: 29
      },
    ];

    const journalEntries = journalTemplates.map((template) => {
      const entryDate = new Date(now.getTime() - template.daysAgo * 24 * 60 * 60 * 1000);
      return {
        userId,
        title: template.title,
        content: template.content,
        mood: template.mood,
        tags: template.tags,
        date: entryDate,
        relatedGoalId: goalId,
        relatedGoalType: "main",
      };
    });

    await JournalEntry.insertMany(journalEntries);
    console.log(`✅ Created ${journalEntries.length} demo journal entries`);
  } catch (error) {
    console.error("❌ Error creating demo journal entries:", error);
    throw error;
  }
};

// Create progress entries for demo
const createDemoProgressEntries = async (userId, goalId) => {
  try {
    const existingProgress = await GoalProgress.find({ userId, goalId });
    if (existingProgress.length > 0) {
      console.log(`✅ ${existingProgress.length} progress entries already exist for demo user`);
      return;
    }

    const progressEntries = [];
    const now = new Date();
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const progressTypes = ["checkin", "milestone", "completion", "reflection"];
    const moods = ["happy", "excited", "calm", "neutral", "grateful", "reflective"];
    const difficulties = ["easy", "medium", "hard"];

    // Create 40 progress entries over 2 months
    for (let i = 0; i < 40; i++) {
      const randomDays = Math.floor(Math.random() * 60);
      const entryDate = new Date(twoMonthsAgo.getTime() + randomDays * 24 * 60 * 60 * 1000);

      const isMilestone = Math.random() > 0.85; // 15% chance of milestone
      const progressType = isMilestone ? "milestone" : progressTypes[Math.floor(Math.random() * progressTypes.length)];

      const completionPercentage = isMilestone
        ? [25, 50, 75][Math.floor(Math.random() * 3)]
        : Math.floor(Math.random() * 25) + 5;

      progressEntries.push({
        userId,
        goalId,
        subGoalId: Math.random() > 0.3 ? `goal-${Math.floor(Math.random() * 9) + 1}` : null,
        progressType,
        title: isMilestone
          ? `${completionPercentage}% Milestone Achieved!`
          : `Progress Check-in - Day ${i + 1}`,
        description: isMilestone
          ? `Reached ${completionPercentage}% completion! This milestone represents significant progress on my personal growth journey.`
          : `Consistent progress today across multiple goals. Staying focused and committed to holistic growth.`,
        date: entryDate,
        mood: moods[Math.floor(Math.random() * moods.length)],
        tags: ["progress", "growth", "consistency"].slice(0, Math.floor(Math.random() * 3) + 1),
        difficulty: difficulties[Math.floor(Math.random() * difficulties.length)],
        timeSpent: Math.floor(Math.random() * 120) + 30, // 30-150 minutes
        notes: "Making steady progress. Each day builds on the previous one.",
        isMilestone,
        milestoneTitle: isMilestone ? `${completionPercentage}% Complete` : undefined,
        milestoneCategory: isMilestone
          ? completionPercentage === 25 ? "quarter"
          : completionPercentage === 50 ? "half"
          : completionPercentage === 75 ? "three-quarter"
          : "custom"
          : undefined,
        completionPercentage,
        celebrationEmoji: isMilestone ? ["🎉", "🏆", "🎯", "✨", "🚀"][Math.floor(Math.random() * 5)] : undefined,
      });
    }

    await GoalProgress.insertMany(progressEntries);
    console.log(`✅ Created ${progressEntries.length} demo progress entries`);
  } catch (error) {
    console.error("❌ Error creating demo progress entries:", error);
    throw error;
  }
};

// Main seed function for demo user
const seedDemoUser = async () => {
  try {
    await connectDB();

    console.log("\n🌱 Starting demo user seeding...\n");

    const user = await createDemoUser();
    const goal = await createDemoGoals(user._id);
    await createDemoJournalEntries(user._id, goal.mandalartData.id);
    await createDemoProgressEntries(user._id, goal.mandalartData.id);

    console.log("\n✅ Demo user seeding completed successfully!");
    console.log("\n📝 Demo Account Credentials:");
    console.log("   Email: demo@reflecta.com");
    console.log("   Password: demo123");
    console.log("\n🎯 Demo user has rich data for landing page showcase!\n");
    console.log("📊 Data Summary:");
    console.log("   - 1 Mandalart goal with 9 sub-goals (72 tasks total)");
    console.log("   - 15 diverse journal entries");
    console.log("   - 40 progress tracking entries");
    console.log("   - 6 default AI personas (created separately)\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Demo user seeding failed:", error);
    process.exit(1);
  }
};

// Run the seed script
seedDemoUser();
