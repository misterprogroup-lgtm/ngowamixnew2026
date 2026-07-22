'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePlayer } from '../components/player/PlayerContext';
import { api, type Track, type PaginatedResponse } from '../lib/api';
import LikeButton from '../components/ui/LikeButton';
import { toPlayerTrack } from '../lib/player-utils';

export default function TracksPage() {
  const { play, addToQueue } = usePlayer();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchTracks = async () => {
      setLoading(true);
      try {
        const res = await api.get<PaginatedResponse<Track>>(`/music/tracks?page=${page}&limit=20`);
        setTracks(res.data || []);
        setTotalPages(res.meta?.totalPages || 1);
      } catch {
        setTracks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTracks();
  }, [page]);

  const playTrack = (track: Track) => {
    play(toPlayerTrack(track), tracks.map(toPlayerTrack));
  };

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Morceaux</h1>
            <p className="mt-2 text-dark-300">Tous les morceaux publiés sur Ngowamix</p>
          </div>
        </div>

        <div className="bg-dark-800/50 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-dark-100 text-sm text-dark-400 font-medium">
            <div className="col-span-1">#</div>
            <div className="col-span-3">Titre</div>
            <div className="col-span-2">Artiste</div>
            <div className="col-span-2">Genre</div>
            <div className="col-span-1">Écoutes</div>
            <div className="col-span-1">Like</div>
            <div className="col-span-1 text-right">Durée</div>
            <div className="col-span-1"></div>
          </div>

          {loading ? (
            [...Array(10)].map((_, i) => (
              <div key={i} className="grid grid-cols-12 gap-4 px-6 py-4 items-center border-b border-dark-700/50 animate-pulse">
                <div className="col-span-1 h-4 bg-dark-700/50 rounded w-4" />
                <div className="col-span-5 h-4 bg-dark-700/50 rounded w-2/3" />
                <div className="col-span-2 h-4 bg-dark-700/50 rounded w-1/2" />
                <div className="col-span-2 h-4 bg-dark-700/50 rounded w-1/3" />
                <div className="col-span-1 h-4 bg-dark-700/50 rounded w-12" />
                <div className="col-span-1 h-4 bg-dark-700/50 rounded w-8" />
              </div>
            ))
          ) : tracks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-dark-400">Aucun morceau disponible</p>
            </div>
          ) : (
            tracks.map((track, index) => (
              <div
                key={track.id}
                className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-dark-700/50 transition-colors cursor-pointer border-b border-dark-700/50"
                onClick={() => playTrack(track)}
              >
                <div className="col-span-1 text-dark-400">{(page - 1) * 20 + index + 1}</div>
                <div className="col-span-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {track.coverUrl ? (
                        <img src={track.coverUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                        </svg>
                      )}
                    </div>
                    <p className="font-medium text-white truncate">{track.title}</p>
                  </div>
                </div>
                <div className="col-span-2">
                  <Link href={`/artistes/${track.artist.slug}`} onClick={(e) => e.stopPropagation()} className="text-dark-300 hover:text-primary-600 text-sm">
                    {track.artist.artistName}
                  </Link>
                </div>
                <div className="col-span-2">
                  {track.genre && (
                    <span className="text-xs bg-dark-700/50 text-dark-300 px-2 py-1 rounded-full">{track.genre}</span>
                  )}
                </div>
                <div className="col-span-1 text-sm text-dark-400">{track.playCount.toLocaleString()}</div>
                <div className="col-span-1">
                  <LikeButton trackId={track.id} initialCount={track.likeCount} size="sm" />
                </div>
                <div className="col-span-1 text-sm text-dark-400 text-right">
                  {track.audioDuration ? `${Math.floor(track.audioDuration / 60)}:${(track.audioDuration % 60).toString().padStart(2, '0')}` : '-'}
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={(e) => { e.stopPropagation(); addToQueue(toPlayerTrack(track)); }}
                    className="p-1.5 rounded-lg text-dark-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                    title="Ajouter à la file"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-outline px-4 py-2 disabled:opacity-50"
            >
              Précédent
            </button>
            <span className="px-4 py-2 text-dark-300">Page {page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-outline px-4 py-2 disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
