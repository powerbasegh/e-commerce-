const router = require('express').Router();
const controller = require('../controllers/notificationController');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', asyncHandler(controller.listMine));
router.put('/:id/read', asyncHandler(controller.markRead));
router.put('/read-all', asyncHandler(controller.markAllRead));

module.exports = router;
