const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User');

passport.use(
  new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      console.log('Auth attempt for email:', email);
      const user = await User.findOne({ email: email });
      if (!user) {
        console.log('User not found');
        return done(null, false, { message: 'That email is not registered' });
      }
      if (user.isActive === false) {
        console.log('User account deactivated');
        return done(null, false, { message: 'Your account has been deactivated. Please contact an admin.' });
      }
      console.log('User found, checking password');

      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        console.log('Password match, login success');
        return done(null, user);
      } else {
        console.log('Password mismatch');
        return done(null, false, { message: 'Password incorrect' });
      }
    } catch (err) {
      console.error('Auth strategy error:', err);
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = {
  ensureAuthenticated: (req, res, next) => {
    if (req.isAuthenticated()) {
      if (req.user && req.user.isActive === false) {
        req.logout(() => {});
        req.flash('error_msg', 'Your account has been deactivated. Please contact an admin.');
        return res.redirect('/auth/login');
      }
      return next();
    }
    req.flash('error_msg', 'Please log in to view this resource');
    res.redirect('/auth/login');
  },
  ensureAdmin: (req, res, next) => {
    if (req.isAuthenticated() && req.user && req.user.isActive === false) {
      req.logout(() => {});
      req.flash('error_msg', 'Your account has been deactivated. Please contact an admin.');
      return res.redirect('/auth/login');
    }
    if (req.isAuthenticated() && req.user.isAdmin) {
      return next();
    }
    req.flash('error_msg', 'Admin access required');
    res.redirect('/dashboard');
  }
};
