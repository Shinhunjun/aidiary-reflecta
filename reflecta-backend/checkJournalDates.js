require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const JournalEntry = require('./models/JournalEntry');

async function checkJournalDates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected\n');

    const demoUser = await User.findOne({ email: 'demo@reflecta.com' });
    const journals = await JournalEntry.find({ userId: demoUser._id }).sort({ date: 1 });

    console.log('Total journals:', journals.length, '\n');

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const oldJournals = journals.filter(j => j.date < threeMonthsAgo);
    const recentJournals = journals.filter(j => j.date >= threeMonthsAgo);

    console.log('Journals older than 3 months:', oldJournals.length);
    console.log('Journals within last 3 months:', recentJournals.length, '\n');

    console.log('Date range:');
    if (journals.length > 0) {
      const oldest = journals[0].date.toISOString().split('T')[0];
      const newest = journals[journals.length - 1].date.toISOString().split('T')[0];
      console.log('  Oldest:', oldest);
      console.log('  Newest:', newest);
    }
    const cutoff = threeMonthsAgo.toISOString().split('T')[0];
    console.log('  3 months ago cutoff:', cutoff, '\n');

    if (oldJournals.length > 0) {
      console.log('Sample old journals:');
      oldJournals.slice(0, 3).forEach(j => {
        const dateStr = j.date.toISOString().split('T')[0];
        console.log('  -', dateStr, ':', j.title);
      });
    }

    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkJournalDates();
