const mongoose = require("mongoose");
const Persona = require("./models/Persona");
const User = require("./models/User");
require("dotenv").config();

const copyPersonasToDemoUser = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Find demo user
    const demoUser = await User.findOne({ email: "demo@reflecta.com" });
    if (!demoUser) {
      console.log("❌ Demo user not found");
      process.exit(1);
    }
    console.log("✅ Found demo user:", demoUser.email);

    // Find all default personas
    const defaultPersonas = await Persona.find({ isDefault: true });
    console.log(`\n Found ${defaultPersonas.length} default personas`);

    // Check if demo user already has persona copies
    const existingPersonas = await Persona.find({
      userId: demoUser._id,
      isDefault: false
    });

    if (existingPersonas.length > 0) {
      console.log(`\n⚠️  Demo user already has ${existingPersonas.length} custom personas`);
      console.log("Do you want to delete them and recreate? (This will remove existing custom personas)");
      // For automation, we'll skip if they exist
      console.log("Skipping - personas already exist for demo user");
      await mongoose.connection.close();
      return;
    }

    // Copy each default persona to demo user
    console.log("\n📋 Copying default personas to demo user...");

    for (const defaultPersona of defaultPersonas) {
      const personalizedPersona = new Persona({
        userId: demoUser._id,
        name: `${defaultPersona.name}-demo-${demoUser._id}`, // Make unique for each user
        displayName: defaultPersona.displayName,
        description: defaultPersona.description,
        systemPrompt: defaultPersona.systemPrompt,
        category: defaultPersona.category,
        color: defaultPersona.color,
        icon: defaultPersona.icon,
        avatarUrl: defaultPersona.avatarUrl,
        isDefault: false, // User's personal copy
      });

      await personalizedPersona.save();
      console.log(`  ✅ Copied: ${defaultPersona.displayName}`);
    }

    console.log(`\n✅ Successfully copied ${defaultPersonas.length} personas to demo user`);
    console.log("\n📊 Demo user now has access to:");
    console.log(`   - ${defaultPersonas.length} personal persona copies`);

    await mongoose.connection.close();
    console.log("\n✅ Done!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

copyPersonasToDemoUser();
