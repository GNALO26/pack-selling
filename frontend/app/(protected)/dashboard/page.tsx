'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen, CreditCard, CheckCircle, Lock, FileText, Clock, ArrowRight, Loader2, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi, paymentApi, documentsApi, packsApi, type Pack, type Document } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatCurrency, formatDate, formatFileSize, getErrorMessage } from '@/lib/utils';

export default function DashboardPage() {
  const router    = useRouter();
  const { user, setUser } = useAuthStore();
  const [packs,   setPacks]   = useState<Pack[]>([]);
  const [docMap,  setDocMap]  = useState<Record<string, Document[]>>({});
  const [paying,  setPaying]  = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try { const r = await authApi.getMe(); setUser(r.data.user); } catch{}
  }, [setUser]);

  const loadDocs = useCallback(async (packId: string) => {
    try {
      const r = await documentsApi.list(packId);
      setDocMap(prev => ({ ...prev, [packId]: r.data.documents }));
    } catch {}
  }, []);

  useEffect(() => {
    const init = async () => {
      await refresh();
      const r = await packsApi.getAll().catch(() => ({ data: { packs: [] } }));
      setPacks(r.data.packs);
      setLoading(false);
    };
    init();
  }, [refresh]);

  useEffect(() => {
    if (!user || !packs.length) return;
    packs.forEach(pack => {
      const owned = user.purchases?.some(p => {
        const id = typeof p.packId === 'string' ? p.packId : (p.packId as any)?._id;
        return id === pack._id;
      });
      if (owned) loadDocs(pack._id);
    });
  }, [user, packs, loadDocs]);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const txId = p.get('transaction_id'), status = p.get('status');
    if (txId && status === 'approved') {
      toast.success('PAIEMENT CONFIRMÉ — Accès activé !');
      window.history.replaceState({}, '', '/dashboard');
      setTimeout(() => { refresh(); }, 3000);
    } else if (txId && status === 'declined') {
      toast.error('Paiement refusé. Réessayez.');
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [refresh]);

  const hasPurchased = (packId: string) => user?.purchases?.some(p => {
    const id = typeof p.packId === 'string' ? p.packId : (p.packId as any)?._id;
    return id === packId;
  });

  const getPurchase = (packId: string) => user?.purchases?.find(p => {
    const id = typeof p.packId === 'string' ? p.packId : (p.packId as any)?._id;
    return id === packId;
  });

  const handleBuy = async (packId: string) => {
    setPaying(packId);
    try {
      const r = await paymentApi.initiate(packId);
      window.location.href = r.data.checkoutUrl;
    } catch (err) {
      const msg = getErrorMessage(err);
      if (msg.includes('déjà')) { toast.success('Vous avez déjà accès !'); refresh(); }
      else toast.error(msg);
      setPaying(null);
    }
  };

  const COLORS = [
    { accent:'#00D4FF', glow:'rgba(0,212,255,0.12)', border:'rgba(0,212,255,0.25)', badge:'badge-cyan' },
    { accent:'#FF006E', glow:'rgba(255,0,110,0.12)',  border:'rgba(255,0,110,0.25)',  badge:'badge-magenta' },
    { accent:'#8B5CF6', glow:'rgba(139,92,246,0.12)', border:'rgba(139,92,246,0.25)', badge:'badge-purple' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="w-10 h-10 rounded-full animate-spin" style={{ border:'2px solid rgba(0,212,255,0.15)', borderTopColor:'var(--cyan)' }}/>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} className="page-header">
        <h1>MES PACKS</h1>
        <p>Bienvenue, {user?.firstName}. Gérez vos accès et découvrez nos guides.</p>
      </motion.div>

      {/* Packs grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {packs.map((pack, i) => {
          const c = COLORS[i % COLORS.length];
          const owned    = hasPurchased(pack._id);
          const purchase = getPurchase(pack._id);
          const docs     = docMap[pack._id] || [];

          return (
            <motion.div key={pack._id} initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{delay:i*.1}}
              className="card flex flex-col" style={{ border:`1px solid ${owned ? c.border : 'var(--border-s)'}`, transition:'border-color .3s' }}>
              <div style={{ height:'1px', background:`linear-gradient(90deg,transparent,${owned?c.accent:'rgba(255,255,255,0.1)'},transparent)` }}/>

              <div className="p-6 flex flex-col flex-1">
                {/* Header pack */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className={`badge ${c.badge} mb-2 inline-block`}>Pack #{i+1}</div>
                    <h2 className="text-base font-bold" style={{ fontFamily:'Orbitron,monospace', color:c.accent }}>
                      {pack.name}
                    </h2>
                    <p className="text-xs mt-1" style={{ color:'var(--text-2)', fontFamily:'Rajdhani,sans-serif' }}>
                      {pack.tagline}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 ml-3 shrink-0"
                    style={{ background: owned?'rgba(0,255,136,0.1)':'rgba(255,255,255,0.04)', border:`1px solid ${owned?'rgba(0,255,136,0.25)':'rgba(255,255,255,0.08)'}`, clipPath:'polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)' }}>
                    {owned
                      ? <><CheckCircle className="w-3 h-3" style={{color:'var(--green)'}}/><span className="text-xs" style={{color:'var(--green)',fontFamily:'JetBrains Mono,monospace'}}>ACTIF</span></>
                      : <><Lock className="w-3 h-3" style={{color:'var(--text-3)'}}/><span className="text-xs" style={{color:'var(--text-3)',fontFamily:'JetBrains Mono,monospace'}}>VERROUILLÉ</span></>
                    }
                  </div>
                </div>

                {/* Owned: show docs */}
                {owned ? (
                  <div className="flex-1">
                    {purchase && (
                      <div className="flex gap-4 mb-4 p-3 text-xs" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid var(--border-s)' }}>
                        <div>
                          <div style={{color:'var(--text-3)',fontFamily:'JetBrains Mono,monospace'}}>Acheté le</div>
                          <div style={{color:'var(--text-1)',fontFamily:'Rajdhani,sans-serif',fontWeight:600}}>{formatDate(purchase.purchasedAt)}</div>
                        </div>
                        {purchase.amount > 0 && (
                          <div>
                            <div style={{color:'var(--text-3)',fontFamily:'JetBrains Mono,monospace'}}>Montant</div>
                            <div style={{color:c.accent,fontFamily:'JetBrains Mono,monospace',fontWeight:700}}>{formatCurrency(purchase.amount,purchase.currency)}</div>
                          </div>
                        )}
                        {purchase.grantedManually && (
                          <div>
                            <div style={{color:'var(--text-3)',fontFamily:'JetBrains Mono,monospace'}}>Type</div>
                            <div style={{color:'var(--gold)',fontFamily:'JetBrains Mono,monospace'}}>Offert 🎁</div>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="space-y-2">
                      {docs.length === 0
                        ? <div className="flex items-center justify-center py-4"><div className="w-5 h-5 rounded-full animate-spin" style={{border:'2px solid rgba(0,212,255,0.15)',borderTopColor:'var(--cyan)'}}/></div>
                        : docs.map((doc, j) => (
                          <motion.div key={doc.id} initial={{opacity:0,x:-12}} animate={{opacity:1,x:0}} transition={{delay:j*.08}}
                            className="flex items-center gap-3 p-3 cursor-pointer group transition-all duration-200"
                            style={{ background:'rgba(255,255,255,0.03)', border:'1px solid var(--border-s)' }}
                            onMouseEnter={e=>{ e.currentTarget.style.borderColor=c.border; e.currentTarget.style.background=`${c.glow}`; }}
                            onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--border-s)'; e.currentTarget.style.background='rgba(255,255,255,0.03)'; }}
                            onClick={()=>router.push(`/viewer?packId=${pack._id}&docId=${doc.id}`)}>
                            <div className="w-8 h-8 flex items-center justify-center shrink-0" style={{background:`${c.accent}12`,clipPath:'polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)'}}>
                              <FileText className="w-4 h-4" style={{color:c.accent}}/>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate" style={{color:'var(--text-1)',fontFamily:'Rajdhani,sans-serif'}}>{doc.title}</p>
                              <p className="text-xs" style={{color:'var(--text-3)',fontFamily:'JetBrains Mono,monospace'}}>{doc.pageCount}p · {formatFileSize(doc.fileSize)} · <Clock className="w-2.5 h-2.5 inline"/>30min</p>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <ArrowRight className="w-4 h-4" style={{color:c.accent}}/>
                            </div>
                          </motion.div>
                        ))
                      }
                    </div>
                    {/* Security note */}
                    <div className="mt-4 p-3 flex items-start gap-2" style={{background:'rgba(255,184,0,0.05)',border:'1px solid rgba(255,184,0,0.15)'}}>
                      <Zap className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{color:'var(--gold)'}}/>
                      <p className="text-xs" style={{color:'rgba(255,184,0,0.7)',fontFamily:'JetBrains Mono,monospace',lineHeight:1.6}}>Documents protégés. Viewer sécurisé. Session 30 min.</p>
                    </div>
                  </div>
                ) : (
                  /* Not owned: show buy */
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="space-y-2 mb-5">
                      {pack.features.slice(0,4).map((f,k)=>(
                        <div key={k} className="flex items-start gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{background:c.accent}}/>
                          <span style={{color:'var(--text-2)',fontFamily:'Rajdhani,sans-serif'}}>{f}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="text-xs mb-1" style={{color:'var(--text-3)',fontFamily:'JetBrains Mono,monospace',textDecoration:'line-through'}}>Valeur réelle : +100 000 FCFA</div>
                      <div className="text-3xl font-black mb-4" style={{fontFamily:'Orbitron,monospace',background:`linear-gradient(135deg,${c.accent},white)`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>
                        {formatCurrency(pack.price,pack.currency)}
                      </div>
                      <button onClick={()=>handleBuy(pack._id)} disabled={paying===pack._id}
                        className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold tracking-widest uppercase transition-all duration-300 disabled:opacity-50"
                        style={{fontFamily:'Orbitron,monospace',background:`linear-gradient(135deg,${c.accent},${c.accent}CC)`,color:'#020608',clipPath:'polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%)',boxShadow:`0 0 20px ${c.glow}`}}>
                        {paying===pack._id ? <><div className="spinner"/>&nbsp;REDIRECTION...</> : <><CreditCard className="w-4 h-4"/> ACHETER CE PACK</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Help */}
      <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.4}}>
        <div className="p-5 flex items-center gap-4" style={{background:'var(--bg-card)',border:'1px solid var(--border-s)'}}>
          <span className="text-2xl">💬</span>
          <div>
            <p className="font-semibold text-sm" style={{color:'var(--text-1)',fontFamily:'Orbitron,monospace',fontSize:'11px',letterSpacing:'0.05em'}}>SUPPORT</p>
            <p className="text-sm" style={{color:'var(--text-2)',fontFamily:'Rajdhani,sans-serif'}}>
              Contactez-nous à{' '}
              <a href="mailto:guidolokossouolympe@gmail.com" className="transition-colors" style={{color:'var(--cyan)'}}
                onMouseEnter={e=>(e.currentTarget.style.color='var(--magenta)')} onMouseLeave={e=>(e.currentTarget.style.color='var(--cyan)')}>
                guidolokossouolympe@gmail.com
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
