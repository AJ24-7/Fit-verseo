const express = require('express');
const router = express.Router();
const multer = require('multer');
const Trainer = require('../models/trainerModel');
const trainerController = require('../controllers/trainerController');


// File storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/trainers'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Handle form submission

// Accept both 'profileImage' and 'photo' for trainer profile photo
const cpUpload = upload.fields([
  { name: 'certifications', maxCount: 5 },
  { name: 'photo', maxCount: 1 },
  { name: 'profileImage', maxCount: 1 }
]);

// Admin: Get all trainers from all gyms, filterable by status
router.get('/all', trainerController.getAllTrainersForAdmin);

// GET /api/trainers?status=pending&gym=<gymId>
router.get('/', async (req, res) => {
  try {
    const status = req.query.status;
    const gym = req.query.gym;
    let filter = {};
    if (status) filter.status = status;
    if (gym) filter.gym = gym;
    // Populate gym field and select all fields except password
    const trainers = await Trainer.find(filter).populate('gym').select('-password');
    // Always send image field for frontend compatibility
    const processed = trainers.map(trainer => ({
      _id: trainer._id,
      id: trainer._id,
      firstName: trainer.firstName,
      lastName: trainer.lastName,
      email: trainer.email,
      phone: trainer.phone,
      specialty: trainer.specialty,
      status: trainer.status,
      experience: trainer.experience,
      certifications: trainer.certifications,
      availability: trainer.availability,
      locations: trainer.locations,
      bio: trainer.bio,
      rate: trainer.rate,
      // Always provide full image URL for frontend
      image: trainer.photo ? `/uploads/trainers/${trainer.photo}` : null,
      gym: trainer.gym ? {
        _id: trainer.gym._id,
        gymName: trainer.gym.gymName,
        address: trainer.gym.location?.address || '',
        city: trainer.gym.location?.city || '',
        logoUrl: trainer.gym.logoUrl || null
      } : null,
    }));
    res.status(200).json(processed);
  } catch (err) {
    console.error('Error fetching trainers:', err);
    res.status(500).json({ message: 'Error fetching trainers' });
  }
});

router.post('/register', cpUpload, trainerController.registerTrainer);

// Approve a trainer
router.patch('/:id/approve', trainerController.approveTrainer);
// Reject a trainer
router.patch('/:id/reject', trainerController.rejectTrainer);
// Delete a trainer
router.delete('/:id', trainerController.deleteTrainer);

module.exports = router;
