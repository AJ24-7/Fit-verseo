const express = require('express');
const router = express.Router();
const {
  getOffers,
  getOfferStats,
  createOffer,
  updateOffer,
  deleteOffer,
  toggleOfferStatus,
  getValidOffers,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  useCoupon,
  getCouponAnalytics,
  exportCoupons,
  getValidOffersByGym,
  validateCouponCode
} = require('../controllers/offersController');

// Middleware to verify admin authentication
const verifyAdminToken = require('../middleware/adminAuth');

// ==================== OFFER ROUTES ====================

// Get all offers for a gym (admin)
router.get('/offers', verifyAdminToken, getOffers);

// Get offer statistics (admin)
router.get('/offers/stats', verifyAdminToken, getOfferStats);

// Create new offer (admin)
router.post('/offers', verifyAdminToken, createOffer);

// Update offer (admin)
router.put('/offers/:id', verifyAdminToken, updateOffer);

// Delete offer (admin)
router.delete('/offers/:id', verifyAdminToken, deleteOffer);

// Pause/Resume offer (admin)
router.patch('/offers/:id/toggle', verifyAdminToken, toggleOfferStatus);

// Get valid offers for public display (no auth required)
router.get('/offers/valid/:gymId', getValidOffers);

// ==================== COUPON ROUTES ====================

// Get all coupons for a gym (admin)
router.get('/coupons', verifyAdminToken, getCoupons);

// Create new coupon (admin)
router.post('/coupons', verifyAdminToken, createCoupon);

// Update coupon (admin)
router.put('/coupons/:id', verifyAdminToken, updateCoupon);

// Delete coupon (admin)
router.delete('/coupons/:id', verifyAdminToken, deleteCoupon);

// Validate coupon (public - for users)
router.get('/coupons/validate/:code', validateCoupon);

// Use coupon (public - for users)
router.post('/coupons/use/:code', useCoupon);

// Get coupon analytics (admin)
router.get('/coupons/analytics', verifyAdminToken, getCouponAnalytics);

// Export coupons to CSV (admin)
router.get('/coupons/export', verifyAdminToken, exportCoupons);

// Public endpoints for frontend display (gym details page)
router.get('/valid/:gymId', getValidOffersByGym);
router.get('/coupons/validate/:code', validateCouponCode);

module.exports = router;