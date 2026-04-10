const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');

// Home page
router.get('/', (req, res) => {
  res.render('pages/home');
});

// Dashboard (requires authentication) - redirects to user profile
router.get('/dashboard', ensureAuthenticated, (req, res) => {
  res.redirect(`/users/${req.user._id}`);
});

module.exports = router;