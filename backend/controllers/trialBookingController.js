const TrialBooking = require('../models/TrialBooking');
const Gym = require('../models/gym');
const User = require('../models/User');
const Notification = require('../models/Notification');
const adminNotificationService = require('../services/adminNotificationService');
const TrialLimitService = require('../services/TrialLimitService');

// Create a new trial booking
const createBooking = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      gymId,
      sessionType,
      preferredDate,
      preferredTime,
      emergencyContact,
      healthConditions,
      fitnessGoals,
      previousExperience
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !gymId || !sessionType || !preferredDate || !preferredTime) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Check if gym exists
    const gym = await Gym.findById(gymId);
    if (!gym) {
      return res.status(404).json({
        success: false,
        message: 'Gym not found'
      });
    }

    // If user is authenticated and booking a trial, check trial limits
    if (req.user && sessionType === 'trial') {
      const canBook = await TrialLimitService.canBookTrial(req.user.id, gymId, new Date(preferredDate));
      
      if (!canBook.canBook) {
        return res.status(400).json({
          success: false,
          message: canBook.message,
          restrictions: canBook.restrictions
        });
      }
    }

    // Create booking
    const booking = new TrialBooking({
      name,
      email,
      phone,
      gymId,
      sessionType,
      preferredDate: new Date(preferredDate),
      preferredTime,
      emergencyContact,
      healthConditions,
      fitnessGoals,
      previousExperience,
      userId: req.user ? req.user.id : null
    });

    const savedBooking = await booking.save();

    // If authenticated user booked a trial, update their trial limits
    if (req.user && sessionType === 'trial') {
      await TrialLimitService.bookTrial(req.user.id, gymId, savedBooking._id);
    }

    // Create notification for gym admin
    try {
      const notification = new Notification({
        type: 'trial_booking',
        title: 'New Trial Booking',
        message: `New trial booking from ${name} for ${gym.name}`,
        gymId: gymId,
        relatedId: savedBooking._id,
        priority: 'medium'
      });
      await notification.save();

      // Send real-time notification
      await adminNotificationService.sendNotification({
        type: 'trial_booking',
        gymId: gymId,
        title: 'New Trial Booking',
        message: `${name} has booked a ${sessionType} session`,
        data: {
          bookingId: savedBooking._id,
          customerName: name,
          email: email,
          phone: phone,
          preferredDate: preferredDate,
          preferredTime: preferredTime
        }
      });
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
      // Don't fail the booking if notification fails
    }

    res.status(200).json({
      success: true,
      message: 'Trial booking created successfully',
      booking: savedBooking
    });

  } catch (error) {
    console.error('Error creating trial booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating trial booking',
      error: error.message
    });
  }
};

// Get all bookings (admin function)
const getAllBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, gymId, sessionType } = req.query;
    
    let filter = {};
    if (status) filter.status = status;
    if (gymId) filter.gymId = gymId;
    if (sessionType) filter.sessionType = sessionType;

    const bookings = await TrialBooking.find(filter)
      .populate('gymId', 'name location')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await TrialBooking.countDocuments(filter);

    res.status(200).json({
      success: true,
      bookings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
};

// Update booking status
const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, adminNotes } = req.body;

    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const booking = await TrialBooking.findById(bookingId).populate('gymId');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    booking.status = status;
    if (adminNotes) booking.adminNotes = adminNotes;
    booking.updatedAt = new Date();

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking status updated successfully',
      booking
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking status',
      error: error.message
    });
  }
};

// Delete booking
const deleteBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const booking = await TrialBooking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    await TrialBooking.findByIdAndDelete(bookingId);

    res.status(200).json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting booking',
      error: error.message
    });
  }
};

// Get user trial status
const getUserTrialStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const status = await TrialLimitService.getUserTrialStatus(userId);
    
    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting trial status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trial status',
      error: error.message
    });
  }
};

// Check trial availability for specific gym and date
const checkTrialAvailability = async (req, res) => {
  try {
    const userId = req.user.id;
    const { gymId, date } = req.query;
    
    if (!gymId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Gym ID and date are required'
      });
    }
    
    const canBook = await TrialLimitService.canBookTrial(userId, gymId, new Date(date));
    
    res.status(200).json({
      success: true,
      data: {
        canBook: canBook.canBook,
        message: canBook.message,
        restrictions: canBook.restrictions || null
      }
    });
  } catch (error) {
    console.error('Error checking trial availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking availability',
      error: error.message
    });
  }
};

// Cancel trial booking
const cancelTrialBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookingId } = req.params;
    
    // Find the booking and verify ownership
    const booking = await TrialBooking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    if (booking.email !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to cancel this booking'
      });
    }
    
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }
    
    // Update booking status
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    await booking.save();
    
    // Refund trial if booking was for a trial session
    if (booking.sessionType === 'trial') {
      const user = await User.findById(userId);
      if (user && user.trialLimits.usedTrials > 0) {
        user.trialLimits.usedTrials -= 1;
        user.trialLimits.remainingTrials += 1;
        
        // Remove from trial history if it exists
        user.trialLimits.trialHistory = user.trialLimits.trialHistory.filter(
          trial => trial.bookingId.toString() !== bookingId
        );
        
        await user.save();
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error.message
    });
  }
};

// Get user trial history
const getUserTrialHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Build filter for trial bookings
    let filter = {
      userId: userId,
      sessionType: 'trial'
    };
    
    if (status) {
      filter.status = status;
    }
    
    // Get trial bookings with pagination
    const bookings = await TrialBooking.find(filter)
      .populate('gymId', 'name location images')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await TrialBooking.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: {
        trialLimits: user.trialLimits,
        bookings,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      }
    });
  } catch (error) {
    console.error('Error getting trial history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trial history',
      error: error.message
    });
  }
};

module.exports = {
  createBooking,
  getAllBookings,
  updateBookingStatus,
  deleteBooking,
  getUserTrialStatus,
  checkTrialAvailability,
  cancelTrialBooking,
  getUserTrialHistory
};