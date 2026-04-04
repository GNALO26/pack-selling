const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

/**
 * ViewToken — Token d'accès temporaire pour visualiser un PDF.
 *
 * Sécurité :
 * - Expire après 30 minutes
 * - Lié à un userId ET un documentFilename spécifique
 * - Usage unique : invalidé après première utilisation (streaming)
 * - IP binding optionnel
 */
const viewTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    default: () => uuidv4() + '-' + uuidv4(), // ~72 caractères aléatoires
  },
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
  documentFilename: {
    type: String,
    required: true,
  },
  // Expire dans 30 minutes
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 30 * 60 * 1000),
  },
  // IP du créateur pour validation optionnelle
  createdFromIP: String,
  // Marqué comme utilisé après le premier stream
  usedAt: Date,
  isUsed: {
    type: Boolean,
    default: false,
  },
  // Compteur d'accès (protection anti-replay)
  accessCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// TTL index — MongoDB supprime automatiquement les tokens expirés
viewTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
viewTokenSchema.index({ token: 1 });
viewTokenSchema.index({ userId: 1 });

// ── Validation du token ───────────────────────────────────────────────────────
viewTokenSchema.methods.isValid = function (userId, filename) {
  if (this.isUsed) return { valid: false, reason: 'Token déjà utilisé' };
  if (new Date() > this.expiresAt) return { valid: false, reason: 'Token expiré' };
  if (this.userId.toString() !== userId.toString()) return { valid: false, reason: 'Token invalide' };
  if (this.documentFilename !== filename) return { valid: false, reason: 'Document invalide' };
  return { valid: true };
};

module.exports = mongoose.model('ViewToken', viewTokenSchema);