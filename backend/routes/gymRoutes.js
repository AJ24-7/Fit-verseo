// --- Activities API ---
const express = require('express');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Import controllers
const gymController = require('../controllers/gymController');
const membershipPlanController = require('../controllers/membershipPlanController');

// Import middleware
const gymadminAuth = require('../middleware/gymadminAuth');
const tempAuth = require('../middleware/tempAuth');

// Import models
const Gym = require('../models/gym');
const LoginAttempt = require('../models/LoginAttempt');
const SecuritySettings = require('../models/SecuritySettings');

// Import controller functions
const { registerGym, loginGym, updateMyProfile, getMyProfile, getGymsByCities } = require('../controllers/gymController'); 

// Debug: Check if tempAuth is properly imported
console.log('tempAuth imported:', typeof tempAuth);
if (typeof tempAuth !== 'function') {
  console.error('ERROR: tempAuth is not a function!', tempAuth);
}

// --- Membership Plans API ---
// Get all membership plans for the logged-in gym admin
router.get('/membership-plans', gymadminAuth, membershipPlanController.getMembershipPlans);

// Update all membership plans for the logged-in gym admin
router.put('/membership-plans', gymadminAuth, membershipPlanController.updateMembershipPlans);
// 🔧 Multer Storage Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use different folders based on file field name
    if (file.fieldname === 'logo') {
      cb(null, 'uploads/gym-logos/');
    } else {
      cb(null, 'uploads/gymPhotos/');
    }
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// ✅ Register Gym [POST] /register
router.options('/register', (req, res) => {
  console.log('<<<< OPTIONS request to /register received >>>>');
  res.header('Access-Control-Allow-Origin', 'http://127.0.0.1:5500'); // Or your specific client origin
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With, Origin, Accept'); // Add common headers
  res.sendStatus(204); // No Content - standard for successful OPTIONS
});

router.post('/register',  upload.fields([
  { name: 'gymImages', maxCount: 5 },
  { name: 'logo', maxCount: 1 },
]), registerGym);

// ✅ Get All Gyms [GET] /
router.get('/', gymadminAuth, async (req, res) => {
  try {
    const gyms = await Gym.find();
    console.log("📦 All gyms fetched:", gyms);
    res.status(200).json(gyms);
  } catch (error) {
    console.error('❌ Failed to fetch gyms:', error);
    res.status(500).json({ message: 'Server error while fetching gyms' });
  }
});

// 🔒 Get My Profile [GET] /profile/me
// ⭐ Gym Admin Login [POST] /login
router.post('/login', require('../controllers/gymController').login);
router.post('/request-password-otp', require('../controllers/gymController').requestPasswordChangeOTP);
router.post('/verify-password-otp', require('../controllers/gymController').verifyPasswordChangeOTP);

// ⭐ Get and Update Logged-in Gym's Profile [GET, PUT] /profile/me
router.get('/profile/me', gymadminAuth, require('../controllers/gymController').getMyProfile);
router.put('/profile/me', gymadminAuth, upload.single('gymLogo'), require('../controllers/gymController').updateMyProfile);

// ⭐ Change Password for Logged-in Gym Admin [POST] /change-password
router.post('/change-password', gymadminAuth, require('../controllers/gymController').changePassword);



// 🔐 2FA Management Routes (placed early to avoid conflicts with /:id route)

// Enable Email-based 2FA for gym admin
router.post('/enable-email-2fa', gymadminAuth, async (req, res) => {
  try {
    const gymId = req.admin?.id;
    console.log(`🔐 Enable Email 2FA request from gym ID: ${gymId}`);
    
    if (!gymId) {
      return res.status(401).json({ success: false, message: 'Invalid authentication token' });
    }

    // Find or create SecuritySettings for this gym
    let securitySettings = await SecuritySettings.findOne({ gymId });
    if (!securitySettings) {
      securitySettings = new SecuritySettings({ 
        gymId,
        twoFactorEnabled: true,
        loginNotifications: { enabled: false }
      });
    } else {
      // Enable 2FA in SecuritySettings
      securitySettings.twoFactorEnabled = true;
    }
    await securitySettings.save();

    // Also update gym model for backward compatibility
    const gym = await Gym.findById(gymId);
    if (gym) {
      gym.twoFactorEnabled = true;
      gym.twoFactorType = 'email';
      await gym.save();
    }
    
    res.json({ 
      success: true, 
      message: 'Email-based 2FA enabled successfully',
      twoFactorEnabled: true,
      twoFactorType: 'email'
    });
  } catch (error) {
    console.error('❌ Error enabling email 2FA:', error);
    res.status(500).json({ success: false, message: 'Failed to enable 2FA' });
  }
});

// Disable 2FA for gym admin
router.post('/disable-2fa', gymadminAuth, async (req, res) => {
  try {
    const gymId = req.admin?.id;
    
    if (!gymId) {
      return res.status(401).json({ success: false, message: 'Invalid authentication token' });
    }

    // Find or create SecuritySettings for this gym
    let securitySettings = await SecuritySettings.findOne({ gymId });
    if (!securitySettings) {
      securitySettings = new SecuritySettings({ 
        gymId,
        twoFactorEnabled: false,
        loginNotifications: { enabled: false }
      });
    } else {
      // Disable 2FA in SecuritySettings
      securitySettings.twoFactorEnabled = false;
    }
    await securitySettings.save();

    // Also update gym model for backward compatibility
    const gym = await Gym.findById(gymId);
    if (gym) {
      gym.twoFactorEnabled = false;
      gym.twoFactorType = null;
      gym.twoFactorOTP = null;
      gym.twoFactorOTPExpiry = null;
      await gym.save();
    }
    
    res.json({ 
      success: true, 
      message: '2FA disabled successfully',
      twoFactorEnabled: false
    });
  } catch (error) {
    console.error('❌ Error disabling 2FA:', error);
    res.status(500).json({ success: false, message: 'Failed to disable 2FA' });
  }
});

// Get 2FA status for gym admin
router.get('/2fa-status', gymadminAuth, async (req, res) => {
  try {
    const gymId = req.admin?.id;
    
    if (!gymId) {
      return res.status(401).json({ success: false, message: 'Invalid authentication token' });
    }
    
    // Check SecuritySettings first
    let securitySettings = await SecuritySettings.findOne({ gymId });
    if (!securitySettings) {
      // Create default settings if they don't exist
      securitySettings = new SecuritySettings({ 
        gymId,
        twoFactorEnabled: false,
        loginNotifications: { enabled: false }
      });
      await securitySettings.save();
    }

    const gym = await Gym.findById(gymId);
    if (!gym) {
      return res.status(404).json({ success: false, message: 'Gym not found' });
    }
    
    res.json({ 
      success: true,
      data: {
        enabled: securitySettings.twoFactorEnabled || false,
        twoFactorEnabled: securitySettings.twoFactorEnabled || false,
        twoFactorType: gym.twoFactorType || null
      }
    });
  } catch (error) {
    console.error('❌ Error fetching 2FA status:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch 2FA status' });
  }
});

// Verify 2FA code during login (uses temp token) - TEMPORARILY DISABLED

router.post('/verify-login-2fa', tempAuth, async (req, res) => {
  try {
    const { otp } = req.body;
    const gymId = req.admin?.id;
    
    
    if (!gymId) {
      return res.status(401).json({ success: false, message: 'Invalid temporary token' });
    }
    
    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP is required' });
    }
    
    const gym = await Gym.findById(gymId);
    if (!gym) {
      return res.status(404).json({ success: false, message: 'Gym not found' });
    }
    
    // Check if OTP is valid and not expired
    if (!gym.twoFactorOTP || gym.twoFactorOTP !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    
    if (!gym.twoFactorOTPExpiry || gym.twoFactorOTPExpiry < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }
    
    // Clear the OTP after successful verification
    gym.twoFactorOTP = null;
    gym.twoFactorOTPExpiry = null;
    await gym.save();
    
    // Create final login token
    const payload = {
      admin: {
        id: gym.id,
        email: gym.email
      }
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    // Update lastLogin field
    gym.lastLogin = new Date();
    await gym.save();
    
    res.json({ 
      success: true, 
      message: 'Login successful!',
      token,
      gymId: gym.id
    });
  } catch (error) {
    console.error('❌ Error verifying login 2FA:', error);
    res.status(500).json({ success: false, message: 'Failed to verify 2FA' });
  }
});


// Verify 2FA code for email-based authentication (settings management)
router.post('/verify-2fa-email', gymadminAuth, async (req, res) => {
  try {
    const { otp } = req.body;
    const gymId = req.admin?.id;
    
    console.log(`🔐 Verify Email 2FA request from gym ID: ${gymId}`);
    
    if (!gymId) {
      return res.status(401).json({ success: false, message: 'Invalid authentication token' });
    }
    
    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP is required' });
    }
    
    const gym = await Gym.findById(gymId);
    if (!gym) {
      return res.status(404).json({ success: false, message: 'Gym not found' });
    }
    
    // Check if OTP is valid and not expired
    if (!gym.twoFactorOTP || gym.twoFactorOTP !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    
    if (!gym.twoFactorOTPExpiry || gym.twoFactorOTPExpiry < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }
    
    // Clear the OTP after successful verification
    gym.twoFactorOTP = null;
    gym.twoFactorOTPExpiry = null;
    await gym.save();
    
    console.log(`✅ Email 2FA verified successfully for gym: ${gym.gymName}`);
    res.json({ 
      success: true, 
      message: '2FA verification successful' 
    });
  } catch (error) {
    console.error('❌ Error verifying email 2FA:', error);
    res.status(500).json({ success: false, message: 'Failed to verify 2FA' });
  }
});

// Resend 2FA OTP
router.post('/resend-2fa-email', gymadminAuth, async (req, res) => {
  try {
    const gymId = req.admin?.id;
    const gymEmail = req.admin?.email;
    
    console.log(`🔐 Resend Email 2FA request from gym ID: ${gymId}`);
    
    if (!gymId || !gymEmail) {
      return res.status(401).json({ success: false, message: 'Invalid authentication token' });
    }
    
    const gym = await Gym.findById(gymId);
    if (!gym) {
      return res.status(404).json({ success: false, message: 'Gym not found' });
    }
    
    // Generate new OTP
    const newOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const newOTPExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Save new OTP to database
    gym.twoFactorOTP = newOTP;
    gym.twoFactorOTPExpiry = newOTPExpiry;
    await gym.save();
    
    // Send OTP via email
    const result = await gymController.send2FAEmail(gymEmail, newOTP, gym.gymName);
    
    if (result.success) {
      console.log(`✅ 2FA OTP resent successfully to gym: ${gym.gymName}`);
      res.json({ 
        success: true, 
        message: 'OTP resent successfully to your email' 
      });
    } else {
      console.error('❌ Failed to resend OTP email:', result.error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send OTP email' 
      });
    }
  } catch (error) {
    console.error('❌ Error resending email 2FA:', error);
    res.status(500).json({ success: false, message: 'Failed to resend OTP' });
  }
});

// Toggle login notifications (moved before parametric routes)
router.post('/toggle-login-notifications', gymadminAuth, async (req, res) => {
  try {
    const gymId = req.admin?.id;
    const { enabled } = req.body;
    
    if (!gymId) {
      return res.status(401).json({ success: false, message: 'Invalid authentication token' });
    }
    
    const SecuritySettings = require('../models/SecuritySettings');
    let settings = await SecuritySettings.findOne({ gymId });
    
    if (!settings) {
      // Create new settings document
      settings = new SecuritySettings({
        gymId,
        loginNotifications: {
          enabled: enabled || false,
          preferences: {
            email: enabled || false,
            browser: false,
            suspiciousOnly: false,
            newLocation: enabled || false
          }
        }
      });
    } else {
      // Update existing settings
      settings.loginNotifications = settings.loginNotifications || {};
      settings.loginNotifications.enabled = enabled || false;
      
      if (!settings.loginNotifications.preferences) {
        settings.loginNotifications.preferences = {
          email: enabled || false,
          browser: false,
          suspiciousOnly: false,
          newLocation: enabled || false
        };
      }
    }
    
    await settings.save();
    
    console.log(`✅ Login notifications ${enabled ? 'enabled' : 'disabled'} for gym ID: ${gymId}`);
    
    res.json({
      success: true,
      message: `Login notifications ${enabled ? 'enabled' : 'disabled'} successfully`,
      data: {
        enabled: settings.loginNotifications.enabled,
        preferences: settings.loginNotifications.preferences
      }
    });
  } catch (error) {
    console.error('Error toggling login notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to update notification settings' });
  }
});

// Get recent login attempts
router.get('/recent-logins', gymadminAuth, async (req, res) => {
  try {
    const gymId = req.admin?.id;
    
    if (!gymId) {
      return res.status(401).json({ success: false, message: 'Invalid authentication token' });
    }
    
    const recentLogins = await LoginAttempt.find({ gymId })
      .sort({ timestamp: -1 })
      .limit(20)
      .select('-gymId');

    res.json({
      success: true,
      data: recentLogins
    });
  } catch (error) {
    console.error('Error getting recent logins:', error);
    res.status(500).json({ success: false, message: 'Failed to get recent login attempts' });
  }
});

// Get login notification settings
router.get('/login-notification-status', gymadminAuth, async (req, res) => {
  try {
    const gymId = req.admin?.id;
    
    if (!gymId) {
      return res.status(401).json({ success: false, message: 'Invalid authentication token' });
    }
    
    const SecuritySettings = require('../models/SecuritySettings');
    const settings = await SecuritySettings.findOne({ gymId });
    
    // If no settings exist, return default (disabled)
    if (!settings) {
      return res.json({
        success: true,
        data: {
          enabled: false,
          preferences: {
            email: false,
            browser: false,
            suspiciousOnly: false,
            newLocation: false
          }
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        enabled: settings.loginNotifications?.enabled || false,
        preferences: settings.loginNotifications?.preferences || {
          email: false,
          browser: false,
          suspiciousOnly: false,
          newLocation: false
        }
      }
    });
  } catch (error) {
    console.error('Error getting login notification status:', error);
    res.status(500).json({ success: false, message: 'Failed to get notification status' });
  }
});

// ⭐ Upload Gym Photo (with metadata)
router.post('/photos', gymadminAuth, upload.single('photo'), require('../controllers/gymController').uploadGymPhoto);
// ⭐ Get all uploaded Gym Photos
router.get('/photos', gymadminAuth, require('../controllers/gymController').getAllGymPhotos);
// ⭐ Edit a Gym Photo
router.patch('/photos/:photoId', gymadminAuth, upload.single('photo'), require('../controllers/gymController').updateGymPhoto);
// remove photo
router.delete('/photos/:photoId', gymadminAuth, require('../controllers/gymController').deleteGymPhoto);
// ✅ Get Gyms with Pending Status [GET] /status/pending
router.get('/status/pending', async (req, res) => {
  try {
    const pendingGyms = await Gym.find({ status: 'pending' }); // Adjust the query if needed
    res.status(200).json(pendingGyms); // Respond with pending gyms
  } catch (error) {
    console.error('❌ Error fetching pending gyms:', error);
    res.status(500).json({ message: 'Error fetching pending gyms' });
  }
});
// ✅ Get Gyms with Approved Status [GET] /status/approved
router.get('/status/approved', async (req, res) => {
  try {
    const approvedGyms = await Gym.find({ status: 'approved' }); // Query for gyms with status 'approved'
    res.status(200).json(approvedGyms); // Respond with approved gyms
  } catch (error) {
    console.error('❌ Error fetching approved gyms:', error);
    res.status(500).json({ message: 'Error fetching approved gyms' });
  }
});

// ✅ Get Gyms with Rejected Status [GET] /status/rejected
router.get('/status/rejected', async (req, res) => {
  try {
    const rejectedGyms = await Gym.find({ status: 'rejected' }); // Query for gyms with status 'rejected'
    res.status(200).json(rejectedGyms); // Respond with rejected gyms
  } catch (error) {
    console.error('❌ Error fetching rejected gyms:', error);
    res.status(500).json({ message: 'Error fetching rejected gyms' });
  }
});
// ✅ Get Gyms by selected cities [POST] /by-cities
router.post('/by-cities', getGymsByCities);

// ✅ Search Gyms [GET] /search
// Helper to normalize activities from query
function normalizeActivities(activities) {
  if (Array.isArray(activities)) {
    return activities.filter(a => typeof a === 'string' && a.trim() !== '');
  } else if (typeof activities === 'string' && activities.trim() !== '') {
    return [activities.trim()];
  }
  return [];
}

// Helper to build filter object
function buildGymFilter({ city, pincode, activities }) {
  const filter = { status: 'approved' };
  if (city && typeof city === 'string' && city.trim() !== '') {
    filter['location.city'] = { $regex: new RegExp(city.trim(), 'i') };
  }
  if (pincode) {
    filter['location.pincode'] = pincode;
  }
  if (activities.length > 0) {
    const cleanedActivities = activities
      .filter(a => typeof a === 'string' && a.trim() !== '')
      .map(a => new RegExp(a.trim(), 'i'));
    if (cleanedActivities.length > 0) {
      // Search in activities.name field since activities are stored as objects
      filter['activities.name'] = { $in: cleanedActivities };
    }
  }
  return filter;
}

// Helper to aggregate gyms by price
async function aggregateGymsByPrice(filter, price) {
  return Gym.aggregate([
    { $match: filter },
    { $addFields: {
        minPlanPrice: {
          $let: {
            vars: {
              plansArray: {
                $cond: [
                  { $isArray: "$membershipPlans" },
                  "$membershipPlans",
                  []
                ]
              }
            },
            in: {
              $cond: [
                { $gt: [{ $size: "$$plansArray" }, 0] },
                {
                  $min: {
                    $map: {
                      input: {
                        $filter: {
                          input: "$$plansArray",
                          as: "plan",
                          cond: { $ne: ["$$plan.price", null] }
                        }
                      },
                      as: "plan",
                      in: { $toDouble: "$$plan.price" }
                    }
                  }
                },
                null
              ]
            }
          }
        }
      }
    },
    { $match: { minPlanPrice: { $lte: price } } }
  ]);
}

router.get('/search', async (req, res) => {
  try {
    const { city, pincode, maxPrice } = req.query;
    const activities = normalizeActivities(req.query.activities);

    console.log('Received activities from query:', req.query.activities);
    console.log('Normalized activityArray:', activities);

    const filter = buildGymFilter({ city, pincode, activities });

    let gyms;
    if (maxPrice && !isNaN(Number(maxPrice))) {
      gyms = await aggregateGymsByPrice(filter, Number(maxPrice));
    } else {
      gyms = await Gym.find(filter);
    }

    console.log(`✅ Found gyms: ${gyms.length}`);
    res.status(200).json(gyms);

  } catch (error) {
    console.error('❌ Error in /search:', error);
    if (error?.stack) {
      console.error('❌ Stack trace:', error.stack);
    }
    if (error?.errors) {
      console.error('❌ Mongoose errors:', error.errors);
    }
    if (!res.headersSent) {
      res.status(500).json({
        message: 'Server error during gym search',
        error: error.message,
        stack: error.stack,
        raw: error
      });
    }
  }
});

// ✅ Get Single Gym by ID [GET] /:id
router.get('/:id', async (req, res) => {
  try {
    // Return gym regardless of status (for admin panel detail view)
    const gym = await Gym.findOne({ _id: req.params.id });
    if (!gym) {
      return res.status(404).json({ message: 'Gym not found' });
    }
    res.status(200).json(gym);
  } catch (error) {
    console.error('❌ Failed to fetch gym with ID', req.params.id + ':', error);
    // Handle invalid ObjectId error
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid Gym ID format' });
    }
    res.status(500).json({ message: 'Error fetching gym', error: error.message });
  }
});

router.put('/activities', gymadminAuth, gymController.updateActivities);

// Session timeout settings
router.get('/security/session-timeout', gymadminAuth, async (req, res) => {
  try {
    const gymId = req.admin?.id;
    
    if (!gymId) {
      return res.status(401).json({ success: false, message: 'Invalid authentication token' });
    }
    
    const SecuritySettings = require('../models/SecuritySettings');
    const settings = await SecuritySettings.findOne({ gymId });
    
    const sessionSettings = settings?.sessionTimeout || { timeoutMinutes: 60, enabled: true };
    
    res.json({
      success: true,
      data: sessionSettings
    });
  } catch (error) {
    console.error('Error getting session timeout settings:', error);
    res.status(500).json({ success: false, message: 'Failed to get session timeout settings' });
  }
});

router.post('/security/session-timeout', gymadminAuth, async (req, res) => {
  try {
    const gymId = req.admin?.id;
    const { timeoutMinutes, enabled } = req.body;
    
    if (!gymId) {
      return res.status(401).json({ success: false, message: 'Invalid authentication token' });
    }
    
    if (timeoutMinutes && (timeoutMinutes < 5 || timeoutMinutes > 720)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Session timeout must be between 5 and 720 minutes' 
      });
    }
    
    const SecuritySettings = require('../models/SecuritySettings');
    let settings = await SecuritySettings.findOne({ gymId });
    
    if (!settings) {
      settings = new SecuritySettings({
        gymId,
        sessionTimeout: {
          timeoutMinutes: timeoutMinutes || 60,
          enabled: enabled !== false
        }
      });
    } else {
      settings.sessionTimeout = {
        timeoutMinutes: timeoutMinutes || settings.sessionTimeout?.timeoutMinutes || 60,
        enabled: enabled !== false
      };
    }
    
    await settings.save();
    
    res.json({
      success: true,
      message: `Session timeout ${enabled === false ? 'disabled' : `set to ${timeoutMinutes} minutes`}`,
      data: settings.sessionTimeout
    });
  } catch (error) {
    console.error('Error updating session timeout settings:', error);
    res.status(500).json({ success: false, message: 'Failed to update session timeout settings' });
  }
});

// 🐛 Debug route to test login notification settings
router.get('/debug/login-notification-status', gymadminAuth, async (req, res) => {
  try {
    const gymId = req.admin?.id;
    const SecuritySettings = require('../models/SecuritySettings');
    const Gym = require('../models/gym');
    
    const gym = await Gym.findById(gymId);
    const settings = await SecuritySettings.findOne({ gymId });
    
    const debugInfo = {
      gymId,
      gymEmail: gym?.email,
      has2FA: gym?.twoFactorEnabled || false,
      hasSecuritySettings: !!settings,
      loginNotificationsConfig: settings?.loginNotifications || null,
      loginNotificationsEnabled: settings?.loginNotifications?.enabled || false,
      emailPreference: settings?.loginNotifications?.preferences?.email || false,
      suspiciousOnlyPreference: settings?.loginNotifications?.preferences?.suspiciousOnly || false
    };
    
    console.log('🐛 Debug info for login notifications:', debugInfo);
    
    res.json({
      success: true,
      debugInfo
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ success: false, message: 'Debug failed', error: error.message });
  }
});

module.exports = router;
