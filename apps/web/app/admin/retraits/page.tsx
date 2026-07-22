'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/auth/AuthContext';
import { api } from '../../lib/api';
import { Wallet, Check, X, ExternalLink } from 'lucide-react';

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  method: string;
  account: string;
  createdAt: string;
  processedAt: string | null;
  user: { pseudo: string; email: string };
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'En attente', color: 'bg-amber-500/20 text-amber-300' },
  APPROVED: { label: 'Approuvé', color: 'bg-blue-500/20 text-blue-300' },
  REJECTED: { label: 'Rejeté', color: 'bg-red-500/20 text-red-300' },
  PAID: { label: 'Payé', color: 'bg-emerald-500/20 text-emerald-300' },
};

const WITHDRAW_METHODS: Record<string, string> = {
  orange_money: 'Orange Money',
  mtn_money: 'MTN Mobile Money',
  carte_bancaire: 'Carte bancaire',
};

export default function AdminWithdrawalsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) router.push('/connexion');
  }, [user, authLoading, router]);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const res = await api.get<Withdrawal[]>('/admin/wallet/withdrawals');
      setWithdrawals(Array.isArray(res) ? res : []);
    } catch { setWithdrawals([]); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return;
    fetchWithdrawals();
  }, [user]);

  const processWithdrawal = async (id: string, status: string) => {
    try {
      await api.patch(`/admin/wallet/withdrawals/${id}`, { status });
      setWithdrawals(withdrawals.map(w => w.id === id ? { ...w, status, processedAt: new Date().toISOString() } : w));
    } catch {}
  };

  const filtered = filter ? withdrawals.filter(w => w.status === filter) : withdrawals;

  if (authLoading) return <div className="min-h-screen bg-dark-900 py-8"><div className="max-w-5xl mx-auto px-4 animate-pulse"><div className="h-8 bg-dark-700 rounded w-1/3 mb-8" /></div></div>;

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Retraits</h1>
          <span className="text-sm text-dark-400">{withdrawals.filter(w => w.status === 'PENDING').length} en attente</span>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['', 'PENDING', 'APPROVED', 'REJECTED', 'PAID'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === s ? 'bg-primary-500 text-white' : 'bg-dark-800/50 text-dark-300 hover:bg-dark-700'}`}>
              {s === '' ? 'Tous' : STATUS_LABELS[s]?.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-dark-700 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="bg-dark-800/50 rounded-xl p-12 text-center">
            <Wallet className="w-12 h-12 text-dark-300 mx-auto mb-3" />
            <p className="text-dark-400">Aucune demande de retrait.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(w => {
              const statusInfo = STATUS_LABELS[w.status] || STATUS_LABELS.PENDING;
              return (
                <div key={w.id} className="bg-dark-800/50 rounded-xl p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white">{w.user.pseudo}</span>
                        <span className="text-xs text-dark-400">{w.user.email}</span>
                      </div>
                      <p className="text-lg font-bold text-white">{w.amount.toLocaleString('fr-FR')} FCFA</p>
                      <p className="text-xs text-dark-400">{WITHDRAW_METHODS[w.method] || w.method} · {w.account}</p>
                      <p className="text-xs text-dark-400">{new Date(w.createdAt).toLocaleString('fr-FR')}</p>
                      {w.processedAt && <p className="text-xs text-dark-400">Traité le {new Date(w.processedAt).toLocaleString('fr-FR')}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                      {w.status === 'PENDING' && (
                        <div className="flex gap-1.5">
                          <button onClick={() => processWithdrawal(w.id, 'APPROVED')}
                            className="flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-lg hover:bg-emerald-500/40">
                            <Check className="w-3 h-3" /> Approuver
                          </button>
                          <button onClick={() => processWithdrawal(w.id, 'REJECTED')}
                            className="flex items-center gap-1 text-xs bg-red-500/20 text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-500/40">
                            <X className="w-3 h-3" /> Rejeter
                          </button>
                        </div>
                      )}
                      {w.status === 'APPROVED' && (
                        <button onClick={() => { if (confirm('Confirmer le paiement de ' + w.amount.toLocaleString('fr-FR') + ' FCFA à ' + w.user.pseudo + ' ?')) processWithdrawal(w.id, 'PAID'); }}
                          className="flex items-center gap-1 text-xs bg-blue-500/20 text-blue-300 px-3 py-1.5 rounded-lg hover:bg-blue-500/40">
                          <Check className="w-3 h-3" /> Marquer comme payé
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
