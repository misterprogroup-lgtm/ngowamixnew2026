'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '../lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      setError('Erreur lors de l\'envoi. Vérifiez votre email.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-dark-900 bg-mesh flex items-center justify-center p-4">
        <div className="bg-dark-800/50 backdrop-blur-xl rounded-2xl border border-dark-700/50 max-w-md w-full p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Email envoyé</h1>
          <p className="text-dark-400 text-sm mb-6">Un lien de réinitialisation a été envoyé à <strong className="text-white">{email}</strong>. Vérifiez votre boîte de réception.</p>
          <Link href="/connexion" className="text-primary-400 hover:text-primary-300 font-medium text-sm transition-colors">Retour à la connexion</Link>
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
          <h1 className="text-xl font-bold text-white mt-4">Mot de passe oublié</h1>
          <p className="text-dark-400 text-sm mt-1">Entrez votre email pour recevoir un lien de réinitialisation.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="votre@email.com"
              className="input-field"
              required
            />
          </div>

          {error && <p className="text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || !email}
            className="btn-primary w-full"
          >
            {loading ? 'Envoi...' : 'Envoyer le lien'}
          </button>
        </form>

        <p className="text-center text-sm text-dark-400 mt-6">
          <Link href="/connexion" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">Retour à la connexion</Link>
        </p>
      </div>
    </div>
  );
}
