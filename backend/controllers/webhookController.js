const crypto      = require('crypto');
const User        = require('../models/User');
const Pack        = require('../models/Pack');
const Transaction = require('../models/Transaction');
const { sendEmail } = require('../utils/mailer');

/**
 * POST /api/webhook/fedapay
 * Reçoit les notifications FedaPay.
 *
 * Sécurité :
 * - Vérifie la signature HMAC si FedaPay la fournit
 * - Idempotent : ignore les doublons
 * - Traitement asynchrone : répond 200 immédiatement à FedaPay
 */
exports.handleFedaPayWebhook = async (req, res, next) => {
  // Répondre immédiatement pour éviter le timeout FedaPay
  res.status(200).json({ received: true });

  try {
    // Le body arrive en raw Buffer (configuré dans server.js)
    const rawBody = req.body;
    const payload = JSON.parse(rawBody.toString());

    console.log('[Webhook] FedaPay event reçu:', payload.event, payload.data?.id);

    // Vérifier la signature si FedaPay la supporte
    const signature = req.headers['x-fedapay-signature'];
    if (process.env.FEDAPAY_WEBHOOK_SECRET && signature) {
      const expectedSig = crypto
        .createHmac('sha256', process.env.FEDAPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');
      if (signature !== `sha256=${expectedSig}`) {
        console.error('[Webhook] Signature invalide — ignoré');
        return;
      }
    }

    const event = payload.event;
    const data  = payload.data;

    // Traiter uniquement les paiements approuvés
    if (event !== 'transaction.approved') {
      console.log(`[Webhook] Event "${event}" ignoré`);
      return;
    }

    const fedapayTxnId = data?.id?.toString();
    if (!fedapayTxnId) return;

    // Trouver la transaction en base
    const txn = await Transaction.findOne({ fedapayTransactionId: fedapayTxnId });
    if (!txn) {
      console.error(`[Webhook] Transaction ${fedapayTxnId} introuvable en base`);
      return;
    }

    // Idempotence : si déjà approuvé, ignorer
    if (txn.status === 'approved') {
      console.log(`[Webhook] Transaction ${fedapayTxnId} déjà traitée — ignoré`);
      return;
    }

    // Mettre à jour la transaction
    txn.status = 'approved';
    txn.confirmedAt = new Date();
    txn.webhookPayload = payload;
    await txn.save();

    // Accorder l'accès au pack pour l'utilisateur
    const user = await User.findById(txn.userId);
    if (!user) {
      console.error(`[Webhook] User ${txn.userId} introuvable`);
      return;
    }

    // Vérifier si pas déjà dans purchases (double sécurité)
    const alreadyOwns = user.hasPurchased(txn.packId);
    if (!alreadyOwns) {
      user.purchases.push({
        packId: txn.packId,
        paymentId: fedapayTxnId,
        transactionId: txn._id.toString(),
        amount: txn.amount,
        currency: txn.currency,
      });
      await user.save({ validateBeforeSave: false });

      // Mettre à jour les stats du pack
      await Pack.findByIdAndUpdate(txn.packId, {
        $inc: { salesCount: 1, totalRevenue: txn.amount },
      });

      console.log(`[Webhook] ✅ Accès accordé — User: ${user.email} — Pack: ${txn.packId}`);
    }

    // Envoyer email de confirmation
    if (!txn.confirmationEmailSent) {
      const pack = await Pack.findById(txn.packId);
      const dashboardUrl = `${process.env.FRONTEND_URL}/dashboard`;

      await sendEmail({
        to: user.email,
        subject: `✅ Paiement confirmé — ${pack?.name || 'Pack Digital 360'}`,
        template: 'purchaseConfirmation',
        data: {
          firstName: user.firstName,
          packName: pack?.name,
          amount: txn.amount,
          currency: txn.currency,
          dashboardUrl,
          transactionId: fedapayTxnId,
        },
      });

      txn.confirmationEmailSent = true;
      await txn.save();
    }
  } catch (err) {
    console.error('[Webhook] Erreur traitement:', err);
    // Ne pas propager — on a déjà répondu 200
  }
};
