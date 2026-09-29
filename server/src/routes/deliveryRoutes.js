const router=require('express').Router();
const c=require('../controllers/deliveryController');
const a=require('../utils/asyncHandler');
const {authenticate,authorize}=require('../middleware/auth');
router.use(authenticate);
router.post('/',authorize('CUSTOMER'),a(c.create));
router.get('/',authorize('CUSTOMER'),a(c.mine));
router.get('/:id',authorize('CUSTOMER'),a(c.getMine));
module.exports=router;
