'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, type Album, type PaginatedResponse } from '../lib/api';

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const res = await api.get<PaginatedResponse<Album>>('/albums');
        setAlbums(res.data || []);
      } catch {
        setAlbums([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAlbums();
  }, []);

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Albums</h1>
          <p className="mt-2 text-dark-300">Découvrez les albums de la plateforme</p>
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
        ) : albums.length === 0 ? (
          <div className="text-center py-12 bg-dark-800/50 rounded-xl">
            <svg className="w-16 h-16 text-dark-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
            <p className="text-dark-500">Aucun album disponible pour le moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {albums.map((album) => (
              <Link key={album.id} href={`/albums/${album.slug}`} className="bg-dark-800/50 rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
                <div className="aspect-square bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center relative">
                  {album.coverUrl ? (
                    <img src={album.coverUrl} alt={album.title} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-16 h-16 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                    </svg>
                  )}
                  {/* Price badge */}
                  <div className="absolute top-2 right-2">
                    {album.isFree ? (
                      <span className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                        Gratuit
                      </span>
                    ) : (
                      <span className="bg-dark-900/80 text-white text-xs font-medium px-2 py-1 rounded-full">
                        {album.price?.toLocaleString('fr-FR')} FCFA
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-white group-hover:text-primary-600 transition-colors truncate">{album.title}</h3>
                  <Link href={`/artistes/${album.artist.slug}`} onClick={(e) => e.stopPropagation()} className="text-sm text-dark-500 hover:text-primary-600">
                    {album.artist.artistName}
                  </Link>
                  <div className="flex items-center justify-between mt-3 text-xs text-dark-400">
                    <span>{album._count?.albumTracks ?? album.trackCount ?? 0} morceaux</span>
                    {album._count?.albumPurchases != null && album._count.albumPurchases > 0 && (
                      <span>{album._count.albumPurchases} achat{album._count.albumPurchases > 1 ? 's' : ''}</span>
                    )}
                    {album.releaseDate && (
                      <span>{new Date(album.releaseDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' })}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
