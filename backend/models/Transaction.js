const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  packId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pack',
    required: true,
  },
  // FedaPay transaction ID
  fedapayTransactionId: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'XOF',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'declined', 'cancelled', 'refunded'],
    default: 'pending',
  },
  customerEmail: String,
  customerName: String,
  customerPhone: String,
  // Données brutes du webhook FedaPay (pour audit)
  webhookPayload: {
    type: mongoose.Schema.Types.Mixed,
    select: false,
  },
  // Email de confirmation envoyé ?
  confirmationEmailSent: {
    type: Boolean,
    default: false,
  },
  confirmedAt: Date,
}, {
  timestamps: true,
});

transactionSchema.index({ fedapayTransactionId: 1 });
transactionSchema.index({ userId: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);