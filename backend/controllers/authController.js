const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const User     = require('../models/User');
const { sendEmail } = require('../utils/mailer');

// ── Helpers ───────────────────────────────────────────────────────────────────
const signToken = (id) => jwt.sign(
  { id },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

const generateVerifToken = () => crypto.randomBytes(32).toString('hex');

// ── REGISTER ──────────────────────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'Tous les champs sont requis.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Mot de passe : minimum 8 caractères.' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ error: 'Un compte existe déjà avec cet email.' });
    }

    // Si SKIP_EMAIL_VERIFY=true → compte activé immédiatement (SMTP non fonctionnel)
    const skipVerif = process.env.SKIP_EMAIL_VERIFY === 'true';
    const verifToken = require('crypto').randomBytes(32).toString('hex');

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      isEmailVerified: skipVerif, // true si SKIP_EMAIL_VERIFY
      emailVerificationToken:   skipVerif ? undefined : verifToken,
      emailVerificationExpires: skipVerif ? undefined : new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    if (skipVerif) {
      // Connexion directe sans vérification email
      const token = signToken(user._id);
      return res.status(201).json({
        message: 'Compte créé avec succès.',
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          purchases: user.purchases || [],
        },
        autoLogin: true,
      });
    }

    // Envoyer email de vérification
    const verifUrl = `${process.env.FRONTEND_URL}/verify?token=${verifToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Vérifiez votre email — GUI-LOK DEV',
      template: 'verifyEmail',
      data: { firstName: user.firstName, verifUrl },
    });

    res.status(201).json({
      message: 'Compte créé. Vérifiez votre email pour activer votre compte.',
      userId: user._id,
    });
  } catch (err) {
    next(err);
  }
};

// ── VERIFY EMAIL ──────────────────────────────────────────────────────────────
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Token manquant.' });

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      return res.status(400).json({ error: 'Token invalide ou expiré. Demandez un nouveau.' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    const jwtToken = signToken(user._id);
    res.json({
      message: 'Email vérifié avec succès.',
      token: jwtToken,
      user: { id: user._id, email: user.email, firstName: user.firstName, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

// ── LOGIN ─────────────────────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        error: 'Email non vérifié. Consultez votre boîte mail.',
        needsVerification: true,
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Compte désactivé. Contactez le support.' });
    }

    // Update last login
    user.lastLoginAt = new Date();
    user.loginCount += 1;
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        purchases: user.purchases,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET ME ────────────────────────────────────────────────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('purchases.packId', 'name slug');
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

// ── FORGOT PASSWORD ───────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });

    // Toujours répondre 200 pour ne pas révéler si l'email existe
    if (!user) return res.json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });

    const resetToken = generateVerifToken();
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Réinitialisation de mot de passe — Pack Digital 360',
      template: 'resetPassword',
      data: { firstName: user.firstName, resetUrl },
    });

    res.json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
  } catch (err) {
    next(err);
  }
};

// ── RESET PASSWORD ────────────────────────────────────────────────────────────
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Données manquantes.' });
    if (password.length < 8) return res.status(400).json({ error: 'Minimum 8 caractères.' });

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) return res.status(400).json({ error: 'Token invalide ou expiré.' });

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: 'Mot de passe réinitialisé. Vous pouvez vous connecter.' });
  } catch (err) {
    next(err);
  }
};

// ── RESEND VERIFICATION ───────────────────────────────────────────────────────
exports.resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() })
      .select('+emailVerificationToken +emailVerificationExpires');

    if (!user || user.isEmailVerified) {
      return res.json({ message: 'Si le compte existe et n\'est pas vérifié, un email a été envoyé.' });
    }

    const verifToken = generateVerifToken();
    user.emailVerificationToken = verifToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const verifUrl = `${process.env.FRONTEND_URL}/auth/verify?token=${verifToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Vérifiez votre email — Pack Digital 360',
      template: 'verifyEmail',
      data: { firstName: user.firstName, verifUrl },
    });

    res.json({ message: 'Email de vérification renvoyé.' });
  } catch (err) {
    next(err);
  }
};