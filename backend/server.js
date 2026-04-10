require('dotenv').config();
const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const connectDB  = require('./config/database');

// ── Routes ──────────────────────────────────────────────────────────────────
const authRoutes     = require('./routes/auth');
const paymentRoutes  = require('./routes/payment');
const documentRoutes = require('./routes/documents');
const adminRoutes    = require('./routes/admin');
const webhookRoutes  = require('./routes/webhook');
const setupRoutes    = require('./routes/setup');
const packsRoutes    = require('./routes/packs');

const app = express();

// ── Trust proxy (Render est derrière un reverse proxy) ───────────────────────
app.set('trust proxy', 1);

// ── Connect MongoDB ──────────────────────────────────────────────────────────
connectDB();

// ── Security middleware ──────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // géré côté frontend Next.js
}));

// ── CORS ─────────────────────────────────────────────────────────────────────
// Construire la liste des origines autorisées
const buildAllowedOrigins = () => {
  const origins = [
    'http://localhost:3000',
    'http://localhost:3001',
  ];

  // Ajouter FRONTEND_URL depuis l'env (peut contenir plusieurs URLs séparées par des virgules)
  if (process.env.FRONTEND_URL) {
    process.env.FRONTEND_URL
      .split(',')
      .map(u => u.trim().replace(/\/$/, '')) // supprimer trailing slash
      .filter(Boolean)
      .forEach(u => origins.push(u));
  }

  return origins;
};

const allowedOrigins = buildAllowedOrigins();
console.log('[CORS] Origines autorisées:', allowedOrigins);

app.use(cors({
  origin: (origin, cb) => {
    // Autoriser les requêtes sans origin (Postman, curl, mobile apps)
    if (!origin) return cb(null, true);

    // Vérifier si l'origin est dans la liste
    if (allowedOrigins.includes(origin)) return cb(null, true);

    // Autoriser tous les sous-domaines Netlify (*.netlify.app)
    if (origin.endsWith('.netlify.app')) return cb(null, true);

    // Autoriser tous les sous-domaines Render (pour les previews)
    if (origin.endsWith('.onrender.com')) return cb(null, true);

    console.warn(`[CORS] Origine bloquée : ${origin}`);
    cb(new Error(`CORS: origine non autorisée — ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-setup-secret'],
}));

// ── Rate limiting global ──────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // augmenté pour la production
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes, réessayez dans 15 minutes.' },
  // Validation désactivée car trust proxy est activé
  validate: { xForwardedForHeader: false },
});
app.use(globalLimiter);

// ── Body parser — webhook AVANT json() ───────────────────────────────────────
app.use('/api/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ──────────────────────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    cors_origins: buildAllowedOrigins(),
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/payment',   paymentRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/webhook',   webhookRoutes);
app.use('/api/setup',     setupRoutes);
app.use('/api/packs',     packsRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route introuvable' });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  if (process.env.NODE_ENV === 'development') console.error(err.stack);
  const status = err.statusCode || 500;
  res.status(status).json({
    error: process.env.NODE_ENV === 'production' && status === 500
      ? 'Erreur serveur'
      : err.message,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Serveur Pack Digital 360 — port ${PORT} — ${process.env.NODE_ENV}`);
});

module.exports = app;