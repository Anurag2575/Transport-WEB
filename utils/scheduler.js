const cron = require('node-cron');
const { closeExpiredLoads } = require('./bidding');

// Run every minute to check for ended bids
cron.schedule('* * * * *', async () => {
  try {
    const result = await closeExpiredLoads(new Date());
    const closedCount = result.modifiedCount || 0;

    if (closedCount > 0) {
      console.log(`Auto-closed ${closedCount} expired load(s)`);
    }
  } catch (error) {
    console.error('Error in bidding scheduler:', error);
  }
});

console.log('Bidding scheduler started');
