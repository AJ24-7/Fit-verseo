const express = require('express');
const router = express.Router();
const { submitReview, getGymReviews } = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware'); // Assuming your auth middleware is here

// @route   POST /api/reviews
// @desc    Submit a new review
// @access  Private (requires user to be logged in)router.post('/', authMiddleware, submitReview);

// @route   GET /api/reviews/gym/:gymId
// @desc    Get all reviews for a specific gym
// @access  Publicrouter.get('/gym/:gymId', getGymReviews);

// @route   GET /api/reviews/gym/:gymId/average
// @desc    Get average rating and review count for a gym
// @access  Public
const { getGymAverageRating } = require('../controllers/reviewController');
router.get('/gym/:gymId/average', getGymAverageRating);

module.exports = router;
