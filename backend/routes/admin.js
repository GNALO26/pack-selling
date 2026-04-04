// routes/admin.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

// Toutes les routes admin nécessitent protect + adminOnly
router.use(protect, adminOnly);

router.get( '/stats',                ctrl.getStats);
router.get( '/clients',              ctrl.getClients);
router.get( '/transactions',         ctrl.getTransactions);
router.post('/grant-access',         ctrl.grantAccess);
router.post('/revoke-access',        ctrl.revokeAccess);
router.patch('/users/:userId/toggle',ctrl.toggleUserStatus);

module.exports = router;
