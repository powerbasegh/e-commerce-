const router = require('express').Router();
const c = require('../controllers/orderController');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, authorize } = require('../middleware/auth');

// Public tracking must be reachable without authentication and returns only
// sanitized tracking information from the controller.
router.get('/track/:reference', asyncHandler(c.track));

router.use(authenticate);
router.post('/', authorize('CUSTOMER'), asyncHandler(c.createOrder));
router.get('/', authorize('CUSTOMER'), asyncHandler(c.listMine));
router.get('/vendor/my-orders', authorize('VENDOR'), asyncHandler(c.vendorOrders));
// Param renamed from :id to :orderNumber to match what this actually is —
// getMine looks up by the customer-facing order_number, not the internal
// numeric primary key (that's the only value the frontend ever has).
router.get('/:orderNumber', authorize('CUSTOMER'), asyncHandler(c.getMine));

module.exports = router;
