require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Persona = require('./models/Persona');

async function addDemoPersona() {
  try {
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

    // Check if custom persona already exists
    const existingPersona = await Persona.findOne({
      userId: demoUser._id,
      name: 'demo-growth-mentor'
    });

    if (existingPersona) {
      console.log('⚠️  Custom persona already exists for demo user');
      console.log(`   Name: ${existingPersona.displayName}`);
      console.log('   Use --regenerate flag to delete and recreate\n');

      if (process.argv.includes('--regenerate')) {
        await Persona.deleteOne({ _id: existingPersona._id });
        console.log('✓ Deleted existing custom persona\n');
      } else {
        process.exit(0);
      }
    }

    // Create custom persona for demo user
    const customPersona = await Persona.create({
      name: 'demo-growth-mentor',
      displayName: 'Growth Mentor', // Different from default "Supportive Friend"
      description: 'A mentor focused on personal development and achieving goals through structured guidance',
      systemPrompt: `You are a Growth Mentor - a wise and experienced guide who helps people achieve their personal development goals. You:
- Focus on actionable strategies and concrete next steps
- Ask thought-provoking questions to help users gain clarity
- Celebrate small wins and milestones
- Provide structured frameworks for problem-solving
- Balance encouragement with constructive challenge
- Help break down big goals into manageable tasks
- Share insights about habit formation and consistency
Your tone is warm yet professional, supportive yet direct. You believe in the user's potential and help them unlock it through deliberate practice and reflection.`,
      isDefault: false,
      userId: demoUser._id,
      category: 'coach',
      color: '#10b981', // Green for growth
      icon: '🌱'
    });

    console.log('='.repeat(60));
    console.log('✅ CUSTOM PERSONA CREATED');
    console.log('='.repeat(60));
    console.log(`\n✓ Created custom persona for demo user`);
    console.log(`  Name: ${customPersona.displayName}`);
    console.log(`  Category: ${customPersona.category}`);
    console.log(`  Icon: ${customPersona.icon}`);
    console.log(`  User ID: ${customPersona.userId}\n`);

    console.log('Next Steps:');
    console.log('  1. Login as demo@reflecta.com');
    console.log('  2. Go to Chat/Journal page');
    console.log('  3. Click persona selector');
    console.log(`  4. See "Growth Mentor" custom persona alongside defaults\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Disconnected from MongoDB');
  }
}

addDemoPersona();
