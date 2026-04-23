const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/documentController');
const { protect } = require('../middleware/auth');

// Routes protégées par JWT
router.get('/list/:packId',   protect, ctrl.listDocuments);
router.post('/request-token', protect, ctrl.requestToken);

// Route de streaming — auth via ViewToken uniquement (pas de JWT obligatoire)
// car PDF.js ne peut pas injecter de header Authorization facilement
router.get('/view/:token', ctrl.viewDocument);

module.exports = router;