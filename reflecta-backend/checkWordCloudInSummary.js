require('dotenv').config();
const mongoose = require('mongoose');
const GoalSummary = require('./models/GoalSummary');
const User = require('./models/User');

async function checkWordCloud() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected\n');

    const demoUser = await User.findOne({ email: 'demo@reflecta.com' });
    const childrenSummaries = await GoalSummary.find({
      userId: demoUser._id,
      summaryType: 'children'
    }).lean();

    const mainSummary = childrenSummaries[0];
    if (mainSummary && mainSummary.metadata && mainSummary.metadata.childGoalsSummaries) {
      console.log('Checking first child summary for word cloud data:\n');
      const firstChild = mainSummary.metadata.childGoalsSummaries[0];
      console.log('goalId:', firstChild.goalId);
      console.log('goalText:', firstChild.goalText);
      console.log('Has wordCloud:', !!firstChild.wordCloud);
      console.log('Has moodDistribution:', !!firstChild.moodDistribution);
      console.log('Has dateRange:', !!firstChild.dateRange);
      console.log('\nFull structure keys:', Object.keys(firstChild));
      
      if (firstChild.wordCloud) {
        console.log('\nWord cloud sample:', firstChild.wordCloud.slice(0, 3));
      }
    }

    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkWordCloud();
