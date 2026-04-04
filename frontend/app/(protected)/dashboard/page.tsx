'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  BookOpen, CreditCard, CheckCircle, Lock,
  FileText, Clock, ArrowRight, Loader2, Star,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi, paymentApi, documentsApi, type Pack, type Document } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatCurrency, formatDate, formatFileSize, getErrorMessage } from '@/lib/utils';

const PACK_ID = process.env.NEXT_PUBLIC_PACK_ID || '';

export default function DashboardPage() {
  const router        = useRouter();
  const { user, setUser } = useAuthStore();
  const [pack, setPack]   = useState<Pack | null>(null);
  const [docs, setDocs]   = useState<Document[]>([]);
  const [paying, setPaying] = useState(false);
  const [loading, setLoading] = useState(true);

  // Rafraîchit les données user depuis l'API
  const refreshUser = useCallback(async () => {
    try {
      const res = await authApi.getMe();
      setUser(res.data.user);
    } catch { /* silent */ }
  }, [setUser]);

  // Charge les données du pack si acheté
  const loadPackDocs = useCallback(async () => {
    if (!PACK_ID) return;
    try {
      const res = await documentsApi.list(PACK_ID);
      setPack({ _id: PACK_ID, name: res.data.packName } as Pack);
      setDocs(res.data.documents);
    } catch { /* pas encore acheté */ }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await refreshUser();
      setLoading(false);
    };
    init();
  }, [refreshUser]);

  // Charger les docs si l'user a acheté
  useEffect(() => {
    const hasPack = user?.purchases?.some(p => {
      const id = typeof p.packId === 'string' ? p.packId : p.packId?._id;
      return id === PACK_ID;
    });
    if (hasPack) loadPackDocs();
  }, [user, loadPackDocs]);

  // Vérifier le statut du paiement (retour FedaPay)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const txnId  = params.get('transaction_id');
    const status = params.get('status');

    if (txnId && status === 'approved') {
      toast.success('Paiement confirmé ! Votre accès est activé.');
      // Nettoyer l'URL
      window.history.replaceState({}, '', '/dashboard');
      // Attendre le webhook puis rafraîchir
      setTimeout(() => { refreshUser(); loadPackDocs(); }, 3000);
    } else if (txnId && status === 'declined') {
      toast.error('Paiement refusé. Réessayez ou contactez le support.');
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [refreshUser, loadPackDocs]);

  const handlePayment = async () => {
    if (!PACK_ID) { toast.error('Configuration manquante.'); return; }
    setPaying(true);
    try {
      const res = await paymentApi.initiate(PACK_ID);
      // Redirection vers la page de paiement FedaPay
      window.location.href = res.data.checkoutUrl;
    } catch (err) {
      const msg = getErrorMessage(err);
      if (msg.includes('déjà')) {
        toast.success('Vous avez déjà accès à ce pack !');
        refreshUser();
      } else {
        toast.error(msg);
      }
      setPaying(false);
    }
  };

  const openViewer = (docId: string) => {
    router.push(`/viewer?packId=${PACK_ID}&docId=${docId}`);
  };

  const hasPurchased = user?.purchases?.some(p => {
    const id = typeof p.packId === 'string' ? p.packId : (p.packId as any)?._id;
    return id === PACK_ID;
  });

  const purchase = user?.purchases?.find(p => {
    const id = typeof p.packId === 'string' ? p.packId : (p.packId as any)?._id;
    return id === PACK_ID;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="page-header">
        <h1>Tableau de bord</h1>
        <p>Bonjour {user?.firstName} 👋 — gérez vos accès ici.</p>
      </motion.div>

      {/* ── Pack Digital 360 card ───────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>

        {/* Acheté */}
        {hasPurchased ? (
          <div className="card p-6 border-l-4 border-l-green-500">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gold-DEFAULT/10 border border-gold-DEFAULT/20 flex items-center justify-center">
                  <BookOpen className="w-7 h-7 text-gold-DEFAULT" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold text-navy-DEFAULT">Pack Digital 360</h2>
                  <p className="text-gray-500 text-sm">Accès complet aux documents premium</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3 py-1.5">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-green-700 text-xs font-semibold">Accès actif</span>
              </div>
            </div>

            {/* Purchase info */}
            {purchase && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6 flex flex-wrap gap-6 text-sm">
                <div>
                  <span className="text-gray-400 text-xs">Date d&apos;achat</span>
                  <p className="font-semibold text-navy-DEFAULT">{formatDate(purchase.purchasedAt)}</p>
                </div>
                {purchase.amount > 0 && (
                  <div>
                    <span className="text-gray-400 text-xs">Montant payé</span>
                    <p className="font-semibold text-navy-DEFAULT">{formatCurrency(purchase.amount, purchase.currency)}</p>
                  </div>
                )}
                {purchase.grantedManually && (
                  <div>
                    <span className="text-gray-400 text-xs">Type d&apos;accès</span>
                    <p className="font-semibold text-gold-DEFAULT">Offert 🎁</p>
                  </div>
                )}
              </div>
            )}

            {/* Documents list */}
            <h3 className="font-semibold text-navy-DEFAULT mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-blue" />
              Vos documents ({docs.length})
            </h3>

            {docs.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-brand-blue animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {docs.map((doc, i) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-brand-blue/30 hover:shadow-sm transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-navy-DEFAULT text-sm truncate">{doc.title}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-gray-400 text-xs">{doc.pageCount} pages</span>
                        <span className="text-gray-300 text-xs">·</span>
                        <span className="text-gray-400 text-xs">{formatFileSize(doc.fileSize)}</span>
                        <span className="text-gray-300 text-xs">·</span>
                        <span className="text-green-600 text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Session 30 min
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => openViewer(doc.id)}
                      className="btn-primary text-sm px-4 py-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Lire <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openViewer(doc.id)}
                      className="btn-primary text-sm px-4 py-2 group-hover:opacity-0 opacity-100 absolute transition-opacity sm:static"
                      style={{ position: 'static' }}
                    >
                      Lire <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Security note */}
            <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <span className="text-amber-500 text-lg">🔒</span>
              <div>
                <p className="font-semibold text-amber-800 text-sm">Documents protégés</p>
                <p className="text-amber-700 text-xs mt-0.5">
                  Les documents s&apos;affichent uniquement dans le lecteur sécurisé.
                  Le téléchargement n&apos;est pas disponible. Chaque session dure 30 minutes.
                </p>
              </div>
            </div>
          </div>

        ) : (
          /* Non acheté */
          <div className="card overflow-hidden">
            {/* Hero section */}
            <div className="bg-navy-gradient p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-hero-pattern opacity-30" />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gold-DEFAULT/20 border border-gold-DEFAULT/30 flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-gold-DEFAULT" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-display font-bold text-white">Pack Digital 360</h2>
                      <p className="text-white/60 text-sm mt-1">Guide complet + Script marketing</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5">
                    <Lock className="w-3.5 h-3.5 text-white/60" />
                    <span className="text-white/60 text-xs">Non acheté</span>
                  </div>
                </div>

                {/* Features preview */}
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {[
                    '55+ pages de contenu',
                    '8 outils Google couverts',
                    'Script marketing 3 versions',
                    'Grille tarifaire FCFA',
                  ].map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-white/70 text-sm">
                      <Star className="w-3 h-3 text-gold-DEFAULT fill-gold-DEFAULT shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>

                {/* Price + CTA */}
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-white/40 text-xs line-through">Valeur réelle : +100 000 FCFA</div>
                    <div className="text-gold-DEFAULT font-display font-bold text-3xl">{formatCurrency(25000)}</div>
                  </div>
                  <button
                    onClick={handlePayment}
                    disabled={paying}
                    className="btn-gold text-base px-8 py-3.5 flex-1 sm:flex-none"
                  >
                    {paying ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Redirection...</>
                    ) : (
                      <><CreditCard className="w-5 h-5" /> Acheter maintenant</>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Payment methods */}
            <div className="p-5 border-t border-gray-100">
              <p className="text-gray-500 text-xs text-center">
                Paiement 100% sécurisé via FedaPay ·
                MTN Mobile Money · Moov Money · Carte bancaire ·
                Accès immédiat après confirmation
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Help card ───────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <div className="card p-5 flex items-center gap-4">
          <div className="text-2xl">💬</div>
          <div>
            <p className="font-semibold text-navy-DEFAULT text-sm">Besoin d&apos;aide ?</p>
            <p className="text-gray-500 text-xs mt-0.5">
              Contactez-nous par email à{' '}
              <a href="mailto:guidolokossouolympe@gmail.com" className="text-brand-blue hover:underline">
                guidolokossouolympe@gmail.com
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
