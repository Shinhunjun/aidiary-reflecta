require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const User = require('./models/User');
const Goal = require('./models/Goal');
const JournalEntry = require('./models/JournalEntry');
const GoalSummary = require('./models/GoalSummary');

async function seedDemoSummaries() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Find demo user
    const demoUser = await User.findOne({ email: 'demo@reflecta.com' });
    if (!demoUser) {
      console.log('❌ Demo user not found!');
      process.exit(1);
    }
    console.log(`✓ Found demo user: ${demoUser.email}`);
    console.log(`  User ID: ${demoUser._id}\n`);

    // Get demo user's main goal
    const goal = await Goal.findOne({ userId: demoUser._id });
    if (!goal) {
      console.log('❌ No goals found for demo user!');
      process.exit(1);
    }

    const mainGoalDocId = goal._id.toString(); // MongoDB ObjectId (used by Dashboard)
    const mainGoalMandalartId = goal.mandalartData.id; // Mandalart ID (e.g., "main-center")
    const mainGoalText = goal.mandalartData.text;
    console.log(`✓ Found goal: "${mainGoalText}"`);
    console.log(`  Goal Document _id: ${mainGoalDocId}`);
    console.log(`  Mandalart ID: ${mainGoalMandalartId}\n`);

    // Check if summaries already exist
    const existingSummaries = await GoalSummary.find({
      userId: demoUser._id,
      goalId: mainGoalDocId
    });

    if (existingSummaries.length > 0) {
      console.log(`⚠️  Found ${existingSummaries.length} existing summaries for this goal`);

      // Check if --regenerate flag is passed
      const shouldRegenerate = process.argv.includes('--regenerate');
      if (shouldRegenerate) {
        console.log('   --regenerate flag detected, deleting existing summaries...');
        await GoalSummary.deleteMany({
          userId: demoUser._id,
          goalId: mainGoalDocId
        });
        console.log('   ✓ Deleted existing summaries\n');
      } else {
        console.log('   Use --regenerate flag to delete and recreate summaries');
        console.log('   Exiting without changes.\n');
        process.exit(0);
      }
    }

    console.log('='.repeat(60));
    console.log('GENERATING AI SUMMARIES (This may take 1-2 minutes)');
    console.log('='.repeat(60));
    console.log();

    // 1. Generate Journal Summary
    console.log('1. Generating Journal Summary...');
    const journals = await JournalEntry.find({
      userId: demoUser._id,
      relatedGoalId: mainGoalMandalartId,
    }).sort({ date: -1 });

    console.log(`   Found ${journals.length} journal entries`);

    if (journals.length > 0) {
      // Calculate metadata
      const moodDistribution = journals.reduce((acc, j) => {
        acc[j.mood] = (acc[j.mood] || 0) + 1;
        return acc;
      }, {});

      const latestEntry = journals[0];
      const oldestEntry = journals[journals.length - 1];
      const dateRange = {
        start: oldestEntry.date,
        end: latestEntry.date,
      };

      // Word frequency for word cloud
      const stopWords = new Set([
        "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
        "of", "with", "by", "from", "as", "is", "was", "are", "were", "been",
        "be", "have", "has", "had", "do", "does", "did", "will", "would",
        "should", "could", "may", "might", "must", "can", "i", "you", "he",
        "she", "it", "we", "they", "my", "your", "his", "her", "its", "our",
        "their", "this", "that", "these", "those",
      ]);

      const wordFreq = {};
      journals.forEach(j => {
        const words = j.content.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
        words.forEach(word => {
          if (!stopWords.has(word)) {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
          }
        });
      });

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
                content: `You are a reflective journal analyst. Summarize the user's journal entries related to their goal "${mainGoalText}". Focus on:
1. Overall progress and journey towards the goal
2. Emotional patterns and mindset changes
3. Key achievements and challenges
4. Recurring themes or insights
5. Actionable observations

Keep the summary concise (3-4 paragraphs), supportive, and insightful.`
              },
              {
                role: "user",
                content: `Here are ${journals.length} journal entries related to the goal "${mainGoalText}":\n\n${journalContents}\n\nPlease provide a thoughtful summary.`
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

        // Extract key themes
        const allContent = journals.map(j => j.content.toLowerCase()).join(' ');
        const commonWords = ['goal', 'progress', 'learning', 'challenge', 'achievement', 'development', 'growth', 'improvement', 'struggle', 'success'];
        const keyThemes = commonWords.filter(word => allContent.includes(word));

        // Save to database WITHOUT expiresAt (permanent for demo user)
        await GoalSummary.create({
          userId: demoUser._id,
          goalId: mainGoalDocId,
          summaryType: "journal",
          summary: aiSummary,
          entryCount: journals.length,
          metadata: {
            dateRange,
            moodDistribution,
            keyThemes: keyThemes.slice(0, 5),
            wordCloud: wordCloudData,
            goalText: mainGoalText,
          },
          // NO expiresAt field - permanent for demo user
        });

        console.log('   ✓ Journal summary generated and saved (permanent)\n');
      } catch (error) {
        console.error('   ❌ OpenAI API error:', error.response?.data || error.message);
        console.log('   Skipping journal summary...\n');
      }
    } else {
      console.log('   ⚠️  No journal entries found, skipping...\n');
    }

    // 2. Generate Children (Sub-Goals) Summary
    console.log('2. Generating Sub-Goals Summary...');

    const targetGoal = goal.mandalartData;
    const childGoalIds = targetGoal.subGoals
      ? targetGoal.subGoals.filter(sg => sg && sg.id).map(sg => sg.id)
      : [];

    console.log(`   Found ${childGoalIds.length} sub-goals`);

    if (childGoalIds.length > 0) {
      // Get all sub-sub-goal IDs (tasks) as well
      const allChildGoalIds = [];
      targetGoal.subGoals.forEach(sg => {
        if (sg && sg.id) {
          allChildGoalIds.push(sg.id); // Add sub-goal ID
          if (sg.subGoals) {
            sg.subGoals.forEach(ssg => {
              if (ssg && ssg.id) {
                allChildGoalIds.push(ssg.id); // Add sub-sub-goal (task) ID
              }
            });
          }
        }
      });

      console.log(`   Total goal IDs to search (including tasks): ${allChildGoalIds.length}`);

      // Get all journals for child goals and their sub-goals (tasks)
      const childJournals = await JournalEntry.find({
        userId: demoUser._id,
        relatedGoalId: { $in: allChildGoalIds },
      }).sort({ date: -1 }).limit(100); // Increase limit for more comprehensive summary

      console.log(`   Found ${childJournals.length} journal entries across sub-goals and tasks`);

      if (childJournals.length > 0) {
        // Group journals by parent sub-goal
        // Journal entries are tagged with task IDs (e.g., "goal-1-3"),
        // but we want to group them by their parent sub-goal (e.g., "goal-1")
        const journalsByGoal = {};
        childGoalIds.forEach(id => {
          const childGoal = targetGoal.subGoals.find(sg => sg && sg.id === id);
          if (childGoal) {
            // Find all task IDs under this sub-goal
            const taskIds = childGoal.subGoals
              ? childGoal.subGoals.filter(ssg => ssg && ssg.id).map(ssg => ssg.id)
              : [];

            // Get all journal entries for this sub-goal's tasks
            const entries = childJournals.filter(j => taskIds.includes(j.relatedGoalId));

            journalsByGoal[id] = {
              goalText: childGoal.text,
              entries: entries
            };
          }
        });

        // Create summary for each child goal with INDIVIDUAL AI summaries
        console.log('   Generating individual AI summaries for each sub-goal...');
        const childSummariesWithAI = [];

        for (const [id, data] of Object.entries(journalsByGoal)) {
          if (data.entries.length === 0) continue;

          const entries = data.entries;
          const moodDist = entries.reduce((acc, j) => {
            acc[j.mood] = (acc[j.mood] || 0) + 1;
            return acc;
          }, {});

          const latestEntry = entries[0];
          const oldestEntry = entries[entries.length - 1];

          // Generate word cloud for this sub-goal
          const stopWords = new Set([
            // Basic stop words
            "that", "this", "with", "from", "have", "been", "were", "your",
            "will", "would", "could", "should", "about", "there", "their",
            "which", "when", "where", "what", "more", "some", "into", "just",
            "only", "very", "much", "than", "then", "also", "well", "back",
            // Time-related words
            "today", "yesterday", "tomorrow", "week", "month", "year", "time",
            "date", "morning", "afternoon", "evening", "night", "daily", "weekly",
            "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
            // Common diary/journal words
            "feel", "felt", "feeling", "feelings", "think", "thought", "thinking",
            "make", "made", "making", "want", "wanted", "need", "needed",
            "going", "went", "come", "came", "know", "knew", "thing", "things",
            "really", "quite", "pretty", "still", "always", "never", "often",
            // Pronouns and common verbs
            "they", "them", "their", "theirs", "being", "having", "doing",
            "getting", "giving", "taking", "looking", "trying", "working",
          ]);

          const wordFreq = {};
          entries.forEach(j => {
            const words = `${j.title || ''} ${j.content || ''}`.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
            words.forEach(word => {
              if (!stopWords.has(word)) {
                wordFreq[word] = (wordFreq[word] || 0) + 1;
              }
            });
          });

          const wordCloudData = Object.entries(wordFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 50)
            .map(([text, value]) => ({ text, value }));

          // Generate individual AI summary for this sub-goal
          let individualSummary = null;
          try {
            console.log(`   Processing sub-goal: "${data.goalText}" (${entries.length} entries)`);

            const journalContents = entries.slice(0, 10).map((j, idx) => {
              return `Entry ${idx + 1} (${j.date.toISOString().split('T')[0]}, Mood: ${j.mood}):\n${j.content.substring(0, 300)}`;
            }).join('\n\n');

            const individualResponse = await axios.post(
              "https://api.openai.com/v1/chat/completions",
              {
                model: "gpt-3.5-turbo",
                messages: [
                  {
                    role: "system",
                    content: `You are analyzing progress for a specific sub-goal "${data.goalText}" under the main goal "${mainGoalText}". Provide a focused summary covering:
1. Key progress and achievements
2. Emotional patterns and challenges
3. Next steps or areas for improvement

Keep it concise (2-3 sentences), supportive, and specific to this sub-goal.`
                  },
                  {
                    role: "user",
                    content: `Analyze ${entries.length} journal entries for sub-goal "${data.goalText}":\n\n${journalContents}`
                  }
                ],
                max_tokens: 200,
                temperature: 0.7,
              },
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                },
              }
            );

            individualSummary = individualResponse.data.choices[0].message.content;
            console.log(`   ✓ AI summary generated for "${data.goalText}"`);
          } catch (aiError) {
            console.error(`   ❌ Failed to generate AI summary for sub-goal ${id}:`, aiError.message);
            individualSummary = `You have ${entries.length} journal entries for "${data.goalText}". Keep tracking your progress!`;
          }

          childSummariesWithAI.push({
            goalId: id,
            goalText: data.goalText,
            summary: individualSummary, // NEW: Individual AI summary
            entryCount: entries.length,
            dateRange: {
              start: oldestEntry.date,
              end: latestEntry.date,
            },
            moodDistribution: moodDist,
            latestMood: latestEntry.mood,
            wordCloud: wordCloudData, // NEW: Sub-goal specific word cloud
          });
        }

        const childSummaries = childSummariesWithAI;

        // Generate overall aggregated summary for the parent goal
        try {
          console.log('   Generating overall aggregated summary...');

          const summaryByGoal = childSummaries.map(cs => {
            return `\n${cs.goalText} (${cs.entryCount} entries): ${cs.summary}`;
          }).join('\n');

          const openaiResponse = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
              model: "gpt-3.5-turbo",
              messages: [
                {
                  role: "system",
                  content: `You are analyzing progress across multiple sub-goals under a parent goal "${mainGoalText}". Provide an overview of:
1. Overall progress across all sub-goals
2. Which areas show the most development
3. Common patterns or themes across the sub-goals
4. Areas that need more attention
5. Key achievements and challenges

Keep it concise (3-4 paragraphs), motivational, and actionable.`
                },
                {
                  role: "user",
                  content: `Analyze progress for "${mainGoalText}" across ${childSummaries.length} sub-goals with a total of ${childJournals.length} journal entries:\n${summaryByGoal}`
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

          // Save to database WITHOUT expiresAt (permanent for demo user)
          await GoalSummary.create({
            userId: demoUser._id,
            goalId: mainGoalDocId,
            summaryType: "children",
            summary: aiSummary,
            entryCount: childJournals.length,
            metadata: {
              goalText: mainGoalText,
              childGoalsCount: childGoalIds.length,
              childGoalsSummaries: childSummaries, // Now includes individual summaries
            },
            // NO expiresAt field - permanent for demo user
          });

          console.log('   ✓ Sub-goals summary generated and saved (permanent)');
          console.log(`   ✓ Generated ${childSummaries.length} individual sub-goal summaries + 1 overall summary\n`);
        } catch (error) {
          console.error('   ❌ OpenAI API error:', error.response?.data || error.message);
          console.log('   Skipping sub-goals summary...\n');
        }
      } else {
        console.log('   ⚠️  No journal entries for sub-goals, skipping...\n');
      }
    } else {
      console.log('   ⚠️  No sub-goals found, skipping...\n');
    }

    // 3. Generate Word Cloud Cache (for both "all" and "recent" time ranges)
    console.log('3. Generating Word Cloud Cache...');

    const allJournalsForWordCloud = await JournalEntry.find({
      userId: demoUser._id,
      relatedGoalId: mainGoalMandalartId,
    });

    if (allJournalsForWordCloud.length > 0) {
      // Enhanced stop words (matching server.js improvements)
      const stopWords = new Set([
        // Basic stop words
        "that", "this", "with", "from", "have", "been", "were", "your",
        "will", "would", "could", "should", "about", "there", "their",
        "which", "when", "where", "what", "more", "some", "into", "just",
        "only", "very", "much", "than", "then", "also", "well", "back",
        // Time-related words (often not meaningful in diary context)
        "today", "yesterday", "tomorrow", "week", "month", "year", "time",
        "date", "morning", "afternoon", "evening", "night", "daily", "weekly",
        "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
        // Common diary/journal words (too generic)
        "feel", "felt", "feeling", "feelings", "think", "thought", "thinking",
        "make", "made", "making", "want", "wanted", "need", "needed",
        "going", "went", "come", "came", "know", "knew", "thing", "things",
        "really", "quite", "pretty", "still", "always", "never", "often",
        // Pronouns and common verbs
        "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
        "of", "by", "as", "is", "was", "are", "be", "do", "does", "did",
        "i", "you", "he", "she", "it", "we", "they", "them", "their", "theirs",
        "being", "having", "doing", "getting", "giving", "taking", "looking",
        "trying", "working",
      ]);

      // Helper function to generate word cloud data
      const generateWordCloud = (journals) => {
        const wordFreq = {};
        journals.forEach(entry => {
          const words = entry.content.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
          words.forEach(word => {
            if (!stopWords.has(word)) {
              wordFreq[word] = (wordFreq[word] || 0) + 1;
            }
          });
        });

        return Object.entries(wordFreq)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 50)
          .map(([text, value]) => ({ text, value }));
      };

      // Generate "all" time range word cloud
      const allTimeWords = generateWordCloud(allJournalsForWordCloud);

      await GoalSummary.create({
        userId: demoUser._id,
        goalId: mainGoalDocId,
        summaryType: "wordcloud",
        summary: `Word cloud for all time`,
        metadata: {
          timeRange: "all",
          wordCloudData: {
            current: allTimeWords,
            past: [],
          },
        },
        // NO expiresAt field - permanent for demo user
      });

      console.log(`   ✓ Word cloud "all" time range: ${allTimeWords.length} words`);

      // Generate "recent" (last 3 months) time range word cloud
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const recentJournals = allJournalsForWordCloud.filter(
        j => j.date >= threeMonthsAgo
      );

      console.log(`   Found ${recentJournals.length} journal entries in last 3 months`);

      const recentWords = generateWordCloud(recentJournals);

      await GoalSummary.create({
        userId: demoUser._id,
        goalId: mainGoalDocId,
        summaryType: "wordcloud",
        summary: `Word cloud for last 3 months`,
        metadata: {
          timeRange: "recent",
          wordCloudData: {
            current: recentWords,
            past: [],
          },
        },
        // NO expiresAt field - permanent for demo user
      });

      console.log(`   ✓ Word cloud "recent" time range: ${recentWords.length} words`);
      console.log('   ✓ Both word cloud caches generated and saved (permanent)\n');
    } else {
      console.log('   ⚠️  No journal entries for word cloud, skipping...\n');
    }

    // Final summary
    console.log('='.repeat(60));
    console.log('✅ DEMO SUMMARIES GENERATION COMPLETE');
    console.log('='.repeat(60));

    const finalCount = await GoalSummary.countDocuments({
      userId: demoUser._id,
      goalId: mainGoalDocId
    });
    console.log(`\n✓ Created ${finalCount} permanent AI summaries for demo user`);
    console.log('✓ These summaries will NEVER expire');
    console.log('✓ Demo Dashboard will always show consistent data\n');

    console.log('Next Steps:');
    console.log('  1. Test the Dashboard at https://aidiary-reflecta.vercel.app/dashboard');
    console.log('  2. Login as demo@reflecta.com');
    console.log('  3. Verify AI summaries appear correctly\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Disconnected from MongoDB');
  }
}

// Run the script
seedDemoSummaries();
