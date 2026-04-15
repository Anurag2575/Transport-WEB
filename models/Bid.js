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
    enum: ['pending', 'active', 'won', 'loading', 'in-progress', 'in-transit', 'on-halt', 'unloading', 'completed', 'cancelled', 'halted'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  hasComplaint: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Bid', bidSchema);

