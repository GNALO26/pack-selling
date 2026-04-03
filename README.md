# Pack Digital 360 — Plateforme de vente sécurisée

Plateforme fullstack de vente de documents PDF premium avec paiement FedaPay,
viewer sécurisé (sans téléchargement) et tableau de bord admin.

**Stack :** Next.js 14 · Node.js/Express · MongoDB Atlas · FedaPay · Netlify (frontend) · Railway (backend)

---

## Architecture de sécurité

```
Client Browser
    │
    ├── /dashboard  (Next.js — Netlify)
    │       └── Bouton "Lire" → demande token à l'API
    │
    ├── /viewer     (Next.js)
    │       ├── POST /api/documents/request-token  → token UUID (30 min)
    │       └── GET  /api/documents/view/:token    → stream PDF
    │                   ↑
    │              [Serveur Express — Railway]
    │              ├── Vérifie le token (MongoDB ViewToken)
    │              ├── Vérifie que l'user a acheté le pack
    │              ├── Stream le PDF par chunks
    │              └── Headers: Content-Disposition: inline (JAMAIS attachment)
    │                           Cache-Control: no-store
    │                           X-Frame-Options: SAMEORIGIN
    │
    └── Aucune URL directe vers les PDF — jamais exposé
```

**Protection anti-téléchargement :**
- `Content-Disposition: inline` → affichage navigateur, pas de téléchargement
- PDF.js utilisé côté client → contrôle total sur l'interface (bouton download retiré)
- Token UUID expire après 30 minutes
- Clic droit désactivé dans le viewer
- Raccourcis Ctrl+S / Ctrl+P bloqués
- Aucun cache navigateur sur les documents

---

## Installation locale

### 1. Cloner et installer

```bash
git clone <votre-repo>

# Backend
cd backend
npm install
cp .env.example .env
# → Remplissez le .env

# Frontend
cd ../frontend
npm install
cp .env.example .env.local
# → Remplissez le .env.local
```

### 2. Configurer MongoDB Atlas

1. Allez sur https://cloud.mongodb.com
2. Créez un cluster gratuit (M0)
3. Créez un utilisateur base de données
4. Whitelist l'IP 0.0.0.0/0 (Network Access)
5. Copiez la connection string dans `MONGODB_URI`

### 3. Configurer FedaPay

1. Créez un compte sur https://sandbox-app.fedapay.com (sandbox)
2. Allez dans Paramètres → API Keys
3. Copiez les clés dans `FEDAPAY_PUBLIC_KEY` et `FEDAPAY_SECRET_KEY`
4. Configurez un webhook : URL = `https://votre-backend.railway.app/api/webhook/fedapay`
5. Copiez le webhook secret dans `FEDAPAY_WEBHOOK_SECRET`

### 4. Lancer le seed (données initiales)

```bash
cd backend
npm run seed
```

Cela crée :
- Le compte admin (email + mot de passe définis dans .env)
- Le Pack Digital 360 en base (avec les filenames des PDFs)

### 5. Placer les PDFs sur le serveur

```bash
# Copiez vos PDFs dans le dossier protégé
cp Guide_Pack_Digital_360_v2.pdf        backend/private/documents/
cp Script_Marketing_Pack_Digital_360.pdf backend/private/documents/
```

⚠️ Ce dossier ne doit JAMAIS être servi statiquement.

### 6. Récupérer l'ID du Pack pour le frontend

```bash
cd backend
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Pack = require('./models/Pack');
  const pack = await Pack.findOne({ slug: 'pack-digital-360' });
  console.log('PACK_ID =', pack._id.toString());
  process.exit(0);
});
"
```

Copiez cet ID dans `NEXT_PUBLIC_PACK_ID` du frontend.

### 7. Démarrer

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Accédez à : http://localhost:3000

---

## Déploiement Production

### Backend → Railway

1. Créez un compte sur https://railway.app
2. "New Project" → "Deploy from GitHub repo" → sélectionnez le dossier `backend`
3. Ajoutez toutes les variables d'environnement du `.env.example`
4. Railway génère automatiquement l'URL (ex: `pack-digital-api.railway.app`)
5. Uploadez les PDFs via Railway Shell :
   ```bash
   mkdir -p /app/private/documents
   # Uploadez via SFTP ou Railway Volume
   ```
6. Mettez `PDF_DIR=/app/private/documents` dans les env vars Railway

### Frontend → Netlify

1. Connectez votre repo GitHub sur https://netlify.com
2. "New site from Git" → sélectionnez le dossier `frontend`
3. Build settings :
   - Base directory : `frontend`
   - Build command : `npm run build`
   - Publish directory : `frontend/.next`
4. Ajoutez les variables d'environnement :
   - `NEXT_PUBLIC_API_URL` = URL Railway (ex: `https://pack-digital-api.railway.app`)
   - `NEXT_PUBLIC_PACK_ID` = ID MongoDB du pack
5. Activez le plugin "Next.js" dans les intégrations Netlify

### SMTP pour les emails

**Gmail (développement) :**
- Activez l'authentification 2FA sur votre compte Google
- Allez dans Compte Google → Sécurité → Mots de passe des applications
- Générez un mot de passe pour "Mail" → utilisez-le dans `SMTP_PASS`

**Production (recommandé) :**
- Brevo (ex Sendinblue) : 300 emails/jour gratuits
- Mailgun : 100 emails/jour gratuits
- SMTP2GO : fiable pour l'Afrique

---

## Passer en production FedaPay

1. Sur app.fedapay.com (pas sandbox), récupérez les clés live
2. Remplacez `pk_sandbox_` par `pk_live_` dans les env vars
3. Mettez `NODE_ENV=production` sur Railway
4. Mettez à jour l'URL webhook FedaPay → votre URL Railway production

---

## Structure des fichiers

```
pack-digital-360/
├── backend/
│   ├── config/database.js          # Connexion MongoDB
│   ├── controllers/
│   │   ├── authController.js       # Register, login, verify, reset
│   │   ├── paymentController.js    # FedaPay initiate + status
│   │   ├── webhookController.js    # Webhook FedaPay (idempotent)
│   │   ├── documentController.js  # Stream PDF sécurisé
│   │   └── adminController.js     # Stats, clients, accès manuel
│   ├── middleware/auth.js          # JWT + adminOnly
│   ├── models/
│   │   ├── User.js                # Utilisateurs + purchases
│   │   ├── Pack.js                # Packs et documents
│   │   ├── ViewToken.js           # Tokens temporaires (TTL auto)
│   │   └── Transaction.js         # Historique FedaPay
│   ├── routes/                     # Express routers
│   ├── utils/
│   │   ├── mailer.js              # Nodemailer + 4 templates HTML
│   │   └── seed.js                # Données initiales
│   ├── private/documents/          # PDFs protégés (jamais exposés)
│   ├── server.js                   # Point d'entrée Express
│   └── .env.example
│
└── frontend/
    ├── app/
    │   ├── page.tsx                # Landing page
    │   ├── (auth)/                 # Login, Register, Verify
    │   ├── (protected)/            # Dashboard, Viewer PDF
    │   └── admin/                  # Admin dashboard
    ├── lib/
    │   ├── api.ts                  # Axios client + types
    │   ├── store.ts                # Zustand auth store
    │   └── utils.ts                # Helpers
    ├── styles/globals.css
    └── .env.example
```

---

## Sécurité — Checklist production

- [ ] JWT_SECRET = chaîne aléatoire 64 caractères minimum
- [ ] ADMIN_PASSWORD changé après le premier seed
- [ ] `NODE_ENV=production` sur Railway
- [ ] PDFs dans `private/documents/` (jamais dans `public/`)
- [ ] Webhook FedaPay configuré avec FEDAPAY_WEBHOOK_SECRET
- [ ] CORS configuré avec l'URL Netlify exacte dans FRONTEND_URL
- [ ] MongoDB Atlas : IP whitelist Railway uniquement (pas 0.0.0.0/0)
- [ ] HTTPS activé (automatique sur Netlify + Railway)
- [ ] Rate limiting actif (configuré dans server.js)

---

## Auteur

**Olympe GUIDO-LOKOSSOU**
Développeur Full Stack · Co-fondateur Quiz de Carabin
guidolokossouolympe@gmail.com · quiz-de-carabin.com · Cotonou, Bénin
