const router = require('express').Router();
const controller = require('../controllers/addressController');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', asyncHandler(controller.listMine));
router.post('/', asyncHandler(controller.create));
router.put('/:id', asyncHandler(controller.update));
router.patch('/:id/default', asyncHandler(controller.setDefault));
router.delete('/:id', asyncHandler(controller.remove));

module.exports = router;
