const router=require('express').Router();
const c=require('../controllers/paymentController');
const a=require('../utils/asyncHandler');
const {authenticate,authorize}=require('../middleware/auth');
router.use(authenticate,authorize('CUSTOMER'));
router.get('/orders/:orderNumber',a(c.getMine));
// Idempotent by design (see paymentService.initiatePayment) — safe against
// double-clicks, refreshes and retries, so no extra dedupe needed here.
router.post('/orders/:orderNumber/initiate',a(c.initiate));
module.exports=router;
