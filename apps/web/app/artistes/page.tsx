'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, type ArtistProfile } from '../lib/api';

export default function ArtistsPage() {
  const [artists, setArtists] = useState<ArtistProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const res = await api.get<{ data: ArtistProfile[] }>('/artists');
        setArtists(res.data || []);
      } catch {
        setArtists([]);
      } finally {
        setLoading(false);
      }
    };
    fetchArtists();
  }, []);

  return (
    <div className="min-h-screen bg-dark-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Artistes</h1>
          <p className="mt-2 text-dark-300">Découvrez les artistes de la plateforme</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="w-full aspect-square bg-dark-700/50 rounded-lg mb-4" />
                <div className="h-5 bg-dark-700/50 rounded w-2/3 mb-2" />
                <div className="h-4 bg-dark-700/50 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : artists.length === 0 ? (
          <div className="text-center py-12 bg-dark-800/50 rounded-xl">
            <svg className="w-16 h-16 text-dark-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
            <p className="text-dark-500">Aucun artiste inscrit pour le moment</p>
            <Link href="/inscription" className="mt-4 inline-block bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors">
              Devenir artiste
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {artists.map((artist) => (
              <Link
                key={artist.id}
                href={`/artistes/${artist.slug}`}
                className="card hover:shadow-md transition-shadow group"
              >
                <div className="w-full aspect-square bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                  {artist.user?.avatarUrl ? (
                    <img src={artist.user.avatarUrl} alt={artist.artistName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl text-white font-bold">
                      {artist.artistName.charAt(0)}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-white group-hover:text-primary-600 transition-colors">
                  {artist.artistName}
                </h3>
                {artist.bio && (
                  <p className="text-sm text-dark-500 mt-1 line-clamp-2">{artist.bio}</p>
                )}
                <div className="flex flex-wrap gap-1 mt-3">
                  {artist.genres.map((genre) => (
                    <span
                      key={genre}
                      className="text-xs bg-dark-700/50 text-dark-300 px-2 py-1 rounded-full"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-dark-400 mt-3">
                  {artist.followerCount.toLocaleString()} abonnés
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
