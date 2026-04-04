const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email requis'],
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Email invalide'],
  },
  password: {
    type: String,
    required: [true, 'Mot de passe requis'],
    minlength: [8, 'Minimum 8 caractères'],
    select: false, // jamais retourné par défaut
  },
  firstName: {
    type: String,
    required: [true, 'Prénom requis'],
    trim: true,
    maxlength: [50, 'Prénom trop long'],
  },
  lastName: {
    type: String,
    required: [true, 'Nom requis'],
    trim: true,
    maxlength: [50, 'Nom trop long'],
  },
  phone: {
    type: String,
    trim: true,
  },
  role: {
    type: String,
    enum: ['client', 'admin'],
    default: 'client',
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: {
    type: String,
    select: false,
  },
  emailVerificationExpires: {
    type: Date,
    select: false,
  },
  passwordResetToken: {
    type: String,
    select: false,
  },
  passwordResetExpires: {
    type: Date,
    select: false,
  },
  // Accès aux packs achetés
  purchases: [{
    packId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pack',
    },
    purchasedAt: { type: Date, default: Date.now },
    paymentId: String,
    transactionId: String,
    amount: Number,
    currency: { type: String, default: 'XOF' },
    // Accès manuel donné par admin
    grantedManually: { type: Boolean, default: false },
    grantedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],
  lastLoginAt: Date,
  loginCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

// ── Index ─────────────────────────────────────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ 'purchases.packId': 1 });

// ── Hash password avant save ──────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ── Comparer mot de passe ─────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// ── Check accès à un pack ─────────────────────────────────────────────────────
userSchema.methods.hasPurchased = function (packId) {
  return this.purchases.some(p => p.packId.toString() === packId.toString());
};

// ── Masquer données sensibles en JSON ────────────────────────────────────────
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailVerificationToken;
  delete obj.emailVerificationExpires;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  return obj;
};

module.exports = mongoose.model('User', userSchema);