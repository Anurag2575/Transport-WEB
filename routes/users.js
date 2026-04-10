const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const { closeExpiredLoads } = require('../utils/bidding');

// Multer config for photo upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images/');
  },
  filename: (req, file, cb) => {
    cb(null, req.user._id + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// User profile
router.get('/:id', async (req, res) => {
  try {
    await closeExpiredLoads();
    const user = await User.findById(req.params.id)
      .populate({
        path: 'loadsPosted',
        select: 'title origin destination status biddingEndTime winner',
        populate: { path: 'winner', select: 'username' }
      })
      .populate('loadsDelivered', 'title origin destination')
      .populate('complaints', 'title description status createdAt');
    
    if (!user) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/');
    }

    res.render('pages/profile', { profileUser: user });
  } catch (err) {
    console.error('Profile load error:', err);
    req.flash('error_msg', 'Error loading profile');
    res.redirect('/');
  }
});

// Edit profile page
router.get('/:id/edit', ensureAuthenticated, (req, res) => {
  if (req.user._id.toString() !== req.params.id) {
    req.flash('error_msg', 'Not authorized');
    return res.redirect('/users/' + req.params.id);
  }
  res.render('pages/edit-profile', { user: req.user });
});

// Update profile
router.put('/:id', ensureAuthenticated, upload.single('photo'), async (req, res) => {
  if (req.user._id.toString() !== req.params.id) {
    req.flash('error_msg', 'Not authorized');
    return res.redirect('/users/' + req.params.id);
  }

  const { firstName, lastName, mobile, address } = req.body;
  const updateData = { firstName, lastName, mobile, address };

  if (req.file) {
    updateData.photo = req.file.filename;
  }

  try {
    await User.findByIdAndUpdate(req.params.id, updateData);
    req.flash('success_msg', 'Profile updated successfully');
    res.redirect('/users/' + req.params.id);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating profile');
    res.redirect('/users/' + req.params.id + '/edit');
  }
});

module.exports = router;
