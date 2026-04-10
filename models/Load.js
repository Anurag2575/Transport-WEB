const mongoose = require('mongoose');

const loadSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  origin: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  weight: Number,
  dimensions: String,
  value: Number,
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'bidding_closed', 'assigned', 'delivered'],
    default: 'open'
  },
  biddingEndTime: {
    type: Date,
    required: true
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  bids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bid'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Load', loadSchema);