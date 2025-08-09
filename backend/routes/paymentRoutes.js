const express = require('express');
const router = express.Router();
const {
  getPaymentStats,
  getPaymentChartData,
  getRecentPayments,
  getRecurringPayments,
  getPaymentReminders,
  addPayment,
  updatePayment,
  markPaymentAsPaid,
  deletePayment,
  createCashPaymentRequest,
  checkCashValidation,
  getPendingCashValidations,
  approveCashValidation
} = require('../controllers/paymentController');

const gymAdminAuth = require('../middleware/gymadminAuth');

// Get payment statistics

// Payment routes
router.get('/stats', gymAdminAuth, getPaymentStats);
router.get('/chart-data', gymAdminAuth, getPaymentChartData);
router.get('/recent', gymAdminAuth, getRecentPayments);
router.get('/recurring', gymAdminAuth, getRecurringPayments);
router.get('/reminders', gymAdminAuth, getPaymentReminders);
router.post('/', gymAdminAuth, addPayment);
router.put('/:id', gymAdminAuth, updatePayment);
router.patch('/:id/mark-paid', gymAdminAuth, markPaymentAsPaid);
router.delete('/:id', gymAdminAuth, deletePayment);

// Cash payment validation routes
router.post('/cash-payment-request', createCashPaymentRequest);
router.get('/check-cash-validation/:validationCode', checkCashValidation);
router.get('/pending-cash-validations', gymAdminAuth, getPendingCashValidations);
router.post('/approve-cash-validation/:validationCode', gymAdminAuth, approveCashValidation);

module.exports = router;
