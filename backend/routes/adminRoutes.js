const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const adminController = require('../controllers/adminController');
const sendEmail = require('../utils/sendEmail');
const Notification = require('../models/Notification'); // Import Notification model

const { getDashboardData } = require('../controllers/adminController');

// Dashboard route
router.get('/dashboard', adminAuth, adminController.getDashboardData);

// Gym Approval Routes
router.patch('/gyms/:id/approve', adminAuth, adminController.approveGym);
router.patch('/gyms/:id/reject', adminAuth, adminController.rejectGym);
router.patch('/gyms/:id/revoke', adminAuth, adminController.revokeGym);
router.patch('/gyms/:id/reconsider', adminAuth, adminController.reconsiderGym);

// Delete gym route
router.delete('/gyms/:id', adminAuth, adminController.deleteGym);

// Notification Routes
router.get('/notifications', adminAuth, adminController.getNotifications);  // Get all notifications for admin
router.patch('/notifications/:id/read', adminAuth, adminController.markNotificationRead);  // Mark a notification as read

// Create notification helper function for gym actions
const createNotification = async (adminId, title, message, type) => {
  const notification = new Notification({
    title: title,
    message: message,
    type: type,
    user: adminId,  // The admin user receiving the notification
  });

  await notification.save();
};

// Update the gym approval logic to include notifications

// Gym approval route with notification
router.patch('/gyms/:id/approve', adminAuth, async (req, res) => {
  const { id } = req.params;
  const adminId = req.admin._id; // Get admin ID from the token

  try {
    const gym = await Gym.findById(id);  // Find the gym by ID

    if (!gym) {
      return res.status(404).json({ message: 'Gym not found' });
    }

    gym.approvalStatus = 'approved';
    await gym.save();

    // Create a notification for the admin
    await createNotification(
      adminId,
      'Gym Approved',
      `${gym.gymName} has been approved for registration.`,
      'gym-registration'
    );

    res.status(200).json({ message: 'Gym approved successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Error approving gym' });
  }
});

// Gym rejection route with notification
router.patch('/gyms/:id/reject', adminAuth, async (req, res) => {
  const { id } = req.params;
  const adminId = req.admin._id;

  try {
    const gym = await Gym.findById(id);

    if (!gym) {
      return res.status(404).json({ message: 'Gym not found' });
    }

    gym.approvalStatus = 'rejected';
    await gym.save();

    // Create a notification for the admin
    await createNotification(
      adminId,
      'Gym Rejected',
      `${gym.gymName} has been rejected for registration.`,
      'gym-registration'
    );

    res.status(200).json({ message: 'Gym rejected successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Error rejecting gym' });
  }
});

module.exports = router;
