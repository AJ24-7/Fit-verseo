const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const adminAuth = require('../middleware/adminAuth');
const adminController = require('../controllers/adminController');
const simpleAdminAuth = require('../controllers/simpleAdminAuth');
const sendEmail = require('../utils/sendEmail');
const Notification = require('../models/Notification'); // Import Notification model
const Admin = require('../models/admin'); // Import Admin model

// Authentication Routes (Public)
router.post('/auth/login', simpleAdminAuth.createRateLimiter(), simpleAdminAuth.login);
router.post('/auth/verify-2fa', simpleAdminAuth.verify2FA);
router.post('/auth/forgot-password', simpleAdminAuth.forgotPassword);
router.post('/auth/reset-password', simpleAdminAuth.resetPassword);
router.post('/auth/refresh-token', simpleAdminAuth.refreshToken);
router.post('/auth/logout', simpleAdminAuth.logout);

// Setup Routes (Public)
router.get('/check-database', async (req, res) => {
  try {
    // Simple database connectivity check
    const adminCount = await Admin.countDocuments({});
    res.json({ 
      success: true, 
      message: 'Database connection successful',
      adminCount 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Database connection failed',
      error: error.message 
    });
  }
});

router.get('/check-admin-exists', async (req, res) => {
  try {
    const adminExists = await Admin.findOne({});
    res.json({ 
      adminExists: !!adminExists,
      message: adminExists ? 'Admin account found' : 'No admin account exists'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error checking admin status',
      error: error.message 
    });
  }
});

router.post('/setup-admin', async (req, res) => {
  try {
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({});
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin account already exists. Please use the login page.'
      });
    }

    const { name, email, phone, password, role, permissions } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Create new admin
    const newAdmin = new Admin({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim(),
      password, // Will be hashed by pre-save middleware
      role: role || 'super_admin',
      permissions: permissions || [
        'manage_gyms',
        'manage_users',
        'manage_subscriptions',
        'manage_payments',
        'manage_support',
        'manage_trainers',
        'view_analytics',
        'system_settings',
        'security_logs'
      ],
      status: 'active',
      twoFactorEnabled: false,
      setupCompleted: true,
      setupDate: new Date()
    });

    await newAdmin.save();

    res.json({
      success: true,
      message: 'Admin account created successfully',
      admin: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role
      }
    });

  } catch (error) {
    console.error('Setup admin error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating admin account',
      error: error.message
    });
  }
});

// Helper route to create default admin for development
router.post('/create-default-admin', async (req, res) => {
  try {
    // Check if any admin already exists
    const existingAdmin = await Admin.findOne({});
    if (existingAdmin) {
      return res.json({ 
        message: 'Admin already exists', 
        adminId: existingAdmin._id,
        email: existingAdmin.email 
      });
    }

    // Create default super admin
    const defaultAdmin = new Admin({
      name: 'Super Admin',
      email: 'admin@gym-wale.com',
      password: 'SecureAdmin@2024', // This will be hashed by the pre-save middleware
      role: 'super_admin',
      permissions: [
        'manage_gyms',
        'manage_users', 
        'manage_subscriptions',
        'manage_payments',
        'manage_support',
        'manage_trainers',
        'view_analytics',
        'system_settings',
        'security_logs'
      ],
      twoFactorEnabled: false, // Disable 2FA for easier testing
      status: 'active'
    });

    await defaultAdmin.save();
    
    res.json({ 
      message: 'Default super admin created successfully', 
      adminId: defaultAdmin._id,
      email: defaultAdmin.email,
      note: 'Please change the default password after first login'
    });
  } catch (error) {
    console.error('Error creating default admin:', error);
    res.status(500).json({ message: 'Error creating default admin', error: error.message });
  }
});

// Helper route to reset admin for development
router.post('/reset-admin-dev', async (req, res) => {
  try {
    // Remove all existing admins
    await Admin.deleteMany({});
    
    // Create new default admin
    const defaultAdmin = new Admin({
      name: 'Super Admin',
      email: 'admin@gym-wale.com',
      password: 'SecureAdmin@2024',
      role: 'super_admin',
      permissions: [
        'manage_gyms',
        'manage_users', 
        'manage_subscriptions',
        'manage_payments',
        'manage_support',
        'manage_trainers',
        'view_analytics',
        'system_settings',
        'security_logs'
      ],
      twoFactorEnabled: false,
      status: 'active'
    });

    await defaultAdmin.save();
    
    res.json({ 
      message: 'Admin reset and created successfully', 
      adminId: defaultAdmin._id,
      email: defaultAdmin.email,
      password: 'SecureAdmin@2024'
    });
  } catch (error) {
    console.error('Error resetting admin:', error);
    res.status(500).json({ message: 'Error resetting admin', error: error.message });
  }
});

// Protected Routes (Require Authentication)
const { getDashboardData } = require('../controllers/adminController');

// Dashboard route
router.get('/dashboard', adminAuth, adminController.getDashboardData);

// Profile routes
router.get('/profile', adminAuth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-password -refreshTokens');
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.json({
      success: true,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        permissions: admin.permissions,
        status: admin.status,
        twoFactorEnabled: admin.twoFactorEnabled,
        lastLogin: admin.lastLogin,
        lastLoginIP: admin.lastLoginIP,
        createdAt: admin.createdAt,
        passwordChangedAt: admin.passwordChangedAt,
        loginCount: admin.loginCount || 0
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile'
    });
  }
});

router.put('/profile', adminAuth, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const adminId = req.admin.id;

    const updateData = {};
    if (name && name.trim()) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone.trim() || null;

    const admin = await Admin.findByIdAndUpdate(
      adminId,
      updateData,
      { new: true, select: '-password -refreshTokens' }
    );

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        permissions: admin.permissions,
        status: admin.status,
        twoFactorEnabled: admin.twoFactorEnabled,
        lastLogin: admin.lastLogin,
        lastLoginIP: admin.lastLoginIP,
        createdAt: admin.createdAt,
        passwordChangedAt: admin.passwordChangedAt
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
});

router.put('/change-password', adminAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.admin.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, admin.password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    admin.password = newPassword; // Will be hashed by pre-save middleware
    admin.passwordChangedAt = new Date();
    await admin.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password'
    });
  }
});

// Gym Management Routes
router.get('/gyms', adminAuth, adminController.getAllGyms);  // Get all gyms for admin
router.get('/gyms/status/:status', adminAuth, adminController.getGymsByStatus);  // Get gyms by status for admin
router.get('/gyms/:id', adminAuth, adminController.getGymById);  // Admin-specific gym details

// Gym Approval Routes
router.patch('/gyms/:id/approve', adminAuth, adminController.approveGym);
router.patch('/gyms/:id/reject', adminAuth, adminController.rejectGym);
router.patch('/gyms/:id/revoke', adminAuth, adminController.revokeGym);
router.patch('/gyms/:id/reconsider', adminAuth, adminController.reconsiderGym);

// Delete gym route
router.delete('/gyms/:id', adminAuth, adminController.deleteGym);

// Notification Routes
router.get('/notifications', adminAuth, adminController.getNotifications);  // Get all notifications for admin
router.put('/notifications/:id/read', adminAuth, adminController.markNotificationRead);  // Mark a notification as read
router.put('/notifications/mark-all-read', adminAuth, adminController.markAllNotificationsRead);  // Mark all notifications as read

// Admin Management Routes (Super Admin only)
router.get('/admins', adminAuth, adminAuth.requireRole('super_admin'), async (req, res) => {
  try {
    const admins = await Admin.find({}).select('-password -refreshTokens -pendingTwoFACode');
    res.json({ success: true, admins });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching admins' });
  }
});

router.post('/admins', adminAuth, adminAuth.requireRole('super_admin'), async (req, res) => {
  try {
    const { name, email, role, permissions } = req.body;
    
    const admin = new Admin({
      name,
      email,
      password: 'TempPassword123!', // Temporary password
      role,
      permissions,
      createdBy: req.admin.id
    });
    
    await admin.save();
    
    // Send welcome email with password reset link
    // Implementation here...
    
    res.json({ success: true, message: 'Admin created successfully', adminId: admin._id });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating admin' });
  }
});

// Security & Audit Routes
router.get('/security/logs', adminAuth, adminAuth.requirePermission('security_logs'), async (req, res) => {
  try {
    const { hours = 24, event } = req.query;
    const SecurityLogger = require('../utils/securityLogger');
    const logger = new SecurityLogger();
    
    const logs = await logger.getRecentLogs(parseInt(hours), event ? [event] : []);
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching security logs' });
  }
});

router.get('/security/report', adminAuth, adminAuth.requirePermission('security_logs'), async (req, res) => {
  try {
    const { hours = 24 } = req.query;
    const SecurityLogger = require('../utils/securityLogger');
    const logger = new SecurityLogger();
    
    const report = await logger.generateSecurityReport(parseInt(hours));
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating security report' });
  }
});

// Profile Management
router.get('/profile', adminAuth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-password -refreshTokens -pendingTwoFACode');
    res.json({ success: true, admin });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching profile' });
  }
});

router.put('/profile', adminAuth, async (req, res) => {
  try {
    const { name, email } = req.body;
    const admin = await Admin.findById(req.admin.id);
    
    if (name) admin.name = name;
    if (email && email !== admin.email) {
      // Check if email is already taken
      const existingAdmin = await Admin.findOne({ email, _id: { $ne: admin._id } });
      if (existingAdmin) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }
      admin.email = email;
    }
    
    await admin.save();
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating profile' });
  }
});

router.post('/change-password', adminAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = await Admin.findById(req.admin.id);
    
    // Verify current password
    const isCurrentPasswordValid = await admin.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    
    // Update password
    admin.password = newPassword; // Will be hashed by pre-save middleware
    await admin.save();
    
    // Log password change
    const SecurityLogger = require('../utils/securityLogger');
    const logger = new SecurityLogger();
    await logger.log('password_changed', {
      adminId: admin._id,
      email: admin.email,
      ip: req.ip
    });
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error changing password' });
  }
});

// 2FA Management
router.post('/enable-2fa', adminAuth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    admin.twoFactorEnabled = true;
    await admin.save();
    
    res.json({ success: true, message: '2FA enabled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error enabling 2FA' });
  }
});

router.post('/disable-2fa', adminAuth, async (req, res) => {
  try {
    const { password } = req.body;
    const admin = await Admin.findById(req.admin.id);
    
    // Verify password for security
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, message: 'Password verification required' });
    }
    
    admin.twoFactorEnabled = false;
    admin.twoFactorSecret = undefined;
    await admin.save();
    
    res.json({ success: true, message: '2FA disabled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error disabling 2FA' });
  }
});

module.exports = router;
