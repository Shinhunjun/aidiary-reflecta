const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Persona = require('./models/Persona');

async function testQuery() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const demoUser = await User.findOne({ email: 'demo@reflecta.com' });
    console.log('Demo user ID:', demoUser._id.toString(), '\n');

    // Test the exact query that the API uses
    const personas = await Persona.find({
      $or: [
        { isDefault: true },
        { userId: demoUser._id }
      ]
    }).sort({ isDefault: -1, createdAt: -1 });

    console.log('API Query Result - Total personas:', personas.length);
    console.log('\nDefault personas (isDefault: true):');
    const defaultPersonas = personas.filter(p => p.isDefault);
    console.log('  Count:', defaultPersonas.length);
    defaultPersonas.forEach(p =>
      console.log('  -', p.icon, p.displayName, '| userId:', p.userId || 'null')
    );

    console.log('\nUser-specific personas (userId matches):');
    const userPersonas = personas.filter(p => !p.isDefault && p.userId?.toString() === demoUser._id.toString());
    console.log('  Count:', userPersonas.length);
    userPersonas.forEach(p =>
      console.log('  -', p.icon, p.displayName, '| userId:', p.userId.toString().substring(0, 12) + '...')
    );

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testQuery();
