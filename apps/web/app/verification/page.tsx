'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { api } from '../lib/api';

function VerifyForm() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length < 4) return;
    setLoading(true);
    try {
      const data = await api.post<{ message?: string }>('/auth/verify-email', { code });
      setStatus('success');
      setMessage(data.message || 'Email vérifié avec succès !');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...user, isVerified: true }));
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.message || 'Code invalide ou expiré.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 bg-mesh flex items-center justify-center p-4">
      <div className="bg-dark-800/50 backdrop-blur-xl rounded-2xl border border-dark-700/50 max-w-md w-full p-8 shadow-2xl">
        <div className="text-center mb-6">
          <Link href="/" className="text-2xl font-bold">
            <span className="text-gradient">Ngowamix</span>
          </Link>
        </div>

        {status === 'success' ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Email vérifié !</h1>
            <p className="text-dark-400 text-sm mb-6">{message}</p>
            <Link href="/connexion" className="btn-primary inline-block">
              Se connecter
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-white mb-2">Vérifier votre email</h1>
            <p className="text-dark-400 text-sm mb-6">Entrez le code de vérification envoyé à votre adresse email.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">Code de vérification</label>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="input-field text-center text-2xl tracking-[0.5em] font-mono"
                  required
                />
              </div>

              {status === 'error' && <p className="text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-sm">{message}</p>}

              <button
                type="submit"
                disabled={loading || code.length < 4}
                className="btn-primary w-full"
              >
                {loading ? 'Vérification...' : 'Vérifier'}
              </button>
            </form>

            <p className="text-center text-sm text-dark-400 mt-6">
              <Link href="/connexion" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">Retour à la connexion</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-dark-900 bg-mesh flex items-center justify-center"><div className="animate-pulse text-dark-400">Chargement...</div></div>}>
      <VerifyForm />
    </Suspense>
  );
}
