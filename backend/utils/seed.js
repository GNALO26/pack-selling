require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('../models/User');
const Pack     = require('../models/Pack');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connecté pour seed...');

    // ── Admin user ───────────────────────────────────────────────────────────
    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL || 'admin@packdigital360.bj' });
    if (!adminExists) {
      await User.create({
        firstName: 'Olympe',
        lastName: 'GUIDO-LOKOSSOU',
        email: process.env.ADMIN_EMAIL || 'admin@packdigital360.bj',
        password: process.env.ADMIN_PASSWORD || 'Admin@360!Secure',
        role: 'admin',
        isEmailVerified: true,
      });
      console.log('✅ Admin créé');
    } else {
      console.log('ℹ️  Admin déjà existant');
    }

    // ── Pack Digital 360 ──────────────────────────────────────────────────────
    const packExists = await Pack.findOne({ slug: 'pack-digital-360' });
    if (!packExists) {
      await Pack.create({
        slug: 'pack-digital-360',
        name: 'Pack Digital 360',
        tagline: 'Votre présence Google complète — configurée, gérée, mesurée',
        description: 'Le guide complet pour maîtriser l\'écosystème Google et devenir un consultant digital indispensable.',
        price: 25000, // 25 000 FCFA — ajustez selon votre tarif
        currency: 'XOF',
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
            title: 'Guide Pack Digital 360 — Complet',
            filename: 'Guide_Pack_Digital_360_v2.pdf',
            fileSize: 274637,
            pageCount: 55,
            order: 1,
          },
          {
            title: 'Script Marketing Voix Off',
            filename: 'Script_Marketing_Pack_Digital_360.pdf',
            fileSize: 144385,
            pageCount: 18,
            order: 2,
          },
        ],
        isActive: true,
      });
      console.log('✅ Pack Digital 360 créé');
    } else {
      console.log('ℹ️  Pack déjà existant');
    }

    console.log('\n🎉 Seed terminé avec succès !');
    console.log('─────────────────────────────────────────');
    console.log('Admin email    :', process.env.ADMIN_EMAIL || 'admin@packdigital360.bj');
    console.log('Admin password :', process.env.ADMIN_PASSWORD || 'Admin@360!Secure');
    console.log('⚠️  CHANGEZ LE MOT DE PASSE EN PRODUCTION !');
    console.log('─────────────────────────────────────────');

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur seed:', err);
    process.exit(1);
  }
};

seed();
