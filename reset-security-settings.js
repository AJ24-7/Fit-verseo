const mongoose = require('mongoose');
const SecuritySettings = require('./backend/models/SecuritySettings');
require('dotenv').config();

async function resetSecuritySettings() {
    try {
        // Connect to MongoDB using the same URI format as the server
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');
        
        // Find all SecuritySettings records
        const settings = await SecuritySettings.find({});
        console.log(`📋 Found ${settings.length} SecuritySettings records`);
        
        // Reset each one to the correct defaults
        for (const setting of settings) {
            console.log(`🔄 Resetting settings for gym: ${setting.gymId}`);
            
            setting.twoFactorEnabled = false;
            setting.loginNotifications.enabled = false;
            
            await setting.save();
            console.log(`✅ Reset settings for gym: ${setting.gymId}`);
        }
        
        console.log('🎉 All SecuritySettings have been reset to correct defaults');
        
        // Disconnect
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
        
    } catch (error) {
        console.error('❌ Error resetting security settings:', error);
        process.exit(1);
    }
}

// Run the reset
resetSecuritySettings();
