const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
  name: String,
  calories: Number,
  price: String
});

const dietPlanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  goal: { type: String, enum: ['weight-loss', 'muscle-gain', 'maintenance'], required: true },
  budget: { type: String, enum: ['low', 'medium', 'high'], required: true },
  selectedMeals: {
    breakfast: [mealSchema],
    lunch: [mealSchema],
    dinner: [mealSchema],
    snacks: [mealSchema]
  }
}, { timestamps: true });

module.exports = mongoose.model('DietPlan', dietPlanSchema);
