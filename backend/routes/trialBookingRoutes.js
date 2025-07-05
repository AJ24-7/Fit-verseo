const express = require('express');
const router = express.Router();
const {
  createBooking,
  getAllBookings,
  updateBookingStatus,
  deleteBooking
} = require('../controllers/trialBookingController');

router.post('/book-trial', createBooking);
router.get('/bookings', getAllBookings);
router.put('/booking/:bookingId/status', updateBookingStatus);
router.delete('/booking/:bookingId', deleteBooking);

module.exports = router;
