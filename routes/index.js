const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');

// Home page
router.get('/', (req, res) => {
  res.render('pages/home');
});

// Dashboard (requires authentication)
router.get('/dashboard', ensureAuthenticated, (req, res) => {
  if (req.user.isAdmin) {
    res.redirect('/users/admin/dashboard');
  } else {
    res.redirect(`/users/${req.user._id}`);
  }
});

module.exports = router;