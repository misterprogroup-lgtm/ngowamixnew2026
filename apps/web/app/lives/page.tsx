'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, type PaginatedResponse } from '../lib/api';

interface PaidLive {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverUrl?: string;
  price: number;
  scheduledAt?: string;
  isLive: boolean;
  viewerCount: number;
  artist: { artistName: string; slug: string; user?: { avatarUrl?: string } };
  _count?: { accesses: number };
}

export default function LivesPage() {
  const [lives, setLives] = useState<PaidLive[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLives = async () => {
      try {
        const res = await api.get<PaginatedResponse<PaidLive>>('/lives');
        setLives(res.data || []);
      } catch {
        setLives([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLives();
  }, []);

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Lives</h1>
          <p className="mt-2 text-dark-300">Lives en direct et lives payants</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-dark-800/50 rounded-xl overflow-hidden">
                <div className="h-48 bg-dark-700/50" />
                <div className="p-4 space-y-2">
                  <div className="h-5 bg-dark-700/50 rounded w-2/3" />
                  <div className="h-4 bg-dark-700/50 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : lives.length === 0 ? (
          <div className="text-center py-16 bg-dark-800/50 rounded-xl">
            <svg className="w-16 h-16 text-dark-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-dark-500 mb-2">Aucun live disponible</p>
            <p className="text-sm text-dark-400">Les artistes bientôt lanceront leurs lives</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {lives.map((live) => (
              <Link key={live.id} href={`/lives/${live.slug}`} className="bg-dark-800/50 rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
                <div className="h-48 bg-gradient-to-br from-red-400 to-red-600 relative">
                  {live.coverUrl ? (
                    <img src={live.coverUrl} alt={live.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  {live.isLive && (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                      <div className="w-2 h-2 bg-white rounded-full" />
                      EN DIRECT
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      live.price === 0 ? 'bg-green-500 text-white' : 'bg-dark-900/80 text-white'
                    }`}>
                      {live.price === 0 ? 'Gratuit' : `${live.price.toLocaleString('fr-FR')} FCFA`}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-white group-hover:text-primary-600 transition-colors truncate">{live.title}</h3>
                  <p className="text-sm text-dark-500 mt-1">{live.artist.artistName}</p>
                  <div className="flex items-center justify-between mt-3 text-xs text-dark-400">
                    {live.scheduledAt && (
                      <span>{new Date(live.scheduledAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                    <span>{live._count?.accesses || 0} accès</span>
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
