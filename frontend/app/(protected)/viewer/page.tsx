'use client';
import { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  ArrowLeft, Clock, Shield, Loader2, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { documentsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

let pdfjsLib: any = null;

function ViewerContent() {
  const router  = useRouter();
  const params  = useSearchParams();
  const { isAuthenticated } = useAuthStore();

  const packId = params.get('packId') || '';
  const docId  = params.get('docId')  || '';

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [pdf,       setPdf]       = useState<any>(null);
  const [numPages,  setNumPages]  = useState(0);
  const [pageNum,   setPageNum]   = useState(1);
  const [scale,     setScale]     = useState(1.2);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeLeft,  setTimeLeft]  = useState('');
  const [rendering, setRendering] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
    if (!packId || !docId) router.replace('/dashboard');
  }, [isAuthenticated, packId, docId, router]);

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

  useEffect(() => {
    if (!packId || !docId || !isAuthenticated) return;

    const init = async () => {
      setLoading(true);
      setError('');
      try {
        // docId = _id MongoDB du document dans le pack
        const tokenRes = await documentsApi.requestToken(packId, docId);
        const { token, expiresAt: expiry } = tokenRes.data;
        setExpiresAt(new Date(expiry));

        const pdfjs = await loadPdfJs();
        const streamUrl = documentsApi.getStreamUrl(token);
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
        const msg = err.response?.data?.error || err.message || 'Impossible de charger le document.';
        setError(msg);
        setLoading(false);
      }
    };

    init();
  }, [packId, docId, isAuthenticated, loadPdfJs]);

  // Timer de session
  useEffect(() => {
    if (!expiresAt) return;
    const update = () => {
      const remaining = Math.max(0, expiresAt.getTime() - Date.now());
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
      if (remaining <= 0) {
        toast.error('Session expirée.');
        router.push('/dashboard');
      }
      if (remaining === 2 * 60000) {
        toast('⏰ Session expire dans 2 minutes', { icon: '⚠️' });
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, router]);

  // Rendu PDF
  const renderPage = useCallback(async (pageNumber: number, currentScale: number) => {
    if (!pdf || !canvasRef.current) return;
    setRendering(true);
    try {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: currentScale });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.height = viewport.height * dpr;
      canvas.width  = viewport.width  * dpr;
      canvas.style.height = `${viewport.height}px`;
      canvas.style.width  = `${viewport.width}px`;
      ctx.scale(dpr, dpr);
      await page.render({ canvasContext: ctx, viewport }).promise;
    } catch (err) {
      console.error('[Viewer] Render error:', err);
    } finally {
      setRendering(false);
    }
  }, [pdf]);

  useEffect(() => { if (pdf) renderPage(pageNum, scale); }, [pdf, pageNum, scale, renderPage]);

  // Bloquer les raccourcis
  useEffect(() => {
    const block = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p')) {
        e.preventDefault();
        toast('Non disponible', { icon: '🔒' });
      }
    };
    window.addEventListener('keydown', block);
    return () => window.removeEventListener('keydown', block);
  }, []);

  if (!isAuthenticated) return null;

  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-void)' }}>
      <div className="card corners p-10 text-center max-w-md" style={{ border: '1px solid rgba(255,0,110,0.2)' }}>
        <AlertTriangle className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--magenta)' }} />
        <h2 className="text-xl mb-3" style={{ fontFamily: 'Orbitron,monospace', color: 'var(--magenta)' }}>ACCÈS IMPOSSIBLE</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-2)', fontFamily: 'Rajdhani,sans-serif' }}>{error}</p>
        <button onClick={() => router.push('/dashboard')} className="btn-primary w-full justify-center">
          <ArrowLeft className="w-4 h-4" /> Retour au tableau de bord
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col select-none" style={{ background: '#1a1a2e' }}
      onContextMenu={e => e.preventDefault()}>

      {/* Toolbar */}
      <div className="px-4 py-2 flex items-center gap-3 sticky top-0 z-50"
        style={{ background: '#0f0f23', borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
        <button onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: 'var(--text-2)', fontFamily: 'Orbitron,monospace', fontSize: '11px' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--cyan)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-2)')}>
          <ArrowLeft className="w-4 h-4" /> RETOUR
        </button>

        <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.1)' }} />

        <div className="flex items-center gap-2">
          <button onClick={() => setPageNum(p => Math.max(1, p - 1))} disabled={pageNum <= 1}
            className="p-1.5 rounded transition-colors disabled:opacity-30"
            style={{ color: 'var(--text-2)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--cyan)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-2)')}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs min-w-[60px] text-center" style={{ color: 'var(--text-2)', fontFamily: 'JetBrains Mono,monospace' }}>
            {pageNum} / {numPages}
          </span>
          <button onClick={() => setPageNum(p => Math.min(numPages, p + 1))} disabled={pageNum >= numPages}
            className="p-1.5 rounded transition-colors disabled:opacity-30"
            style={{ color: 'var(--text-2)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--cyan)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-2)')}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.1)' }} />

        <div className="flex items-center gap-2">
          <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="p-1.5"
            style={{ color: 'var(--text-2)' }}><ZoomOut className="w-4 h-4" /></button>
          <span className="text-xs" style={{ color: 'var(--text-3)', fontFamily: 'JetBrains Mono,monospace' }}>
            {Math.round(scale * 100)}%
          </span>
          <button onClick={() => setScale(s => Math.min(3, s + 0.2))} className="p-1.5"
            style={{ color: 'var(--text-2)' }}><ZoomIn className="w-4 h-4" /></button>
        </div>

        <div className="flex-1" />

        {timeLeft && (
          <div className="flex items-center gap-1.5 px-3 py-1 text-xs"
            style={{
              background: timeLeft < '02:00' ? 'rgba(255,0,110,0.15)' : 'rgba(255,255,255,0.06)',
              border: timeLeft < '02:00' ? '1px solid rgba(255,0,110,0.3)' : '1px solid rgba(255,255,255,0.1)',
              clipPath: 'polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)',
              color: timeLeft < '02:00' ? 'var(--magenta)' : 'var(--text-2)',
              fontFamily: 'JetBrains Mono,monospace',
            }}>
            <Clock className="w-3 h-3" /> {timeLeft}
          </div>
        )}

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 text-xs"
          style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)', clipPath: 'polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)' }}>
          <Shield className="w-3 h-3" style={{ color: 'var(--green)' }} />
          <span style={{ color: 'var(--green)', fontFamily: 'JetBrains Mono,monospace' }}>SÉCURISÉ</span>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto flex justify-center py-6 px-4" style={{ background: '#323741' }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4" style={{ color: 'var(--text-2)' }}>
            <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--cyan)' }} />
            <p className="text-sm" style={{ fontFamily: 'Orbitron,monospace', fontSize: '11px' }}>CHARGEMENT...</p>
          </div>
        ) : (
          <div className="relative shadow-2xl">
            {rendering && (
              <div className="absolute inset-0 flex items-center justify-center z-10"
                style={{ background: 'rgba(0,0,0,0.2)' }}>
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--cyan)' }} />
              </div>
            )}
            <canvas ref={canvasRef} className="block rounded" />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 flex items-center justify-between"
        style={{ background: '#0f0f23', borderTop: '1px solid rgba(0,212,255,0.08)' }}>
        <span className="text-xs" style={{ color: 'var(--text-3)', fontFamily: 'JetBrains Mono,monospace' }}>
          🔒 Document protégé — Reproduction interdite
        </span>
        <span className="text-xs hidden sm:block" style={{ color: 'var(--text-3)', fontFamily: 'JetBrains Mono,monospace' }}>
          © 2026 GUI-LOK DEV
        </span>
      </div>
    </div>
  );
}

export default function ViewerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-void)' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--cyan)' }} />
      </div>
    }>
      <ViewerContent />
    </Suspense>
  );
}