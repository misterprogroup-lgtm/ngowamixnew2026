'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, type Track } from '../../lib/api';

export default function PublishAlbumPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [price, setPrice] = useState(0);
  const [isFree, setIsFree] = useState(true);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [myTracks, setMyTracks] = useState<Track[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTracks, setLoadingTracks] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchMyTracks = async () => {
      try {
        const res = await api.get<{ data: Track[] }>('/tracks/my-tracks');
        const tracks = res.data ?? res ?? [];
        setMyTracks(Array.isArray(tracks) ? tracks : []);
      } catch {
        setMyTracks([]);
      } finally {
        setLoadingTracks(false);
      }
    };
    fetchMyTracks();
  }, []);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const url = URL.createObjectURL(file);
      setCoverPreview(url);
    }
  };

  const toggleTrack = (trackId: string) => {
    setSelectedTracks((prev) =>
      prev.includes(trackId) ? prev.filter((id) => id !== trackId) : [...prev, trackId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError('Le titre est requis');
    if (!isFree && price <= 0) return setError('Le prix doit être supérieur à 0');

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      if (description) formData.append('description', description);
      if (releaseDate) formData.append('releaseDate', releaseDate);
      formData.append('price', String(isFree ? 0 : price));
      formData.append('isFree', String(isFree));
      if (coverFile) formData.append('cover', coverFile);

      const album = await api.postFormData<{ id: string; slug: string }>('/albums', formData);

      // Add selected tracks to the album
      for (const trackId of selectedTracks) {
        await api.post(`/albums/${album.id}/tracks`, { trackId });
      }

      setSuccess(true);
      setTimeout(() => router.push('/artiste/dashboard'), 1500);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="bg-dark-800/50 rounded-xl p-8 text-center max-w-md mx-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Album publié !</h2>
          <p className="text-dark-400">Redirection vers votre tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="mb-6">
          <Link href="/artiste/dashboard" className="text-primary-600 hover:text-primary-700 text-sm">
            &larr; Retour au dashboard
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-white mb-8">Publier un album</h1>

        <form onSubmit={handleSubmit} className="bg-dark-800/50 rounded-xl p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          {/* Cover */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">Pochette de l&apos;album</label>
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 rounded-xl bg-dark-700/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                {coverPreview ? (
                  <img src={coverPreview} alt="Pochette" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-10 h-10 text-dark-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                  </svg>
                )}
              </div>
              <label className="cursor-pointer">
                <span className="bg-dark-700/50 hover:bg-dark-600/50 text-dark-200 px-4 py-2 rounded-lg text-sm transition-colors">
                  Choisir une image
                </span>
                <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
              </label>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1">Titre *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="Nom de l'album"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="input-field"
              placeholder="Décrivez votre album..."
            />
          </div>

          {/* Release Date */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1">Date de sortie</label>
            <input
              type="date"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              className="input-field"
            />
          </div>

          {/* Pricing */}
          <div className="border border-dark-700/50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-dark-200 mb-3">Monétisation</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={isFree}
                  onChange={() => { setIsFree(true); setPrice(0); }}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="text-sm text-dark-200">Gratuit</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={!isFree}
                  onChange={() => setIsFree(false)}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="text-sm text-dark-200">Payant</span>
              </label>
              {!isFree && (
                <div className="ml-7">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      min={100}
                      step={50}
                      className="input-field"
                    />
                    <span className="text-sm text-dark-400">FCFA</span>
                  </div>
                  <p className="text-xs text-dark-400 mt-1">Prix minimum : 100 FCFA</p>
                </div>
              )}
            </div>
          </div>

          {/* Track Selection */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Morceaux de l&apos;album {selectedTracks.length > 0 && `(${selectedTracks.length} sélectionné${selectedTracks.length > 1 ? 's' : ''})`}
            </label>
            {loadingTracks ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse h-12 bg-dark-700/50 rounded-lg" />
                ))}
              </div>
            ) : myTracks.length === 0 ? (
              <div className="bg-dark-700/50 rounded-lg p-4 text-center">
                <p className="text-sm text-dark-400">Vous n&apos;avez pas encore de morceaux.</p>
                <Link href="/artiste/publier" className="text-sm text-primary-600 hover:text-primary-700 mt-1 inline-block">
                  Publier un morceau d&apos;abord &rarr;
                </Link>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {myTracks.map((track) => (
                  <label
                    key={track.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedTracks.includes(track.id) ? 'bg-primary-500/10 border border-primary-500/20' : 'bg-dark-700/50 hover:bg-dark-600/50 border border-transparent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTracks.includes(track.id)}
                      onChange={() => toggleTrack(track.id)}
                      className="w-4 h-4 text-primary-600 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{track.title}</p>
                      <p className="text-xs text-dark-400">{track.genre || 'Sans genre'}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Link href="/artiste/dashboard" className="px-5 py-2.5 text-dark-300 hover:text-dark-800 text-sm">
              Annuler
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Publication...' : 'Publier l\'album'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
