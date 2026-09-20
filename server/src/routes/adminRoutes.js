const router = require('express').Router();
const c = require('../controllers/adminController');
const a = require('../utils/asyncHandler');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('ADMIN'));

router.get('/dashboard', a(c.dashboard));

// Existing surface: orders still awaiting a delivery-fee quote.
router.get('/orders', a(c.listOrders));
router.put('/orders/:orderId/delivery-fee', a(c.updateDeliveryFee));

// Added so the payment -> stock -> settlement chain is real rather than
// simulated (see adminController.confirmPayment). Backend only for now; the
// admin UI for these is out of scope for this pass.
router.get('/orders/all', a(c.listAllOrders));
router.get('/orders/:orderId', a(c.getOrder));
router.put('/orders/:orderId/payment', a(c.confirmPayment));
router.patch('/orders/:orderId/status', a(c.updateOrderStatus));
// Releases stock held by orders that were never paid for. Also runs on a
// timer in the live process (services/reservationService.js).
router.post('/reservations/expire', a(c.expireReservations));

router.get('/vendors', a(c.listVendors));
router.post('/vendors', a(c.createVendor));
router.get('/vendors/:id', a(c.getVendor));
router.patch('/vendors/:id/verify', a(c.setVendorVerified));
router.patch('/vendors/:id/status', a(c.setVendorStatus));
router.patch('/vendors/:id/share', a(c.setVendorShare));

router.get('/customers', a(c.listCustomers));
router.get('/customers/:id', a(c.getCustomer));
router.patch('/customers/:id/status', a(c.setCustomerStatus));

router.get('/products', a(c.listProducts));
router.patch('/products/:id/status', a(c.setProductStatus));

router.get('/categories', a(c.listCategories));
router.post('/categories', a(c.createCategory));
router.put('/categories/:id', a(c.updateCategory));
router.delete('/categories/:id', a(c.deleteCategory));

router.get('/settlements', a(c.listSettlements));
router.put('/settlements/:settlementId', a(c.updateSettlement));

module.exports = router;
