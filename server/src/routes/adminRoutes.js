const router=require('express').Router(); const c=require('../controllers/adminController'); const a=require('../utils/asyncHandler'); const {authenticate,authorize}=require('../middleware/auth');
router.use(authenticate,authorize('ADMIN')); router.get('/orders',a(c.listOrders)); router.put('/orders/:orderId/delivery-fee',a(c.updateDeliveryFee)); module.exports=router;
