require('dotenv').config();
const mongoose = require('mongoose');
const GoalSummary = require('./models/GoalSummary');
const User = require('./models/User');

async function checkWordCloud() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected\n');

    // Find demo user's wordcloud summaries
    const demoUser = await User.findOne({ email: 'demo@reflecta.com' });

    const wordclouds = await GoalSummary.find({
      userId: demoUser._id,
      summaryType: 'wordcloud'
    }).lean();

    console.log(`Found ${wordclouds.length} wordcloud summaries:\n`);

    wordclouds.forEach((wc, idx) => {
      console.log(`${idx + 1}. goalId: ${wc.goalId}`);
      console.log(`   timeRange: ${wc.metadata?.timeRange}`);
      console.log(`   wordCloudData exists: ${!!wc.metadata?.wordCloudData}`);
      console.log(`   current words count: ${wc.metadata?.wordCloudData?.current?.length || 0}`);
      console.log(`   past words count: ${wc.metadata?.wordCloudData?.past?.length || 0}`);
      if (wc.metadata?.wordCloudData?.current?.length > 0) {
        console.log(`   Sample words: ${wc.metadata.wordCloudData.current.slice(0, 5).map(w => w.text).join(', ')}`);
      }
      console.log();
    });

    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkWordCloud();
