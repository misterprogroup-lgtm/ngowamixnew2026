'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { api } from '../lib/api';

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage('Les mots de passe ne correspondent pas');
      setStatus('error');
      return;
    }
    if (password.length < 8) {
      setMessage('Le mot de passe doit contenir au moins 8 caractères');
      setStatus('error');
      return;
    }
    setLoading(true);
    try {
      const data = await api.post<{ message?: string }>('/auth/reset-password', { token, password });
      setStatus('success');
      setMessage(data.message || 'Mot de passe réinitialisé avec succès !');
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.message || 'Lien invalide ou expiré.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-dark-900 bg-mesh flex items-center justify-center p-4">
        <div className="bg-dark-800/50 backdrop-blur-xl rounded-2xl border border-dark-700/50 max-w-md w-full p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Mot de passe réinitialisé</h1>
          <p className="text-dark-400 text-sm mb-6">{message}</p>
          <Link href="/connexion" className="btn-primary inline-block">Se connecter</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 bg-mesh flex items-center justify-center p-4">
      <div className="bg-dark-800/50 backdrop-blur-xl rounded-2xl border border-dark-700/50 max-w-md w-full p-8 shadow-2xl">
        <div className="text-center mb-6">
          <Link href="/" className="text-2xl font-bold">
            <span className="text-gradient">Ngowamix</span>
          </Link>
          <h1 className="text-xl font-bold text-white mt-4">Nouveau mot de passe</h1>
          <p className="text-dark-400 text-sm mt-1">Choisissez un mot de passe sécurisé.</p>
        </div>

        {!token ? (
          <div className="text-center">
            <p className="text-dark-400 text-sm mb-4">Lien de réinitialisation invalide ou manquant.</p>
            <Link href="/mot-de-passe-oublie" className="text-primary-400 hover:text-primary-300 font-medium text-sm transition-colors">Demander un nouveau lien</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">Nouveau mot de passe</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 caractères"
                className="input-field" required minLength={8} />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">Confirmer</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••"
                className="input-field" required />
            </div>
            {status === 'error' && <p className="text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-sm">{message}</p>}
            <button type="submit" disabled={loading || !password || !confirmPassword}
              className="btn-primary w-full">
              {loading ? 'Réinitialisation...' : 'Réinitialiser'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-dark-900 bg-mesh flex items-center justify-center"><div className="animate-pulse text-dark-400">Chargement...</div></div>}>
      <ResetForm />
    </Suspense>
  );
}
