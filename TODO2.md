# Load Details Bidders Enhancement

## Step 1: Create TODO2.md [✅ COMPLETE]

## Step 2: Update Load Details Route - Populate bidder complaints count
- Edit routes/loads.js: add .populate('bids.bidder.complaints', null, { countOnly: true, as: 'complaintsCount' }) [✅ COMPLETE]

## Step 3: Update Load Details View - Show complaints per bidder
- Edit views/pages/load-details.ejs: add complaints count in bid-item [✅ COMPLETE]

## Step 4: Test
- Restart server, create test data, check /loads/:id bids show complaints
