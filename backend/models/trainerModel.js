// models/trainerModel.js
const mongoose = require('mongoose');

const trainerSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  specialty: { type: String, required: true },
  experience: { type: Number, required: true },
  locations: { type: [String], default: [] },
  availability: { type: String, required: true },
  certifications: { type: [String], default: [] }, // filenames
  bio: { type: String, default: '' },
  rate: { type: Number, required: true },
  photo: { type: String, default: '' }, // profile photo filename
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    required: true
  },
  gym: { type: mongoose.Schema.Types.ObjectId, ref: 'Gym', required: false },
  rejectionReason: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Trainer', trainerSchema);
