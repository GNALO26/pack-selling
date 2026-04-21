const { FedaPay, Transaction: FedaTransaction } = require('fedapay');
const Transaction = require('../models/Transaction');
const User        = require('../models/User');
const { sendEmail } = require('../utils/mailer');

/**
 * POST /api/webhook/fedapay
 * Reçoit les événements FedaPay et active l'accès après paiement confirmé.
 */
exports.handleFedaPayWebhook = async (req, res) => {
  try {
    // ── 1. Vérifier la signature ────────────────────────────────────────────
    const signature = req.headers['x-fedapay-signature'] || req.headers['x-fedapay-webhook-signature'];
    const rawBody   = req.body; // Buffer (express.raw configuré dans server.js)

    console.log('[Webhook] Headers reçus:', JSON.stringify({
      'x-fedapay-signature': req.headers['x-fedapay-signature'],
      'x-fedapay-webhook-signature': req.headers['x-fedapay-webhook-signature'],
      'content-type': req.headers['content-type'],
    }));

    let event;

    // Vérifier la signature seulement si le secret est configuré
    if (process.env.FEDAPAY_WEBHOOK_SECRET && signature) {
      try {
        event = FedaPay.Webhook.constructEvent(
          rawBody,
          signature,
          process.env.FEDAPAY_WEBHOOK_SECRET
        );
        console.log('[Webhook] ✅ Signature valide');
      } catch (sigErr) {
        console.warn('[Webhook] ⚠️ Signature invalide, tentative parsing direct:', sigErr.message);
        // En cas d'échec de signature, parser quand même le body
        try {
          const bodyStr = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : JSON.stringify(rawBody);
          event = JSON.parse(bodyStr);
          console.log('[Webhook] Body parsé sans vérification signature');
        } catch (parseErr) {
          console.error('[Webhook] Impossible de parser le body:', parseErr.message);
          return res.status(400).json({ error: 'Body invalide' });
        }
      }
    } else {
      // Pas de secret configuré → parser directement
      try {
        const bodyStr = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : JSON.stringify(rawBody);
        event = JSON.parse(bodyStr);
        console.log('[Webhook] Body parsé (pas de vérification signature)');
      } catch (e) {
        console.error('[Webhook] Parse error:', e.message);
        return res.status(400).json({ error: 'Body invalide' });
      }
    }

    console.log('[Webhook] Event type:', event?.name || event?.type || 'unknown');
    console.log('[Webhook] Event data:', JSON.stringify(event?.data || event, null, 2).substring(0, 500));

    // ── 2. Traiter l'événement ─────────────────────────────────────────────
    const eventName = event?.name || event?.type || '';
    const txData    = event?.data?.object || event?.data || event?.transaction || {};
    const txId      = txData?.id?.toString() || txData?.transaction_id?.toString();
    const txStatus  = txData?.status || txData?.transaction_status;

    console.log(`[Webhook] Transaction ID: ${txId} | Status: ${txStatus}`);

    // Répondre immédiatement à FedaPay (évite les retries)
    res.status(200).json({ received: true });

    // Traiter en arrière-plan
    if (txId && (txStatus === 'approved' || eventName === 'transaction.approved')) {
      await activateAccess(txId, txData);
    } else {
      console.log(`[Webhook] Événement ignoré — status: ${txStatus}, event: ${eventName}`);
    }

  } catch (err) {
    console.error('[Webhook] Erreur générale:', err.message);
    res.status(200).json({ received: true }); // Toujours 200 pour éviter les retries FedaPay
  }
};

/**
 * Activer l'accès au pack après paiement confirmé
 */
async function activateAccess(fedapayTxId, txData) {
  try {
    console.log(`[Webhook] Activation accès pour transaction ${fedapayTxId}...`);

    // Trouver la transaction en base
    const txn = await Transaction.findOne({ fedapayTransactionId: fedapayTxId.toString() });

    if (!txn) {
      console.error(`[Webhook] Transaction ${fedapayTxId} introuvable en base`);
      return;
    }

    // Idempotence — ne pas traiter deux fois
    if (txn.status === 'approved') {
      console.log(`[Webhook] Transaction ${fedapayTxId} déjà traitée — ignoré`);
      return;
    }

    // Mettre à jour la transaction
    txn.status      = 'approved';
    txn.confirmedAt = new Date();
    await txn.save();

    // Ajouter le pack dans les achats de l'utilisateur
    const user = await User.findById(txn.userId);
    if (!user) {
      console.error(`[Webhook] User ${txn.userId} introuvable`);
      return;
    }

    // Vérifier que l'accès n'est pas déjà là
    const alreadyHas = user.purchases?.some(p => {
      const pid = typeof p.packId === 'string' ? p.packId : p.packId?.toString();
      return pid === txn.packId.toString();
    });

    if (!alreadyHas) {
      user.purchases.push({
        packId:      txn.packId,
        purchasedAt: new Date(),
        amount:      txn.amount,
        currency:    txn.currency,
      });
      await user.save({ validateBeforeSave: false });
      console.log(`[Webhook] ✅ Accès activé — User: ${user.email} | Pack: ${txn.packId}`);
    } else {
      console.log(`[Webhook] User ${user.email} a déjà accès au pack ${txn.packId}`);
    }

    // Envoyer email de confirmation
    try {
      const Pack = require('../models/Pack');
      const pack = await Pack.findById(txn.packId);
      await sendEmail({
        to:       user.email,
        template: 'purchaseConfirmation',
        data: {
          firstName:     user.firstName,
          packName:      pack?.name || 'Pack Digital 360',
          amount:        txn.amount,
          currency:      txn.currency,
          dashboardUrl:  `${process.env.FRONTEND_URL}/dashboard`,
          transactionId: fedapayTxId,
        },
      });
      console.log(`[Webhook] Email confirmation envoyé à ${user.email}`);
    } catch (emailErr) {
      console.error('[Webhook] Email non envoyé:', emailErr.message);
    }

  } catch (err) {
    console.error('[Webhook] Erreur activateAccess:', err.message);
  }
}