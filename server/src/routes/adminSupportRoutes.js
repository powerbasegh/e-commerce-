const router = require('express').Router();
const c = require('../controllers/supportController');
const a = require('../utils/asyncHandler');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('ADMIN'));
router.get('/', a(c.adminList));
router.get('/:ticketId', a(c.adminGet));
router.post('/:ticketId/messages', a(c.adminReply));
router.patch('/:ticketId', a(c.adminUpdate));

module.exports = router;
