const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  complainant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  accused: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  load: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Load'
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'resolved', 'dismissed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Complaint', complaintSchema);