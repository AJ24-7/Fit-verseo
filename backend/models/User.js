const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  username: { type: String, unique: true },
  birthdate: Date,
  phone: String,
  email: { type: String, unique: true },
  profileImage: {
    type: String,
    default: "/uploads/profile-pics/default.png"
  },
  createdAt: { type: Date, default: Date.now },
  
  // Fitness
  height: {
    feet: Number,
    inches: Number,
  },
  weight: Number,
  fitnessLevel: String,
  primaryGoal: String,
  workoutPreferences: [String],
  
  // Preferences
  theme: String,
  measurementSystem: String,
  notifications: String,
  twoFactorEnabled: { type: Boolean, default: false },

  // Auth
   password: String,
  // Forgot password support
  passwordResetOTP: String,
  passwordResetOTPExpiry: Date,

  // Authentication provider
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  workoutSchedule: {
  type: Object, // or Map, or Mixed
  default: {}
}
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
