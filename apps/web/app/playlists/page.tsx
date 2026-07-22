'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, type Playlist, type PaginatedResponse } from '../lib/api';
import { useAuth } from '../components/auth/AuthContext';

export default function PlaylistsPage() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const res = await api.get<PaginatedResponse<Playlist>>('/playlists/public');
        setPlaylists(res.data || []);
      } catch {
        setPlaylists([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaylists();
  }, []);

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Playlists</h1>
            <p className="mt-2 text-dark-300">Playlists publiques de la communauté</p>
          </div>
          {user && (
            <Link href="/playlists/creer" className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors">
              + Nouvelle playlist
            </Link>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-dark-700/50 rounded-xl mb-4" />
                <div className="h-5 bg-dark-700/50 rounded w-2/3 mb-2" />
                <div className="h-4 bg-dark-700/50 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : playlists.length === 0 ? (
          <div className="text-center py-12 bg-dark-800/50 rounded-xl">
            <svg className="w-16 h-16 text-dark-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
            </svg>
            <p className="text-dark-500">Aucune playlist publique</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {playlists.map((playlist) => (
              <Link key={playlist.id} href={`/playlists/${playlist.id}`} className="bg-dark-800/50 rounded-xl overflow-hidden hover:shadow-md transition-shadow group cursor-pointer">
                <div className="aspect-square bg-gradient-to-br from-dark-700 to-dark-900 flex items-center justify-center p-6">
                  <div className="grid grid-cols-2 gap-1 w-full h-full">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="bg-dark-600 rounded" />
                    ))}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-white group-hover:text-primary-600 transition-colors truncate">{playlist.title}</h3>
                  <p className="text-sm text-dark-500">par {playlist.user.pseudo}</p>
                  <p className="text-xs text-dark-400 mt-2">{playlist.trackCount} morceaux</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
