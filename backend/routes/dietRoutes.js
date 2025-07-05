const express = require('express');
const router = express.Router();
const { saveDietPlan, getUserDietPlan } = require('../controllers/dietController');
const protect = require('../middleware/authMiddleware');

router.post('/user-meals', protect, saveDietPlan);
router.get('/my-plan', protect, getUserDietPlan);

module.exports = router;
