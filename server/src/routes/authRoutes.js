const router=require('express').Router(); const c=require('../controllers/authController'); const a=require('../utils/asyncHandler'); const {authenticate}=require('../middleware/auth');
router.post('/register',a(c.register)); router.post('/login',a(c.login)); router.get('/profile',authenticate,a(c.profile)); module.exports=router;
