'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePlayer } from '../components/player/PlayerContext';
import { api, type Track, type PaginatedResponse } from '../lib/api';
import LikeButton from '../components/ui/LikeButton';
import { toPlayerTrack } from '../lib/player-utils';

export default function FavoritesPage() {
  const { play, addToQueue } = usePlayer();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLikes = async () => {
      try {
        const res = await api.get<PaginatedResponse<Track>>('/likes/my-likes');
        setTracks(res.data || []);
      } catch {
        setTracks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLikes();
  }, []);

  const playTrack = (track: Track) => {
    play(toPlayerTrack(track), tracks.map(toPlayerTrack));
  };

  const handleUnlike = (trackId: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
  };

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Mes favoris</h1>
          <p className="mt-2 text-dark-300">Les morceaux que vous avez likés</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-dark-800/50 rounded-xl">
                <div className="w-12 h-12 bg-dark-700/50 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-dark-700/50 rounded w-2/3" />
                  <div className="h-3 bg-dark-700/50 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-16 bg-dark-800/50 rounded-xl">
            <svg className="w-16 h-16 text-dark-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <p className="text-dark-500 mb-4">Vous n&apos;avez pas encore de favoris</p>
            <Link href="/morceaux" className="text-primary-600 hover:text-primary-700 font-medium">
              Explorer les morceaux &rarr;
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {tracks.map((track, index) => (
              <div
                key={track.id}
                className="flex items-center gap-4 p-4 bg-dark-800/50 rounded-xl hover:bg-dark-700/50 transition-colors cursor-pointer"
                onClick={() => playTrack(track)}
              >
                <span className="text-sm text-dark-400 w-6 text-center">{index + 1}</span>
                <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  {track.coverUrl ? (
                    <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{track.title}</p>
                  <Link href={`/artistes/${track.artist.slug}`} onClick={(e) => e.stopPropagation()} className="text-sm text-dark-500 hover:text-primary-600">
                    {track.artist.artistName}
                  </Link>
                </div>
                <div className="text-sm text-dark-400">
                  {track.playCount.toLocaleString()} écoutes
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <LikeButton
                    trackId={track.id}
                    initialLiked={true}
                    initialCount={track.likeCount}
                    onToggle={(liked) => { if (!liked) handleUnlike(track.id); }}
                    size="sm"
                  />
                </div>
                <button onClick={e => { e.stopPropagation(); addToQueue(toPlayerTrack(track)); }}
                  className="text-dark-400 hover:text-primary-600 transition-colors opacity-0 group-hover:opacity-100 text-xs"
                  title="Ajouter à la file">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
