const Load = require('../models/Load');

async function closeExpiredLoads(referenceTime = new Date()) {
  return Load.updateMany(
    {
      status: 'open',
      biddingEndTime: { $lte: referenceTime }
    },
    {
      $set: { status: 'bidding_closed' }
    }
  );
}

async function syncExpiredLoad(load, referenceTime = new Date()) {
  if (
    load &&
    load.status === 'open' &&
    load.biddingEndTime &&
    load.biddingEndTime <= referenceTime
  ) {
    load.status = 'bidding_closed';
    await load.save();
  }

  return load;
}

module.exports = {
  closeExpiredLoads,
  syncExpiredLoad
};
