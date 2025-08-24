const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { OAuth2Client } = require('google-auth-library');

// ====== Generate JWT ======
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// ====== Register User ======
const registerUser = async (req, res) => {
  const { username, email, phone, password } = req.body;

  // Split full name into first and last name
  let firstName = "";
  let lastName = "";
  if (username) {
    const nameParts = username.trim().split(" ");
    firstName = nameParts[0];
    lastName = nameParts.slice(1).join(" "); // Handles middle names too
  }

  console.log('📩 Received signup data:', { username, email, phone });

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      firstName,
      lastName,
      username, // keep for backward compatibility
      email,
      phone,
      password: hashedPassword,
    });

    const token = generateToken(newUser._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        profileImage: newUser.profileImage, // <-- ADD THIS LINE
      },
    });
  } catch (error) {
    console.error('❌ Error in registerUser:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

// ====== Login User ======
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid password' });

    const token = generateToken(user._id);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage, // <-- ADD THIS LINE
      },
    });
  } catch (error) {
    console.error('❌ Error in loginUser:', error.message);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};
// ====== Google OAuth Sign-In/Sign-Up ======
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const googleAuth = async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ message: "No credential provided" });

  try {
    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, picture, sub } = payload;

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      // Split name into first and last
      let firstName = "";
      let lastName = "";
      if (name) {
        const nameParts = name.trim().split(" ");
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(" ");
      }
      user = await User.create({
        firstName,
        lastName,
        username: name,
        email,
        password: sub, // Not used for Google users, but required by schema
        profileImage: picture,
        authProvider: 'google',
        // You can add other default fields here
      });
    } else {
      // If user exists and has default image, update to Google image
      if (
        (!user.profileImage || user.profileImage === "/uploads/profile-pics/default.png") &&
        picture
      ) {
        user.profileImage = picture;
        await user.save();
      }
    }

    // Generate JWT
    const token = generateToken(user._id);

    res.status(200).json({
      message: "Google authentication successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error("❌ Google Auth Error:", error);
    res.status(401).json({ message: "Google authentication failed" });
  }
};
//Update profile
const updateProfile = async (req, res) => {
  console.log("BODY:", req.body);
  try {
    const userId = req.userId;
    const {
      firstName, lastName, username, birthdate, phone, email,
      heightFeet, heightInches, weight, fitnessLevel, primaryGoal,
      workoutPreferences, removeProfileImage, confirmPassword
     
    } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check if the user is a Google user
    const isGoogleUser =
      user.authProvider === 'google' ||
      (user.profileImage && user.profileImage.startsWith('http'));

    // Password confirmation for non-Google users
    if (!isGoogleUser) {
      if (!confirmPassword) {
        return res.status(400).json({ message: "Password confirmation is required." });
      }
      const isMatch = await bcrypt.compare(confirmPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Incorrect password." });
      }
    }

    // Update basic profile fields only
    user.firstName = firstName;
    user.lastName = lastName;
    user.username = username;
    user.birthdate = birthdate;
    user.phone = phone;
    user.email = email;
    
    // Update fitness details
    user.height = { feet: heightFeet, inches: heightInches };
    user.weight = weight;
    user.fitnessLevel = fitnessLevel;
    user.primaryGoal = primaryGoal;
    user.workoutPreferences = Array.isArray(workoutPreferences)
      ? workoutPreferences
      : workoutPreferences
        ? [workoutPreferences]
        : [];

   
    // Remove profile image if requested
    if (removeProfileImage === "true") {
      if (user.profileImage && user.profileImage !== "/uploads/profile-pics/default.png") {
        const imagePath = path.join(__dirname, "..", "..", "frontend", user.profileImage);
        fs.unlink(imagePath, (err) => {
          if (err) {
            console.error("Failed to delete old profile image:", err.message);
          }
        });
      }
      user.profileImage = "/uploads/profile-pics/default.png";
    }

    // Profile image upload
    if (req.file) {
      user.profileImage = `/uploads/profile-pics/${req.file.filename}`;
    }

     try {
      await user.save();
      return res.status(200).json({ message: 'Profile updated successfully', user });
    } catch (err) {
      if (err.name === 'ValidationError') {
        return res.status(400).json({ message: err.message });
      }
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
  catch (error) {
    console.error('❌ Error in updateProfile:', error);
    return res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};

// ✅ Export all controller functions
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// === Forgot Password: Request OTP ===
const requestPasswordResetOTP = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'No user found with this email.' });

    // Generate 6-digit OTP
    const otp = (Math.floor(100000 + Math.random() * 900000)).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry

    user.passwordResetOTP = otp;
    user.passwordResetOTPExpiry = expiry;
    await user.save();

    // Send OTP email
    await sendEmail(user.email, 'Your Password Reset OTP', `<p>Your OTP for password reset is: <b>${otp}</b>. It is valid for 10 minutes.</p>`);

    res.json({ success: true, message: 'OTP sent to your email.' });
  } catch (err) {
    console.error('Error in requestPasswordResetOTP:', err);
    res.status(500).json({ success: false, message: 'Error sending OTP. Please try again.' });
  }
};

// === Forgot Password: Verify OTP and Reset Password ===
const verifyPasswordResetOTP = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required.' });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'No user found with this email.' });
    if (!user.passwordResetOTP || !user.passwordResetOTPExpiry) {
      return res.status(400).json({ success: false, message: 'No OTP requested or OTP expired.' });
    }
    if (user.passwordResetOTP !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }
    if (user.passwordResetOTPExpiry < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP expired.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetOTP = undefined;
    user.passwordResetOTPExpiry = undefined;
    await user.save();
    res.json({ success: true, message: 'Password reset successful. You can now login.' });
  } catch (err) {
    console.error('Error in verifyPasswordResetOTP:', err);
    res.status(500).json({ success: false, message: 'Error resetting password. Please try again.' });
  }
};

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      phone: user.phone,
      profileImage: user.profileImage, // <-- This will be Google URL if Google user
      // ...add other fields as needed
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
// Save workout schedule
const saveWorkoutSchedule = async (req, res) => {
  try {
    const userId = req.userId;
    const { schedule } = req.body;
    if (!schedule) return res.status(400).json({ message: "No schedule provided" });
    const user = await User.findById(userId);
    user.workoutSchedule = schedule;
    await user.save();
    res.status(200).json({ message: "Workout schedule saved", schedule: user.workoutSchedule });
  } catch (err) {
    res.status(500).json({ message: "Failed to save schedule" });
  }
};

// Get workout schedule
const getWorkoutSchedule = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.status(200).json({ schedule: user.workoutSchedule || {} });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch schedule" });
  }
};

// === Change Password for authenticated users ===
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user is Google user
    if (user.authProvider === 'google' || (user.profileImage && user.profileImage.startsWith('http'))) {
      return res.status(400).json({ message: 'Cannot change password for Google accounts' });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(userId, { password: hashedPassword });
    
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
};

module.exports = {
  registerUser,
  loginUser,
   updateProfile,
  requestPasswordResetOTP,
  verifyPasswordResetOTP,
  changePassword,
  googleAuth,
  getUserProfile,
  saveWorkoutSchedule,
  getWorkoutSchedule
};

