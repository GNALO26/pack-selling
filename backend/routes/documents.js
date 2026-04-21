const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/documentController');
const { protect } = require('../middleware/auth');

// Toutes les routes documents nécessitent une authentification
router.use(protect);

// Liste les documents d'un pack (sans exposer le filename)
router.get('/list/:packId',   ctrl.listDocuments);

// Génère un token d'accès temporaire
router.post('/request-token', ctrl.requestToken);

// Stream le PDF via le token
router.get('/view/:token',    ctrl.viewDocument);

module.exports = router;