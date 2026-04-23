const path      = require('path');
const fs        = require('fs');
const { v4: uuidv4 } = require('uuid');
const Pack      = require('../models/Pack');
const ViewToken = require('../models/ViewToken');

const PDF_DIR = process.env.PDF_DIR || './private/documents';

// ── LIST DOCUMENTS ────────────────────────────────────────────────────────────
exports.listDocuments = async (req, res, next) => {
  try {
    const { packId } = req.params;
    const user = req.user;

    const hasPack = user.purchases && user.purchases.some(p => {
      const pid = p.packId?._id ? p.packId._id.toString() : p.packId?.toString();
      return pid === packId;
    });

    if (!hasPack) {
      console.log(`[Documents] Accès refusé — ${user.email} sur pack ${packId}`);
      console.log(`[Documents] Purchases:`, JSON.stringify(
        user.purchases?.map(p => ({ packId: p.packId?._id?.toString() || p.packId?.toString() }))
      ));
      return res.status(403).json({ error: 'Accès non autorisé à ce pack.' });
    }

    const pack = await Pack.findById(packId);
    if (!pack) return res.status(404).json({ error: 'Pack introuvable.' });

    const documents = pack.documents
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(doc => ({
        id:        doc._id.toString(),
        title:     doc.title,
        fileSize:  doc.fileSize,
        pageCount: doc.pageCount,
        order:     doc.order,
      }));

    res.json({ packName: pack.name, documents });
  } catch (err) { next(err); }
};

// ── REQUEST TOKEN ─────────────────────────────────────────────────────────────
exports.requestToken = async (req, res, next) => {
  try {
    const { packId, docId } = req.body;
    const user = req.user;

    if (!packId || !docId) {
      return res.status(400).json({ error: 'packId et docId sont requis.' });
    }

    const hasPack = user.purchases && user.purchases.some(p => {
      const pid = p.packId?._id ? p.packId._id.toString() : p.packId?.toString();
      return pid === packId;
    });

    if (!hasPack) {
      console.log(`[Documents] requestToken refusé — ${user.email} sur pack ${packId}`);
      return res.status(403).json({ error: 'Accès non autorisé à ce pack.' });
    }

    const pack = await Pack.findById(packId);
    if (!pack) return res.status(404).json({ error: 'Pack introuvable.' });

    const doc = pack.documents.find(d => d._id.toString() === docId);
    if (!doc) {
      console.error(`[Documents] Doc ${docId} non trouvé. Dispo:`,
        pack.documents.map(d => d._id.toString()));
      return res.status(404).json({ error: 'Document introuvable dans ce pack.' });
    }

    // Vérifier que le PDF existe physiquement
    const pdfPath = path.resolve(PDF_DIR, doc.filename);
    if (!fs.existsSync(pdfPath)) {
      console.error(`[Documents] PDF absent : ${pdfPath}`);
      return res.status(404).json({
        error: `Fichier PDF "${doc.filename}" non disponible sur le serveur. Contactez le support.`,
      });
    }

    // Supprimer les anciens tokens
    await ViewToken.deleteMany({ userId: user._id, documentFilename: doc.filename });

    const token     = `${uuidv4()}-${uuidv4()}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await ViewToken.create({
      token,
      userId:           user._id,
      packId:           pack._id,
      documentFilename: doc.filename,
      expiresAt,
      createdFromIP:    req.ip,
    });

    console.log(`[Documents] ✅ Token créé — ${user.email} | ${doc.title} | expire ${expiresAt.toISOString()}`);

    res.json({ token, expiresAt: expiresAt.toISOString() });
  } catch (err) { next(err); }
};

// ── VIEW DOCUMENT ─────────────────────────────────────────────────────────────
// Cette route N'EST PAS protégée par JWT — auth via ViewToken uniquement
// Le JWT est vérifié optionnellement depuis le query param pour plus de sécurité
exports.viewDocument = async (req, res, next) => {
  try {
    const { token } = req.params;

    const viewToken = await ViewToken.findOne({ token });

    if (!viewToken) {
      console.error(`[Documents] ViewToken introuvable: ${token.substring(0, 20)}...`);
      return res.status(404).json({ error: 'Token invalide ou expiré.' });
    }

    if (new Date() > viewToken.expiresAt) {
      await ViewToken.deleteOne({ _id: viewToken._id });
      return res.status(401).json({ error: 'Session expirée. Retournez au tableau de bord.' });
    }

    // Vérification optionnelle du JWT dans le header Authorization
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        if (decoded.id !== viewToken.userId.toString()) {
          return res.status(403).json({ error: 'Token invalide.' });
        }
      } catch {
        // JWT invalide ou expiré — on continue quand même avec le ViewToken seul
        console.warn('[Documents] JWT invalide mais ViewToken OK — accès autorisé');
      }
    }

    const pdfPath = path.resolve(PDF_DIR, viewToken.documentFilename);

    if (!fs.existsSync(pdfPath)) {
      console.error(`[Documents] PDF absent sur disque: ${pdfPath}`);
      return res.status(404).json({
        error: `Fichier PDF absent du serveur. Contactez le support.`,
      });
    }

    const stat = fs.statSync(pdfPath);

    // Headers anti-téléchargement
    res.setHeader('Content-Type',           'application/pdf');
    res.setHeader('Content-Length',         stat.size);
    res.setHeader('Content-Disposition',    'inline');
    res.setHeader('Cache-Control',          'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma',                 'no-cache');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options',        'SAMEORIGIN');
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');

    // Incrémenter le compteur
    viewToken.accessCount = (viewToken.accessCount || 0) + 1;
    viewToken.usedAt = new Date();
    await viewToken.save();

    console.log(`[Documents] 📄 Stream PDF — ${viewToken.documentFilename} — accès #${viewToken.accessCount}`);

    // Stream le fichier
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.on('error', err => {
      console.error('[Documents] Stream error:', err.message);
      if (!res.headersSent) res.status(500).json({ error: 'Erreur lecture fichier.' });
    });
    fileStream.pipe(res);

  } catch (err) { next(err); }
};