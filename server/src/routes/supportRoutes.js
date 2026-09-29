const router = require('express').Router();
const c = require('../controllers/supportController');
const a = require('../utils/asyncHandler');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/', authorize('CUSTOMER'), a(c.listMine));
router.post('/', authorize('CUSTOMER'), a(c.create));
router.get('/:ticketId', authorize('CUSTOMER'), a(c.getMine));
router.post('/:ticketId/messages', authorize('CUSTOMER'), a(c.replyMine));

module.exports = router;
