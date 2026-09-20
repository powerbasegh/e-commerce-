const multer = require('multer');
const router = require('express').Router();
const c = require('../controllers/vendorController');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, authorize, requireActiveVendor } = require('../middleware/auth');

// Authentication -> VENDOR role -> live, active vendor account. req.vendor is
// established here from the JWT and nowhere else, so no handler below can be
// pointed at another vendor's data by anything in the request.
router.use(authenticate, authorize('VENDOR'), asyncHandler(requireActiveVendor));

router.get('/dashboard', asyncHandler(c.dashboard));

router.get('/profile', asyncHandler(c.getProfile));
router.put('/profile', asyncHandler(c.updateProfile));

router.get('/products', asyncHandler(c.listProducts));
router.post('/products', asyncHandler(c.createProduct));
router.get('/products/:id', asyncHandler(c.getProduct));
router.put('/products/:id', asyncHandler(c.updateProduct));
router.patch('/products/:id/status', asyncHandler(c.setProductStatus));
router.patch('/products/:id/stock', asyncHandler(c.updateStock));

// Kept in memory and streamed straight to Cloudinary — nothing is written to
// the server's disk. The limit is enforced here as well as in imageService so
// an oversized body is rejected before it is fully buffered.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

router.get('/uploads/status', asyncHandler(c.imageUploadStatus));
router.post('/uploads/product-image', upload.single('image'), asyncHandler(c.uploadProductImage));

router.get('/inventory', asyncHandler(c.listInventory));

router.get('/earnings', asyncHandler(c.earnings));

module.exports = router;
