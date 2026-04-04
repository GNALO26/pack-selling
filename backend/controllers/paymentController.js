const FedaPay   = require('fedapay');
const Pack       = require('../models/Pack');
const Transaction = require('../models/Transaction');

// Init FedaPay
FedaPay.setApiKey(process.env.FEDAPAY_SECRET_KEY);
FedaPay.setEnvironment(process.env.FEDAPAY_ENV || 'live');
console.log('[Fedapay] Mode : ${process.env.FEDAPAY || 'live'}');
/**
 * POST /api/payment/initiate
 * Crée une transaction FedaPay et retourne le checkout URL.
 */
exports.initiatePayment = async (req, res, next) => {
  try {
    const { packId } = req.body;
    const user = req.user;

    // Vérifier que le pack existe
    const pack = await Pack.findById(packId);
    if (!pack || !pack.isActive) {
      return res.status(404).json({ error: 'Pack introuvable.' });
    }

    // Vérifier que l'utilisateur n'a pas déjà acheté
    if (user.hasPurchased(packId)) {
      return res.status(409).json({
        error: 'Vous avez déjà accès à ce pack.',
        alreadyPurchased: true,
      });
    }

    // Créer transaction FedaPay
    const transaction = await FedaPay.Transaction.create({
      description: `Achat ${pack.name} — Pack Digital 360`,
      amount: pack.price,
      currency: { iso: pack.currency },
      callback_url: `${process.env.BACKEND_URL}/api/webhook/fedapay`,
      customer: {
        firstname: user.firstName,
        lastname: user.lastName,
        email: user.email,
        phone_number: {
          number: user.phone || '',
          country: 'BJ',
        },
      },
      custom_metadata: {
        userId: user._id.toString(),
        packId: pack._id.toString(),
      },
    });

    // Générer le token de paiement (checkout URL)
    const token = await transaction.generateToken();

    // Sauvegarder la transaction en base
    await Transaction.create({
      userId: user._id,
      packId: pack._id,
      fedapayTransactionId: transaction.id.toString(),
      amount: pack.price,
      currency: pack.currency,
      status: 'pending',
      customerEmail: user.email,
      customerName: `${user.firstName} ${user.lastName}`,
      customerPhone: user.phone,
    });

    res.json({
      checkoutUrl: token.url,
      transactionId: transaction.id,
    });
  } catch (err) {
    console.error('[Payment] Erreur FedaPay:', err);
    next(err);
  }
};

/**
 * GET /api/payment/status/:transactionId
 * Vérifie le statut d'une transaction.
 */
exports.checkStatus = async (req, res, next) => {
  try {
    const { transactionId } = req.params;

    const txn = await Transaction.findOne({
      fedapayTransactionId: transactionId,
      userId: req.user._id,
    });

    if (!txn) return res.status(404).json({ error: 'Transaction introuvable.' });

    res.json({
      status: txn.status,
      amount: txn.amount,
      currency: txn.currency,
      confirmedAt: txn.confirmedAt,
    });
  } catch (err) {
    next(err);
  }
};
