'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../components/auth/AuthContext';
import { api } from '../../lib/api';
import { ArrowLeft, Music, Globe, Lock } from 'lucide-react';

export default function CreatePlaylistPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError('');
    try {
      const playlist = await api.post<{ id: string }>('/playlists', { title: title.trim(), description: description.trim() || undefined, isPublic });
      router.push(`/playlists/${playlist.id}`);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Connectez-vous</h2>
          <p className="text-dark-500 mb-4">Vous devez être connecté pour créer une playlist.</p>
          <Link href="/connexion" className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">Se connecter</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-lg mx-auto px-4">
        <Link href="/playlists" className="inline-flex items-center gap-1.5 text-dark-500 hover:text-dark-700 text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour aux playlists
        </Link>

        <div className="bg-dark-800/50 rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Music className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Nouvelle playlist</h1>
            <p className="text-dark-500 text-sm mt-1">Créez une playlist et ajoutez-y vos morceaux favoris.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">Titre *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} required maxLength={100}
                placeholder="Ma playlist afrobeat"
                className="input-field" />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1.5">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} maxLength={500}
                placeholder="Les meilleurs morceaux pour..."
                className="input-field" />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">Visibilité</label>
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsPublic(true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-colors ${isPublic ? 'bg-primary-500/10 border-primary-500 text-primary-400' : 'bg-dark-700/50 border-dark-600/50 text-dark-400 hover:border-dark-500'}`}>
                  <Globe className="w-4 h-4" /> Publique
                </button>
                <button type="button" onClick={() => setIsPublic(false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-colors ${!isPublic ? 'bg-primary-500/10 border-primary-500 text-primary-400' : 'bg-dark-700/50 border-dark-600/50 text-dark-400 hover:border-dark-500'}`}>
                  <Lock className="w-4 h-4" /> Privée
                </button>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button type="submit" disabled={loading || !title.trim()}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50">
              {loading ? 'Création...' : 'Créer la playlist'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
