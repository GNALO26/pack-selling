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
const seedRoutes     = require('./routes/seed');

const app = express();

// ── Connect MongoDB ──────────────────────────────────────────────────────────
connectDB();

// ── Security middleware ──────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'"],
      imgSrc:     ["'self'", 'data:'],
      frameSrc:   ["'none'"],       // ← Empêche l'embed du viewer dans d'autres sites
      objectSrc:  ["'none'"],
    }
  }
}));

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS bloqué'));
  },
  credentials: true,
}));

// ── Rate limiting global ──────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes, réessayez dans 15 minutes.' },
});
app.use(globalLimiter);

// ── Body parser — webhook AVANT json() ───────────────────────────────────────
app.use('/api/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logging (prod: combined, dev: dev) ───────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV, timestamp: new Date().toISOString() });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/payment',  paymentRoutes);
app.use('/api/documents',documentRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/webhook',  webhookRoutes);
app.use('/api/setup',    setupRoutes);
app.use('/api/seed',     seedRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route introuvable' });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  if (process.env.NODE_ENV === 'development') console.error(err.stack);
  res.status(err.statusCode || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Erreur serveur' : err.message,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Serveur Pack Digital 360 — port ${PORT} — ${process.env.NODE_ENV}`);
});

module.exports = app;