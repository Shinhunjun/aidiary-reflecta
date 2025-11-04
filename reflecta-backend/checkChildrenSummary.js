require('dotenv').config();
const mongoose = require('mongoose');
const GoalSummary = require('./models/GoalSummary');
const User = require('./models/User');

async function checkChildrenSummary() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected\n');

    // Find demo user's children summaries
    const demoUser = await User.findOne({ email: 'demo@reflecta.com' });

    const childrenSummaries = await GoalSummary.find({
      userId: demoUser._id,
      summaryType: 'children'
    }).lean();

    console.log(`Found ${childrenSummaries.length} children summaries:\n`);

    childrenSummaries.forEach((cs, idx) => {
      console.log(`${idx + 1}. goalId: ${cs.goalId}`);
      console.log(`   summary text exists: ${!!cs.summary}`);
      console.log(`   summary text preview: ${cs.summary?.substring(0, 100)}...`);
      console.log(`   metadata exists: ${!!cs.metadata}`);
      console.log(`   childGoalsSummaries exists: ${!!cs.metadata?.childGoalsSummaries}`);
      console.log(`   childGoalsSummaries count: ${cs.metadata?.childGoalsSummaries?.length || 0}`);

      if (cs.metadata?.childGoalsSummaries && cs.metadata.childGoalsSummaries.length > 0) {
        console.log(`\n   First 2 sub-goal summaries:`);
        cs.metadata.childGoalsSummaries.slice(0, 2).forEach((child, i) => {
          console.log(`   ${i + 1}. goalId: ${child.goalId}`);
          console.log(`      goalText: ${child.goalText}`);
          console.log(`      summary: ${child.summary?.substring(0, 80)}...`);
          console.log(`      entryCount: ${child.entryCount}`);
        });
      }
      console.log();
    });

    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkChildrenSummary();
