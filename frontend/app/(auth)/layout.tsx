'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  const pts = Array.from({length:16},(_,i)=>({id:i,x:Math.random()*100,delay:Math.random()*7,dur:5+Math.random()*6,size:1+Math.random()*1.5,col:i%2===0?'#00D4FF':'#FF006E'}));
  return (
    <div className="min-h-screen relative flex flex-col" style={{ background:'var(--bg-void)' }}>
      <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none" style={{ background:'radial-gradient(ellipse at 50% 30%,rgba(0,212,255,0.04) 0%,transparent 60%)' }} />
      {m && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {pts.map(p=>(
            <div key={p.id} className="absolute rounded-full" style={{ left:`${p.x}%`, bottom:'-4px', width:`${p.size}px`, height:`${p.size}px`, background:p.col, boxShadow:`0 0 4px ${p.col}`, animation:`floatP ${p.dur}s ${p.delay}s ease-in infinite` }} />
          ))}
          <style>{`@keyframes floatP{0%{transform:translateY(0) scale(1);opacity:0}8%{opacity:.8}92%{opacity:.3}100%{transform:translateY(-100vh) scale(.2);opacity:0}}`}</style>
        </div>
      )}
      <header className="relative z-10 py-5 px-6" style={{ borderBottom:'1px solid rgba(0,212,255,0.07)' }}>
        <Link href="/" className="inline-flex items-center gap-3">
          <div className="relative w-9 h-9"><Image src="/logo.png" alt="GUI-LOK DEV" fill className="object-contain" /></div>
          <div>
            <div className="text-sm font-bold tracking-widest leading-none" style={{ fontFamily:'Orbitron,monospace', color:'var(--cyan)' }}>GUI-LOK DEV</div>
            <div className="text-xs leading-none mt-0.5" style={{ color:'var(--text-3)', fontFamily:'JetBrains Mono,monospace' }}>Digital Store</div>
          </div>
        </Link>
      </header>
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">{children}</main>
      <footer className="relative z-10 py-4 text-center text-xs" style={{ color:'var(--text-3)', fontFamily:'JetBrains Mono,monospace', borderTop:'1px solid rgba(255,255,255,0.04)' }}>
        © 2026 GUI-LOK DEV · Cotonou, Bénin
      </footer>
    </div>
  );
}
