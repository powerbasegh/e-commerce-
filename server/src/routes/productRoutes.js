const router = require('express').Router();
const controller = require('../controllers/productController');
const asyncHandler = require('../utils/asyncHandler');

// Public browsing — no authentication required, same as order tracking.
// Route order matters: '/categories' is a literal path and must be
// registered before '/:id', otherwise Express would try to look up a
// product with id "categories".
router.get('/categories', asyncHandler(controller.listCategories));
router.get('/:id', asyncHandler(controller.getById));
router.get('/', asyncHandler(controller.list));

module.exports = router;
