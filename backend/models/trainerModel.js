// models/trainerModel.js
const mongoose = require('mongoose');

const trainerSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  specialty: String,
  experience: Number,
  locations: [String],
  availability: String,
  certifications: [String], // filenames
  bio: String,
  rate: Number,
  photo: String, // profile photo filename
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Trainer', trainerSchema);
