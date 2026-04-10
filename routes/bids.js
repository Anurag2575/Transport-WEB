const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const Bid = require('../models/Bid');
const Load = require('../models/Load');
const { syncExpiredLoad } = require('../utils/bidding');

// Place bid
router.post('/:loadId', ensureAuthenticated, async (req, res) => {
  const { amount, message } = req.body;
  const loadId = req.params.loadId;

  try {
    const load = await Load.findById(loadId);
    await syncExpiredLoad(load);

    if (!load || load.status !== 'open') {
      req.flash('error_msg', 'Load not available for bidding');
      return res.redirect('/loads/' + loadId);
    }

    if (load.biddingEndTime <= new Date()) {
      req.flash('error_msg', 'Bidding time has ended for this load');
      return res.redirect('/loads/' + loadId);
    }

    // Check if user already bid on this load
    const existingBid = await Bid.findOne({ load: loadId, bidder: req.user._id });
    if (existingBid) {
      req.flash('error_msg', 'You have already bid on this load');
      return res.redirect('/loads/' + loadId);
    }

    const newBid = new Bid({
      load: loadId,
      bidder: req.user._id,
      amount: parseFloat(amount),
      message
    });

    await newBid.save();
    await Load.findByIdAndUpdate(loadId, { $push: { bids: newBid._id } });

    req.flash('success_msg', 'Bid placed successfully');
    res.redirect('/loads/' + loadId);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error placing bid');
    res.redirect('/loads/' + loadId);
  }
});

// My bids
router.get('/my-bids', ensureAuthenticated, async (req, res) => {
  try {
    const bids = await Bid.find({ bidder: req.user._id })
      .populate('load')
      .sort({ createdAt: -1 });
    res.render('pages/my-bids', { bids });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
