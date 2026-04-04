'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, CreditCard, BookOpen, LogOut, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && (!isAuthenticated || user?.role !== 'admin')) {
      router.replace(isAuthenticated ? '/dashboard' : '/login');
    }
  }, [mounted, isAuthenticated, user, router]);

  if (!mounted || !isAuthenticated || user?.role !== 'admin') {
    return <div className="min-h-screen bg-navy-DEFAULT flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gold-DEFAULT/30 border-t-gold-DEFAULT rounded-full animate-spin" />
    </div>;
  }

  const navLinks = [
    { href: '/admin',         label: 'Dashboard',     icon: LayoutDashboard },
    { href: '/admin/clients', label: 'Clients',       icon: Users },
    { href: '/admin/stats',   label: 'Transactions',  icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-navy-DEFAULT fixed inset-y-0 left-0 flex flex-col">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-5 h-5 text-gold-DEFAULT" />
            <span className="text-gold-DEFAULT font-display font-bold">Pack Digital 360</span>
          </div>
          <div className="badge-gold text-xs">Administration</div>
        </div>

        <div className="p-4 border-b border-white/10">
          <div className="text-white text-sm font-semibold">{user.firstName} {user.lastName}</div>
          <div className="text-white/40 text-xs">{user.email}</div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all text-sm group">
              <Icon className="w-4 h-4 group-hover:text-gold-DEFAULT transition-colors" />
              {label}
            </Link>
          ))}

          <div className="pt-2 border-t border-white/10 mt-2">
            <Link href="/dashboard"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all text-sm">
              <ArrowLeft className="w-4 h-4" /> Espace client
            </Link>
          </div>
        </nav>

        <div className="p-3 border-t border-white/10">
          <button onClick={() => { logout(); router.push('/'); }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm w-full">
            <LogOut className="w-4 h-4" /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 ml-60">
        <header className="bg-white border-b border-gray-100 h-14 flex items-center px-6 sticky top-0 z-30">
          <div className="flex-1" />
          <div className="badge-gold text-xs">Mode Admin</div>
        </header>
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
