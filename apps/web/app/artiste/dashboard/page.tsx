'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/auth/AuthContext';
import { api, type Track, type PaginatedResponse } from '../../lib/api';
import { Radio, Ticket, Wallet } from 'lucide-react';

interface AlbumStats {
  totalAlbums: number;
  totalPurchases: number;
  totalRevenue: number;
}

export default function ArtistDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [stats, setStats] = useState({ totalPlays: 0, totalDownloads: 0, trackCount: 0 });
  const [albumStats, setAlbumStats] = useState<AlbumStats>({ totalAlbums: 0, totalPurchases: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !user.artistProfile)) {
      router.push('/inscription');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user?.artistProfile) return;
    const fetchData = async () => {
      try {
        const res = await api.get<PaginatedResponse<Track>>('/music/my-tracks');
        const trackList = res.data || [];
        setTracks(trackList);
        setStats({
          totalPlays: trackList.reduce((sum: number, t: Track) => sum + t.playCount, 0),
          totalDownloads: trackList.reduce((sum: number, t: Track) => sum + t.downloadCount, 0),
          trackCount: trackList.length,
        });

        try {
          const aStats = await api.get<AlbumStats>('/albums/album-stats');
          setAlbumStats(aStats);
        } catch {
          // ignore
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-dark-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-8 bg-dark-700/50 rounded w-1/3 mb-8 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card animate-pulse h-24" />
            ))}
          </div>
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
            <h1 className="text-3xl font-bold text-white">Dashboard Artiste</h1>
            <p className="mt-2 text-dark-300">Bienvenue, {user.artistProfile.artistName}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/artiste/stats" className="bg-dark-700/50 text-dark-200 px-4 py-3 rounded-lg font-medium hover:bg-dark-600/50 transition-colors">
              Mes stats
            </Link>
            <Link href="/artiste/publier" className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors">
              + Morceau
            </Link>
            <Link href="/artiste/publier-album" className="bg-dark-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-dark-800 transition-colors">
              + Album
            </Link>
            <Link href="/artiste/concerts" className="flex items-center gap-1.5 bg-dark-700/50 text-dark-200 px-4 py-3 rounded-lg font-medium hover:bg-dark-600/50 transition-colors">
              <Ticket className="w-4 h-4" /> Concerts
            </Link>
            <Link href="/artiste/lives" className="flex items-center gap-1.5 bg-red-50 text-red-600 px-4 py-3 rounded-lg font-medium hover:bg-red-100 transition-colors">
              <Radio className="w-4 h-4" /> Lives
            </Link>
            <Link href="/artiste/gains" className="flex items-center gap-1.5 bg-green-50 text-green-600 px-4 py-3 rounded-lg font-medium hover:bg-green-100 transition-colors">
              <Wallet className="w-4 h-4" /> Gains
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.trackCount}</p>
                <p className="text-sm text-dark-400">Morceaux</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{albumStats.totalAlbums}</p>
                <p className="text-sm text-dark-400">Albums</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalPlays.toLocaleString()}</p>
                <p className="text-sm text-dark-400">Écoutes</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{albumStats.totalRevenue.toLocaleString('fr-FR')} <span className="text-sm font-normal">FCFA</span></p>
                <p className="text-sm text-dark-400">Revenus albums ({albumStats.totalPurchases} ventes)</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Mes morceaux</h2>
            <Link href="/artiste/morceaux" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              Voir tout
            </Link>
          </div>

          {tracks.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-dark-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
              <p className="text-dark-400 mb-4">Vous n'avez pas encore publié de morceau</p>
              <Link href="/artiste/publier" className="btn-primary">
                Publier votre premier morceau
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {tracks.slice(0, 5).map((track) => (
                <div key={track.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-dark-700/50 transition-colors">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded flex items-center justify-center flex-shrink-0">
                    {track.coverUrl ? (
                      <img src={track.coverUrl} alt="" className="w-full h-full object-cover rounded" />
                    ) : (
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{track.title}</p>
                    <p className="text-xs text-dark-400">
                      {track.playCount.toLocaleString()} écoutes • {track.downloadCount.toLocaleString()} téléchargements
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${track.visibility === 'PUBLIC' ? 'bg-green-100 text-green-700' : 'bg-dark-700/50 text-dark-300'}`}>
                    {track.visibility === 'PUBLIC' ? 'Public' : track.visibility === 'PRIVATE' ? 'Privé' : 'Non listé'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
