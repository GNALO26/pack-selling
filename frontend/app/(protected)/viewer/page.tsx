'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  RotateCw, ArrowLeft, Clock, Shield, Loader2, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { documentsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';

// PDF.js chargé dynamiquement (côté client uniquement)
let pdfjsLib: any = null;

const EXPIRY_MINUTES = 28; // Avertissement à 28min (token expire à 30)

export default function ViewerPage() {
  const router         = useRouter();
  const params         = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();

  const packId  = params.get('packId') || '';
  const docId   = params.get('docId')  || '';

  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const containerRef  = useRef<HTMLDivElement>(null);

  const [pdf,       setPdf]       = useState<any>(null);
  const [numPages,  setNumPages]  = useState(0);
  const [pageNum,   setPageNum]   = useState(1);
  const [scale,     setScale]     = useState(1.2);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [token,     setToken]     = useState('');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeLeft,  setTimeLeft]  = useState('');
  const [rendering, setRendering] = useState(false);

  // ── Sécurité : rediriger si non authentifié ─────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
    if (!packId || !docId) router.replace('/dashboard');
  }, [isAuthenticated, packId, docId, router]);

  // ── Charger PDF.js depuis CDN (jamais exposé en bundle) ─────────────────
  const loadPdfJs = useCallback(async () => {
    if (pdfjsLib) return pdfjsLib;
    return new Promise<any>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        const pdfjs = (window as any).pdfjsLib;
        pdfjs.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        pdfjsLib = pdfjs;
        resolve(pdfjs);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }, []);

  // ── Obtenir le token d'accès puis charger le PDF ─────────────────────────
  useEffect(() => {
    if (!packId || !docId || !isAuthenticated) return;

    const initViewer = async () => {
      setLoading(true);
      setError('');

      try {
        // 1. Demander le token temporaire
        const tokenRes = await documentsApi.requestToken(packId, docId);
        const { token: viewToken, expiresAt: expiry } = tokenRes.data;
        setToken(viewToken);
        setExpiresAt(new Date(expiry));

        // 2. Charger PDF.js
        const pdfjs = await loadPdfJs();

        // 3. Charger le PDF via le stream sécurisé
        const streamUrl = documentsApi.getStreamUrl(viewToken);
        const authToken = localStorage.getItem('pd360_token') || '';

        const loadingTask = pdfjs.getDocument({
          url: streamUrl,
          httpHeaders: { Authorization: `Bearer ${authToken}` },
          withCredentials: false,
        });

        const pdfDoc = await loadingTask.promise;
        setPdf(pdfDoc);
        setNumPages(pdfDoc.numPages);
        setLoading(false);
      } catch (err: any) {
        console.error('[Viewer] Erreur:', err);
        setError(err.response?.data?.error || 'Impossible de charger le document. Réessayez.');
        setLoading(false);
      }
    };

    initViewer();
  }, [packId, docId, isAuthenticated, loadPdfJs]);

  // ── Timer de session ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!expiresAt) return;

    const update = () => {
      const remaining = Math.max(0, expiresAt.getTime() - Date.now());
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);

      if (remaining <= 0) {
        toast.error('Session expirée. Retournez au tableau de bord.');
        router.push('/dashboard');
      } else if (remaining <= (30 - EXPIRY_MINUTES) * 60000) {
        // Avertissement à 2 minutes
        if (remaining <= 2 * 60000 && remaining > 1.9 * 60000) {
          toast('⏰ Session expire dans 2 minutes', { icon: '⚠️' });
        }
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, router]);

  // ── Rendre une page PDF ──────────────────────────────────────────────────
  const renderPage = useCallback(async (pageNumber: number, currentScale: number) => {
    if (!pdf || !canvasRef.current) return;
    setRendering(true);

    try {
      const page      = await pdf.getPage(pageNumber);
      const viewport  = page.getViewport({ scale: currentScale });
      const canvas    = canvasRef.current;
      const ctx       = canvas.getContext('2d');
      if (!ctx) return;

      // Ajuster le canvas au DPI de l'écran
      const deviceRatio = window.devicePixelRatio || 1;
      canvas.height = viewport.height * deviceRatio;
      canvas.width  = viewport.width  * deviceRatio;
      canvas.style.height = `${viewport.height}px`;
      canvas.style.width  = `${viewport.width}px`;
      ctx.scale(deviceRatio, deviceRatio);

      await page.render({ canvasContext: ctx, viewport }).promise;
    } catch (err) {
      console.error('[Viewer] Render error:', err);
    } finally {
      setRendering(false);
    }
  }, [pdf]);

  useEffect(() => {
    if (pdf) renderPage(pageNum, scale);
  }, [pdf, pageNum, scale, renderPage]);

  // ── Bloquer les raccourcis clavier de téléchargement ────────────────────
  useEffect(() => {
    const block = (e: KeyboardEvent) => {
      // Bloquer Ctrl+S, Ctrl+P
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p')) {
        e.preventDefault();
        toast('Sauvegarde et impression non disponibles.', { icon: '🔒' });
      }
    };
    window.addEventListener('keydown', block);
    return () => window.removeEventListener('keydown', block);
  }, []);

  // ── Navigation ───────────────────────────────────────────────────────────
  const prevPage = () => setPageNum(p => Math.max(1, p - 1));
  const nextPage = () => setPageNum(p => Math.min(numPages, p + 1));
  const zoomIn   = () => setScale(s => Math.min(3, s + 0.2));
  const zoomOut  = () => setScale(s => Math.max(0.5, s - 0.2));

  // ── Render states ────────────────────────────────────────────────────────
  if (!isAuthenticated) return null;

  if (error) {
    return (
      <div className="min-h-screen bg-navy-DEFAULT flex items-center justify-center p-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-white font-display font-bold text-xl mb-3">Accès impossible</h2>
          <p className="text-white/60 mb-6">{error}</p>
          <button onClick={() => router.push('/dashboard')} className="btn-gold w-full justify-center">
            <ArrowLeft className="w-4 h-4" /> Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#1a1a2e] flex flex-col select-none"
      onContextMenu={e => e.preventDefault()} // Désactiver clic droit
    >
      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="bg-[#0f0f23] border-b border-white/10 px-4 py-2.5 flex items-center gap-3 sticky top-0 z-50">
        {/* Back */}
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors px-2 py-1 rounded"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Retour</span>
        </button>

        <div className="w-px h-5 bg-white/20" />

        {/* Page navigation */}
        <div className="flex items-center gap-2">
          <button onClick={prevPage} disabled={pageNum <= 1} className="p-1.5 rounded text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-white/70 text-sm min-w-[80px] text-center">
            {pageNum} / {numPages}
          </span>
          <button onClick={nextPage} disabled={pageNum >= numPages} className="p-1.5 rounded text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-5 bg-white/20" />

        {/* Zoom */}
        <div className="flex items-center gap-2">
          <button onClick={zoomOut} className="p-1.5 rounded text-white/60 hover:text-white hover:bg-white/10 transition-all">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-white/50 text-xs min-w-[44px] text-center">{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} className="p-1.5 rounded text-white/60 hover:text-white hover:bg-white/10 transition-all">
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1" />

        {/* Session timer */}
        {timeLeft && (
          <div className={cn(
            'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold',
            timeLeft < '02:00'
              ? 'bg-red-500/20 border border-red-500/30 text-red-400'
              : 'bg-white/10 border border-white/20 text-white/60'
          )}>
            <Clock className="w-3 h-3" />
            {timeLeft}
          </div>
        )}

        {/* Security badge */}
        <div className="hidden sm:flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1">
          <Shield className="w-3 h-3 text-green-400" />
          <span className="text-green-400 text-xs">Sécurisé</span>
        </div>
      </div>

      {/* ── PDF Canvas ────────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto flex justify-center py-6 px-4"
        style={{ background: '#323741' }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 text-white/50">
            <Loader2 className="w-10 h-10 animate-spin text-gold-DEFAULT" />
            <p className="text-sm">Chargement du document sécurisé...</p>
          </div>
        ) : (
          <div className="relative shadow-2xl">
            {rendering && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10 rounded">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
            <canvas
              ref={canvasRef}
              className="rounded block"
              style={{ imageRendering: 'crisp-edges' }}
            />
          </div>
        )}
      </div>

      {/* ── Bottom bar ────────────────────────────────────────────────────── */}
      <div className="bg-[#0f0f23] border-t border-white/10 px-4 py-2 flex items-center justify-between">
        <span className="text-white/30 text-xs">
          🔒 Document protégé — Reproduction et téléchargement interdits
        </span>
        <span className="text-white/30 text-xs hidden sm:block">
          © 2026 Pack Digital 360 — Olympe GUIDO-LOKOSSOU
        </span>
      </div>
    </div>
  );
}
