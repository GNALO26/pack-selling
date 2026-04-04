// routes/webhook.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/webhookController');

// Pas de middleware auth — FedaPay appelle directement
// Le body arrive en raw Buffer (configuré dans server.js avant express.json)
router.post('/fedapay', ctrl.handleFedaPayWebhook);

module.exports = router;
