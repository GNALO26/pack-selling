const express = require('express');
const router  = express.Router();
const Pack    = require('../models/Pack');

// GET /api/packs — liste publique de tous les packs actifs
router.get('/', async (req, res, next) => {
  try {
    const packs = await Pack.find({ isActive: true })
      .select('-documents.filename') // ne jamais exposer le nom de fichier
      .sort({ createdAt: 1 });
    res.json({ packs });
  } catch (err) { next(err); }
});

// GET /api/packs/:slug — détail d'un pack (sans filename)
router.get('/:slug', async (req, res, next) => {
  try {
    const pack = await Pack.findOne({ slug: req.params.slug, isActive: true })
      .select('-documents.filename');
    if (!pack) return res.status(404).json({ error: 'Pack introuvable.' });
    res.json({ pack });
  } catch (err) { next(err); }
});

module.exports = router;