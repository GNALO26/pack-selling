const { FedaPay, Transaction: FedaTransaction } = require('fedapay');
const Pack        = require('../models/Pack');
const Transaction = require('../models/Transaction');

FedaPay.setApiKey(process.env.FEDAPAY_SECRET_KEY);
FedaPay.setEnvironment(process.env.FEDAPAY_ENV || 'sandbox');
console.log(`[FedaPay] Mode : ${process.env.FEDAPAY_ENV || 'sandbox'}`);
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

    const txPayload = {
      description: `Achat — ${pack.name}`,
      amount:      pack.price,
      currency:    { iso: 'XOF' },
      callback_url:`${process.env.BACKEND_URL}/api/webhook/fedapay`,
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
      // Extraire le maximum d'info de l'erreur FedaPay
      console.error('[FedaPay RAW ERROR]', JSON.stringify(fedaErr, Object.getOwnPropertyNames(fedaErr)));
      console.error('[FedaPay] message:', fedaErr.message);
      console.error('[FedaPay] status:', fedaErr.status);
      console.error('[FedaPay] errors:', JSON.stringify(fedaErr.errors));

      // Tester si c'est un problème de montant minimum
      if (pack.price < 100) {
        return res.status(400).json({ error: `Montant trop faible : ${pack.price} XOF. Minimum FedaPay : 100 XOF.` });
      }

      return res.status(500).json({
        error: 'Erreur FedaPay lors de la création de la transaction.',
        fedapay_message: fedaErr.message,
        fedapay_errors:  fedaErr.errors || null,
        fedapay_status:  fedaErr.status || null,
      });
    }

    const token = await transaction.generateToken();
    console.log('[Payment] ✅ Transaction créée ID:', transaction.id, '| URL:', token.url);

    await Transaction.create({
      userId: user._id, packId: pack._id,
      fedapayTransactionId: transaction.id.toString(),
      amount: pack.price, currency: 'XOF', status: 'pending',
      customerEmail: user.email,
      customerName:  `${user.firstName} ${user.lastName}`,
      customerPhone: user.phone || '',
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
    res.json({ status: txn.status, amount: txn.amount, currency: txn.currency });
  } catch (err) { next(err); }
};