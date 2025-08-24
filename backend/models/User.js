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
  
  // User preferences for settings
  preferences: {
    notifications: {
      email: {
        bookings: { type: Boolean, default: true },
        promotions: { type: Boolean, default: false },
        reminders: { type: Boolean, default: true }
      },
      sms: {
        bookings: { type: Boolean, default: true },
        reminders: { type: Boolean, default: false }
      },
      push: {
        enabled: { type: Boolean, default: true }
      }
    },
    privacy: {
      profileVisibility: { type: String, default: 'public', enum: ['public', 'friends', 'private'] },
      shareWorkoutData: { type: Boolean, default: false },
      shareProgress: { type: Boolean, default: true }
    }
  },
  
  // Account status
  accountStatus: { type: String, default: 'active', enum: ['active', 'deactivated', 'deleted'] },
  deactivatedAt: Date,
  deletedAt: Date,

  // Trial tracking system
  trialLimits: {
    totalTrials: { type: Number, default: 3 }, // Total free trials per month
    usedTrials: { type: Number, default: 0 }, // Used trials this month
    remainingTrials: { type: Number, default: 3 }, // Remaining trials this month
    lastResetDate: { type: Date, default: Date.now }, // Last monthly reset date
    trialHistory: [{
      gymId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gym' },
      gymName: String,
      bookingDate: Date,
      trialDate: Date,
      status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' }
    }]
  },

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
