const router = require('express').Router();
const c = require('../controllers/webhookController');
const a = require('../utils/asyncHandler');

// Paystack signs webhook payloads with x-paystack-signature. The controller
// verifies the raw request body before processing any payment event.
router.post('/paystack', a(c.paystackWebhook));

module.exports = router;
