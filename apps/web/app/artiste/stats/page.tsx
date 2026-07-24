'use client';

import { useState, useEffect } from 'react';
import { usePlayer } from '../../components/player/PlayerContext';
import { api } from '../../lib/api';

interface ArtistStats {
  totalTracks: number;
  totalAlbums: number;
  totalPlays: number;
  totalLikes: number;
  totalFollowers: number;
  topTracks: { id: string; title: string; playCount: number; likeCount: number; genre: string | null }[];
  recentListeners: { userId: string; user: { pseudo: string; avatarUrl: string | null; country: string | null; city: string | null } }[];
}

export default function ArtistStatsPage() {
  const { play } = usePlayer();
  const [stats, setStats] = useState<ArtistStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.get<ArtistStats>('/artists/me/stats');
        setStats(data);
      } catch {
        setStats(null);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 py-8">
        <div className="max-w-5xl mx-auto px-4 animate-pulse space-y-6">
          <div className="h-8 bg-dark-700/50 rounded w-1/3" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-dark-700/50 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <p className="text-dark-400">Impossible de charger les statistiques.</p>
      </div>
    );
  }

  const statCards = [
    { label: 'Écoutes totales', value: stats.totalPlays.toLocaleString(), icon: '🎵' },
    { label: 'Morceaux', value: stats.totalTracks, icon: '🎶' },
    { label: 'Albums', value: stats.totalAlbums, icon: '💿' },
    { label: 'Likes', value: stats.totalLikes.toLocaleString(), icon: '❤️' },
    { label: 'Abonnés', value: stats.totalFollowers.toLocaleString(), icon: '👥' },
  ];

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-white mb-6">Mes statistiques</h1>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {statCards.map(card => (
            <div key={card.label} className="bg-dark-800/50 rounded-xl p-5 text-center">
              <span className="text-2xl">{card.icon}</span>
              <p className="text-2xl font-bold text-white mt-2">{card.value}</p>
              <p className="text-sm text-dark-400 mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Top Tracks */}
          <div className="bg-dark-800/50 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Top morceaux</h2>
            {stats.topTracks.length === 0 ? (
              <p className="text-dark-400 text-sm">Aucun morceau encore.</p>
            ) : (
              <div className="space-y-3">
                {stats.topTracks.map((track, i) => (
                  <div
                    key={track.id}
                    className="flex items-center gap-3 p-3 bg-dark-700/50 rounded-lg cursor-pointer hover:bg-dark-600/50 transition-colors"
                    onClick={() => play({
                      id: track.id, title: track.title, audioUrl: api.streamUrl(track.id),
                      artist: { artistName: 'Vous', slug: '' }
                    })}
                  >
                    <span className="text-lg font-bold text-primary-500 w-6">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{track.title}</p>
                      <p className="text-xs text-dark-400">{track.playCount.toLocaleString()} écoutes · {track.likeCount} likes</p>
                    </div>
                    {track.genre && <span className="text-xs bg-dark-700/50 text-dark-300 px-2 py-0.5 rounded-full">{track.genre}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Listeners */}
          <div className="bg-dark-800/50 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Auditeurs récents</h2>
            {stats.recentListeners.length === 0 ? (
              <p className="text-dark-400 text-sm">Aucun auditeur récent.</p>
            ) : (
              <div className="space-y-3">
                {stats.recentListeners.map(listener => (
                  <div key={listener.userId} className="flex items-center gap-3 p-3 bg-dark-700/50 rounded-lg">
                    <div className="w-9 h-9 bg-dark-700/50 rounded-full flex items-center justify-center overflow-hidden">
                      {listener.user.avatarUrl ? (
                        <img src={listener.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm text-dark-400 font-medium">{listener.user.pseudo.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{listener.user.pseudo}</p>
                      <p className="text-xs text-dark-400">{[listener.user.city, listener.user.country].filter(Boolean).join(', ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
