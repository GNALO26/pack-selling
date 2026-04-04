'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search, UserCheck, UserX, Gift, Ban,
  CheckCircle, XCircle, ChevronLeft, ChevronRight, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi, type User } from '@/lib/api';
import { formatDate, getErrorMessage } from '@/lib/utils';

const PACK_ID = process.env.NEXT_PUBLIC_PACK_ID || '';

export default function AdminClientsPage() {
  const [clients,  setClients]  = useState<User[]>([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [pages,    setPages]    = useState(1);
  const [search,   setSearch]   = useState('');
  const [loading,  setLoading]  = useState(true);
  const [granting, setGranting] = useState<string | null>(null);

  const load = useCallback(async (p: number, q: string) => {
    setLoading(true);
    try {
      const res = await adminApi.getClients({ page: p, limit: 15, search: q });
      setClients(res.data.clients);
      setTotal(res.data.pagination.total);
      setPages(res.data.pagination.pages);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(page, search), 300);
    return () => clearTimeout(t);
  }, [page, search, load]);

  const handleGrantAccess = async (userId: string) => {
    if (!PACK_ID) return;
    setGranting(userId);
    try {
      await adminApi.grantAccess(userId, PACK_ID);
      toast.success('Accès accordé ! Email envoyé au client.');
      load(page, search);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setGranting(null);
    }
  };

  const handleRevokeAccess = async (userId: string) => {
    if (!PACK_ID || !confirm('Révoquer l\'accès à ce client ?')) return;
    try {
      await adminApi.revokeAccess(userId, PACK_ID);
      toast.success('Accès révoqué.');
      load(page, search);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    if (!confirm(`${isActive ? 'Désactiver' : 'Réactiver'} ce compte ?`)) return;
    try {
      await adminApi.toggleUserStatus(userId);
      toast.success(`Compte ${isActive ? 'désactivé' : 'réactivé'}.`);
      load(page, search);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const hasPack = (client: User) =>
    client.purchases?.some(p => {
      const id = typeof p.packId === 'string' ? p.packId : (p.packId as any)?._id;
      return id === PACK_ID;
    });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="page-header">
        <h1>Clients ({total})</h1>
        <p>Gérez les accès manuels et les comptes clients.</p>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Rechercher par nom ou email..."
            className="input pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-brand-blue animate-spin" />
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Aucun client trouvé</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-gray-100">
                  <tr>
                    {['Client', 'Email', 'Inscrit le', 'Statut', 'Pack', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {clients.map((client, i) => {
                    const packAccess = hasPack(client);
                    return (
                      <motion.tr
                        key={client._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        {/* Client */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-navy-DEFAULT flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {client.firstName?.[0]}{client.lastName?.[0]}
                            </div>
                            <div>
                              <div className="font-semibold text-navy-DEFAULT text-sm">
                                {client.firstName} {client.lastName}
                              </div>
                              <div className="text-gray-400 text-xs">{client.loginCount} connexions</div>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-600">{client.email}</div>
                          {client.isEmailVerified ? (
                            <span className="badge-green text-xs">Vérifié</span>
                          ) : (
                            <span className="badge-red text-xs">Non vérifié</span>
                          )}
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 text-gray-500 text-sm whitespace-nowrap">
                          {formatDate(client.createdAt)}
                        </td>

                        {/* Statut compte */}
                        <td className="px-4 py-3">
                          {client.isActive ? (
                            <span className="flex items-center gap-1 text-green-600 text-xs font-semibold">
                              <CheckCircle className="w-3.5 h-3.5" /> Actif
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-500 text-xs font-semibold">
                              <XCircle className="w-3.5 h-3.5" /> Désactivé
                            </span>
                          )}
                        </td>

                        {/* Pack access */}
                        <td className="px-4 py-3">
                          {packAccess ? (
                            <span className="badge-green">✓ Accès</span>
                          ) : (
                            <span className="badge-grey">Aucun</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {/* Grant/Revoke access */}
                            {packAccess ? (
                              <button
                                onClick={() => handleRevokeAccess(client._id)}
                                title="Révoquer l'accès"
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleGrantAccess(client._id)}
                                disabled={granting === client._id}
                                title="Donner l'accès manuellement"
                                className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
                              >
                                {granting === client._id
                                  ? <Loader2 className="w-4 h-4 animate-spin" />
                                  : <Gift className="w-4 h-4" />
                                }
                              </button>
                            )}

                            {/* Toggle account */}
                            <button
                              onClick={() => handleToggleStatus(client._id, client.isActive)}
                              title={client.isActive ? 'Désactiver le compte' : 'Réactiver le compte'}
                              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                            >
                              {client.isActive
                                ? <Ban className="w-4 h-4" />
                                : <UserCheck className="w-4 h-4 text-green-600" />
                              }
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-gray-500 text-sm">{total} clients au total</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded text-gray-400 hover:text-navy-DEFAULT disabled:opacity-30">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-600">Page {page} / {pages}</span>
                  <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page >= pages} className="p-1.5 rounded text-gray-400 hover:text-navy-DEFAULT disabled:opacity-30">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Legend */}
      <div className="text-xs text-gray-400 flex flex-wrap gap-4">
        <span>🎁 = Donner accès manuellement (sans paiement)</span>
        <span>🚫 = Désactiver/réactiver le compte</span>
        <span>✕ = Révoquer l&apos;accès au pack</span>
      </div>
    </div>
  );
}
