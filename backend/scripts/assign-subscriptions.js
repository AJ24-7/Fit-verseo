const mongoose = require('mongoose');
const Gym = require('../models/gym');
const Subscription = require('../models/Subscription');

async function assignSubscriptions() {
  try {
    await mongoose.connect('mongodb+srv://Fit-verse:Ajha%402468@fit-verse.2bxgkg4.mongodb.net/gymdb?retryWrites=true&w=majority&appName=Fit-verse');
    console.log('✅ Connected to MongoDB');

    // Get first 3 approved gyms
    const approvedGyms = await Gym.find({ status: 'approved' }).limit(3);
    console.log(`📋 Found ${approvedGyms.length} approved gyms`);

    if (approvedGyms.length === 0) {
      console.log('❌ No approved gyms found. Creating test data...');
      process.exit(0);
    }

    // Check existing subscriptions
    const existingSubscriptions = await Subscription.find({});
    console.log(`📊 Existing subscriptions: ${existingSubscriptions.length}`);

    for (let i = 0; i < approvedGyms.length; i++) {
      const gym = approvedGyms[i];

      // Check if subscription already exists
      const existingSub = await Subscription.findOne({ gymId: gym._id });
      if (existingSub) {
        console.log(`⚠️  Subscription already exists for ${gym.gymName}`);
        continue;
      }

      const plans = ['1month', '3month', '6month'];
      const planPricing = {
        '1month': { amount: 999, displayName: 'Monthly', billingCycle: 'monthly' },
        '3month': { amount: 1699, displayName: 'Quarterly', billingCycle: 'quarterly' }, 
        '6month': { amount: 3299, displayName: 'Half-Yearly', billingCycle: 'half-yearly' }
      };
      
      const selectedPlan = plans[i];
      const pricing = planPricing[selectedPlan];

      const subscription = new Subscription({
        gymId: gym._id,
        plan: selectedPlan,
        planDisplayName: pricing.displayName,
        pricing: {
          amount: pricing.amount,
          currency: 'INR',
          billingCycle: pricing.billingCycle
        },
        status: 'active', // Set as active for testing
        trialPeriod: {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago (trial ended)
          isActive: false
        },
        activePeriod: {
          startDate: new Date(), // Active now
          endDate: new Date(Date.now() + (selectedPlan === '1month' ? 30 : selectedPlan === '3month' ? 90 : 180) * 24 * 60 * 60 * 1000)
        },
        paymentDetails: {
          paymentMethod: 'razorpay',
          lastPaymentDate: new Date(),
          nextPaymentDate: new Date(Date.now() + (selectedPlan === '1month' ? 30 : selectedPlan === '3month' ? 90 : 180) * 24 * 60 * 60 * 1000)
        },
        features: [
          { name: 'Customizable Dashboard', enabled: true },
          { name: 'Full Payment Management', enabled: true },
          { name: 'Secure Data Protection', enabled: true },
          { name: 'Full Customer Support', enabled: true },
          { name: 'Enhanced Membership Handler', enabled: true },
          { name: 'Fingerprint & Face Recognition', enabled: true },
          { name: 'Advanced Analytics & Reports', enabled: true },
          { name: 'Multi-Location Management', enabled: true }
        ],
        billingHistory: [
          {
            date: new Date(),
            amount: pricing.amount,
            status: 'success',
            paymentMethod: 'razorpay',
            transactionId: 'txn_' + Math.random().toString(36).substr(2, 9),
            description: 'Subscription payment for ' + pricing.displayName + ' plan'
          }
        ]
      });

      await subscription.save();
      console.log(`✅ Created ${pricing.displayName} subscription for ${gym.gymName}`);
    }

    console.log('🎉 All subscriptions created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

assignSubscriptions();
