const { FedaPay, Transaction: FedaTransaction } = require('fedapay');
const Pack        = require('../models/Pack');
const Transaction = require('../models/Transaction');

FedaPay.setApiKey(process.env.FEDAPAY_SECRET_KEY);
FedaPay.setEnvironment(process.env.FEDAPAY_ENV || 'sandbox');
console.log(`[FedaPay] Mode : ${process.env.FEDAPAY_ENV || 'live'}`);
console.log(`[FedaPay] Clé (5 premiers chars): ${(process.env.FEDAPAY_SECRET_KEY||'').substring(0,12)}...`);

exports.initiatePayment = async (req, res, next) => {
  try {
    const { packId } = req.body;
    const user = req.user;

    if (!packId) return res.status(400).json({ error: 'packId requis.' });

    const pack = await Pack.findById(packId);
    if (!pack || !pack.isActive) return res.status(404).json({ error: 'Pack introuvable.' });

    if (user.hasPurchased(packId))
      return res.status(409).json({ error: 'Vous avez déjà accès à ce pack.', alreadyPurchased: true });

    const frontendUrl = process.env.FRONTEND_URL || 'https://gui-lok-packs.netlify.app';
    const backendUrl  = process.env.BACKEND_URL  || 'https://pack-selling.onrender.com';

    const txPayload = {
      description:  `Achat — ${pack.name}`,
      amount:       pack.price,
      currency:     { iso: 'XOF' },
      // callback_url = appelé par FedaPay serveur à serveur (webhook)
      callback_url: `${backendUrl}/api/webhook/fedapay`,
      // redirect_url = où FedaPay redirige le navigateur du client après paiement
      redirect_url: `${frontendUrl}/dashboard`,
      customer: {
        firstname: user.firstName || 'Client',
        lastname:  user.lastName  || 'Pack',
        email:     user.email,
      },
    };

    console.log('[Payment] Payload:', JSON.stringify(txPayload));

    let transaction;
    try {
      transaction = await FedaTransaction.create(txPayload);
    } catch (fedaErr) {
      console.error('[FedaPay RAW ERROR]', JSON.stringify(fedaErr, Object.getOwnPropertyNames(fedaErr)));
      console.error('[FedaPay] errors:', JSON.stringify(fedaErr.errors));
      return res.status(500).json({
        error: 'Erreur FedaPay lors de la création de la transaction.',
        fedapay_errors: fedaErr.errors || fedaErr.message,
      });
    }

    const token = await transaction.generateToken();
    console.log('[Payment] ✅ Transaction créée ID:', transaction.id, '| URL:', token.url);

    await Transaction.create({
      userId:               user._id,
      packId:               pack._id,
      fedapayTransactionId: transaction.id.toString(),
      amount:               pack.price,
      currency:             'XOF',
      status:               'pending',
      customerEmail:        user.email,
      customerName:         `${user.firstName} ${user.lastName}`,
      customerPhone:        user.phone || '',
    });

    res.json({ checkoutUrl: token.url, transactionId: transaction.id });

  } catch (err) {
    console.error('[Payment] Erreur générale:', err.message);
    next(err);
  }
};

exports.checkStatus = async (req, res, next) => {
  try {
    const txn = await Transaction.findOne({
      fedapayTransactionId: req.params.transactionId,
      userId: req.user._id,
    });
    if (!txn) return res.status(404).json({ error: 'Transaction introuvable.' });
    res.json({ status: txn.status, amount: txn.amount, currency: txn.currency, confirmedAt: txn.confirmedAt });
  } catch (err) { next(err); }
};