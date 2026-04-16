const express = require('express');
const router = express.Router();
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { closeExpiredLoads } = require('../utils/bidding');

// Multer config for photo upload
const imageUploadDir = path.join(__dirname, '..', 'public', 'images');
if (!fs.existsSync(imageUploadDir)) {
  fs.mkdirSync(imageUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imageUploadDir);
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

// Admin dashboard - list all users
router.get('/admin/dashboard', ensureAdmin, async (req, res) => {
  try {
    const users = await User.find({})
      .select('username email firstName lastName photo isVerified isActive isAdmin joinDate complaints')
      .sort({ joinDate: -1 });
    res.render('pages/admin-dashboard', { users });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading admin dashboard');
    res.redirect('/dashboard');
  }
});

// Admin complaints page
router.get('/admin/complaints', ensureAdmin, async (req, res) => {
  try {
    const selectedUserId = req.query.userId;
    const users = await User.find({})
      .select('username email photo')
      .sort({ username: 1 });

    const allComplaints = await Complaint.find({})
      .select('title description status createdAt load complainant accused')
      .populate([
        { path: 'load', select: 'title' },
        { path: 'complainant', select: 'username' },
        { path: 'accused', select: 'username' }
      ])
      .sort({ createdAt: -1 });

    const complaintUsers = users.map((user) => {
      const userId = user._id.toString();
      return {
        ...user.toObject(),
        filedByUser: allComplaints.filter(
          (complaint) => complaint.complainant && complaint.complainant._id.toString() === userId
        ),
        filedAgainstUser: allComplaints.filter(
          (complaint) => complaint.accused && complaint.accused._id.toString() === userId
        )
      };
    });

    const visibleComplaintUsers = selectedUserId
      ? complaintUsers.filter((user) => user._id.toString() === selectedUserId)
      : complaintUsers;

    const selectedUser = selectedUserId
      ? complaintUsers.find((user) => user._id.toString() === selectedUserId) || null
      : null;

    res.render('pages/admin-complaints', {
      complaintUsers: visibleComplaintUsers,
      totalComplaints: selectedUser
        ? (selectedUser.filedByUser.length + selectedUser.filedAgainstUser.length)
        : allComplaints.length,
      selectedUser
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading complaints');
    res.redirect('/users/admin/dashboard');
  }
});

// Admin verify user
router.post('/admin/users/:id/verify', ensureAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    user.isVerified = true;
    await user.save();
    res.json({ success: true, isVerified: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin activate/deactivate user
router.post('/admin/users/:id/toggle-active', ensureAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'You cannot deactivate your own account' });
    }

    const requestedState = req.body && typeof req.body.isActive === 'boolean'
      ? req.body.isActive
      : user.isActive === false;

    user.isActive = requestedState;
    await user.save();

    res.json({ success: true, isActive: user.isActive });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
