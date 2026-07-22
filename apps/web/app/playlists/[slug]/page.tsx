'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, type Playlist, type Track } from '../../lib/api';
import { usePlayer } from '../../components/player/PlayerContext';
import { useAuth } from '../../components/auth/AuthContext';
import { toPlayerTrack } from '../../lib/player-utils';
import { Music, Play, Clock, User, Plus, Trash2, ArrowLeft, Globe, Lock, Loader2 } from 'lucide-react';

export default function PlaylistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user } = useAuth();
  const { play, addToQueue } = usePlayer();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingTrack, setAddingTrack] = useState(false);
  const [trackIdToAdd, setTrackIdToAdd] = useState('');
  const [searchTracks, setSearchTracks] = useState<Track[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchPlaylist = async () => {
    try {
      const data = await api.get<Playlist>(`/playlists/${slug}`);
      setPlaylist(data);
    } catch {
      setPlaylist(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylist();
  }, [slug]);

  const handlePlayAll = () => {
    if (!playlist?.playlistTracks?.length) return;
    const allTracks = playlist.playlistTracks
      .sort((a, b) => a.position - b.position)
      .map(pt => toPlayerTrack(pt.track));
    play(allTracks[0], allTracks);
  };

  const handlePlayTrack = (track: Track, index: number) => {
    const pt = toPlayerTrack(track);
    if (playlist?.playlistTracks) {
      const allTracks = playlist.playlistTracks
        .sort((a, b) => a.position - b.position)
        .map(pt => toPlayerTrack(pt.track));
      play(pt, allTracks);
    } else {
      play(pt);
    }
  };

  const handleRemoveTrack = async (trackId: string) => {
    if (!confirm('Retirer ce morceau de la playlist ?')) return;
    try {
      await api.delete(`/playlists/${slug}/tracks/${trackId}`);
      setPlaylist(prev => prev ? {
        ...prev,
        playlistTracks: prev.playlistTracks?.filter(pt => pt.track.id !== trackId),
      } : prev);
    } catch {
      alert('Erreur lors du retrait');
    }
  };

  const handleSearchTrack = async (query: string) => {
    setTrackIdToAdd(query);
    if (query.length < 2) {
      setSearchTracks([]);
      return;
    }
    setSearching(true);
    try {
      const res = await api.get<{ data: Track[] }>(`/music/tracks/search?query=${encodeURIComponent(query)}`);
      setSearchTracks(res.data || []);
    } catch {
      setSearchTracks([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAddTrack = async (trackId: string) => {
    setAddingTrack(true);
    try {
      await api.post(`/playlists/${slug}/tracks`, { trackId });
      setTrackIdToAdd('');
      setSearchTracks([]);
      await fetchPlaylist();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'ajout');
    } finally {
      setAddingTrack(false);
    }
  };

  const isOwner = user && playlist?.user?.pseudo === user.pseudo;

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="h-8 bg-dark-700/50 rounded w-1/3 mb-4 animate-pulse" />
          <div className="h-4 bg-dark-700/50 rounded w-1/4 mb-8 animate-pulse" />
          {[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-dark-800/50 rounded-lg mb-2 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Music className="w-16 h-16 text-dark-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Playlist introuvable</h2>
          <p className="text-dark-400 mb-4">Cette playlist n'existe pas ou a été supprimée.</p>
          <Link href="/playlists" className="text-primary-600 hover:text-primary-700 font-medium">Voir les playlists</Link>
        </div>
      </div>
    );
  }

  const tracks = (playlist.playlistTracks || [])
    .sort((a, b) => a.position - b.position);

  const totalDuration = tracks.reduce((acc, pt) => acc + (pt.track.audioDuration || 0), 0);

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/playlists" className="inline-flex items-center gap-1.5 text-dark-400 hover:text-dark-700 text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour aux playlists
        </Link>

        <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-8 mb-8 text-white">
          <div className="flex items-start gap-6">
            <div className="w-32 h-32 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Music className="w-12 h-12 text-white/60" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {playlist.isPublic ? (
                  <span className="inline-flex items-center gap-1 text-xs bg-white/20 px-2.5 py-0.5 rounded-full"><Globe className="w-3 h-3" /> Publique</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs bg-white/20 px-2.5 py-0.5 rounded-full"><Lock className="w-3 h-3" /> Privée</span>
                )}
              </div>
              <h1 className="text-3xl font-bold mb-1">{playlist.title}</h1>
              {playlist.description && <p className="text-white/70 mb-3">{playlist.description}</p>}
              <div className="flex items-center gap-4 text-sm text-white/60">
                <span className="flex items-center gap-1"><User className="w-4 h-4" /> {playlist.user?.pseudo || 'Utilisateur'}</span>
                <span>{tracks.length} morceau{tracks.length !== 1 ? 'x' : ''}</span>
                {totalDuration > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" /> {Math.floor(totalDuration / 60)} min
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={handlePlayAll}
                  disabled={tracks.length === 0}
                  className="flex items-center gap-2 btn-primary rounded-xl font-semibold hover:bg-white/90 transition-colors disabled:opacity-50"
                >
                  <Play className="w-5 h-5" /> Tout écouter
                </button>
              </div>
            </div>
          </div>
        </div>

        {isOwner && (
          <div className="bg-dark-800/50 rounded-xl border border-dark-700/50 p-4 mb-6">
            <h3 className="text-sm font-semibold text-dark-700 mb-3">Ajouter un morceau</h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher un morceau par titre..."
                value={trackIdToAdd}
                onChange={e => handleSearchTrack(e.target.value)}
                className="w-full input-field text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-dark-400" />}
              {searchTracks.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-dark-800/50 border border-dark-700/50 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {searchTracks.map(track => (
                    <button
                      key={track.id}
                      onClick={() => handleAddTrack(track.id)}
                      disabled={addingTrack}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-dark-700/50 text-left transition-colors disabled:opacity-50"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {track.coverUrl ? <img src={track.coverUrl} alt="" className="w-full h-full object-cover" /> : <Music className="w-4 h-4 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{track.title}</p>
                        <p className="text-xs text-dark-400">{track.artist?.artistName}</p>
                      </div>
                      <Plus className="w-4 h-4 text-primary-600 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tracks.length === 0 ? (
          <div className="text-center py-12 bg-dark-800/50 rounded-xl">
            <Music className="w-12 h-12 text-dark-300 mx-auto mb-4" />
            <p className="text-dark-400">Cette playlist est vide</p>
          </div>
        ) : (
          <div className="bg-dark-800/50 rounded-xl border border-dark-700/50 overflow-hidden">
            <div className="divide-y divide-dark-700/50">
              {tracks.map((pt, index) => (
                <div key={pt.track.id} className="flex items-center gap-3 p-3 hover:bg-dark-700/50 transition-colors group">
                  <span className="text-sm text-dark-400 w-6 text-center flex-shrink-0">{index + 1}</span>
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {pt.track.coverUrl ? (
                      <img src={pt.track.coverUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Music className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => handlePlayTrack(pt.track, index)}
                      className="font-medium text-white hover:text-primary-600 transition-colors truncate block text-left w-full"
                    >
                      {pt.track.title}
                    </button>
                    <p className="text-xs text-dark-400">
                      <Link href={`/artistes/${pt.track.artist.slug}`} className="hover:text-primary-600 transition-colors">
                        {pt.track.artist.artistName}
                      </Link>
                    </p>
                  </div>
                  <span className="text-xs text-dark-400">
                    {pt.track.audioDuration ? `${Math.floor(pt.track.audioDuration / 60)}:${String(pt.track.audioDuration % 60).padStart(2, '0')}` : '--:--'}
                  </span>
                  <button
                    onClick={() => addToQueue(toPlayerTrack(pt.track))}
                    className="p-1.5 text-dark-300 hover:text-primary-600 opacity-0 group-hover:opacity-100 transition-all"
                    title="Ajouter à la file"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  {isOwner && (
                    <button
                      onClick={() => handleRemoveTrack(pt.track.id)}
                      className="p-1.5 text-dark-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      title="Retirer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
