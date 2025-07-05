

const Member = require('../models/Member');
const Gym = require('../models/gym');
const path = require('path');

// Add a new member to a gym
exports.addMember = async (req, res) => {
  try {
    // Accept gymId from req.admin (set by gymadminAuth) or body
    const gymId = (req.admin && (req.admin.gymId || req.admin.id)) || req.body.gymId;
    if (!gymId) return res.status(400).json({ message: 'Gym ID is required.' });
    const gym = await Gym.findById(gymId);
    if (!gym) return res.status(404).json({ message: 'Gym not found.' });

    let profileImagePath = '';
    if (req.file) {
      // Save relative path for frontend use
      profileImagePath = '/uploads/profile-pics/' + req.file.filename;
    }

    const member = new Member({
      gym: gymId,
      memberName: req.body.memberName,
      age: req.body.memberAge,
      gender: req.body.memberGender,
      phone: req.body.memberPhone,
      email: req.body.memberEmail,
      paymentMode: req.body.paymentMode,
      paymentAmount: req.body.paymentAmount,
      planSelected: req.body.planSelected,
      monthlyPlan: req.body.monthlyPlan,
      activityPreference: req.body.activityPreference,
      profileImage: profileImagePath
    });
    await member.save();
    res.status(201).json({ message: 'Member added successfully', member });
  } catch (err) {
    console.error('Error adding member:', err);
    res.status(500).json({ message: 'Server error while adding member' });
  }
};
// Update member details
exports.updateMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const updateFields = {};

    // Only allow updating specific fields
    if (req.body.phone) updateFields.phone = req.body.phone;
    if (req.body.email) updateFields.email = req.body.email;
    if (req.body.address) updateFields.address = req.body.address;
    if (req.body.activityPreference) updateFields.activityPreference = req.body.activityPreference;

    if (req.file) {
      updateFields.profileImage = '/uploads/profile-pics/' + req.file.filename;
    }

    const updatedMember = await Member.findByIdAndUpdate(
      memberId,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedMember) {
      return res.status(404).json({ message: 'Member not found' });
    }

    res.status(200).json({ message: 'Member updated successfully', member: updatedMember });
  } catch (err) {
    console.error('Error updating member:', err);
    res.status(500).json({ message: 'Server error while updating member' });
  }
};
// Get all members for a gym
exports.getMembers = async (req, res) => {
  try {
   const gymId = (req.admin && (req.admin.gymId || req.admin.id)) || req.body.gymId;
    if (!gymId) return res.status(400).json({ message: 'Gym ID is required.' });
    const members = await Member.find({ gym: gymId }).sort({ joinDate: -1 });
    res.status(200).json(members);
  } catch (err) {
    console.error('Error fetching members:', err);
    res.status(500).json({ message: 'Server error while fetching members' });
  }
};
