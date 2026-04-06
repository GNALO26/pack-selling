'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

// ── Composant interne qui utilise useSearchParams ─────────────────────────────
function VerifyContent() {
  const router       = useRouter();
  const params       = useSearchParams();
  const setAuth      = useAuthStore(s => s.setAuth);
  const [status, setStatus]   = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) { setStatus('error'); setMessage('Token manquant dans l\'URL.'); return; }

    authApi.verifyEmail(token)
      .then(res => {
        setAuth(res.data.user, res.data.token);
        setStatus('success');
        setTimeout(() => router.push('/dashboard'), 2000);
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Lien invalide ou expiré.');
      });
  }, [params, router, setAuth]);

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-10 text-center shadow-navy">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-gold-DEFAULT animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-display font-bold text-white mb-2">Vérification en cours...</h1>
            <p className="text-white/50">Nous activons votre compte.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-400 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-2xl font-display font-bold text-white mb-3">Email vérifié !</h1>
            <p className="text-white/60 mb-6">Votre compte est activé. Redirection vers votre tableau de bord...</p>
            <Link href="/dashboard" className="btn-gold w-full justify-center">
              Accéder au tableau de bord
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-400 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-400" />
            </div>
            <h1 className="text-2xl font-display font-bold text-white mb-3">Lien invalide</h1>
            <p className="text-white/60 mb-6">{message}</p>
            <div className="space-y-3">
              <Link href="/login" className="btn-gold w-full justify-center">Se connecter</Link>
              <Link href="/register" className="btn-ghost text-white/60 w-full justify-center">
                Créer un nouveau compte
              </Link>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ── Page principale avec Suspense obligatoire (Next.js 14) ────────────────────
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md">
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-10 text-center">
          <Loader2 className="w-16 h-16 text-gold-DEFAULT animate-spin mx-auto mb-6" />
          <p className="text-white/50">Chargement...</p>
        </div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}