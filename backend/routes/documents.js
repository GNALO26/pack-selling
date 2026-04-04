// routes/documents.js
const express = require('express');
const rateLimit = require('express-rate-limit');
const router  = express.Router();
const ctrl    = require('../controllers/documentController');
const { protect } = require('../middleware/auth');

// Limite stricte sur la génération de tokens
const tokenLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 20,
  message: { error: 'Trop de requêtes de documents.' },
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
});

// Limite sur le streaming (par IP)
const streamLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  message: { error: 'Trop de requêtes de visualisation.' },
});

router.post('/request-token',   protect, tokenLimiter,  ctrl.requestViewToken);
router.get( '/view/:token',              streamLimiter,  ctrl.streamDocument);
router.get( '/list/:packId',    protect,                 ctrl.listDocuments);

module.exports = router;
