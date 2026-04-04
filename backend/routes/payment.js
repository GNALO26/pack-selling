// routes/payment.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/initiate',          protect, ctrl.initiatePayment);
router.get( '/status/:transactionId', protect, ctrl.checkStatus);

module.exports = router;
