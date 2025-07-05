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

router.post('/register', cpUpload, async (req, res) => {
  try {
    const {
      firstName, lastName, email, phone,
      specialty, experience, availability,
      bio, rate
    } = req.body;

    const locations = req.body.locations ? [].concat(req.body.locations) : [];
    const certifications = req.files['certifications']?.map(f => f.filename) || [];
    const photo = req.files['photo']?.[0]?.filename || '';

    const newTrainer = new Trainer({
      firstName, lastName, email, phone,
      specialty, experience, availability,
      locations, bio, rate,
      certifications, photo
    });

    await newTrainer.save();
    res.status(200).json({ message: 'Application submitted. Awaiting admin approval.' });
  } catch (err) {
    res.status(500).json({ message: 'Submission failed.', error: err.message });
  }
});

module.exports = router;
