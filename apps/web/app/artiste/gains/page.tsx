'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../components/auth/AuthContext';
import { api } from '../../lib/api';
import { Wallet, TrendingUp, Clock, ArrowUpRight, Download, AlertCircle } from 'lucide-react';

interface WalletData {
  id: string;
  balance: number;
  income: number;
  pending: number;
  Withdrawal: Withdrawal[];
}

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  method: string;
  account: string;
  createdAt: string;
  processedAt: string | null;
}

const WITHDRAW_METHODS: Record<string, string> = {
  orange_money: 'Orange Money',
  mtn_money: 'MTN Mobile Money',
  carte_bancaire: 'Carte bancaire',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
  APPROVED: { label: 'Approuvé', color: 'bg-blue-100 text-blue-700' },
  REJECTED: { label: 'Rejeté', color: 'bg-red-100 text-red-700' },
  PAID: { label: 'Payé', color: 'bg-green-100 text-green-700' },
};

export default function ArtistGainsPage() {
  const { user, loading: authLoading } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState('orange_money');
  const [account, setAccount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const data = await api.get<WalletData>('/wallet');
        setWallet(data);
      } catch {
        // Wallet might not exist yet, ensure it
        try {
          const data = await api.get<WalletData>('/wallet');
          setWallet(data);
        } catch {
          setWallet(null);
        }
      } finally {
        setLoading(false);
      }
    };
    if (user?.artistProfile) fetchWallet();
    else setLoading(false);
  }, [user]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const withdrawal = await api.post<Withdrawal>('/wallet/withdraw', { amount, method, account });
      setWallet(prev => prev ? {
        ...prev,
        balance: prev.balance - amount,
        pending: prev.pending + amount,
        Withdrawal: [withdrawal, ...prev.Withdrawal],
      } : prev);
      setShowForm(false);
      setAmount(0);
      setAccount('');
      setSuccess('Demande de retrait envoyée avec succès !');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la demande');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-dark-900 py-8">
        <div className="max-w-4xl mx-auto px-4 space-y-4">
          <div className="h-8 w-48 bg-dark-700/50 rounded animate-pulse" />
          <div className="grid grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-dark-700/50 rounded-xl animate-pulse" />)}</div>
        </div>
      </div>
    );
  }

  if (!user?.artistProfile) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <p className="text-dark-400">Profil artiste requis.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Mes gains</h1>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
            <ArrowUpRight className="w-4 h-4" /> {showForm ? 'Annuler' : 'Demander un retrait'}
          </button>
        </div>

        {success && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm mb-4">{success}</div>}

        {/* Wallet stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-dark-800/50 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm text-dark-400">Solde disponible</span>
            </div>
            <p className="text-2xl font-bold text-white">{wallet?.balance.toLocaleString('fr-FR') || 0} FCFA</p>
          </div>
          <div className="bg-dark-800/50 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-sm text-dark-400">En attente</span>
            </div>
            <p className="text-2xl font-bold text-white">{wallet?.pending.toLocaleString('fr-FR') || 0} FCFA</p>
          </div>
          <div className="bg-dark-800/50 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-dark-400">Revenu total</span>
            </div>
            <p className="text-2xl font-bold text-white">{wallet?.income.toLocaleString('fr-FR') || 0} FCFA</p>
          </div>
        </div>

        {/* Withdrawal form */}
        {showForm && (
          <form onSubmit={handleWithdraw} className="bg-dark-800/50 rounded-xl p-6 mb-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">Demande de retrait</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">Montant (FCFA)</label>
                <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} min={5000} max={wallet?.balance || 0} required
                  className="input-field" />
                <p className="text-xs text-dark-400 mt-1">Minimum 5 000 FCFA · Solde: {wallet?.balance.toLocaleString('fr-FR') || 0} FCFA</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">Méthode</label>
                <select value={method} onChange={e => setMethod(e.target.value)}
                  className="input-field">
                  {Object.entries(WITHDRAW_METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-dark-200 mb-1">Compte de réception</label>
                <input type="text" value={account} onChange={e => setAccount(e.target.value)} required placeholder="Numéro de téléphone ou IBAN"
                  className="input-field" />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {error}</p>}
            <button type="submit" disabled={submitting || amount < 5000 || amount > (wallet?.balance || 0) || !account}
              className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors">
              {submitting ? 'Envoi...' : 'Demander le retrait'}
            </button>
          </form>
        )}

        {/* Withdrawal history */}
        <h2 className="text-lg font-semibold text-white mb-4">Historique des retraits</h2>
        {wallet?.Withdrawal && wallet.Withdrawal.length > 0 ? (
          <div className="space-y-2">
            {wallet.Withdrawal.map(w => {
              const s = STATUS_LABELS[w.status] || STATUS_LABELS.PENDING;
              return (
                <div key={w.id} className="bg-dark-800/50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{w.amount.toLocaleString('fr-FR')} FCFA</p>
                    <p className="text-xs text-dark-400">{WITHDRAW_METHODS[w.method] || w.method} · {w.account}</p>
                    <p className="text-xs text-dark-400">{new Date(w.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${s.color}`}>{s.label}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-dark-800/50 rounded-xl p-12 text-center">
            <Download className="w-12 h-12 text-dark-300 mx-auto mb-3" />
            <p className="text-dark-400">Aucun retrait pour le moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
