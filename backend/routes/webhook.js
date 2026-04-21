const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/webhookController');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://gui-lok-packs.netlify.app';

// POST — webhook serveur à serveur (FedaPay notifie le backend)
router.post('/fedapay', ctrl.handleFedaPayWebhook);

// GET — FedaPay redirige le navigateur du client ici après paiement
// On redirige vers le dashboard avec le statut
router.get('/fedapay', (req, res) => {
  const status = req.query.status || 'unknown';
  const id     = req.query.id     || '';
  const close  = req.query.close  || '';

  console.log(`[Webhook GET] Redirection client — status: ${status} | id: ${id}`);

  // Rediriger vers le dashboard avec les infos de paiement
  const redirectUrl = `${FRONTEND_URL}/dashboard?status=${status}&txn=${id}`;
  res.redirect(302, redirectUrl);
});

module.exports = router;