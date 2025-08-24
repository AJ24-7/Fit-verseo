const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  createBooking,
  getAllBookings,
  updateBookingStatus,
  deleteBooking,
  getUserTrialStatus,
  checkTrialAvailability,
  cancelTrialBooking,
  getUserTrialHistory
} = require('../controllers/trialBookingController');

// Public routes (no authentication required)
router.post('/book-trial', authMiddleware, createBooking); // Auth optional but recommended
router.get('/bookings', getAllBookings);
router.put('/booking/:bookingId/status', updateBookingStatus);
router.delete('/booking/:bookingId', deleteBooking);

// User-specific routes (authentication required)
router.get('/trial-status', authMiddleware, getUserTrialStatus);
router.get('/check-availability', authMiddleware, checkTrialAvailability);
router.put('/cancel/:bookingId', authMiddleware, cancelTrialBooking);
router.get('/history', authMiddleware, getUserTrialHistory);

module.exports = router;
