'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api';
import { formatCurrency, formatDate, getErrorMessage } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Transaction {
  _id: string;
  fedapayTransactionId: string;
  userId: { email: string; firstName: string; lastName: string };
  packId: { name: string };
  amount: number;
  currency: string;
  status: string;
  confirmedAt?: string;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  approved:  'badge-green',
  pending:   'badge-gold',
  declined:  'badge-red',
  cancelled: 'badge-grey',
  refunded:  'badge-grey',
};
const STATUS_LABELS: Record<string, string> = {
  approved:  '✓ Approuvé',
  pending:   '⏳ En attente',
  declined:  '✗ Refusé',
  cancelled: 'Annulé',
  refunded:  'Remboursé',
};

export default function AdminStatsPage() {
  const [txns,    setTxns]    = useState<Transaction[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await adminApi.getTransactions({ page: p, limit: 20 });
      setTxns(res.data.transactions);
      setTotal(res.data.pagination.total);
      setPages(res.data.pagination.pages);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page); }, [page, load]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="page-header">
        <h1>Transactions ({total})</h1>
        <p>Historique de tous les paiements FedaPay.</p>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-brand-blue animate-spin" />
          </div>
        ) : txns.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Aucune transaction</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-gray-100">
                  <tr>
                    {['Référence', 'Client', 'Pack', 'Montant', 'Statut', 'Date'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {txns.map((txn, i) => (
                    <motion.tr
                      key={txn._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded inline-block">
                          #{txn.fedapayTransactionId}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-navy-DEFAULT text-sm">
                          {txn.userId?.firstName} {txn.userId?.lastName}
                        </div>
                        <div className="text-gray-400 text-xs">{txn.userId?.email}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {txn.packId?.name || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-navy-DEFAULT">
                          {formatCurrency(txn.amount, txn.currency)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('badge', STATUS_STYLES[txn.status] || 'badge-grey')}>
                          {STATUS_LABELS[txn.status] || txn.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-sm whitespace-nowrap">
                        {formatDate(txn.createdAt)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pages > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-gray-500 text-sm">{total} transactions</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded text-gray-400 disabled:opacity-30">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-600">Page {page} / {pages}</span>
                  <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page >= pages} className="p-1.5 rounded text-gray-400 disabled:opacity-30">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
