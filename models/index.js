const mongoose = require('mongoose');

// Require all models to register them globally after mongoose connection
require('./Load');
require('./Complaint');
require('./Bid');
require('./User');

module.exports = { Load: mongoose.model('Load'), Complaint: mongoose.model('Complaint'), Bid: mongoose.model('Bid'), User: mongoose.model('User') };
