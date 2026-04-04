import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-navy-DEFAULT flex flex-col">
      {/* Header minimal */}
      <header className="py-6 px-6">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <span className="text-gold-DEFAULT font-display font-bold text-lg">Pack</span>
          <span className="text-white font-display font-bold text-lg">Digital 360</span>
        </Link>
      </header>

      {/* Background décoration */}
      <div className="absolute inset-0 bg-hero-pattern opacity-30 pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-brand-blue/10 rounded-full blur-3xl pointer-events-none" />

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        {children}
      </main>

      <footer className="py-4 text-center text-white/30 text-xs">
        © 2026 Pack Digital 360 · Cotonou, Bénin
      </footer>
    </div>
  );
}
