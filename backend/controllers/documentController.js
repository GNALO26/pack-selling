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

    // Vérifier l'accès — chercher dans les purchases
    const hasPack = user.purchases && user.purchases.some(p => {
      const pid = p.packId?._id
        ? p.packId._id.toString()
        : p.packId?.toString();
      return pid === packId;
    });

    if (!hasPack) {
      console.log(`[Documents] listDocuments — accès refusé pour ${user.email} sur pack ${packId}`);
      console.log(`[Documents] Purchases de cet user:`, JSON.stringify(user.purchases?.map(p => ({
        packId: p.packId?._id?.toString() || p.packId?.toString(),
        purchasedAt: p.purchasedAt,
      }))));
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

    // Vérifier l'accès — même logique que listDocuments
    const hasPack = user.purchases && user.purchases.some(p => {
      const pid = p.packId?._id
        ? p.packId._id.toString()
        : p.packId?.toString();
      return pid === packId;
    });

    if (!hasPack) {
      console.log(`[Documents] requestToken — accès refusé pour ${user.email} sur pack ${packId}`);
      console.log(`[Documents] Purchases:`, JSON.stringify(user.purchases?.map(p => ({
        packId: p.packId?._id?.toString() || p.packId?.toString(),
      }))));
      return res.status(403).json({ error: 'Accès non autorisé à ce pack.' });
    }

    const pack = await Pack.findById(packId);
    if (!pack) return res.status(404).json({ error: 'Pack introuvable.' });

    // Trouver le document par son _id
    const doc = pack.documents.find(d => d._id.toString() === docId);
    if (!doc) {
      console.error(`[Documents] Document ${docId} non trouvé. Disponibles:`,
        pack.documents.map(d => d._id.toString()));
      return res.status(404).json({ error: 'Document introuvable dans ce pack.' });
    }

    // Vérifier que le PDF existe sur le serveur
    const pdfPath = path.resolve(PDF_DIR, doc.filename);
    if (!fs.existsSync(pdfPath)) {
      console.error(`[Documents] PDF introuvable : ${pdfPath}`);
      return res.status(404).json({
        error: 'Fichier PDF non disponible. Contactez le support.',
      });
    }

    // Supprimer les anciens tokens pour ce document
    await ViewToken.deleteMany({ userId: user._id, documentFilename: doc.filename });

    // Créer le token
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

// ── VIEW DOCUMENT (stream PDF) ────────────────────────────────────────────────
exports.viewDocument = async (req, res, next) => {
  try {
    const { token } = req.params;
    const user = req.user;

    const viewToken = await ViewToken.findOne({ token });

    if (!viewToken) {
      return res.status(404).json({ error: 'Token invalide ou expiré.' });
    }

    if (new Date() > viewToken.expiresAt) {
      await ViewToken.deleteOne({ _id: viewToken._id });
      return res.status(401).json({ error: 'Session expirée. Retournez au tableau de bord.' });
    }

    if (viewToken.userId.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Token invalide.' });
    }

    const pdfPath = path.resolve(PDF_DIR, viewToken.documentFilename);

    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ error: 'Fichier introuvable. Contactez le support.' });
    }

    const stat = fs.statSync(pdfPath);

    res.setHeader('Content-Type',           'application/pdf');
    res.setHeader('Content-Length',         stat.size);
    res.setHeader('Content-Disposition',    'inline');
    res.setHeader('Cache-Control',          'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma',                 'no-cache');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options',        'SAMEORIGIN');

    viewToken.accessCount = (viewToken.accessCount || 0) + 1;
    viewToken.usedAt = new Date();
    await viewToken.save();

    const fileStream = fs.createReadStream(pdfPath);
    fileStream.on('error', err => console.error('[Documents] Stream error:', err.message));
    fileStream.pipe(res);

  } catch (err) { next(err); }
};