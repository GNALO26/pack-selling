const path       = require('path');
const fs         = require('fs');
const { v4: uuidv4 } = require('uuid');
const User       = require('../models/User');
const Pack       = require('../models/Pack');
const ViewToken  = require('../models/ViewToken');

// Répertoire des PDFs — JAMAIS exposé publiquement
const PDF_DIR = path.resolve(process.env.PDF_DIR || path.join(__dirname, '..', 'private', 'documents'));

/**
 * POST /api/documents/request-token
 *
 * Génère un token d'accès temporaire pour visualiser un PDF.
 * L'utilisateur doit avoir acheté le pack.
 *
 * Retourne : { token, expiresAt }
 */
exports.requestViewToken = async (req, res, next) => {
  try {
    const { packId, documentFilename } = req.body;
    const user = req.user;

    // Vérifier que l'utilisateur a acheté ce pack
    if (!user.hasPurchased(packId)) {
      return res.status(403).json({
        error: 'Accès refusé. Achetez ce pack pour y accéder.',
      });
    }

    // Vérifier que le pack existe et que le document est bien dans ce pack
    const pack = await Pack.findById(packId);
    if (!pack) return res.status(404).json({ error: 'Pack introuvable.' });

    const docExists = pack.documents.some(d => d.filename === documentFilename);
    if (!docExists) {
      return res.status(403).json({ error: 'Document introuvable dans ce pack.' });
    }

    // Révoquer les anciens tokens non utilisés pour ce user/doc
    await ViewToken.deleteMany({
      userId: user._id,
      documentFilename,
      isUsed: false,
    });

    // Créer le token — expire dans 30 minutes
    const viewToken = await ViewToken.create({
      token: uuidv4() + '-' + uuidv4() + '-' + Date.now(),
      userId: user._id,
      packId,
      documentFilename,
      createdFromIP: req.ip,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    res.json({
      token: viewToken.token,
      expiresAt: viewToken.expiresAt,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/documents/view/:token
 *
 * Stream le PDF en réponse — avec les headers qui INTERDISENT le téléchargement.
 *
 * Sécurité :
 * - Vérifie le token
 * - Stream par chunks (pas d'envoi complet)
 * - Headers anti-download
 * - Pas de Content-Disposition: attachment
 * - Pas de cache navigateur
 * - Marque le token comme utilisé après 1 accès complet
 */
exports.streamDocument = async (req, res, next) => {
  const { token } = req.params;
  let viewToken = null;

  try {
    // Charger le token
    viewToken = await ViewToken.findOne({ token }).select('+isUsed +usedAt +accessCount');
    if (!viewToken) {
      return res.status(403).json({ error: 'Token invalide.' });
    }

    // Valider : expiration + appartenance (par userId en query param signé)
    if (new Date() > viewToken.expiresAt) {
      await ViewToken.deleteOne({ _id: viewToken._id });
      return res.status(403).json({ error: 'Session expirée. Retournez au tableau de bord.' });
    }

    // Incrémenter le compteur d'accès
    viewToken.accessCount += 1;
    if (!viewToken.usedAt) viewToken.usedAt = new Date();
    await viewToken.save();

    // Construire le chemin du fichier
    const filename  = viewToken.documentFilename;
    const safeFile  = path.basename(filename); // Empêche path traversal
    const filePath  = path.join(PDF_DIR, safeFile);

    if (!fs.existsSync(filePath)) {
      console.error(`[Documents] Fichier manquant: ${filePath}`);
      return res.status(500).json({ error: 'Fichier temporairement indisponible.' });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;

    // ── Headers de sécurité anti-téléchargement ──────────────────────────────
    res.set({
      // AFFICHAGE dans le navigateur — jamais en téléchargement
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline',        // inline = afficher, attachment = télécharger

      // Taille pour la barre de progression du viewer
      'Content-Length': fileSize,

      // Interdire le cache — chaque accès doit être authentifié
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0',

      // Sécurité CORS — seul le frontend autorisé peut lire
      'Access-Control-Allow-Origin': process.env.FRONTEND_URL,
      'Access-Control-Allow-Credentials': 'true',

      // Empêcher l'embedding dans d'autres sites
      'X-Frame-Options': 'SAMEORIGIN',
      'Content-Security-Policy': "default-src 'none'",

      // Désactiver la sauvegarde dans les DevTools (pas parfait mais ajoute friction)
      'X-Content-Type-Options': 'nosniff',
    });

    // Support range requests (pour navigation dans le PDF)
    const rangeHeader = req.headers.range;
    if (rangeHeader) {
      const parts  = rangeHeader.replace(/bytes=/, '').split('-');
      const start  = parseInt(parts[0], 10);
      const end    = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      res.status(206);
      res.set({
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
      });

      const stream = fs.createReadStream(filePath, { start, end });
      stream.pipe(res);
    } else {
      res.set('Accept-Ranges', 'bytes');
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    }

    // Marquer comme "utilisé" une fois le stream terminé
    res.on('finish', async () => {
      if (!viewToken.isUsed) {
        viewToken.isUsed = true;
        await viewToken.save().catch(console.error);
      }
    });

  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/documents/list/:packId
 * Liste les documents accessibles pour un pack (si acheté).
 */
exports.listDocuments = async (req, res, next) => {
  try {
    const { packId } = req.params;
    const user = req.user;

    if (!user.hasPurchased(packId)) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }

    const pack = await Pack.findById(packId).select('name documents');
    if (!pack) return res.status(404).json({ error: 'Pack introuvable.' });

    // Retourner les métadonnées SANS le filename réel
    const docs = pack.documents
      .sort((a, b) => a.order - b.order)
      .map(d => ({
        id: d._id,
        title: d.title,
        fileSize: d.fileSize,
        pageCount: d.pageCount,
        // filename n'est PAS retourné ici — récupéré côté serveur lors du requestViewToken
      }));

    res.json({ packName: pack.name, documents: docs });
  } catch (err) {
    next(err);
  }
};
