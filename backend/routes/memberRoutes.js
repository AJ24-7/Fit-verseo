const express = require('express');
const router = express.Router();
const { addMember, getMembers } = require('../controllers/memberController');
const gymadminAuth = require('../middleware/gymadminAuth');
const memberImageUpload = require('../middleware/memberImageUpload');

// Add a new member (protected route, with image upload)
router.post('/', gymadminAuth, memberImageUpload.single('profileImage'), addMember);

// Get all members for a gym (protected route)
router.get('/', gymadminAuth, getMembers);

module.exports = router;
