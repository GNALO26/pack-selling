'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, Users, CreditCard, LogOut, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path   = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => setReady(true), []);
  useEffect(() => {
    if (ready && (!isAuthenticated || user?.role !== 'admin')) {
      router.replace(isAuthenticated ? '/dashboard' : '/login');
    }
  }, [ready, isAuthenticated, user, router]);

  if (!ready || !isAuthenticated || user?.role !== 'admin') return (
    <div className="min-h-screen flex items-center justify-center" style={{background:'var(--bg-void)'}}>
      <div className="w-8 h-8 rounded-full animate-spin" style={{border:'2px solid rgba(0,212,255,0.15)',borderTopColor:'var(--cyan)'}}/>
    </div>
  );

  const nav = [
    {href:'/admin',         label:'DASHBOARD',    icon:LayoutDashboard},
    {href:'/admin/clients', label:'CLIENTS',      icon:Users},
    {href:'/admin/stats',   label:'TRANSACTIONS', icon:CreditCard},
  ];

  return (
    <div className="min-h-screen flex" style={{background:'var(--bg-void)'}}>
      <aside className="w-56 fixed inset-y-0 left-0 flex flex-col" style={{background:'var(--bg-deep)',borderRight:'1px solid rgba(255,0,110,0.1)'}}>
        <div className="p-4" style={{borderBottom:'1px solid rgba(255,0,110,0.08)'}}>
          <div className="flex items-center gap-2 mb-1">
            <div className="relative w-8 h-8"><Image src="/logo.png" alt="GUI-LOK" fill className="object-contain"/></div>
            <div className="text-xs font-bold tracking-widest" style={{fontFamily:'Orbitron,monospace',color:'var(--magenta)'}}>GUI-LOK DEV</div>
          </div>
          <div className="badge-magenta badge text-xs">ADMINISTRATION</div>
        </div>
        <div className="p-3 text-xs" style={{borderBottom:'1px solid rgba(255,255,255,0.04)',color:'var(--text-2)',fontFamily:'JetBrains Mono,monospace'}}>
          {user.firstName} {user.lastName}
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(({href,label,icon:Icon})=>{
            const active = path===href || (path.startsWith(href+'/') && href!=='/admin');
            return (
              <Link key={href} href={href}
                className="flex items-center gap-3 px-3 py-2.5 text-xs tracking-widest transition-all duration-200"
                style={{fontFamily:'Orbitron,monospace',color:active?'var(--magenta)':'var(--text-2)',background:active?'rgba(255,0,110,0.08)':'transparent',borderLeft:active?'2px solid var(--magenta)':'2px solid transparent'}}>
                <Icon className="w-3.5 h-3.5 shrink-0"/>{label}
              </Link>
            );
          })}
          <div className="pt-2" style={{borderTop:'1px solid rgba(255,255,255,0.04)',marginTop:'8px'}}>
            <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 text-xs tracking-widest transition-all duration-200"
              style={{fontFamily:'Orbitron,monospace',color:'var(--text-3)'}}
              onMouseEnter={e=>(e.currentTarget.style.color='var(--cyan)')} onMouseLeave={e=>(e.currentTarget.style.color='var(--text-3)')}>
              <ArrowLeft className="w-3.5 h-3.5"/>ESPACE CLIENT
            </Link>
          </div>
        </nav>
        <div className="p-3" style={{borderTop:'1px solid rgba(255,255,255,0.04)'}}>
          <button onClick={()=>{logout();router.push('/');}} className="flex items-center gap-3 px-3 py-2.5 text-xs tracking-widest w-full transition-all duration-200"
            style={{fontFamily:'Orbitron,monospace',color:'var(--text-3)'}}
            onMouseEnter={e=>(e.currentTarget.style.color='var(--magenta)')} onMouseLeave={e=>(e.currentTarget.style.color='var(--text-3)')}>
            <LogOut className="w-3.5 h-3.5"/>DÉCONNEXION
          </button>
        </div>
      </aside>
      <div className="flex-1 ml-56">
        <header className="h-14 flex items-center px-6 sticky top-0 z-30"
          style={{background:'var(--bg-deep)',borderBottom:'1px solid rgba(255,0,110,0.08)'}}>
          <div className="flex-1"/>
          <div className="badge-magenta badge text-xs">MODE ADMIN</div>
        </header>
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
