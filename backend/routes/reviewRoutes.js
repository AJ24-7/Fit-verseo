const express = require('express');
const router = express.Router();
const { addReview, getGymReviews, getGymAverageRating, addAdminReply } = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware'); // Assuming your auth middleware is here
const gymadminAuth = require('../middleware/gymadminAuth'); // For gym admin authentication

// @route   POST /api/reviews
// @desc    Submit a new review
// @access  Private (requires user to be logged in)
router.post('/', authMiddleware, addReview);

// @route   GET /api/reviews/gym/:gymId
// @desc    Get all reviews for a specific gym
// @access  Public
router.get('/gym/:gymId', getGymReviews);

// @route   GET /api/reviews/gym/:gymId/average
// @desc    Get average rating and review count for a gym
// @access  Public
router.get('/gym/:gymId/average', getGymAverageRating);

// @route   PUT /api/reviews/:reviewId/reply
// @desc    Add admin reply to a review
// @access  Private (Gym Admin only)
router.put('/:reviewId/reply', gymadminAuth, addAdminReply);

module.exports = router;
