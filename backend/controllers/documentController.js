const path      = require('path');
const fs        = require('fs');
const { v4: uuidv4 } = require('uuid');
const Pack      = require('../models/Pack');
const ViewToken = require('../models/ViewToken');

const PDF_DIR = process.env.PDF_DIR || './private/documents';

/**
 * GET /api/documents/list/:packId
 * Liste les documents d'un pack (sans exposer le filename)
 */
exports.listDocuments = async (req, res, next) => {
  try {
    const { packId } = req.params;
    const user = req.user;

    // Vérifier que l'user a acheté ce pack
    if (!user.hasPurchased(packId)) {
      return res.status(403).json({ error: 'Accès non autorisé à ce pack.' });
    }

    const pack = await Pack.findById(packId);
    if (!pack) return res.status(404).json({ error: 'Pack introuvable.' });

    // Retourner les documents sans le filename
    const documents = pack.documents.map(doc => ({
      id:        doc._id.toString(), // on utilise _id MongoDB comme identifiant
      title:     doc.title,
      fileSize:  doc.fileSize,
      pageCount: doc.pageCount,
      order:     doc.order,
    }));

    // Trier par ordre
    documents.sort((a, b) => (a.order || 0) - (b.order || 0));

    res.json({ packName: pack.name, documents });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/documents/request-token
 * Génère un token d'accès temporaire (30 min) pour un document.
 * Body: { packId, docId }  — docId est le _id MongoDB du document dans le pack
 */
exports.requestToken = async (req, res, next) => {
  try {
    const { packId, docId } = req.body;
    const user = req.user;

    if (!packId || !docId) {
      return res.status(400).json({ error: 'packId et docId sont requis.' });
    }

    // Vérifier l'accès au pack
    if (!user.hasPurchased(packId)) {
      return res.status(403).json({ error: 'Accès non autorisé à ce pack.' });
    }

    const pack = await Pack.findById(packId);
    if (!pack) return res.status(404).json({ error: 'Pack introuvable.' });

    // Trouver le document par son _id MongoDB
    const doc = pack.documents.find(d => d._id.toString() === docId);
    if (!doc) {
      console.error(`[Documents] Document ${docId} introuvable dans pack ${packId}`);
      console.error(`[Documents] Documents disponibles:`, pack.documents.map(d => ({ id: d._id.toString(), title: d.title, filename: d.filename })));
      return res.status(404).json({ error: 'Document introuvable dans ce pack.' });
    }

    // Vérifier que le PDF existe sur le serveur
    const pdfPath = path.resolve(PDF_DIR, doc.filename);
    if (!fs.existsSync(pdfPath)) {
      console.error(`[Documents] Fichier PDF introuvable sur disque: ${pdfPath}`);
      return res.status(404).json({
        error: 'Fichier PDF non disponible. Contactez le support.',
        filename: doc.filename,
      });
    }

    // Invalider les tokens précédents pour ce document
    await ViewToken.deleteMany({
      userId:           user._id,
      documentFilename: doc.filename,
    });

    // Créer un nouveau token
    const token = `${uuidv4()}-${uuidv4()}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await ViewToken.create({
      token,
      userId:           user._id,
      packId:           pack._id,
      documentFilename: doc.filename,
      expiresAt,
      createdFromIP:    req.ip,
    });

    console.log(`[Documents] Token créé — User: ${user.email} | Doc: ${doc.title} | Expire: ${expiresAt.toISOString()}`);

    res.json({ token, expiresAt: expiresAt.toISOString() });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/documents/view/:token
 * Stream le PDF via le token temporaire
 */
exports.viewDocument = async (req, res, next) => {
  try {
    const { token } = req.params;

    // Vérifier le JWT de l'user (depuis Authorization header ou query param)
    // Note: cette route est accessible avec le token de session ET le viewToken
    const viewToken = await ViewToken.findOne({ token });

    if (!viewToken) {
      return res.status(404).json({ error: 'Token invalide ou expiré.' });
    }

    // Vérifier l'expiration
    if (new Date() > viewToken.expiresAt) {
      await ViewToken.deleteOne({ _id: viewToken._id });
      return res.status(401).json({ error: 'Session expirée. Retournez au tableau de bord.' });
    }

    // Vérifier que l'user est bien le propriétaire du token
    const userId = req.user?._id?.toString() || '';
    if (viewToken.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Token invalide.' });
    }

    const pdfPath = path.resolve(PDF_DIR, viewToken.documentFilename);

    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ error: 'Fichier introuvable. Contactez le support.' });
    }

    const stat = fs.statSync(pdfPath);

    // Headers de sécurité — empêcher le téléchargement
    res.setHeader('Content-Type',        'application/pdf');
    res.setHeader('Content-Length',      stat.size);
    res.setHeader('Content-Disposition', 'inline'); // affichage, pas téléchargement
    res.setHeader('Cache-Control',       'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma',              'no-cache');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options',    'SAMEORIGIN');

    // Incrémenter le compteur d'accès
    viewToken.accessCount = (viewToken.accessCount || 0) + 1;
    viewToken.usedAt = new Date();
    await viewToken.save();

    // Stream le fichier
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.on('error', (err) => {
      console.error('[Documents] Erreur stream:', err.message);
    });
    fileStream.pipe(res);

  } catch (err) {
    next(err);
  }
};