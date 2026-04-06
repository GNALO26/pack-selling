/**
 * Route de setup initial — utilisée UNE SEULE FOIS pour créer l'admin et le pack.
 * Protégée par SETUP_SECRET (variable d'environnement).
 *
 * Usage :
 *   POST https://pack-selling.onrender.com/api/setup/seed
 *   Header: x-setup-secret: VOTRE_SETUP_SECRET
 *
 * ⚠️  Désactiver cette route après le premier seed en production
 *     en supprimant SETUP_SECRET des variables d'environnement Render.
 */
const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const User    = require('../models/User');
const Pack    = require('../models/Pack');

router.post('/seed', async (req, res) => {
  try {
    // ── Vérification du secret ──────────────────────────────────────────────
    const secret = req.headers['x-setup-secret'];

    if (!process.env.SETUP_SECRET) {
      return res.status(403).json({
        error: 'Route de setup désactivée. Ajoutez SETUP_SECRET dans vos variables d\'environnement.',
      });
    }

    if (secret !== process.env.SETUP_SECRET) {
      return res.status(401).json({ error: 'Secret invalide.' });
    }

    const results = [];

    // ── Créer l'admin ───────────────────────────────────────────────────────
    const adminEmail = process.env.ADMIN_EMAIL || 'guidolokossouolympe@gmail.com';
    const adminExists = await User.findOne({ email: adminEmail });

    if (!adminExists) {
      await User.create({
        firstName:       'Olympe',
        lastName:        'GUIDO-LOKOSSOU',
        email:           adminEmail,
        password:        process.env.ADMIN_PASSWORD || 'Admin@360!Secure',
        role:            'admin',
        isEmailVerified: true,
      });
      results.push('✅ Admin créé : ' + adminEmail);
    } else {
      results.push('ℹ️  Admin déjà existant : ' + adminEmail);
    }

    // ── Créer le Pack Digital 360 ───────────────────────────────────────────
    const packExists = await Pack.findOne({ slug: 'pack-digital-360' });

    if (!packExists) {
      const pack = await Pack.create({
        slug:        'pack-digital-360',
        name:        'Pack Digital 360',
        tagline:     'Votre présence Google complète — configurée, gérée, mesurée',
        description: 'Le guide complet pour maîtriser l\'écosystème Google et devenir un consultant digital indispensable.',
        price:       25000,
        currency:    'XOF',
        features: [
          'Guide complet Google Business Profile',
          'Google Search Console — configuration détaillée',
          'Google Analytics 4 + Tag Manager',
          'Google PageSpeed Insights & Core Web Vitals',
          'Google Looker Studio — reporting automatisé',
          'Google Workspace — email professionnel',
          'Intelligence Artificielle comme service premium',
          'Grille tarifaire FCFA complète',
          'Script marketing voix off (3 versions)',
        ],
        documents: [
          {
            title:    'Guide Pack Digital 360 — Complet',
            filename: 'Guide_Pack_Digital_360.pdf',
            fileSize: 274637,
            pageCount: 68,
            order:    1,
          },
          {
            title:    'Script Marketing Voix Off',
            filename: 'Script_Marketing_Pack_Digital_360.pdf',
            fileSize: 144385,
            pageCount: 18,
            order:    2,
          },
        ],
        isActive: true,
      });
      results.push('✅ Pack créé — ID : ' + pack._id.toString());
      results.push('📋 PACK_ID pour le frontend : ' + pack._id.toString());
    } else {
      results.push('ℹ️  Pack déjà existant — ID : ' + packExists._id.toString());
      results.push('📋 PACK_ID pour le frontend : ' + packExists._id.toString());
    }

    res.json({
      success: true,
      message: 'Setup terminé avec succès.',
      results,
      next_steps: [
        '1. Copiez le PACK_ID ci-dessus',
        '2. Ajoutez-le dans NEXT_PUBLIC_PACK_ID sur Netlify',
        '3. Redéployez le frontend Netlify',
        '4. Supprimez SETUP_SECRET des variables Render pour désactiver cette route',
      ],
    });

  } catch (err) {
    console.error('[Setup] Erreur:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;