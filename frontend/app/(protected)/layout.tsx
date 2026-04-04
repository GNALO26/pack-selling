'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, LogOut, BookOpen, Shield, Menu, X } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router        = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted]   = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.replace('/login');
    }
  }, [mounted, isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-navy-DEFAULT flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-DEFAULT/30 border-t-gold-DEFAULT rounded-full animate-spin" />
      </div>
    );
  }

  const navLinks = [
    { href: '/dashboard', label: 'Mes packs', icon: LayoutDashboard },
    ...(user?.role === 'admin' ? [{ href: '/admin', label: 'Administration', icon: Shield }] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-navy-DEFAULT flex flex-col transition-transform duration-300',
        'lg:translate-x-0',
        menuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-gold-DEFAULT" />
            <div>
              <span className="text-gold-DEFAULT font-display font-bold text-base">Pack</span>
              <span className="text-white font-display font-bold text-base"> Digital 360</span>
            </div>
          </Link>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold-DEFAULT/20 border border-gold-DEFAULT/30 flex items-center justify-center text-gold-DEFAULT font-bold text-sm">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-white/40 text-xs truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all text-sm font-medium group"
            >
              <Icon className="w-4 h-4 group-hover:text-gold-DEFAULT transition-colors" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium w-full group"
          >
            <LogOut className="w-4 h-4" />
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* ── Mobile overlay ──────────────────────────────────────────────── */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMenuOpen(false)} />
      )}

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 h-14 flex items-center px-4 sm:px-6 sticky top-0 z-30">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 mr-3"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            {user?.role === 'admin' && (
              <span className="badge-gold text-xs">Admin</span>
            )}
            <div className="w-8 h-8 rounded-full bg-navy-DEFAULT flex items-center justify-center text-white text-xs font-bold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
