require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Goal = require('./models/Goal');
const JournalEntry = require('./models/JournalEntry');

async function checkRelatedGoalIds() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Find demo user
    const demoUser = await User.findOne({ email: 'demo@reflecta.com' });
    if (!demoUser) {
      console.log('❌ Demo user not found!');
      process.exit(1);
    }

    // Get demo user's goal
    const goal = await Goal.findOne({ userId: demoUser._id });
    if (!goal) {
      console.log('❌ No goals found for demo user!');
      process.exit(1);
    }

    const mainGoalMandalartId = goal.mandalartData.id;
    console.log(`Main Goal: "${goal.mandalartData.text}"`);
    console.log(`Main Goal Mandalart ID: ${mainGoalMandalartId}\n`);

    // Get sub-goal IDs
    const subGoalIds = goal.mandalartData.subGoals
      ? goal.mandalartData.subGoals.filter(sg => sg && sg.id).map(sg => sg.id)
      : [];

    console.log(`Sub-Goals (${subGoalIds.length}):`);
    goal.mandalartData.subGoals.forEach((sg, idx) => {
      if (sg && sg.id) {
        console.log(`  ${idx + 1}. ${sg.id} - "${sg.text}"`);
      }
    });
    console.log();

    // Get all journal entries
    const journals = await JournalEntry.find({ userId: demoUser._id }).sort({ date: -1 });
    console.log(`Total journal entries: ${journals.length}\n`);

    // Group by relatedGoalId
    const journalsByGoalId = {};
    journals.forEach(j => {
      const goalId = j.relatedGoalId;
      if (!journalsByGoalId[goalId]) {
        journalsByGoalId[goalId] = [];
      }
      journalsByGoalId[goalId].push(j);
    });

    console.log('='.repeat(60));
    console.log('JOURNAL ENTRIES BY RELATED GOAL ID');
    console.log('='.repeat(60));

    Object.entries(journalsByGoalId)
      .sort((a, b) => b[1].length - a[1].length)
      .forEach(([goalId, entries]) => {
        console.log(`\n${goalId}: ${entries.length} entries`);

        // Check if it's main goal
        if (goalId === mainGoalMandalartId) {
          console.log('  → MAIN GOAL');
        }

        // Check if it's a sub-goal
        if (subGoalIds.includes(goalId)) {
          const subGoal = goal.mandalartData.subGoals.find(sg => sg.id === goalId);
          console.log(`  → SUB-GOAL: "${subGoal?.text}"`);
        }

        // Check if it's a sub-sub-goal (task)
        let foundAsTask = false;
        goal.mandalartData.subGoals.forEach(sg => {
          if (sg && sg.subGoals) {
            const task = sg.subGoals.find(ssg => ssg && ssg.id === goalId);
            if (task) {
              console.log(`  → TASK under "${sg.text}": "${task.text}"`);
              foundAsTask = true;
            }
          }
        });

        if (!foundAsTask && goalId !== mainGoalMandalartId && !subGoalIds.includes(goalId)) {
          console.log('  → UNKNOWN/ORPHANED');
        }

        // Show sample entry
        console.log(`  Latest: ${entries[0].date.toISOString().split('T')[0]} - "${entries[0].content.substring(0, 60)}..."`);
      });

    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));

    const mainGoalEntries = journalsByGoalId[mainGoalMandalartId] || [];
    console.log(`Main goal entries: ${mainGoalEntries.length}`);

    const subGoalEntries = subGoalIds.reduce((sum, id) => {
      return sum + (journalsByGoalId[id] || []).length;
    }, 0);
    console.log(`Sub-goal entries (direct): ${subGoalEntries}`);

    console.log(`Other/Task entries: ${journals.length - mainGoalEntries.length - subGoalEntries}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

checkRelatedGoalIds();
