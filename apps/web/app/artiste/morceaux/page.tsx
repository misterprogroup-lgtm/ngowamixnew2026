'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/auth/AuthContext';
import { api, type Track, type PaginatedResponse } from '../../lib/api';
import { Loader2, Plus, Trash2, Eye, EyeOff, Music, Search, ArrowUpDown } from 'lucide-react';

export default function ArtistTracksPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'plays' | 'title'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!authLoading && (!user || !user.artistProfile)) {
      router.push('/inscription');
    }
  }, [user, authLoading, router]);

  const fetchTracks = async (p = page) => {
    try {
      const res = await api.get<PaginatedResponse<Track>>(`/music/my-tracks?page=${p}&limit=50`);
      setTracks(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
    } catch {
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.artistProfile) return;
    fetchTracks();
  }, [user, page]);

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce morceau définitivement ?')) return;
    setDeleting(id);
    try {
      await api.delete(`/music/tracks/${id}`);
      setTracks(prev => prev.filter(t => t.id !== id));
    } catch {
      alert('Erreur lors de la suppression');
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleVisibility = async (id: string, current: string) => {
    setToggling(id);
    const newVisibility = current === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';
    try {
      await api.patch(`/music/tracks/${id}`, { visibility: newVisibility });
      setTracks(prev => prev.map(t => t.id === id ? { ...t, visibility: newVisibility } : t));
    } catch {
      alert('Erreur lors du changement de visibilité');
    } finally {
      setToggling(null);
    }
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  const filtered = tracks
    .filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortBy === 'plays') return (a.playCount - b.playCount) * dir;
      if (sortBy === 'title') return a.title.localeCompare(b.title) * dir;
      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
    });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-dark-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-8 bg-dark-700/50 rounded w-1/3 mb-8 animate-pulse" />
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-dark-800/50 rounded-lg mb-2 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!user?.artistProfile) return null;

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Mes morceaux</h1>
            <p className="mt-2 text-dark-300">{tracks.length} morceau{tracks.length !== 1 ? 'x' : ''} publié{tracks.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/artiste/publier"
              className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-5 h-5" /> Publier
            </Link>
            <Link
              href="/artiste/dashboard"
              className="bg-dark-700/50 text-dark-200 px-4 py-3 rounded-lg font-medium hover:bg-dark-600/50 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="text"
              placeholder="Rechercher un morceau..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-dark-400">Trier:</span>
            {(['date', 'plays', 'title'] as const).map(f => (
              <button
                key={f}
                onClick={() => handleSort(f)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                  sortBy === f ? 'bg-primary-500/10 text-primary-400 font-medium' : 'bg-dark-800/50 text-dark-300 hover:bg-dark-600/50'
                }`}
              >
                {f === 'date' ? 'Date' : f === 'plays' ? 'Écoutes' : 'Titre'}
                {sortBy === f && <ArrowUpDown className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="card text-center py-12">
            <Music className="w-12 h-12 text-dark-300 mx-auto mb-4" />
            <p className="text-dark-500 mb-4">{search ? 'Aucun morceau trouvé' : "Vous n'avez pas encore publié de morceau"}</p>
            {!search && (
              <Link href="/artiste/publier" className="btn-primary inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> Publier votre premier morceau
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-dark-800/50 rounded-xl border border-dark-700/50 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700/50 bg-dark-700/30">
                  <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">Titre</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-400">Écoutes</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-400">Téléch.</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-400">Visibilité</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-dark-400">Publié le</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-dark-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(track => (
                  <tr key={track.id} className="border-b border-dark-700/50 hover:bg-dark-700/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {track.coverUrl ? (
                            <img src={track.coverUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Music className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/morceaux/${track.slug}`} className="font-medium text-white hover:text-primary-600 transition-colors truncate block">
                            {track.title}
                          </Link>
                          <span className="text-xs text-dark-400">{track.genre || 'Non classé'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-dark-300">{track.playCount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center text-sm text-dark-300">{track.downloadCount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleVisibility(track.id, track.visibility)}
                        disabled={toggling === track.id}
                        className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                          track.visibility === 'PUBLIC'
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-dark-700/50 text-dark-300 hover:bg-dark-600/50'
                        }`}
                      >
                        {toggling === track.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : track.visibility === 'PUBLIC' ? (
                          <Eye className="w-3 h-3" />
                        ) : (
                          <EyeOff className="w-3 h-3" />
                        )}
                        {track.visibility === 'PUBLIC' ? 'Public' : 'Privé'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-dark-400">
                      {new Date(track.publishedAt || track.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/morceaux/${track.slug}`}
                          className="p-2 text-dark-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Voir"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(track.id)}
                          disabled={deleting === track.id}
                          className="p-2 text-dark-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          {deleting === track.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                  p === page ? 'bg-primary-600 text-white' : 'bg-dark-800/50 text-dark-300 hover:bg-dark-600/50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
