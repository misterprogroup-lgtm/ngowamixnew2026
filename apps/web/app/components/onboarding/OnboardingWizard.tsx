'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../auth/AuthContext';
import { api } from '@/app/lib/api';

const GENRES = ['Afrobeat', 'Coupé-Décalé', 'Zouglou', 'Hip-Hop', 'R&B', 'Pop', 'World', 'Reggae', 'Blues', 'Afropop', 'Makossa', 'Ndombolo'];

export default function OnboardingWizard() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [artistName, setArtistName] = useState('');
  const [bio, setBio] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const toggleGenre = (g: string) => {
    setSelectedGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  };

  const handleSubmit = async () => {
    if (!artistName.trim() || selectedGenres.length === 0) {
      setError('Remplissez le nom et sélectionnez au moins un genre.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.patch('/artists/me', { artistName, bio, genres: selectedGenres });
      setDone(true);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du profil.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-dark-900 bg-mesh flex items-center justify-center p-4">
        <div className="bg-dark-800/50 backdrop-blur-xl rounded-2xl border border-dark-700/50 max-w-lg w-full p-8 text-center shadow-2xl">
          <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Bienvenue sur Ngowamix !</h1>
          <p className="text-dark-400 mb-6">Votre profil artiste est prêt. Commencez à publier vos morceaux.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/artiste/publier" className="btn-primary">
              Publier un morceau
            </Link>
            <Link href="/artiste/dashboard" className="btn-outline">
              Mon dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 bg-mesh flex items-center justify-center p-4">
      <div className="bg-dark-800/50 backdrop-blur-xl rounded-2xl border border-dark-700/50 max-w-lg w-full p-8 shadow-2xl">
        <div className="text-center mb-6">
          <Link href="/" className="text-2xl font-bold">
            <span className="text-gradient">Ngowamix</span>
          </Link>
          <h1 className="text-xl font-bold text-white mt-4">Créez votre profil artiste</h1>
          <p className="text-dark-400 text-sm mt-1">Étape {step} sur 3</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? 'bg-primary-500' : 'bg-dark-600'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">Nom d&apos;artiste *</label>
              <input
                type="text" value={artistName} onChange={e => setArtistName(e.target.value)}
                placeholder="Ex: Djalo, Marie Houon..."
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">Bio (optionnel)</label>
              <textarea
                value={bio} onChange={e => setBio(e.target.value)}
                placeholder="Décrivez-vous en quelques mots..."
                rows={3}
                className="input-field resize-none"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-3">Sélectionnez vos genres musicaux *</label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map(g => (
                <button
                  key={g}
                  onClick={() => toggleGenre(g)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedGenres.includes(g) ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'bg-dark-700/50 text-dark-300 hover:bg-dark-600/50 border border-dark-600/50'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            {selectedGenres.length > 0 && (
              <p className="text-sm text-dark-400 mt-3">{selectedGenres.length} genre(s) sélectionné(s)</p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Récapitulatif</h2>
            <div className="bg-dark-700/30 border border-dark-600/50 rounded-xl p-4 space-y-3">
              <div>
                <span className="text-xs text-dark-400 uppercase tracking-wider">Nom d&apos;artiste</span>
                <p className="font-medium text-white">{artistName}</p>
              </div>
              {bio && (
                <div>
                  <span className="text-xs text-dark-400 uppercase tracking-wider">Bio</span>
                  <p className="text-sm text-dark-300">{bio}</p>
                </div>
              )}
              <div>
                <span className="text-xs text-dark-400 uppercase tracking-wider">Genres</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selectedGenres.map(g => (
                    <span key={g} className="text-xs bg-primary-500/10 text-primary-400 border border-primary-500/20 px-2 py-0.5 rounded-full">{g}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-sm mt-4">{error}</p>}

        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)} className="btn-outline flex-1">
              Retour
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => { if (step === 1 && !artistName.trim()) { setError('Entrez votre nom d\'artiste.'); return; } setError(''); setStep(s => s + 1); }}
              className="btn-primary flex-1"
            >
              Suivant
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? 'Création...' : 'Créer mon profil'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
