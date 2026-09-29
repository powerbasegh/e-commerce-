const router = require('express').Router();
const controller = require('../controllers/productController');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/auth');

router.get('/categories', asyncHandler(controller.listCategories));
router.post('/:id/reviews', authenticate, asyncHandler(controller.createReview));
router.get('/:id', asyncHandler(controller.getById));
router.get('/', asyncHandler(controller.list));

module.exports = router;
