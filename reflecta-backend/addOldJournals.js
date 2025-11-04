require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Goal = require('./models/Goal');
const JournalEntry = require('./models/JournalEntry');

async function addOldJournals() {
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

    // Get all task IDs from the goal structure
    const taskIds = [];
    goal.mandalartData.subGoals.forEach(sg => {
      if (sg && sg.subGoals) {
        sg.subGoals.forEach(task => {
          if (task && task.id) {
            taskIds.push({ id: task.id, text: task.text });
          }
        });
      }
    });

    console.log(`Found ${taskIds.length} tasks\n`);

    // Old journal templates with different themes and vocabulary
    const oldJournalTemplates = [
      {
        title: "Reflecting on Past Achievements",
        content: "Looking back at what I accomplished earlier this year fills me with gratitude. The foundation I built during that time continues to support my current efforts. Those early steps taught me valuable lessons about perseverance and dedication.",
        mood: "grateful"
      },
      {
        title: "Learning from Earlier Challenges",
        content: "The difficulties I faced months ago seemed overwhelming at the time, but now I see how they shaped my approach to current obstacles. That period of struggle developed resilience I didn't know I had. It's remarkable how perspective changes with time.",
        mood: "reflective"
      },
      {
        title: "Previous Goals Review",
        content: "Reviewing my initial objectives from several months back shows interesting evolution. Some targets shifted while others remained constant. The journey has been more about adapting and growing than simply checking boxes off a list.",
        mood: "calm"
      },
      {
        title: "Early Progress Milestone",
        content: "Reaching that first major milestone felt incredible back then. The enthusiasm and energy from that period created momentum that carried me forward. I want to recapture some of that initial excitement and apply it to my current pursuits.",
        mood: "excited"
      },
      {
        title: "Building Better Habits",
        content: "The routines I established earlier are really paying off now. Those weeks of consistent practice created strong foundations. Even when motivation wanes, these ingrained habits keep me moving in the right direction.",
        mood: "happy"
      },
      {
        title: "Overcoming Initial Doubts",
        content: "I remember questioning whether I could really achieve these goals when I first started. Those doubts feel distant now, replaced by quiet confidence built through consistent effort. The person I was then would be proud of the progress made.",
        mood: "reflective"
      },
      {
        title: "Valuable Lessons Learned",
        content: "The mistakes from months ago turned out to be excellent teachers. What seemed like setbacks were actually opportunities for course correction. I'm grateful for those learning experiences that refined my approach.",
        mood: "grateful"
      },
      {
        title: "Comparing Then and Now",
        content: "The difference between my skills then and now is substantial. Regular practice and dedication transformed what once seemed impossible into achievable tasks. This comparison motivates me to continue investing in growth.",
        mood: "happy"
      },
      {
        title: "Foundation Building Period",
        content: "That initial phase was all about laying groundwork and learning fundamentals. While less exciting than current work, it was absolutely necessary. Everything built afterward relies on that solid base.",
        mood: "calm"
      },
      {
        title: "Early Experimentation Phase",
        content: "Trying different approaches back then helped identify what works best. Some experiments failed, others succeeded, but all provided valuable data. That exploratory period informed current strategies significantly.",
        mood: "reflective"
      },
      {
        title: "First Success Celebration",
        content: "Achieving that first real success was exhilarating. It validated the effort and proved the approach was sound. That win provided confidence to tackle bigger challenges ahead.",
        mood: "excited"
      },
      {
        title: "Understanding Core Concepts",
        content: "The time spent understanding basics really paid off. Mastering fundamentals made advanced work much more manageable. That patient foundation-building approach was wise even though it felt slow.",
        mood: "calm"
      },
      {
        title: "Developing Consistency",
        content: "Building consistency was harder than expected but absolutely worthwhile. Those early weeks of forcing routine until it became natural were challenging. Now consistency feels effortless and automatic.",
        mood: "reflective"
      },
      {
        title: "Initial Inspiration Source",
        content: "What inspired me to start this journey still resonates strongly. That original vision continues to guide decisions and provide direction. Reconnecting with initial motivations helps maintain focus during difficult periods.",
        mood: "grateful"
      },
      {
        title: "Establishing Work Patterns",
        content: "Figuring out optimal work patterns took considerable experimentation. Trial and error revealed what times and environments produce best results. Those discoveries continue to shape daily scheduling and productivity.",
        mood: "happy"
      },
      {
        title: "Support System Development",
        content: "Building a network of supportive people was crucial for sustained progress. Those relationships formed early on provide ongoing encouragement and accountability. I'm thankful for everyone who believed in these goals.",
        mood: "grateful"
      },
      {
        title: "Breaking Old Habits",
        content: "Replacing counterproductive patterns with better ones required significant effort. The struggle to break old habits while building new ones was real. That transformation period shaped who I am today.",
        mood: "reflective"
      },
      {
        title: "Resource Discovery Journey",
        content: "Finding useful resources and tools took time but opened many doors. Each discovery accelerated learning and improved efficiency. Building that resource library continues to benefit current work.",
        mood: "happy"
      },
      {
        title: "Setting Realistic Expectations",
        content: "Learning to set achievable targets rather than overwhelming ones was important. That balance between ambition and realism took time to calibrate. The adjusted approach leads to sustainable progress.",
        mood: "calm"
      },
      {
        title: "Celebrating Small Victories",
        content: "Recognizing incremental progress rather than only major milestones improved motivation. Those small wins accumulated into significant advancement. This appreciation for gradual improvement sustains long-term effort.",
        mood: "happy"
      }
    ];

    console.log('Creating old journal entries (4-10 months ago)...\n');

    let createdCount = 0;
    const moods = ['happy', 'calm', 'reflective', 'grateful', 'excited'];

    // Create journals 4-10 months ago (40 entries)
    for (let i = 0; i < 40; i++) {
      const monthsAgo = 4 + Math.floor(Math.random() * 7); // 4-10 months ago
      const daysOffset = Math.floor(Math.random() * 30); // Random day within that month

      const journalDate = new Date();
      journalDate.setMonth(journalDate.getMonth() - monthsAgo);
      journalDate.setDate(journalDate.getDate() - daysOffset);

      // Select random template and task
      const template = oldJournalTemplates[i % oldJournalTemplates.length];
      const randomTask = taskIds[Math.floor(Math.random() * taskIds.length)];

      const journalEntry = new JournalEntry({
        userId: demoUser._id,
        title: template.title,
        content: template.content,
        mood: template.mood,
        date: journalDate,
        relatedGoalId: randomTask.id,
        tags: ['reflection', 'progress', 'growth'],
      });

      await journalEntry.save();
      createdCount++;

      if (createdCount % 10 === 0) {
        console.log(`  ✓ Created ${createdCount} old journals...`);
      }
    }

    console.log(`\n✅ Successfully created ${createdCount} old journal entries`);
    console.log('   Date range: 4-10 months ago');
    console.log('   This will create a clear difference between "All Time" and "Last 3 Months" word clouds\n');

    await mongoose.connection.close();
    console.log('✓ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

addOldJournals();
