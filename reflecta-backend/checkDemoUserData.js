require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Goal = require('./models/Goal');
const JournalEntry = require('./models/JournalEntry');
const GoalSummary = require('./models/GoalSummary');
const GoalProgress = require('./models/GoalProgress');

async function checkDemoUserData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // 1. Check Demo User
    console.log('='.repeat(60));
    console.log('1. CHECKING DEMO USER');
    console.log('='.repeat(60));

    const demoUser = await User.findOne({ email: 'demo@reflecta.com' });
    if (!demoUser) {
      console.log('❌ Demo user not found!');
      process.exit(1);
    }
    console.log(`✓ Demo user found: ${demoUser.email}`);
    console.log(`  User ID: ${demoUser._id}`);
    console.log(`  Name: ${demoUser.name}`);
    console.log(`  Role: ${demoUser.role}\n`);

    // 2. Check Goals
    console.log('='.repeat(60));
    console.log('2. CHECKING GOALS');
    console.log('='.repeat(60));

    const goals = await Goal.find({ userId: demoUser._id });
    console.log(`✓ Found ${goals.length} goal(s)\n`);

    if (goals.length === 0) {
      console.log('❌ No goals found for demo user!');
      process.exit(1);
    }

    goals.forEach((goal, idx) => {
      console.log(`Goal ${idx + 1}:`);
      console.log(`  Goal Document _id: ${goal._id}`);
      console.log(`  Mandalart ID: ${goal.mandalartData?.id}`);
      console.log(`  Main Goal Text: ${goal.mandalartData?.text}`);
      console.log(`  Sub-Goals Count: ${goal.mandalartData?.subGoals?.length || 0}`);

      if (goal.mandalartData?.subGoals) {
        const totalTasks = goal.mandalartData.subGoals.reduce((sum, sg) =>
          sum + (sg?.subGoals?.length || 0), 0
        );
        console.log(`  Total Tasks: ${totalTasks}`);
      }
      console.log();
    });

    const mainGoal = goals[0];
    const mainGoalDocId = mainGoal._id.toString();
    const mainGoalMandalartId = mainGoal.mandalartData?.id;

    // 3. Check Journal Entries
    console.log('='.repeat(60));
    console.log('3. CHECKING JOURNAL ENTRIES');
    console.log('='.repeat(60));

    const journals = await JournalEntry.find({ userId: demoUser._id }).sort({ date: -1 });
    console.log(`✓ Found ${journals.length} journal entries\n`);

    if (journals.length > 0) {
      console.log('Sample journal entries:');
      journals.slice(0, 3).forEach((j, idx) => {
        console.log(`  ${idx + 1}. ${j.title}`);
        console.log(`     Date: ${j.date.toISOString().split('T')[0]}`);
        console.log(`     Mood: ${j.mood}`);
        console.log(`     Related Goal ID: ${j.relatedGoalId || 'NONE'}`);
        console.log(`     Related Goal Type: ${j.relatedGoalType || 'NONE'}`);
      });
      console.log();

      // Check ID mapping
      console.log('ID Mapping Analysis:');
      const uniqueGoalIds = [...new Set(journals.map(j => j.relatedGoalId).filter(Boolean))];
      console.log(`  Unique relatedGoalIds: ${uniqueGoalIds.length}`);
      uniqueGoalIds.forEach(id => {
        const count = journals.filter(j => j.relatedGoalId === id).length;
        const matchesDocId = id === mainGoalDocId;
        const matchesMandalartId = id === mainGoalMandalartId;
        console.log(`    "${id}"`);
        console.log(`      Count: ${count} journals`);
        console.log(`      Matches Goal Document _id: ${matchesDocId ? '✓' : '✗'}`);
        console.log(`      Matches Mandalart ID: ${matchesMandalartId ? '✓' : '✗'}`);
      });
      console.log();
    } else {
      console.log('⚠️  No journal entries found!\n');
    }

    // 4. Check Goal Summaries
    console.log('='.repeat(60));
    console.log('4. CHECKING GOAL SUMMARIES (AI CACHE)');
    console.log('='.repeat(60));

    const summaries = await GoalSummary.find({ userId: demoUser._id });
    console.log(`✓ Found ${summaries.length} cached summaries\n`);

    if (summaries.length > 0) {
      summaries.forEach(s => {
        console.log(`Summary Type: ${s.summaryType}`);
        console.log(`  Goal ID: ${s.goalId}`);
        console.log(`  Created: ${s.createdAt}`);
        console.log(`  Expires: ${s.expiresAt || 'NEVER (permanent)'}`);
        console.log(`  Entry Count: ${s.metadata?.entryCount || s.entryCount || 'N/A'}`);
        console.log(`  Summary Preview: ${s.summary?.substring(0, 100)}...`);
        console.log();
      });
    } else {
      console.log('⚠️  No cached summaries found!');
      console.log('   Dashboard will call OpenAI API on first visit.\n');
    }

    // 5. Check Goal Progress
    console.log('='.repeat(60));
    console.log('5. CHECKING GOAL PROGRESS');
    console.log('='.repeat(60));

    const progress = await GoalProgress.find({ userId: demoUser._id });
    console.log(`✓ Found ${progress.length} progress entries\n`);

    if (progress.length > 0) {
      const moodCounts = {};
      progress.forEach(p => {
        moodCounts[p.mood] = (moodCounts[p.mood] || 0) + 1;
      });
      console.log('Mood distribution:');
      Object.entries(moodCounts).forEach(([mood, count]) => {
        console.log(`  ${mood}: ${count}`);
      });
      console.log();
    }

    // 6. Summary and Recommendations
    console.log('='.repeat(60));
    console.log('6. SUMMARY & RECOMMENDATIONS');
    console.log('='.repeat(60));

    const issues = [];
    const warnings = [];

    if (goals.length === 0) {
      issues.push('No goals found');
    }
    if (journals.length === 0) {
      issues.push('No journal entries found');
    }
    if (summaries.length === 0) {
      warnings.push('No cached AI summaries - will generate on first Dashboard visit');
    }
    if (progress.length === 0) {
      warnings.push('No progress entries - Emotional Journey may be empty');
    }

    // Check if any summaries will expire soon
    const now = new Date();
    const expiringSoon = summaries.filter(s => {
      if (!s.expiresAt) return false;
      const daysUntilExpiry = (s.expiresAt - now) / (1000 * 60 * 60 * 24);
      return daysUntilExpiry < 1;
    });
    if (expiringSoon.length > 0) {
      warnings.push(`${expiringSoon.length} summaries expire within 24 hours`);
    }

    console.log('\n✓ Data Check Complete!\n');

    if (issues.length > 0) {
      console.log('❌ CRITICAL ISSUES:');
      issues.forEach(issue => console.log(`   - ${issue}`));
      console.log();
    }

    if (warnings.length > 0) {
      console.log('⚠️  WARNINGS:');
      warnings.forEach(warning => console.log(`   - ${warning}`));
      console.log();
    }

    if (issues.length === 0 && warnings.length === 0) {
      console.log('✅ All data looks good! Dashboard should work perfectly.\n');
    }

    console.log('Next Steps:');
    if (summaries.length === 0) {
      console.log('  1. Run: node seedDemoSummaries.js');
      console.log('     (Generates permanent AI summaries for demo user)');
    }
    if (expiringSoon.length > 0) {
      console.log('  2. Run: node seedDemoSummaries.js --regenerate');
      console.log('     (Regenerates expiring summaries)');
    }
    console.log();

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Disconnected from MongoDB');
  }
}

// Run the check
checkDemoUserData();
