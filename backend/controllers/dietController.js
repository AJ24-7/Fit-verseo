const User = require('../models/User');
const DietPlan = require('../models/DietPlan');

exports.saveDietPlan = async (req, res) => {
  try {
    // 🔑 This is the correct way to access userId based on your authMiddleware + token
    const userId = req.userId;

    const { meals } = req.body;

    if (!meals) {
      return res.status(400).json({ message: 'Meals data missing' });
    }

    // 📝 You can either update if one already exists or create new
    const updatedPlan = await DietPlan.findOneAndUpdate(
      { user: userId },
      { $set: { selectedMeals: meals } },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      message: 'Diet plan saved successfully',
      plan: updatedPlan,
    });

  } catch (error) {
    console.error('❌ Error saving diet plan:', error);
    return res.status(500).json({ message: 'Error saving diet plan', error: error.message });
  }
};
exports.getUserDietPlan = async (req, res) => {
  try {
    // Use req.userId, not req.user._id
    const plan = await DietPlan.findOne({ user: req.userId });
    if (!plan) return res.status(404).json({ message: "No plan found" });

    res.status(200).json(plan);
  } catch (err) {
    console.error("Error fetching diet plan:", err);
    res.status(500).json({ message: "Server error" });
  }
};
