const router = require('express').Router();
const c = require('../controllers/webhookController');
const a = require('../utils/asyncHandler');

// Deliberately unauthenticated (Hubtel calls this server-to-server — there
// is no PowerBase session to authenticate as) and mounted at its own
// top-level prefix (/api/webhooks), not nested under /api/payments, so it
// can never be caught by paymentRoutes.js's router.use(authenticate,
// authorize('CUSTOMER')), which applies to every path in that router.
// Trust is established inside the controller itself — see the comment
// block at the top of webhookController.js.
router.post('/hubtel/callback/:token', a(c.hubtelCallback));

module.exports = router;
