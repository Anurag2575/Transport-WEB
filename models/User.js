const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  firstName: String,
  lastName: String,
  mobile: String,
  address: String,
  photo: String,
  isVerified: {
    type: Boolean,
    default: false
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  loadsPosted: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Load'
  }],
  loadsDelivered: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Load'
  }],
  complaints: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint'
  }]
});

module.exports = mongoose.model('User', userSchema);