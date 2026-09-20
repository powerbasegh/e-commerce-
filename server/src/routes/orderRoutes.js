const router = require('express').Router();
const c = require('../controllers/orderController');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, authorize, requireActiveVendor } = require('../middleware/auth');

// Public tracking must be reachable without authentication and returns only
// sanitized tracking information from the controller.
router.get('/track/:reference', asyncHandler(c.track));

router.use(authenticate);
router.post('/', authorize('CUSTOMER'), asyncHandler(c.createOrder));
router.get('/', authorize('CUSTOMER'), asyncHandler(c.listMine));
// Every vendor order endpoint runs authenticate -> authorize('VENDOR') ->
// requireActiveVendor, which resolves req.vendor from the JWT and rejects
// deactivated accounts. The controllers scope every query to req.vendor.id
// and never read a vendor id from the request.
const vendorOnly = [authorize('VENDOR'), asyncHandler(requireActiveVendor)];
router.get('/vendor/my-orders', ...vendorOnly, asyncHandler(c.vendorOrders));
router.get('/vendor/my-orders/:vendorOrderId', ...vendorOnly, asyncHandler(c.vendorOrderDetail));
router.patch('/vendor/my-orders/:vendorOrderId/status', ...vendorOnly, asyncHandler(c.updateVendorOrderStatus));
router.get('/vendor/my-settlements', ...vendorOnly, asyncHandler(c.vendorSettlements));
// Param renamed from :id to :orderNumber to match what this actually is —
// getMine looks up by the customer-facing order_number, not the internal
// numeric primary key (that's the only value the frontend ever has).
router.get('/:orderNumber', authorize('CUSTOMER'), asyncHandler(c.getMine));

module.exports = router;
