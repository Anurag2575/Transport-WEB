const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Register page
router.get('/register', (req, res) => {
  res.render('pages/register');
});

// Register handle
router.post('/register', async (req, res) => {
  const { username, email, password, password2, firstName, lastName, mobile, userRole } = req.body;
  let errors = [];

  if (!username || !email || !password || !password2) {
    errors.push({ msg: 'Please fill in all fields' });
  }

  if (password !== password2) {
    errors.push({ msg: 'Passwords do not match' });
  }

  if (password.length < 6) {
    errors.push({ msg: 'Password should be at least 6 characters' });
  }

  if (errors.length > 0) {
    res.render('pages/register', {
      errors,
      username,
      email,
      firstName,
      lastName,
      mobile
    });
  } else {
    try {
      const user = await User.findOne({ email: email });
      if (user) {
        errors.push({ msg: 'Email is already registered' });
        res.render('pages/register', {
          errors,
          username,
          email,
          firstName,
          lastName,
          mobile
        });
      } else {
        const newUser = new User({
          username,
          email,
          password,
          firstName,
          lastName,
          mobile,
          isAdmin: req.body.userRole === 'admin'
        });

        const salt = await bcrypt.genSalt(10);
        newUser.password = await bcrypt.hash(password, salt);

        await newUser.save();
        req.flash('success_msg', 'You are now registered and can log in');
        res.redirect('/auth/login');
      }
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  }
});

// Login page
router.get('/login', (req, res) => {
  res.render('pages/login');
});

// Login handle
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/auth/login',
    failureFlash: true
  })(req, res, next);
});

// Logout handle
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) { return next(err); }
    req.flash('success_msg', 'You are logged out');
    res.redirect('/auth/login');
  });
});

module.exports = router;