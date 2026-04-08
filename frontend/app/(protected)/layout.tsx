'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, LogOut, Shield, Menu, X } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [open, setOpen]   = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => { setReady(true); }, []);
  useEffect(() => { if (ready && !isAuthenticated) router.replace('/login'); }, [ready, isAuthenticated, router]);

  if (!ready || !isAuthenticated) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:'var(--bg-void)'}}>
      <div className="w-8 h-8 rounded-full animate-spin" style={{border:'2px solid rgba(0,212,255,0.15)',borderTopColor:'var(--cyan)'}}/>
    </div>
  );

  const navLinks = [
    { href:'/dashboard', label:'Mes packs', icon:LayoutDashboard },
    ...(user?.role==='admin'?[{href:'/admin',label:'Administration',icon:Shield}]:[]),
  ];

  return (
    <div className="min-h-screen flex" style={{background:'var(--bg-void)'}}>
      {/* Sidebar identique à avant, inchangée sauf le bouton logout plus bas */}
      <aside className={cn('fixed inset-y-0 left-0 z-50 w-60 flex flex-col transition-transform duration-300 lg:translate-x-0',
        open?'translate-x-0':'-translate-x-full lg:translate-x-0')}
        style={{background:'var(--bg-deep)',borderRight:'1px solid rgba(0,212,255,0.08)'}}>
        <div className="p-5" style={{borderBottom:'1px solid rgba(0,212,255,0.08)'}}>
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-8 h-8"><Image src="/logo.png" alt="GUI-LOK DEV" fill className="object-contain"/></div>
            <div>
              <div className="text-sm font-bold tracking-widest" style={{fontFamily:'Orbitron,monospace',color:'var(--cyan)'}}>GUI-LOK DEV</div>
              <div className="text-xs" style={{color:'var(--text-3)',fontFamily:'JetBrains Mono,monospace'}}>Digital Store</div>
            </div>
          </Link>
        </div>
        <div className="p-4" style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center font-bold text-sm"
              style={{background:'rgba(0,212,255,0.1)',border:'1px solid rgba(0,212,255,0.25)',clipPath:'polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)',color:'var(--cyan)',fontFamily:'Orbitron,monospace'}}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{color:'var(--text-1)',fontFamily:'Rajdhani,sans-serif'}}>{user?.firstName} {user?.lastName}</p>
              <p className="text-xs truncate" style={{color:'var(--text-3)',fontFamily:'JetBrains Mono,monospace'}}>{user?.email}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navLinks.map(({href,label,icon:Icon})=>{
            const active = pathname === href || pathname.startsWith(href+'/');
            return (
              <Link key={href} href={href} onClick={()=>setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm tracking-wider transition-all duration-200"
                style={{
                  fontFamily:'Orbitron,monospace', fontSize:'11px',
                  background: active ? 'rgba(0,212,255,0.08)' : 'transparent',
                  color: active ? 'var(--cyan)' : 'var(--text-2)',
                  borderLeft: active ? '2px solid var(--cyan)' : '2px solid transparent',
                }}
                onMouseEnter={e=>{ if(!active) e.currentTarget.style.color='var(--text-1)'; }}
                onMouseLeave={e=>{ if(!active) e.currentTarget.style.color='var(--text-2)'; }}>
                <Icon className="w-4 h-4 shrink-0"/>
                {label}
              </Link>
            );
          })}
        </nav>
        {/* Bouton Déconnexion corrigé */}
        <div className="p-3" style={{borderTop:'1px solid rgba(255,255,255,0.04)'}}>
          <button onClick={()=>{logout();router.push('/');}}
            className="flex items-center gap-3 px-4 py-3 text-sm w-full transition-all duration-200 tracking-wider"
            style={{fontFamily:'Orbitron,monospace', fontSize:'11px', color:'var(--text-3)'}}
            onMouseEnter={e=>(e.currentTarget.style.color='var(--magenta)')}
            onMouseLeave={e=>(e.currentTarget.style.color='var(--text-3)')}>
            <LogOut className="w-4 h-4"/>DÉCONNEXION
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-40 bg-black/70 lg:hidden" onClick={()=>setOpen(false)}/>}

      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        <header className="h-14 flex items-center px-4 sm:px-6 sticky top-0 z-30"
          style={{background:'var(--bg-deep)',borderBottom:'1px solid rgba(0,212,255,0.07)'}}>
          <button onClick={()=>setOpen(!open)} className="lg:hidden p-2 mr-3 transition-colors"
            style={{color:'var(--text-2)'}} onMouseEnter={e=>(e.currentTarget.style.color='var(--cyan)')} onMouseLeave={e=>(e.currentTarget.style.color='var(--text-2)')}>
            {open?<X className="w-5 h-5"/>:<Menu className="w-5 h-5"/>}
          </button>
          <div className="flex-1"/>
          {user?.role==='admin' && <span className="badge-magenta badge text-xs mr-2">ADMIN</span>}
          <div className="w-8 h-8 flex items-center justify-center text-xs font-bold"
            style={{background:'rgba(0,212,255,0.1)',border:'1px solid rgba(0,212,255,0.2)',clipPath:'polygon(5px 0%,100% 0%,calc(100% - 5px) 100%,0% 100%)',color:'var(--cyan)',fontFamily:'Orbitron,monospace'}}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}