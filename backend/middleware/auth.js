const jwt  = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware d'authentification JWT.
 * Vérifie le token Bearer dans Authorization header.
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Non authentifié. Connectez-vous.' });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Session expirée. Reconnectez-vous.' });
      }
      return res.status(401).json({ error: 'Token invalide.' });
    }

    const user = await User.findById(decoded.id).select('+isActive');
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Compte introuvable ou désactivé.' });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Middleware admin uniquement.
 * À utiliser APRÈS protect.
 */
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs.' });
  }
  next();
};

/**
 * Middleware optionnel — authentifie si token présent, continue sinon.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return next();
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch {
    next(); // continue sans user
  }
};

module.exports = { protect, adminOnly, optionalAuth };
