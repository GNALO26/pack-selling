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

    // Construire l'objet customer — phone_number optionnel
    const customer = {
      firstname: user.firstName,
      lastname:  user.lastName,
      email:     user.email,
    };

    // N'ajouter phone_number que s'il est renseigné et valide
    if (user.phone && user.phone.trim().length >= 8) {
      // Nettoyer le numéro : garder uniquement les chiffres
      const cleanPhone = user.phone.replace(/\D/g, '');
      if (cleanPhone.length >= 8) {
        customer.phone_number = {
          number:  cleanPhone,
          country: 'BJ',
        };
      }
    }

    // Créer la transaction FedaPay
    const txData = {
      description: `Achat — ${pack.name}`,
      amount:      pack.price,
      currency:    { iso: pack.currency || 'XOF' },
      callback_url: `${process.env.BACKEND_URL}/api/webhook/fedapay`,
      customer,
      // custom_metadata transmis dans le webhook
      custom_metadata: {
        userId: user._id.toString(),
        packId: pack._id.toString(),
      },
    };

    console.log('[Payment] Création transaction FedaPay:', JSON.stringify({
      description: txData.description,
      amount: txData.amount,
      currency: txData.currency,
      customer_email: txData.customer.email,
    }));

    const transaction = await FedaTransaction.create(txData);

    // Générer le token de paiement
    const token = await transaction.generateToken();

    // Sauvegarder en base
    await Transaction.create({
      userId:               user._id,
      packId:               pack._id,
      fedapayTransactionId: transaction.id.toString(),
      amount:               pack.price,
      currency:             pack.currency || 'XOF',
      status:               'pending',
      customerEmail:        user.email,
      customerName:         `${user.firstName} ${user.lastName}`,
      customerPhone:        user.phone || '',
    });

    console.log(`[Payment] ✅ Transaction créée — ID: ${transaction.id} — User: ${user.email}`);

    // Construire la redirect_url SANS placeholders FedaPay
    // On redirige vers le dashboard et on vérifie le statut via l'API
    const redirectUrl = `${process.env.FRONTEND_URL}/dashboard?payment=pending&txn=${transaction.id}`;

    res.json({
      checkoutUrl:   token.url,
      transactionId: transaction.id,
      redirectUrl,
    });

  } catch (err) {
    console.error('[Payment] Erreur FedaPay:', err?.message || err);
    console.error('[Payment] Status:', err?.response?.status);
    console.error('[Payment] Data:', JSON.stringify(err?.response?.data || {}));

    if (err?.message?.includes('Unauthorized') || err?.response?.status === 401) {
      return res.status(500).json({ error: 'Clés FedaPay invalides. Vérifiez FEDAPAY_SECRET_KEY.' });
    }
    if (err?.response?.status === 400) {
      return res.status(500).json({
        error: 'Erreur FedaPay (400). Vérifiez les données envoyées.',
        detail: err?.response?.data,
      });
    }

    next(err);
  }
};

/**
 * GET /api/payment/status/:transactionId
 */
exports.checkStatus = async (req, res, next) => {
  try {
    const { transactionId } = req.params;

    const txn = await Transaction.findOne({
      fedapayTransactionId: transactionId,
      userId: req.user._id,
    });

    if (!txn)
      return res.status(404).json({ error: 'Transaction introuvable.' });

    res.json({
      status:      txn.status,
      amount:      txn.amount,
      currency:    txn.currency,
      confirmedAt: txn.confirmedAt,
    });
  } catch (err) {
    next(err);
  }
};