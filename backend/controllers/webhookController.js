const { FedaPay, Transaction: FedaTransaction } = require('fedapay');
const Transaction = require('../models/Transaction');
const User        = require('../models/User');
const Pack        = require('../models/Pack');
const { sendEmail } = require('../utils/mailer');

exports.handleFedaPayWebhook = async (req, res) => {
  // Répondre immédiatement à FedaPay pour éviter les retries
  res.status(200).json({ received: true });

  try {
    // Parser le body (Buffer depuis express.raw)
    let event;
    try {
      const bodyStr = Buffer.isBuffer(req.body)
        ? req.body.toString('utf8')
        : JSON.stringify(req.body);
      event = JSON.parse(bodyStr);
    } catch (e) {
      console.error('[Webhook] Impossible de parser le body:', e.message);
      return;
    }

    const eventName = event?.name || '';
    // La structure FedaPay réelle : event.entity contient la transaction
    const entity    = event?.entity || event?.data?.object || event?.data || {};
    const txId      = entity?.id?.toString();
    const txStatus  = entity?.status;

    console.log(`[Webhook] Event: ${eventName} | TxID: ${txId} | Status: ${txStatus}`);

    // Traiter uniquement les paiements approuvés
    if (eventName === 'transaction.approved' || txStatus === 'approved') {
      if (!txId) {
        console.error('[Webhook] Pas de transaction ID trouvé dans le payload');
        return;
      }
      await activateAccess(txId);
    } else {
      console.log(`[Webhook] Événement ignoré: ${eventName} (${txStatus})`);
    }

  } catch (err) {
    console.error('[Webhook] Erreur:', err.message);
  }
};

async function activateAccess(fedapayTxId) {
  try {
    console.log(`[Webhook] Activation accès pour transaction ${fedapayTxId}...`);

    const txn = await Transaction.findOne({ fedapayTransactionId: fedapayTxId });
    if (!txn) {
      console.error(`[Webhook] Transaction ${fedapayTxId} introuvable en base`);
      return;
    }

    // Idempotence
    if (txn.status === 'approved') {
      console.log(`[Webhook] Transaction ${fedapayTxId} déjà traitée`);
      return;
    }

    // Mettre à jour la transaction
    txn.status      = 'approved';
    txn.confirmedAt = new Date();
    await txn.save();

    // Ajouter le pack à l'utilisateur
    const user = await User.findById(txn.userId);
    if (!user) {
      console.error(`[Webhook] User ${txn.userId} introuvable`);
      return;
    }

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
    }

    console.log(`[Webhook] ✅ Accès activé — ${user.email} → Pack ${txn.packId}`);

    // Email de confirmation
    try {
      const pack = await Pack.findById(txn.packId);
      await sendEmail({
        to:       user.email,
        template: 'purchaseConfirmation',
        data: {
          firstName:     user.firstName,
          packName:      pack?.name || 'Pack',
          amount:        txn.amount,
          currency:      txn.currency,
          dashboardUrl:  `${process.env.FRONTEND_URL}/dashboard`,
          transactionId: fedapayTxId,
        },
      });
    } catch (e) {
      console.error('[Webhook] Email non envoyé:', e.message);
    }

  } catch (err) {
    console.error('[Webhook] Erreur activateAccess:', err.message);
  }
}