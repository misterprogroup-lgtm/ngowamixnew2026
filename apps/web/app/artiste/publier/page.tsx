'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../components/auth/AuthContext';
import { api } from '../../lib/api';

const GENRES = ['Afrobeat', 'Pop', 'R&B', 'World', 'Blues', 'Dancehall', 'Hip-Hop', 'Zouk', 'Makossa', 'Reggae', 'Jazz', 'Soul', 'Folk', 'Electronic'];

export default function PublishTrackPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState('PUBLIC');
  const [isExplicit, setIsExplicit] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !user.artistProfile)) {
      router.push('/inscription');
    }
  }, [user, authLoading, router]);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setCoverPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!audioFile) {
      setError('Veuillez sélectionner un fichier audio');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('audioFile', audioFile);
      formData.append('title', title);
      if (description) formData.append('description', description);
      if (genre) formData.append('genre', genre);
      if (tags) formData.append('tags', JSON.stringify(tags.split(',').map(t => t.trim()).filter(Boolean)));
      formData.append('visibility', visibility);
      formData.append('isExplicit', String(isExplicit));

      if (coverFile) {
        const coverRes = await api.upload<{ url: string }>('/upload/image', coverFile, 'file');
        if (coverRes.url) formData.append('coverUrl', coverRes.url);
      }

      const token = api.getAccessToken();
      const res = await fetch('/api/music/tracks', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur lors de la publication');

      setSuccess(true);
      setTimeout(() => router.push('/artiste/dashboard'), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-dark-900 py-8">
        <div className="max-w-2xl mx-auto px-4 animate-pulse">
          <div className="h-8 bg-dark-700/50 rounded w-1/3 mb-8" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-dark-700/50 rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!user?.artistProfile) return null;

  if (success) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Morceau publié !</h2>
          <p className="text-dark-300">Votre morceau est maintenant en ligne.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <Link href="/artiste/dashboard" className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block">
            &larr; Retour au dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white">Publier un morceau</h1>
          <p className="mt-2 text-dark-300">Partagez votre musique avec le monde</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">{error}</div>
          )}

          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Fichier audio *</h2>
            <div className="border-2 border-dashed border-dark-600 rounded-xl p-8 text-center hover:border-primary-400 transition-colors">
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                className="hidden"
                id="audio-upload"
              />
              <label htmlFor="audio-upload" className="cursor-pointer">
                {audioFile ? (
                  <div>
                    <svg className="w-12 h-12 text-green-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="font-medium text-white">{audioFile.name}</p>
                    <p className="text-sm text-dark-400 mt-1">{(audioFile.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                ) : (
                  <div>
                    <svg className="w-12 h-12 text-dark-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="font-medium text-white">Cliquez pour sélectionner un fichier audio</p>
                    <p className="text-sm text-dark-400 mt-1">MP3, WAV, OGG, FLAC (max 50 MB)</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Informations</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">Titre *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field"
                  placeholder="Nom du morceau"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="Décrivez votre morceau..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-2">Genre</label>
                  <select value={genre} onChange={(e) => setGenre(e.target.value)} className="input-field">
                    <option value="">Sélectionner</option>
                    {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-2">Visibilité</label>
                  <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className="input-field">
                    <option value="PUBLIC">Public</option>
                    <option value="UNLISTED">Non listé</option>
                    <option value="PRIVATE">Privé</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">Tags (séparés par des virgules)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="input-field"
                  placeholder="afrobeat, abidjan, coupé-décalé"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="explicit"
                  checked={isExplicit}
                  onChange={(e) => setIsExplicit(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <label htmlFor="explicit" className="text-sm text-dark-200">Contenu explicite</label>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Pochette</h2>
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 bg-dark-100 rounded-lg overflow-hidden flex-shrink-0">
                {coverPreview ? (
                  <img src={coverPreview} alt="Pochette" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-dark-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  className="hidden"
                  id="cover-upload"
                />
                <label htmlFor="cover-upload" className="btn-outline cursor-pointer inline-block text-sm">
                  Choisir une image
                </label>
                <p className="text-xs text-dark-400 mt-2">JPG, PNG ou WebP (max 5 MB)</p>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading || !audioFile || !title} className="btn-primary w-full text-lg py-4">
            {loading ? 'Publication en cours...' : 'Publier le morceau'}
          </button>
        </form>
      </div>
    </div>
  );
}
