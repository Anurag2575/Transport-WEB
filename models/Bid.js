const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  load: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Load',
    required: true
  },
  bidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  message: String,
  status: {
    type: String,
    enum: ['active', 'won', 'lost'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Bid', bidSchema);