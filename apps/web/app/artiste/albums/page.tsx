'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/auth/AuthContext';
import { api } from '../../lib/api';
import { ROUTES } from '../../lib/routes';
import type { Album, PaginatedResponse } from '../../lib/types';
import { Loader2, Plus, Trash2, Eye, Music, Search, ArrowUpDown, Edit3, X, Check, Disc3 } from 'lucide-react';

export default function ArtistAlbumsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'tracks'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', price: 0, isFree: true });
  const [savingEdit, setSavingEdit] = useState(false);
  const [managingId, setManagingId] = useState<string | null>(null);
  const [manageTracks, setManageTracks] = useState<{ id: string; title: string }[]>([]);
  const [allTracks, setAllTracks] = useState<{ id: string; title: string }[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState('');
  const [addingTrack, setAddingTrack] = useState(false);
  const [removingTrack, setRemovingTrack] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !user.artistProfile)) {
      router.push('/inscription');
    }
  }, [user, authLoading, router]);

  const fetchAlbums = async (p = page) => {
    try {
      const res = await api.get<PaginatedResponse<Album>>(`/albums/my-albums?page=${p}&limit=50`);
      setAlbums(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
    } catch {
      setAlbums([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.artistProfile) return;
    fetchAlbums();
  }, [user, page]);

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet album définitivement ?')) return;
    setDeleting(id);
    try {
      await api.delete(`/albums/${id}`);
      setAlbums(prev => prev.filter(a => a.id !== id));
    } catch {
      alert('Erreur lors de la suppression');
    } finally {
      setDeleting(null);
    }
  };

  const startEdit = (album: Album) => {
    setEditingId(album.id);
    setEditForm({ title: album.title, description: album.description || '', price: album.price ?? 0, isFree: album.isFree ?? true });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    setSavingEdit(true);
    try {
      const updated = await api.patch<Album>(`/albums/${id}`, {
        title: editForm.title,
        description: editForm.description || undefined,
        price: editForm.isFree ? 0 : editForm.price,
        isFree: editForm.isFree,
      });
      setAlbums(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));
      setEditingId(null);
    } catch {
      alert('Erreur lors de la modification');
    } finally {
      setSavingEdit(false);
    }
  };

  const openManage = async (album: Album) => {
    if (managingId === album.id) { setManagingId(null); return; }
    setManagingId(album.id);
    setManageTracks((album.albumTracks || []).map(at => ({ id: at.track.id, title: at.track.title })));
    try {
      const res = await api.get<{ data: { id: string; title: string }[] }>('/music/my-tracks?limit=200');
      const tracks = res.data || [];
      setAllTracks(tracks.filter((t: any) => !manageTracks.find(mt => mt.id === t.id)));
    } catch { setAllTracks([]); }
  };

  const handleAddTrack = async (albumId: string) => {
    if (!selectedTrackId) return;
    setAddingTrack(true);
    try {
      await api.post(`/albums/${albumId}/tracks`, { trackId: selectedTrackId });
      const track = allTracks.find(t => t.id === selectedTrackId);
      if (track) {
        setManageTracks(prev => [...prev, track]);
        setAllTracks(prev => prev.filter(t => t.id !== selectedTrackId));
      }
      setSelectedTrackId('');
    } catch {
      alert('Erreur lors de l\'ajout');
    } finally {
      setAddingTrack(false);
    }
  };

  const handleRemoveTrack = async (albumId: string, trackId: string) => {
    setRemovingTrack(trackId);
    try {
      await api.delete(`/albums/${albumId}/tracks/${trackId}`);
      const track = manageTracks.find(t => t.id === trackId);
      setManageTracks(prev => prev.filter(t => t.id !== trackId));
      if (track) setAllTracks(prev => [...prev, track]);
    } catch {
      alert('Erreur lors du retrait');
    } finally {
      setRemovingTrack(null);
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

  const filtered = albums
    .filter(a => a.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortBy === 'tracks') return ((a._count?.albumTracks || 0) - (b._count?.albumTracks || 0)) * dir;
      if (sortBy === 'title') return a.title.localeCompare(b.title) * dir;
      return (new Date(a.createdAt || a.releaseDate || '').getTime() - new Date(b.createdAt || b.releaseDate || '').getTime()) * dir;
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
            <h1 className="text-3xl font-bold text-white">Mes albums</h1>
            <p className="mt-2 text-dark-300">{albums.length} album{albums.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={ROUTES.ARTIST_ALBUM}
              className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-5 h-5" /> Album
            </Link>
            <Link
              href={ROUTES.ARTIST_DASHBOARD}
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
              placeholder="Rechercher un album..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-dark-400">Trier:</span>
            {(['date', 'tracks', 'title'] as const).map(f => (
              <button
                key={f}
                onClick={() => handleSort(f)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                  sortBy === f ? 'bg-primary-500/10 text-primary-400 font-medium' : 'bg-dark-800/50 text-dark-300 hover:bg-dark-600/50'
                }`}
              >
                {f === 'date' ? 'Date' : f === 'tracks' ? 'Morceaux' : 'Titre'}
                {sortBy === f && <ArrowUpDown className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-dark-800/50 rounded-xl p-12 text-center">
            <Disc3 className="w-12 h-12 text-dark-300 mx-auto mb-4" />
            <p className="text-dark-400 mb-4">{search ? 'Aucun album trouvé' : "Vous n'avez pas encore créé d'album"}</p>
            {!search && (
              <Link href={ROUTES.ARTIST_ALBUM} className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors">
                <Plus className="w-4 h-4" /> Créer votre premier album
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(album => (
              <div key={album.id} className="bg-dark-800/50 rounded-xl border border-dark-700/50 overflow-hidden">
                <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {album.coverUrl ? (
                        <img src={album.coverUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Disc3 className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link href={`/albums/${album.slug}`} className="font-semibold text-white hover:text-primary-600 transition-colors truncate block">
                        {album.title}
                      </Link>
                      <p className="text-xs text-dark-400">
                        {album._count?.albumTracks || 0} morceau{(album._count?.albumTracks || 0) !== 1 ? 'x' : ''}
                        {album._count ? ' · ' : ''}
                        {album._count?.albumPurchases || 0} vente{(album._count?.albumPurchases || 0) !== 1 ? 's' : ''}
                        {album.isFree ? ' · Gratuit' : album.price != null ? ` · ${album.price.toLocaleString('fr-FR')} FCFA` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openManage(album)} className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${managingId === album.id ? 'bg-primary-500/10 text-primary-400' : 'bg-dark-700/50 text-dark-300 hover:bg-dark-600/50'}`}>
                      Morceaux
                    </button>
                    <button onClick={() => startEdit(album)} className="p-2 text-dark-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Modifier">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <Link href={`/albums/${album.slug}`} className="p-2 text-dark-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Voir">
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(album.id)}
                      disabled={deleting === album.id}
                      className="p-2 text-dark-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      {deleting === album.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {editingId === album.id && (
                  <div className="border-t border-dark-700/50 p-4 bg-dark-25 space-y-3">
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-dark-300 mb-1">Titre</label>
                        <input type="text" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                          className="input-field" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-dark-300 mb-1">Prix (FCFA)</label>
                        <div className="flex items-center gap-2">
                          <input type="number" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: Number(e.target.value) }))}
                            disabled={editForm.isFree}
                            className="input-field disabled:opacity-50" />
                          <label className="flex items-center gap-1.5 text-sm text-dark-300 whitespace-nowrap">
                            <input type="checkbox" checked={editForm.isFree} onChange={e => setEditForm(f => ({ ...f, isFree: e.target.checked }))}
                              className="rounded border-dark-300 text-primary-600 focus:ring-primary-500" />
                            Gratuit
                          </label>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-dark-300 mb-1">Description</label>
                      <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={2}
                        className="input-field resize-none" />
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => saveEdit(album.id)} disabled={savingEdit} className="flex items-center gap-1.5 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors">
                        {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Enregistrer
                      </button>
                      <button onClick={cancelEdit} className="flex items-center gap-1.5 bg-dark-700/50 text-dark-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-dark-600/50 transition-colors">
                        <X className="w-4 h-4" /> Annuler
                      </button>
                    </div>
                  </div>
                )}

                {managingId === album.id && (
                  <div className="border-t border-dark-700/50 p-4 bg-dark-25">
                    <div className="flex items-center gap-2 mb-3">
                      <select value={selectedTrackId} onChange={e => setSelectedTrackId(e.target.value)}
                        className="input-field flex-1">
                        <option value="">Ajouter un morceau...</option>
                        {allTracks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                      </select>
                      <button onClick={() => handleAddTrack(album.id)} disabled={!selectedTrackId || addingTrack}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors">
                        {addingTrack ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ajouter'}
                      </button>
                    </div>
                    {manageTracks.length === 0 ? (
                      <p className="text-sm text-dark-400 text-center py-3">Aucun morceau dans cet album</p>
                    ) : (
                      <div className="space-y-1">
                        {manageTracks.map(t => (
                          <div key={t.id} className="flex items-center justify-between bg-dark-800/50 rounded-lg px-3 py-2">
                            <span className="text-sm text-white">{t.title}</span>
                            <button onClick={() => handleRemoveTrack(album.id, t.id)} disabled={removingTrack === t.id}
                              className="text-dark-400 hover:text-red-600 transition-colors">
                              {removingTrack === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
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
