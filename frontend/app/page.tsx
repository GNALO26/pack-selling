'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Shield, Lock, Zap, FileText, ChevronRight, CheckCircle, Star } from 'lucide-react';
import { packsApi, type Pack } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

/* ── 3D HOLOGRAPHIC GRID ─────────────────────────────────────────────────── */
function HoloGrid() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    let id: number, t = 0;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    const draw = () => {
      t += 0.008;
      const W = canvas.width, H = canvas.height, cx = W/2, cy = H/2;
      ctx.clearRect(0,0,W,H);
      const S = Math.min(W,H)*0.4;
      // Rotating grid
      for (let i=0;i<=14;i++) {
        const u=(i/14-.5)*2, a=0.04+0.02*Math.abs(Math.sin(t+i*0.4));
        const x0=cx+u*S*Math.cos(t)-(-1)*S*Math.sin(t), y0=cy+u*S*Math.sin(t)*0.35+((-1)*S*0.28*Math.cos(t));
        const x1=cx+u*S*Math.cos(t)-(+1)*S*Math.sin(t), y1=cy+u*S*Math.sin(t)*0.35+((+1)*S*0.28*Math.cos(t));
        ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y1);
        ctx.strokeStyle=`rgba(0,212,255,${a})`; ctx.lineWidth=0.7; ctx.stroke();
      }
      for (let j=0;j<=14;j++) {
        const v=(j/14-.5)*2, a=0.03+0.015*Math.abs(Math.cos(t+j*0.3));
        const x0=cx+((-1)*S*Math.cos(t)-v*S*Math.sin(t)), y0=cy+((-1)*S*Math.sin(t)*0.35+v*S*0.28*Math.cos(t));
        const x1=cx+((+1)*S*Math.cos(t)-v*S*Math.sin(t)), y1=cy+((+1)*S*Math.sin(t)*0.35+v*S*0.28*Math.cos(t));
        ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y1);
        ctx.strokeStyle=`rgba(255,0,110,${a})`; ctx.lineWidth=0.7; ctx.stroke();
      }
      // Orbit nodes
      for (let n=0;n<10;n++) {
        const phi=(n/10)*Math.PI*2+t*0.6, r=S*0.52;
        const x=cx+Math.cos(phi)*r, y=cy+Math.sin(phi)*r*0.35;
        const pulse=0.4+0.6*Math.abs(Math.sin(t*1.5+n));
        ctx.beginPath(); ctx.arc(x,y,5,0,Math.PI*2);
        ctx.strokeStyle=`rgba(0,212,255,${pulse*0.7})`; ctx.lineWidth=1; ctx.stroke();
        ctx.beginPath(); ctx.arc(x,y,2,0,Math.PI*2);
        ctx.fillStyle=`rgba(0,212,255,${pulse})`; ctx.fill();
      }
      // Center hexagon
      const hr=S*0.1;
      ctx.beginPath();
      for(let h=0;h<6;h++){const a=(h/6)*Math.PI*2+t*0.5;ctx.lineTo(cx+Math.cos(a)*hr,cy+Math.sin(a)*hr*0.55);}
      ctx.closePath(); ctx.strokeStyle=`rgba(0,212,255,0.5)`; ctx.lineWidth=1.5; ctx.stroke();
      ctx.fillStyle=`rgba(0,212,255,0.06)`; ctx.fill();
      id=requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize',resize); };
  },[]);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
}

/* ── FLOATING PARTICLES ──────────────────────────────────────────────────── */
function Particles({count=25}:{count?:number}) {
  const pts = Array.from({length:count},(_,i)=>({
    id:i, x:Math.random()*100, delay:Math.random()*8, dur:5+Math.random()*7,
    size:1+Math.random()*1.5, col:i%3===0?'#00D4FF':i%3===1?'#FF006E':'#8B5CF6',
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pts.map(p=>(
        <div key={p.id} className="absolute rounded-full" style={{
          left:`${p.x}%`, bottom:'-4px', width:`${p.size}px`, height:`${p.size}px`,
          background:p.col, boxShadow:`0 0 5px ${p.col}`,
          animation:`floatP ${p.dur}s ${p.delay}s ease-in infinite`,
        }}/>
      ))}
      <style>{`@keyframes floatP{0%{transform:translateY(0) scale(1);opacity:0}8%{opacity:.8}92%{opacity:.3}100%{transform:translateY(-100vh) scale(.2);opacity:0}}`}</style>
    </div>
  );
}

/* ── PACK CARD ───────────────────────────────────────────────────────────── */
function PackCard({ pack, index }: { pack: Pack; index: number }) {
  const colors = [
    { accent: '#00D4FF', glow: 'rgba(0,212,255,0.15)', border: 'rgba(0,212,255,0.3)', badge: 'badge-cyan' },
    { accent: '#FF006E', glow: 'rgba(255,0,110,0.15)',  border: 'rgba(255,0,110,0.3)',  badge: 'badge-magenta' },
    { accent: '#8B5CF6', glow: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.3)', badge: 'badge-purple' },
  ];
  const c = colors[index % colors.length];
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12, duration: 0.6 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex flex-col"
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${hovered ? c.border : 'var(--border-s)'}`,
        transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: hovered ? `var(--shadow-card), 0 0 50px ${c.glow}` : 'var(--shadow-card)',
      }}
    >
      {/* Top glow line */}
      <div style={{ height:'1px', background: hovered ? `linear-gradient(90deg,transparent,${c.accent},transparent)` : 'linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)', transition:'all .35s' }} />

      {/* Corners */}
      <div style={{ position:'absolute', top:0, left:0, width:14, height:14, borderTop:`1.5px solid ${c.accent}`, borderLeft:`1.5px solid ${c.accent}`, opacity: hovered?1:0.4, transition:'opacity .35s' }} />
      <div style={{ position:'absolute', bottom:0, right:0, width:14, height:14, borderBottom:`1.5px solid ${c.accent}`, borderRight:`1.5px solid ${c.accent}`, opacity: hovered?1:0.4, transition:'opacity .35s' }} />

      <div className="p-6 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className={`badge ${c.badge} text-xs mb-2 inline-block`}>Pack #{index + 1}</span>
            <h3 className="text-lg font-bold leading-tight" style={{ fontFamily:'Orbitron,monospace', color: c.accent }}>
              {pack.name}
            </h3>
            <p className="text-sm mt-1" style={{ color:'var(--text-2)', fontFamily:'Rajdhani,sans-serif' }}>
              {pack.tagline}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 ml-3"
            style={{ background:`${c.accent}12`, border:`1px solid ${c.accent}30` }}>
            <FileText className="w-5 h-5" style={{ color: c.accent }} />
          </div>
        </div>

        {/* Features */}
        <div className="space-y-2 mb-6 flex-1">
          {pack.features.slice(0,5).map((f,i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: c.accent }} />
              <span style={{ color:'var(--text-2)', fontFamily:'Rajdhani,sans-serif' }}>{f}</span>
            </div>
          ))}
          {pack.features.length > 5 && (
            <div className="text-xs" style={{ color:'var(--text-3)', fontFamily:'JetBrains Mono,monospace' }}>
              +{pack.features.length - 5} autres inclus...
            </div>
          )}
        </div>

        {/* Documents count */}
        <div className="flex items-center gap-2 mb-5 py-3"
          style={{ borderTop:'1px solid var(--border-s)', borderBottom:'1px solid var(--border-s)' }}>
          <FileText className="w-4 h-4" style={{ color: c.accent }} />
          <span className="text-sm" style={{ color:'var(--text-2)', fontFamily:'JetBrains Mono,monospace' }}>
            {pack.documents?.length || 0} document{(pack.documents?.length||0)>1?'s':''} PDF inclus
          </span>
        </div>

        {/* Price + CTA */}
        <div>
          <div className="text-xs mb-1" style={{ color:'var(--text-3)', fontFamily:'JetBrains Mono,monospace', textDecoration:'line-through' }}>
            Valeur réelle : +25 000 FCFA
          </div>
          <div className="text-3xl font-black mb-4" style={{
            fontFamily:'Orbitron,monospace',
            background: `linear-gradient(135deg, ${c.accent}, white)`,
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
          }}>
            {formatCurrency(pack.price, pack.currency)}
          </div>
          <Link
            href="/register"
            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold tracking-widest uppercase transition-all duration-300"
            style={{
              fontFamily:'Orbitron,monospace',
              background: `linear-gradient(135deg, ${c.accent}, ${c.accent}CC)`,
              color: '#020608',
              clipPath:'polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%)',
              boxShadow: hovered ? `0 0 30px ${c.glow}, 0 0 60px ${c.glow}` : `0 0 15px ${c.glow}`,
            }}
          >
            Obtenir ce pack <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [packs, setPacks]     = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0,600], [0,80]);
  const heroO = useTransform(scrollY, [0,500], [1,0]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    packsApi.getAll()
      .then(r => setPacks(r.data.packs))
      .catch(() => setPacks([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ background:'var(--bg-void)', minHeight:'100vh' }}>

      {/* ── NAVBAR ────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 glass" style={{ borderBottom:'1px solid rgba(0,212,255,0.08)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-9 h-9">
              <Image src="/logo.png" alt="GUI-LOK DEV" fill className="object-contain" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-widest leading-none" style={{ fontFamily:'Orbitron,monospace', color:'var(--cyan)' }}>GUI-LOK DEV</div>
              <div className="text-xs leading-none mt-0.5" style={{ color:'var(--text-3)', fontFamily:'JetBrains Mono,monospace' }}>Digital Store</div>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {[['#packs','Nos Packs'],['#securite','Sécurité'],['#contact','Contact']].map(([h,l])=>(
              <a key={h} href={h} className="text-xs tracking-widest uppercase transition-colors duration-200"
                style={{ fontFamily:'Orbitron,monospace', color:'var(--text-2)' }}
                onMouseEnter={e=>(e.currentTarget.style.color='var(--cyan)')}
                onMouseLeave={e=>(e.currentTarget.style.color='var(--text-2)')}>{l}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost text-xs hidden sm:flex">Connexion</Link>
            <Link href="/register" className="btn-primary text-xs px-4 py-2">
              Commencer <ChevronRight className="w-3 h-3"/>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        <div className="absolute inset-0 grid-bg" />
        {mounted && <><HoloGrid /><Particles /></>}

        {/* Scan line */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-full h-px" style={{ background:'linear-gradient(90deg,transparent,rgba(0,212,255,0.25),transparent)', animation:'scan 6s linear infinite' }} />
        </div>

        {/* Radial glow center */}
        <div className="absolute inset-0 pointer-events-none" style={{ background:'radial-gradient(ellipse 60% 60% at 50% 50%,rgba(0,212,255,0.04) 0%,transparent 70%)' }} />
        <div className="absolute top-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none" style={{ background:'radial-gradient(circle,rgba(255,0,110,0.04) 0%,transparent 70%)' }} />

        <motion.div style={{ y:heroY, opacity:heroO }} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <div className="max-w-3xl mx-auto text-center">

            {/* Live badge */}
            <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.2}} className="inline-flex items-center gap-2 mb-8">
              <div className="flex items-center gap-2 px-4 py-2" style={{ background:'rgba(0,212,255,0.07)', border:'1px solid rgba(0,212,255,0.2)', clipPath:'polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%)' }}>
                <div className="w-2 h-2 rounded-full anim-pulse-c" style={{ background:'var(--cyan)' }} />
                <span className="text-xs tracking-widest uppercase" style={{ fontFamily:'Orbitron,monospace', color:'var(--cyan)' }}>Guides Premium · Marché Béninois</span>
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1 initial={{opacity:0,y:32}} animate={{opacity:1,y:0}} transition={{delay:.3,duration:.8}}
              className="text-4xl sm:text-5xl md:text-7xl mb-6"
              style={{ fontFamily:'Orbitron,monospace', fontWeight:900, lineHeight:1.08, letterSpacing:'0.02em' }}>
              <span className="text-cyan-glow">GUIDES</span><br/>
              <span style={{ color:'var(--text-1)' }}>DIGITAUX</span><br/>
              <span className="text-holo">PREMIUM</span>
            </motion.h1>

            {/* Sub */}
            <motion.p initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{delay:.5}}
              className="text-lg md:text-xl mb-10 max-w-2xl mx-auto"
              style={{ fontFamily:'Rajdhani,sans-serif', color:'var(--text-2)', lineHeight:1.7, fontWeight:400 }}>
              Des ressources <span style={{ color:'var(--cyan)' }}>complètes et actionnables</span> pour maîtriser
              les outils digitaux et développer votre activité au Bénin.
              <span style={{ color:'var(--magenta)' }}> Paiement Mobile Money.</span>
            </motion.p>

            {/* CTAs */}
            <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{delay:.65}} className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#packs" className="btn-primary text-sm px-8 py-4">
                Voir les packs <ArrowRight className="w-4 h-4"/>
              </a>
              <Link href="/login" className="btn-outline text-sm px-8 py-4">
                Mon espace client
              </Link>
            </motion.div>

            {/* Trust */}
            <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.9}}
              className="flex flex-wrap justify-center gap-5 mt-12 pt-8"
              style={{ borderTop:'1px solid rgba(255,255,255,0.05)' }}>
              {['✓ MTN Mobile Money','✓ Moov Money','✓ Accès immédiat','✓ FedaPay sécurisé'].map((t,i)=>(
                <span key={i} className="text-xs" style={{ color:'var(--text-3)', fontFamily:'JetBrains Mono,monospace' }}>{t}</span>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-32 pointer-events-none" style={{ background:'linear-gradient(to top,var(--bg-void),transparent)' }} />
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────────────── */}
      <div style={{ background:'var(--bg-deep)', borderTop:'1px solid rgba(0,212,255,0.08)', borderBottom:'1px solid rgba(0,212,255,0.08)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              {v:`${packs.length || '1'}+`, l:'Packs disponibles', i:'📦'},
              {v:'55+', l:'Pages de contenu', i:'📋'},
              {v:'100%', l:'Config détaillée', i:'⚡'},
              {v:'24h', l:'Accès après paiement', i:'🔓'},
            ].map((s,i)=>(
              <motion.div key={i} initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}} transition={{delay:i*.1}} className="text-center">
                <div className="text-2xl mb-1">{s.i}</div>
                <div className="text-3xl font-black mb-1" style={{ fontFamily:'Orbitron,monospace', color:'var(--cyan)' }}>{s.v}</div>
                <div className="text-sm" style={{ color:'var(--text-2)', fontFamily:'Rajdhani,sans-serif' }}>{s.l}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PACKS CATALOGUE ───────────────────────────────────────────── */}
      <section id="packs" className="py-24" style={{ background:'var(--bg-void)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} className="text-center mb-16">
            <div className="cyber-line w-20 mx-auto mb-6" />
            <h2 className="text-3xl md:text-5xl mb-4" style={{ fontFamily:'Orbitron,monospace', fontWeight:900 }}>
              <span className="text-cyan-glow">NOS PACKS</span><br/>
              <span style={{ color:'var(--text-1)' }}>PREMIUM</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color:'var(--text-2)', fontFamily:'Rajdhani,sans-serif' }}>
              Chaque pack est un guide complet et autonome. Achetez celui dont vous avez besoin,
              accédez instantanément à tous ses documents.
            </p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-10 h-10 rounded-full animate-spin" style={{ border:'2px solid rgba(0,212,255,0.15)', borderTopColor:'var(--cyan)' }} />
            </div>
          ) : packs.length === 0 ? (
            <div className="text-center py-20" style={{ color:'var(--text-3)', fontFamily:'Orbitron,monospace' }}>
              Packs en cours de chargement...
            </div>
          ) : (
            <div className={`grid gap-6 ${packs.length === 1 ? 'max-w-md mx-auto' : packs.length === 2 ? 'md:grid-cols-2 max-w-3xl mx-auto' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
              {packs.map((pack, i) => <PackCard key={pack._id} pack={pack} index={i} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── SECURITY ──────────────────────────────────────────────────── */}
      <section id="securite" style={{ background:'var(--bg-deep)', borderTop:'1px solid rgba(255,255,255,0.04)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
          <motion.div initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} className="text-center mb-14">
            <h2 className="text-2xl md:text-4xl mb-3" style={{ fontFamily:'Orbitron,monospace' }}>
              PROTECTION <span className="text-mag-glow">MAXIMALE</span>
            </h2>
            <p style={{ color:'var(--text-2)', fontFamily:'Rajdhani,sans-serif' }}>
              Vos documents sont protégés à chaque niveau.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon:Shield, title:'Accès authentifié', desc:'Email vérifié + mot de passe requis. Impossible d\'accéder sans compte actif.', col:'var(--cyan)' },
              { icon:Lock,   title:'Viewer sécurisé',   desc:'Les PDF s\'affichent dans un lecteur intégré. Aucun téléchargement possible.', col:'var(--magenta)' },
              { icon:Zap,    title:'Session 30 minutes', desc:'Chaque ouverture génère un token unique qui expire automatiquement.', col:'var(--purple)' },
            ].map((item,i)=>(
              <motion.div key={i} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} transition={{delay:i*.1}}
                className="card corners p-6">
                <div className="w-12 h-12 flex items-center justify-center mb-4"
                  style={{ background:`${item.col}10`, border:`1px solid ${item.col}25`, clipPath:'polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)' }}>
                  <item.icon className="w-6 h-6" style={{ color:item.col }} />
                </div>
                <h3 className="font-bold mb-2 text-sm tracking-wider uppercase" style={{ fontFamily:'Orbitron,monospace', color:item.col }}>
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color:'var(--text-2)', fontFamily:'Rajdhani,sans-serif' }}>
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────── */}
      <section className="py-20 relative overflow-hidden" style={{ background:'var(--bg-void)' }}>
        {mounted && <Particles count={15} />}
        <div className="absolute inset-0 pointer-events-none" style={{ background:'radial-gradient(ellipse at 50% 50%,rgba(0,212,255,0.04) 0%,transparent 60%)' }} />
        <div className="max-w-2xl mx-auto px-4 text-center relative z-10">
          <motion.div initial={{opacity:0,y:32}} whileInView={{opacity:1,y:0}}>
            <div className="cyber-line w-16 mx-auto mb-8" />
            <div className="w-20 h-20 relative mx-auto mb-6">
              <Image src="/logo.png" alt="GUI-LOK DEV" fill className="object-contain" />
            </div>
            <h2 className="text-2xl md:text-4xl mb-3" style={{ fontFamily:'Orbitron,monospace', fontWeight:900 }}>
              <span className="text-holo">PRÊT À COMMENCER ?</span>
            </h2>
            <p className="mb-8 text-lg" style={{ color:'var(--text-2)', fontFamily:'Rajdhani,sans-serif' }}>
              Créez votre compte gratuitement et accédez au catalogue complet.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="btn-primary text-sm px-8 py-4">
                Créer mon compte <ArrowRight className="w-4 h-4"/>
              </Link>
              <Link href="/login" className="btn-outline text-sm px-8 py-4">
                J&apos;ai déjà un compte
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="py-8" style={{ background:'var(--bg-deep)', borderTop:'1px solid rgba(0,212,255,0.08)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="cyber-line mb-6" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 relative">
                <Image src="/logo.png" alt="GUI-LOK DEV" fill className="object-contain" />
              </div>
              <div>
                <div className="text-sm font-bold tracking-widest" style={{ fontFamily:'Orbitron,monospace', color:'var(--cyan)' }}>GUI-LOK DEV</div>
                <div className="text-xs" style={{ color:'var(--text-3)', fontFamily:'JetBrains Mono,monospace' }}>Cotonou, Bénin · 2026</div>
              </div>
            </div>
            <div className="flex gap-6 text-xs" style={{ color:'var(--text-3)', fontFamily:'JetBrains Mono,monospace' }}>
              {[['/','"Accueil"'],['/login','Connexion'],['/register','S\'inscrire'],['mailto:guidolokossouolympe@gmail.com','Contact'],['/admin','Admin']].map(([href,label])=>(
                <a key={href} href={href} className="hover:text-white transition-colors">{label.replace(/"/g,'')}</a>
              ))}
            </div>
            <div className="text-xs" style={{ color:'var(--text-3)', fontFamily:'JetBrains Mono,monospace' }}>
              © 2026 Olympe GUIDO-LOKOSSOU
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
