'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Users, TrendingUp, CreditCard, ArrowUpRight,
  ShoppingBag, Calendar, Loader2,
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';

interface Stats {
  totalUsers: number;
  totalTransactions: number;
  totalRevenue: number;
  newUsersThisWeek: number;
  packs: Array<{ name: string; salesCount: number; totalRevenue: number }>;
  revenueByMonth: Array<{ _id: string; total: number; count: number }>;
}

export default function AdminPage() {
  const router     = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [stats, setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { router.replace('/login'); return; }
    if (user?.role !== 'admin') { router.replace('/dashboard'); return; }

    adminApi.getStats()
      .then(res => { setStats(res.data); setLoading(false); })
      .catch(() => { router.replace('/dashboard'); });
  }, [isAuthenticated, user, router]);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
      </div>
    );
  }

  const kpiCards = [
    { label: 'Clients total', value: stats.totalUsers, icon: Users, color: 'blue', sub: `+${stats.newUsersThisWeek} cette semaine` },
    { label: 'Ventes confirmées', value: stats.totalTransactions, icon: ShoppingBag, color: 'green', sub: 'Paiements approuvés' },
    { label: 'Revenu total', value: formatCurrency(stats.totalRevenue), icon: TrendingUp, color: 'gold', sub: 'Toutes périodes confondues' },
    { label: 'Nouveaux (7j)', value: stats.newUsersThisWeek, icon: Calendar, color: 'purple', sub: 'Inscriptions récentes' },
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    gold: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="page-header">
        <h1>Administration</h1>
        <p>Vue globale des ventes et des clients — Pack Digital 360</p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${colorMap[kpi.color]}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl font-display font-bold text-navy-DEFAULT">{kpi.value}</div>
            <div className="text-gray-500 text-sm font-medium mt-1">{kpi.label}</div>
            <div className="text-gray-400 text-xs mt-1">{kpi.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Revenue by month */}
      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2 card p-6">
          <h2 className="font-display font-bold text-navy-DEFAULT text-lg mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-blue" /> Revenus par mois
          </h2>
          {stats.revenueByMonth.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Aucune donnée disponible</div>
          ) : (
            <div className="space-y-3">
              {stats.revenueByMonth.slice(0, 6).map((m, i) => {
                const max = Math.max(...stats.revenueByMonth.map(x => x.total));
                const pct = max > 0 ? (m.total / max) * 100 : 0;
                return (
                  <div key={i} className="flex items-center gap-4">
                    <span className="text-gray-500 text-sm font-mono w-16 shrink-0">{m._id}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-brand-blue to-brand-lblue transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-right w-28 shrink-0">
                      <div className="text-navy-DEFAULT font-semibold text-sm">{formatCurrency(m.total)}</div>
                      <div className="text-gray-400 text-xs">{m.count} vente{m.count > 1 ? 's' : ''}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Pack stats */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card p-6">
          <h2 className="font-display font-bold text-navy-DEFAULT text-lg mb-6 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-gold-DEFAULT" /> Packs
          </h2>
          {stats.packs.map((pack, i) => (
            <div key={i} className="p-4 rounded-xl bg-gradient-to-r from-navy-DEFAULT to-brand-blue text-white mb-3">
              <div className="font-semibold mb-2">{pack.name}</div>
              <div className="flex justify-between text-sm">
                <div>
                  <div className="text-white/60 text-xs">Ventes</div>
                  <div className="font-bold text-gold-DEFAULT">{pack.salesCount}</div>
                </div>
                <div className="text-right">
                  <div className="text-white/60 text-xs">Revenu</div>
                  <div className="font-bold text-gold-DEFAULT">{formatCurrency(pack.totalRevenue)}</div>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Quick links */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="grid grid-cols-2 gap-4">
        <Link href="/admin/clients" className="card-hover p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <div className="font-semibold text-navy-DEFAULT">Gérer les clients</div>
            <div className="text-gray-500 text-sm">Accès manuels, désactivation</div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-gray-400 ml-auto" />
        </Link>

        <Link href="/admin/stats" className="card-hover p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <div className="font-semibold text-navy-DEFAULT">Transactions</div>
            <div className="text-gray-500 text-sm">Historique des paiements</div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-gray-400 ml-auto" />
        </Link>
      </motion.div>
    </div>
  );
}
