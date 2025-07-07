const express = require('express');
const router = express.Router();
const multer = require('multer');
const Trainer = require('../models/trainerModel');

// File storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/trainers'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Handle form submission
const cpUpload = upload.fields([
  { name: 'certifications', maxCount: 5 },
  { name: 'photo', maxCount: 1 }
]);


const trainerController = require('../controllers/trainerController');

// GET /api/trainers?status=pending&gym=<gymId>
router.get('/', async (req, res) => {
  try {
    const status = req.query.status;
    const gym = req.query.gym;
    let filter = {};
    if (status) filter.status = status;
    if (gym) filter.gym = gym;
    const trainers = await Trainer.find(filter).select('-password');
    res.status(200).json(trainers);
  } catch (err) {
    console.error('Error fetching trainers:', err);
    res.status(500).json({ message: 'Error fetching trainers' });
  }
});

router.post('/register', cpUpload, trainerController.registerTrainer);

module.exports = router;
