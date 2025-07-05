const mongoose = require('mongoose');

const trialBookingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  trialDate: { type: Date, required: true },
  message: { type: String, required: false },
  gymId: { type: String, required: true },
  gymName: { type: String, required: true },
  status: { type: String, default: 'Pending' }, // Status could be 'Pending', 'Approved', 'Rejected'
}, {
  timestamps: true
});

module.exports = mongoose.model('TrialBooking', trialBookingSchema);
