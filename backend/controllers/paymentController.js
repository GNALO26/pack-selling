const { FedaPay, Transaction: FedaTransaction } = require('fedapay');
const Pack        = require('../models/Pack');
const Transaction = require('../models/Transaction');

// Init FedaPay
FedaPay.setApiKey(process.env.FEDAPAY_SECRET_KEY);
FedaPay.setEnvironment(process.env.FEDAPAY_ENV || 'sandbox');
console.log(`[FedaPay] Mode : ${process.env.FEDAPAY_ENV || 'sandbox'}`);

/**
 * POST /api/payment/initiate
 */
exports.initiatePayment = async (req, res, next) => {
  try {
    const { packId } = req.body;
    const user = req.user;

    if (!packId)
      return res.status(400).json({ error: 'packId requis.' });

    const pack = await Pack.findById(packId);
    if (!pack || !pack.isActive)
      return res.status(404).json({ error: 'Pack introuvable ou indisponible.' });

    if (user.hasPurchased(packId))
      return res.status(409).json({ error: 'Vous avez déjà accès à ce pack.', alreadyPurchased: true });

    // ── Payload minimal — juste ce que FedaPay exige absolument ──────────────
    const txPayload = {
      description: `Achat — ${pack.name}`,
      amount:      pack.price,
      currency:    { iso: 'XOF' },
      callback_url: `${process.env.BACKEND_URL}/api/webhook/fedapay`,
      customer: {
        firstname: user.firstName || 'Client',
        lastname:  user.lastName  || 'GUI-LOK',
        email:     user.email,
      },
    };

    console.log('[Payment] Payload FedaPay complet:', JSON.stringify(txPayload, null, 2));

    const transaction = await FedaTransaction.create(txPayload);
    console.log('[Payment] Transaction créée, ID:', transaction.id);

    const token = await transaction.generateToken();
    console.log('[Payment] Token URL:', token.url);

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

    res.json({
      checkoutUrl:   token.url,
      transactionId: transaction.id,
    });

  } catch (err) {
    // Log complet de l'erreur FedaPay
    console.error('[Payment] ===== ERREUR FEDAPAY =====');
    console.error('[Payment] message:', err?.message);
    console.error('[Payment] name:', err?.name);
    console.error('[Payment] status:', err?.status);
    console.error('[Payment] statusCode:', err?.statusCode);
    // L'erreur FedaPay est souvent dans err.errors ou err.response
    if (err?.errors) console.error('[Payment] errors:', JSON.stringify(err.errors));
    if (err?.response) {
      console.error('[Payment] response.status:', err.response?.status);
      console.error('[Payment] response.data:', JSON.stringify(err.response?.data));
    }
    // Stringify complet pour ne rien rater
    try {
      console.error('[Payment] err (JSON):', JSON.stringify(err, Object.getOwnPropertyNames(err)));
    } catch(e) {}
    console.error('[Payment] ==========================');

    return res.status(500).json({
      error: 'Erreur lors de la création du paiement.',
      detail: err?.message || 'Erreur inconnue',
    });
  }
};

/**
 * GET /api/payment/status/:transactionId
 */
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