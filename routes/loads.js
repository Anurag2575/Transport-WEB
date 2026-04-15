/* @ts-nocheck */
const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const Load = require('../models/Load');
const User = require('../models/User');
const Bid = require('../models/Bid');
const Complaint = require('../models/Complaint');
const { closeExpiredLoads, syncExpiredLoad } = require('../utils/bidding');

// Upload load page
router.get('/upload', ensureAuthenticated, (req, res) => {
  res.render('pages/upload-load');
});

// Upload load handle
router.post('/upload', ensureAuthenticated, async (req, res) => {
  const { title, description, origin, destination, weight, dimensions, value, biddingHours } = req.body;

  const biddingEndTime = new Date();
  biddingEndTime.setHours(biddingEndTime.getHours() + parseInt(biddingHours));

  const newLoad = new Load({
    title,
    description,
    origin,
    destination,
    weight,
    dimensions,
    value,
    postedBy: req.user._id,
    biddingEndTime
  });

  try {
    await newLoad.save();
    await User.findByIdAndUpdate(req.user._id, { $push: { loadsPosted: newLoad._id } });
    req.flash('success_msg', 'Load uploaded successfully');
    res.redirect('/loads/current');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error uploading load');
    res.redirect('/loads/upload');
  }
});

// Current loads page (open only)
router.get('/current', async (req, res) => {
  try {
    await closeExpiredLoads();
    const loads = await Load.find({ status: 'open' }).populate('postedBy', 'username').sort({ createdAt: -1 });
    res.render('pages/current-loads', { loads });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// My posted loads
router.get('/my-loads', ensureAuthenticated, async (req, res) => {
  try {
    await closeExpiredLoads();
    const user = await User.findById(req.user._id).populate({
      path: 'loadsPosted',
      populate: [
        { path: 'winner', select: 'username' },
        { 
          path: 'bids', 
          match: { status: { $in: ['won', 'in-progress', 'completed'] } },
          populate: { 
            path: 'bidder', 
            select: 'username' 
          },
          options: { limit: 1, sort: { status: 1 } }
        }
      ]
    }).populate({
      path: 'loadsPosted.bids',
      match: { status: 'won' },
      options: { limit: 1 }
    });
    res.render('pages/my-loads', { user });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading your loads');
    res.redirect('/dashboard');
  }
});

// Search loads
router.get('/search', async (req, res) => {
  const { origin, destination } = req.query;
  try {
    await closeExpiredLoads();
    let query = { status: 'open' };
    if (origin) query.origin = new RegExp(origin, 'i');
    if (destination) query.destination = new RegExp(destination, 'i');

    const loads = await Load.find(query).populate('postedBy', 'username').sort({ createdAt: -1 });
    res.render('pages/search-results', { loads, origin, destination });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Load details
router.get('/:id', async (req, res) => {
  try {
    const load = await Load.findById(req.params.id)
      .populate('postedBy', 'username firstName lastName')
      .populate({
        path: 'bids',
        populate: [
          { path: 'bidder', select: 'username' },
          { path: 'bidder.complaints', options: { countOnly: true }, as: 'bidderComplaintsCount' }
        ]
      });
    await syncExpiredLoad(load);
    if (!load) {
      req.flash('error_msg', 'Load not found');
      return res.redirect('/loads/current');
    }
    res.render('pages/load-details', { load });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// File complaint against winner bidder - only load owner
router.post('/:id/complaint', ensureAuthenticated, async (req, res) => {
  try {
    const { title, description } = req.body;
    const loadId = req.params.id;
    
    if (!title || !description || title.trim().length < 5 || description.trim().length < 10) {
      req.flash('error_msg', 'Title (min 5 chars) and description (min 10 chars) are required');
      return res.redirect('/loads/my-loads');
    }
    
    const load = await Load.findById(loadId).populate({
      path: 'bids',
      match: { status: 'won' },
      populate: { path: 'bidder' },
      options: { limit: 1 }
    }).populate('postedBy');
    
    if (!load || load.postedBy._id.toString() !== req.user._id.toString()) {
      req.flash('error_msg', 'Not authorized');
      return res.redirect('/loads/my-loads');
    }
    
    const wonBid = load.bids[0];
    if (!wonBid) {
      req.flash('error_msg', 'No winner selected for this load');
      return res.redirect('/loads/my-loads');
    }
    
    // Set hasComplaint on won bid
    wonBid.hasComplaint = true;
    await wonBid.save();
    
    const newComplaint = new Complaint({
      complainant: req.user._id,
      accused: wonBid.bidder._id,
      load: load._id,
      title: title.trim(),
      description: description.trim()
    });
    
    await newComplaint.save();
    
    // Add complaint to accused bidder's profile
    await User.findByIdAndUpdate(wonBid.bidder._id, { $push: { complaints: newComplaint._id } });
    
    req.flash('success_msg', 'Complaint filed successfully and sent for review.');
    res.redirect('/loads/my-loads');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error filing complaint');
    res.redirect('/loads/my-loads');
  }
});

// Close load without winner - only owner
router.post('/:id/close-no-winner', ensureAuthenticated, async (req, res) => {
  try {
    const load = await Load.findById(req.params.id).populate('postedBy');
    await syncExpiredLoad(load);

    if (!load || !['open', 'bidding_closed'].includes(load.status)) {
      req.flash('error_msg', 'Cannot close this load');
      return res.redirect('/loads/my-loads');
    }
    if (load.postedBy._id.toString() !== req.user._id.toString()) {
      req.flash('error_msg', 'Not authorized');
      return res.redirect('/loads/my-loads');
    }
    load.status = 'bidding_closed';
    await load.save();
    await Bid.updateMany({ load: load._id, status: 'active' }, { status: 'lost' });
    req.flash('success_msg', 'Load closed without winner');
    res.redirect('/loads/my-loads');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error closing load');
    res.redirect('/loads/my-loads');
  }
});

// Select winner bid - only owner
router.post('/:id/select-winner/:bidId', ensureAuthenticated, async (req, res) => {
  try {
    const load = await Load.findById(req.params.id).populate('postedBy');
    const bid = await Bid.findById(req.params.bidId).populate('bidder');
    await syncExpiredLoad(load);

    if (
      !load ||
      !['open', 'bidding_closed'].includes(load.status) ||
      load.winner ||
      !bid ||
      bid.load.toString() !== load._id.toString()
    ) {
      req.flash('error_msg', 'Invalid load or bid');
      return res.redirect(`/loads/${req.params.id}`);
    }
    if (load.postedBy._id.toString() !== req.user._id.toString()) {
      req.flash('error_msg', 'Not authorized');
      return res.redirect(`/loads/${req.params.id}`);
    }
    
    // Update load
    load.status = 'assigned';
    load.winner = bid.bidder._id;
    await load.save();
    
    // Winner bid
    bid.status = 'won';
    await bid.save();
    
    // Other bids lost
    await Bid.updateMany({ load: load._id, _id: { $ne: bid._id } }, { status: 'lost' });
    
    req.flash('success_msg', `Winner selected: ${bid.bidder.username}`);
    res.redirect('/loads/my-loads');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error selecting winner');
    res.redirect(`/loads/${req.params.id}`);
  }
});

module.exports = router;
