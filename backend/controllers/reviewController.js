const Review = require('../models/Review');
const Gym = require('../models/gym'); // Assuming you have a Gym model
const User = require('../models/User'); // Assuming you have a User model

// @desc    Submit a review for a gym
// @route   POST /api/reviews
// @access  Private (User must be logged in)
const submitReview = async (req, res) => {
    const { gymId, rating, comment, reviewerName } = req.body;
    const userId = req.userId; // Extracted from authMiddleware

    try {
        const gym = await Gym.findById(gymId);
        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        // Optional: Check if the user has already reviewed this gym
        // const existingReview = await Review.findOne({ gym: gymId, user: userId });
        // if (existingReview) {
        //     return res.status(400).json({ message: 'You have already reviewed this gym' });
        // }

        const review = new Review({
            gym: gymId,
            user: userId,
            rating: Number(rating),
            comment,
            reviewerName: reviewerName || req.user.name // Use name from form, or fallback to authenticated user's name
        });

        await review.save();

        // After saving the review, update the gym's average rating and review count
        const reviewsForGym = await Review.find({ gym: gymId });
        const totalRating = reviewsForGym.reduce((acc, item) => item.rating + acc, 0);
        gym.averageRating = totalRating / reviewsForGym.length;
        gym.numReviews = reviewsForGym.length;
        await gym.save();

        // Populate user details for the response
        const populatedReview = await Review.findById(review._id).populate('user', 'name');

        res.status(201).json({ message: 'Review submitted successfully', review: populatedReview });

    } catch (error) {
        console.error('Error submitting review:', error);
        res.status(500).json({ message: 'Server error while submitting review' });
    }
};

// @desc    Get all reviews for a specific gym
// @route   GET /api/reviews/gym/:gymId
// @access  Public
const getGymReviews = async (req, res) => {
    const { gymId } = req.params;

    try {
        const gym = await Gym.findById(gymId);
        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        const reviews = await Review.find({ gym: gymId })
            .populate('user', 'name') // Populate user's name
            .sort({ createdAt: -1 }); // Show newest reviews first

        res.status(200).json(reviews);

    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ message: 'Server error while fetching reviews' });
    }
};

// @desc    Get average rating and review count for a specific gym
// @route   GET /api/reviews/gym/:gymId/average
// @access  Public
const getGymAverageRating = async (req, res) => {
    const { gymId } = req.params;
    try {
        const gym = await Gym.findById(gymId);
        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }
        // Use stored average if available, otherwise calculate from reviews
        let averageRating = gym.averageRating;
        let numReviews = gym.numReviews;
        if (averageRating === undefined || numReviews === undefined) {
            const reviews = await Review.find({ gym: gymId });
            numReviews = reviews.length;
            averageRating = numReviews > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / numReviews) : 0;
        }
        res.status(200).json({ averageRating, numReviews });
    } catch (error) {
        console.error('Error fetching average rating:', error);
        res.status(500).json({ message: 'Server error while fetching average rating' });
    }
};

module.exports = {
    submitReview,
    getGymReviews,
    getGymAverageRating
};
