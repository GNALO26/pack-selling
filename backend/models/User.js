const mongoose  = require('mongoose');
const bcrypt    = require('bcryptjs');
const validator = require('validator');

const purchaseSchema = new mongoose.Schema({
  packId: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'Pack',
    required: true,
  },
  purchasedAt:     { type: Date, default: Date.now },
  amount:          { type: Number, default: 0 },
  currency:        { type: String, default: 'XOF' },
  grantedManually: { type: Boolean, default: false },
}, { _id: false });

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName:  { type: String, required: true, trim: true },
  email: {
    type:      String,
    required:  true,
    lowercase: true,
    trim:      true,
    validate:  [validator.isEmail, 'Email invalide'],
  },
  password: {
    type:     String,
    required: true,
    minlength: 8,
    select:   false,
  },
  phone:  { type: String, trim: true },
  role:   { type: String, enum: ['client', 'admin'], default: 'client' },

  isEmailVerified:         { type: Boolean, default: false },
  emailVerificationToken:  { type: String, select: false },
  emailVerificationExpires:{ type: Date,   select: false },

  passwordResetToken:      { type: String, select: false },
  passwordResetExpires:    { type: Date,   select: false },

  isActive:    { type: Boolean, default: true },
  lastLoginAt: Date,
  loginCount:  { type: Number, default: 0 },

  purchases: [purchaseSchema],
}, { timestamps: true });

// Index uniques
userSchema.index({ email: 1 }, { unique: true });

// Hash du mot de passe avant sauvegarde
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Comparer le mot de passe
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Vérifier si l'utilisateur a acheté un pack — robuste sur les deux formats
userSchema.methods.hasPurchased = function (packId) {
  if (!this.purchases || this.purchases.length === 0) return false;
  const targetId = packId.toString();
  return this.purchases.some(p => {
    // packId peut être un ObjectId populé ou une string
    const pid = p.packId?._id
      ? p.packId._id.toString()
      : p.packId?.toString();
    return pid === targetId;
  });
};

module.exports = mongoose.model('User', userSchema);