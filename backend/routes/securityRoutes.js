const express = require('express');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Gym = require('../models/gym');
const LoginAttempt = require('../models/LoginAttempt');
const SecuritySettings = require('../models/SecuritySettings');
const authenticateGymToken = require('../middleware/gymadminAuth');
const router = express.Router();

// ===== TWO-FACTOR AUTHENTICATION ROUTES =====

// Generate 2FA secret and QR code
router.post('/generate-2fa-secret', authenticateGymToken, async (req, res) => {
  try {
    const gymId = req.admin.id;
    const gym = await Gym.findById(gymId);
    
    if (!gym) {
      return res.status(404).json({ success: false, message: 'Gym not found' });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Gym-Wale (${gym.gymName})`,
      issuer: 'Gym-Wale',
      length: 32
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    // Store temp secret in gym document (don't enable 2FA yet)
    gym.twoFactorTempSecret = secret.base32;
    await gym.save();

    res.json({
      success: true,
      data: {
        secret: secret.base32,
        qrCode: qrCode
      }
    });
  } catch (error) {
    console.error('Error generating 2FA secret:', error);
    res.status(500).json({ success: false, message: 'Failed to generate 2FA secret' });
  }
});

// Verify 2FA setup and enable
router.post('/verify-2fa-setup', authenticateGymToken, async (req, res) => {
  try {
    const { secret, code } = req.body;
    const gymId = req.admin.id;
    const gym = await Gym.findById(gymId);
    
    if (!gym) {
      return res.status(404).json({ success: false, message: 'Gym not found' });
    }

    // Verify the code
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    // Enable 2FA
    gym.twoFactorSecret = secret;
    gym.twoFactorEnabled = true;
    gym.twoFactorTempSecret = undefined;

    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 8; i++) {
      backupCodes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    
    // Hash backup codes before storing
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code => bcrypt.hash(code, 10))
    );
    
    gym.twoFactorBackupCodes = hashedBackupCodes;
    await gym.save();

    res.json({
      success: true,
      message: '2FA enabled successfully',
      data: {
        backupCodes: backupCodes
      }
    });
  } catch (error) {
    console.error('Error verifying 2FA setup:', error);
    res.status(500).json({ success: false, message: 'Failed to verify 2FA setup' });
  }
});

// Disable 2FA
router.post('/disable-2fa', authenticateGymToken, async (req, res) => {
  try {
    const { password } = req.body;
    const gymId = req.admin.id;
    const gym = await Gym.findById(gymId);
    
    if (!gym) {
      return res.status(404).json({ success: false, message: 'Gym not found' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, gym.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    // Disable 2FA
    gym.twoFactorEnabled = false;
    gym.twoFactorSecret = undefined;
    gym.twoFactorBackupCodes = undefined;
    await gym.save();

    res.json({ success: true, message: '2FA disabled successfully' });
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    res.status(500).json({ success: false, message: 'Failed to disable 2FA' });
  }
});

// Verify 2FA code during login
router.post('/verify-2fa', async (req, res) => {
  try {
    const { tempToken, code, email } = req.body;
    
    // Verify temporary token
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    if (!decoded.admin.temp) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    
    const gymId = decoded.admin.id;
    const gym = await Gym.findById(gymId);
    
    if (!gym || gym.email !== email) {
      return res.status(404).json({ success: false, message: 'Gym not found' });
    }
    
    // Verify 2FA code
    const verified = speakeasy.totp.verify({
      secret: gym.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2
    });
    
    if (!verified) {
      // Check if it's a backup code
      let isBackupCode = false;
      if (gym.twoFactorBackupCodes && gym.twoFactorBackupCodes.length > 0) {
        for (let i = 0; i < gym.twoFactorBackupCodes.length; i++) {
          const isMatch = await bcrypt.compare(code, gym.twoFactorBackupCodes[i]);
          if (isMatch) {
            // Remove used backup code
            gym.twoFactorBackupCodes.splice(i, 1);
            await gym.save();
            isBackupCode = true;
            break;
          }
        }
      }
      
      if (!isBackupCode) {
        return res.status(401).json({ success: false, message: 'Invalid verification code' });
      }
    }
    
    // Generate new permanent token
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
      message: '2FA verification successful',
      token,
      gymId: gym.id
    });
  } catch (error) {
    console.error('Error verifying 2FA:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    res.status(500).json({ success: false, message: 'Failed to verify 2FA' });
  }
});

// Get 2FA status
router.get('/2fa-status', authenticateGymToken, async (req, res) => {
  try {
    const gymId = req.admin.id;
    const gym = await Gym.findById(gymId);
    
    if (!gym) {
      return res.status(404).json({ success: false, message: 'Gym not found' });
    }

    res.json({
      success: true,
      data: {
        enabled: gym.twoFactorEnabled || false
      }
    });
  } catch (error) {
    console.error('Error getting 2FA status:', error);
    res.status(500).json({ success: false, message: 'Failed to get 2FA status' });
  }
});

// ===== LOGIN NOTIFICATIONS ROUTES =====

// Toggle login notifications
router.post('/toggle-login-notifications', authenticateGymToken, async (req, res) => {
  try {
    const { enabled } = req.body;
    const gymId = req.admin.id;
    
    let settings = await SecuritySettings.findOne({ gymId });
    if (!settings) {
      settings = new SecuritySettings({ gymId });
    }
    
    settings.loginNotifications.enabled = enabled;
    await settings.save();

    res.json({ success: true, message: `Login notifications ${enabled ? 'enabled' : 'disabled'}` });
  } catch (error) {
    console.error('Error toggling login notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to update login notifications' });
  }
});

// Get/Set notification preferences
router.get('/notification-preferences', authenticateGymToken, async (req, res) => {
  try {
    const gymId = req.admin.id;
    let settings = await SecuritySettings.findOne({ gymId });
    
    if (!settings) {
      settings = new SecuritySettings({ gymId });
      await settings.save();
    }

    res.json({
      success: true,
      data: settings.loginNotifications.preferences
    });
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    res.status(500).json({ success: false, message: 'Failed to get notification preferences' });
  }
});

router.post('/notification-preferences', authenticateGymToken, async (req, res) => {
  try {
    const gymId = req.admin.id;
    const preferences = req.body;
    
    let settings = await SecuritySettings.findOne({ gymId });
    if (!settings) {
      settings = new SecuritySettings({ gymId });
    }
    
    settings.loginNotifications.preferences = preferences;
    await settings.save();

    res.json({ success: true, message: 'Notification preferences saved' });
  } catch (error) {
    console.error('Error saving notification preferences:', error);
    res.status(500).json({ success: false, message: 'Failed to save notification preferences' });
  }
});

// Get recent login attempts
router.get('/recent-logins', authenticateGymToken, async (req, res) => {
  try {
    const gymId = req.admin.id;
    
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

// Report suspicious activity
router.post('/report-suspicious', authenticateGymToken, async (req, res) => {
  try {
    const { loginId } = req.body;
    
    await LoginAttempt.findByIdAndUpdate(loginId, {
      reported: true,
      reportedAt: new Date()
    });

    // Here you could add logic to send alerts to admins, block IPs, etc.
    
    res.json({ success: true, message: 'Suspicious activity reported' });
  } catch (error) {
    console.error('Error reporting suspicious activity:', error);
    res.status(500).json({ success: false, message: 'Failed to report suspicious activity' });
  }
});

// Get notification status
router.get('/notification-status', authenticateGymToken, async (req, res) => {
  try {
    const gymId = req.admin.id;
    let settings = await SecuritySettings.findOne({ gymId });
    
    if (!settings) {
      settings = new SecuritySettings({ gymId });
      await settings.save();
    }

    res.json({
      success: true,
      data: {
        enabled: settings.loginNotifications.enabled
      }
    });
  } catch (error) {
    console.error('Error getting notification status:', error);
    res.status(500).json({ success: false, message: 'Failed to get notification status' });
  }
});

// ===== SESSION TIMEOUT ROUTES =====

// Get session timeout settings
router.get('/session-timeout', authenticateGymToken, async (req, res) => {
  try {
    const gymId = req.admin.id;
    let settings = await SecuritySettings.findOne({ gymId });
    
    if (!settings) {
      settings = new SecuritySettings({ gymId });
      await settings.save();
    }

    res.json({
      success: true,
      data: {
        timeoutMinutes: settings.sessionTimeout.timeoutMinutes,
        enabled: settings.sessionTimeout.enabled
      }
    });
  } catch (error) {
    console.error('Error getting session timeout settings:', error);
    res.status(500).json({ success: false, message: 'Failed to get session timeout settings' });
  }
});

// Update session timeout settings
router.post('/session-timeout', authenticateGymToken, async (req, res) => {
  try {
    const { timeoutMinutes, enabled } = req.body;
    const gymId = req.admin.id;
    
    let settings = await SecuritySettings.findOne({ gymId });
    if (!settings) {
      settings = new SecuritySettings({ gymId });
    }
    
    settings.sessionTimeout.timeoutMinutes = timeoutMinutes;
    settings.sessionTimeout.enabled = enabled;
    await settings.save();

    res.json({ success: true, message: 'Session timeout settings updated' });
  } catch (error) {
    console.error('Error updating session timeout settings:', error);
    res.status(500).json({ success: false, message: 'Failed to update session timeout settings' });
  }
});

// Extend session
router.post('/extend-session', authenticateGymToken, async (req, res) => {
  try {
    // In a real implementation, you might update the JWT token expiry
    // or store session extension info in the database
    
    res.json({ 
      success: true, 
      message: 'Session extended',
      extendedUntil: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
    });
  } catch (error) {
    console.error('Error extending session:', error);
    res.status(500).json({ success: false, message: 'Failed to extend session' });
  }
});

module.exports = router;
