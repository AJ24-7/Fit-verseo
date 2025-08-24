const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');

// Get user's payment methods (mock data for now)
router.get('/methods', authMiddleware, async (req, res) => {
  try {
    // For demo purposes, return mock payment methods
    // In a real application, this would fetch from a payment processor like Stripe
    const mockPaymentMethods = [
      {
        id: 'pm_1',
        type: 'Visa',
        lastFour: '4242',
        expiryMonth: '12',
        expiryYear: '25',
        isDefault: true
      },
      {
        id: 'pm_2',
        type: 'Mastercard',
        lastFour: '5555',
        expiryMonth: '10',
        expiryYear: '26',
        isDefault: false
      }
    ];
    
    res.json(mockPaymentMethods);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ message: 'Failed to fetch payment methods' });
  }
});

// Get user's payment history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    
    // For demo purposes, return mock transaction history
    // In a real application, this would fetch from payment records
    const mockTransactions = [
      {
        id: 'txn_1',
        amount: 1500,
        description: 'Gym Membership - Fitness First',
        date: new Date(Date.now() - 86400000), // Yesterday
        status: 'success',
        paymentMethod: 'Visa *4242'
      },
      {
        id: 'txn_2',
        amount: 500,
        description: 'Personal Training Session',
        date: new Date(Date.now() - 604800000), // Week ago
        status: 'success',
        paymentMethod: 'Mastercard *5555'
      },
      {
        id: 'txn_3',
        amount: 200,
        description: 'Gym Trial - PowerHouse Gym',
        date: new Date(Date.now() - 1209600000), // 2 weeks ago
        status: 'success',
        paymentMethod: 'Visa *4242'
      }
    ];
    
    res.json(mockTransactions);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ message: 'Failed to fetch payment history' });
  }
});

// Add new payment method
router.post('/methods', authMiddleware, async (req, res) => {
  try {
    const { cardNumber, expiryMonth, expiryYear, cvv, cardType } = req.body;
    
    // In a real application, you would integrate with Stripe or another payment processor
    // For demo purposes, just return success
    
    const newPaymentMethod = {
      id: 'pm_' + Date.now(),
      type: cardType,
      lastFour: cardNumber.slice(-4),
      expiryMonth,
      expiryYear,
      isDefault: false
    };
    
    res.json({ success: true, paymentMethod: newPaymentMethod });
  } catch (error) {
    console.error('Error adding payment method:', error);
    res.status(500).json({ message: 'Failed to add payment method' });
  }
});

// Remove payment method
router.delete('/methods/:methodId', authMiddleware, async (req, res) => {
  try {
    const { methodId } = req.params;
    
    // In a real application, you would remove from payment processor
    // For demo purposes, just return success
    
    res.json({ success: true, message: 'Payment method removed successfully' });
  } catch (error) {
    console.error('Error removing payment method:', error);
    res.status(500).json({ message: 'Failed to remove payment method' });
  }
});

module.exports = router;
