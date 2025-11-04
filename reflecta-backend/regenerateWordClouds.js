require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Goal = require('./models/Goal');
const JournalEntry = require('./models/JournalEntry');
const GoalSummary = require('./models/GoalSummary');

async function regenerateWordClouds() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    const demoUser = await User.findOne({ email: 'demo@reflecta.com' });
    if (!demoUser) {
      console.log('❌ Demo user not found!');
      process.exit(1);
    }

    const goal = await Goal.findOne({ userId: demoUser._id });
    if (!goal) {
      console.log('❌ No goals found for demo user!');
      process.exit(1);
    }

    const goalId = goal._id;
    const mainGoalMandalartId = goal.mandalartData.id;

    console.log('Deleting existing word cloud caches...');
    const deleteResult = await GoalSummary.deleteMany({
      userId: demoUser._id,
      goalId: goalId,
      summaryType: 'wordcloud'
    });
    console.log(`  ✓ Deleted ${deleteResult.deletedCount} old word cloud caches\n`);

    // Enhanced stop words
    const stopWords = new Set([
      "that", "this", "with", "from", "have", "been", "were", "your",
      "will", "would", "could", "should", "about", "there", "their",
      "which", "when", "where", "what", "more", "some", "into", "just",
      "only", "very", "much", "than", "then", "also", "well", "back",
      "today", "yesterday", "tomorrow", "week", "month", "year", "time",
      "date", "morning", "afternoon", "evening", "night", "daily", "weekly",
      "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
      "feel", "felt", "feeling", "feelings", "think", "thought", "thinking",
      "make", "made", "making", "want", "wanted", "need", "needed",
      "going", "went", "come", "came", "know", "knew", "thing", "things",
      "really", "quite", "pretty", "still", "always", "never", "often",
      "they", "them", "their", "theirs", "being", "having", "doing",
      "getting", "giving", "taking", "looking", "trying", "working",
    ]);

    // Generate word cloud for "all" time range
    console.log('Generating "All Time" word cloud...');
    const allJournals = await JournalEntry.find({
      userId: demoUser._id,
      relatedGoalId: mainGoalMandalartId,
    }).sort({ date: -1 });

    console.log(`  Found ${allJournals.length} journals for all time`);

    const allWordFreq = {};
    allJournals.forEach(j => {
      const words = `${j.title || ''} ${j.content || ''}`.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
      words.forEach(word => {
        if (!stopWords.has(word)) {
          allWordFreq[word] = (allWordFreq[word] || 0) + 1;
        }
      });
    });

    const allWordCloud = Object.entries(allWordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([text, value]) => ({ text, value }));

    await GoalSummary.create({
      userId: demoUser._id,
      goalId: goalId,
      summaryType: 'wordcloud',
      summary: 'Word cloud for all timeRange',
      metadata: {
        timeRange: 'all',
        wordCloudData: {
          current: allWordCloud,
          past: [],
        }
      },
      // No expiresAt - permanent for demo user
    });

    console.log(`  ✓ All time word cloud: ${allWordCloud.length} unique words`);
    console.log(`     Top 5: ${allWordCloud.slice(0, 5).map(w => `${w.text}(${w.value})`).join(', ')}\n`);

    // Generate word cloud for "recent" time range (last 3 months)
    console.log('Generating "Last 3 Months" word cloud...');
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const recentJournals = await JournalEntry.find({
      userId: demoUser._id,
      relatedGoalId: mainGoalMandalartId,
      date: { $gte: threeMonthsAgo },
    }).sort({ date: -1 });

    console.log(`  Found ${recentJournals.length} journals for last 3 months`);

    const recentWordFreq = {};
    recentJournals.forEach(j => {
      const words = `${j.title || ''} ${j.content || ''}`.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
      words.forEach(word => {
        if (!stopWords.has(word)) {
          recentWordFreq[word] = (recentWordFreq[word] || 0) + 1;
        }
      });
    });

    const recentWordCloud = Object.entries(recentWordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([text, value]) => ({ text, value }));

    await GoalSummary.create({
      userId: demoUser._id,
      goalId: goalId,
      summaryType: 'wordcloud',
      summary: 'Word cloud for recent timeRange',
      metadata: {
        timeRange: 'recent',
        wordCloudData: {
          current: recentWordCloud,
          past: [],
        }
      },
      // No expiresAt - permanent for demo user
    });

    console.log(`  ✓ Recent word cloud: ${recentWordCloud.length} unique words`);
    console.log(`     Top 5: ${recentWordCloud.slice(0, 5).map(w => `${w.text}(${w.value})`).join(', ')}\n`);

    // Compare the two word clouds
    console.log('='.repeat(60));
    console.log('COMPARISON: All Time vs Last 3 Months');
    console.log('='.repeat(60));

    const allTimeWords = new Set(allWordCloud.map(w => w.text));
    const recentWords = new Set(recentWordCloud.map(w => w.text));

    const uniqueToAllTime = [...allTimeWords].filter(w => !recentWords.has(w)).slice(0, 10);
    const uniqueToRecent = [...recentWords].filter(w => !allTimeWords.has(w)).slice(0, 10);

    console.log('\nWords unique to "All Time" (appear in old journals):');
    console.log('  ', uniqueToAllTime.join(', '));

    console.log('\nWords unique to "Last 3 Months" (appear in recent journals):');
    console.log('  ', uniqueToRecent.join(', '));

    console.log('\n✅ Word cloud caches regenerated successfully!');
    console.log('   Now "All Time" and "Last 3 Months" will show different words\n');

    await mongoose.connection.close();
    console.log('✓ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

regenerateWordClouds();
