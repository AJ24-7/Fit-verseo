const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const adminNotificationService = require('../services/adminNotificationService');

// Endpoint for gym admin to send notification to main admin
router.post('/send', adminAuth, async (req, res) => {
  try {
    const { title, message, type = 'system', icon, color, metadata, priority, isGrievance, gym } = req.body;
    
    // Enhanced metadata for grievance notifications
    const enhancedMetadata = {
      ...metadata,
      gym: gym || {},
      isGrievance: isGrievance || false,
      timestamp: new Date().toISOString()
    };

    // Set appropriate icon and color for grievance notifications
    const notificationIcon = isGrievance ? 'fa-exclamation-triangle' : (icon || 'fa-bell');
    const notificationColor = isGrievance ? '#dc3545' : (color || '#2563eb');
    const notificationPriority = isGrievance ? 'high' : (priority || 'medium');

    // Use the service to create a notification for the default admin
    await adminNotificationService.createNotification(
      title,
      message,
      type,
      notificationIcon,
      notificationColor,
      enhancedMetadata,
      notificationPriority
    );
    
    console.log(`📧 Admin notification sent: ${title} ${isGrievance ? '(GRIEVANCE)' : ''}`);
    res.json({ success: true, message: 'Notification sent to admin.' });
  } catch (error) {
    console.error('Error sending notification to admin:', error);
    res.status(500).json({ success: false, message: 'Error sending notification to admin.' });
  }
});

module.exports = router;
