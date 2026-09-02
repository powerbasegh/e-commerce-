const router=require('express').Router();
const c=require('../controllers/paymentController');
const a=require('../utils/asyncHandler');
const {authenticate,authorize}=require('../middleware/auth');
router.use(authenticate,authorize('CUSTOMER'));
router.get('/orders/:orderNumber',a(c.getMine));
module.exports=router;
