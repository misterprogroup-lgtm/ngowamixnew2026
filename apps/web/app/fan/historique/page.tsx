'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../components/auth/AuthContext';
import { usePlayer } from '../../components/player/PlayerContext';
import { api } from '../../lib/api';
import type { Track } from '../../lib/types';
import { toPlayerTrack } from '../../lib/player-utils';
import { Clock, Play, Music } from 'lucide-react';

interface ListenHistoryEntry {
  id: string;
  duration: number;
  listenedAt: string;
  track: {
    id: string;
    title: string;
    slug: string;
    coverUrl: string | null;
    genre: string | null;
    artist: { artistName: string; slug: string };
  };
}

export default function FanHistoriquePage() {
  const { user } = useAuth();
  const { play, addToQueue } = usePlayer();
  const [entries, setEntries] = useState<ListenHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await api.get<ListenHistoryEntry[]>('/music/listen-history');
        setEntries(Array.isArray(data) ? data : []);
      } catch { setEntries([]); } finally { setLoading(false); }
    };
    if (user) fetchHistory();
    else setLoading(false);
  }, [user]);

  const playTrack = (entry: ListenHistoryEntry) => {
    play(toPlayerTrack(entry.track as Track), [toPlayerTrack(entry.track as Track)]);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Connectez-vous</h2>
          <Link href="/connexion" className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">Se connecter</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <Clock className="w-6 h-6 text-primary-500" />
          <h1 className="text-2xl font-bold text-white">Historique d&apos;écoute</h1>
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-dark-700 rounded-xl animate-pulse" />)}</div>
        ) : entries.length === 0 ? (
          <div className="bg-dark-800/50 rounded-xl p-12 text-center">
            <Music className="w-12 h-12 text-dark-300 mx-auto mb-3" />
            <p className="text-dark-400 mb-4">Aucun historique d&apos;écoute.</p>
            <Link href="/decouverte" className="text-primary-600 hover:text-primary-300 font-medium text-sm">Découvrir des morceaux</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map(entry => (
              <div key={entry.id} className="bg-dark-800/50 rounded-xl p-4 flex items-center gap-4 hover:bg-dark-700/50 transition-colors group">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-dark-700 flex-shrink-0">
                  {entry.track.coverUrl ? (
                    <img src={entry.track.coverUrl} alt={entry.track.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-400 to-primary-600">
                      <Music className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/morceaux/${entry.track.slug}`} className="font-medium text-white hover:text-primary-600 transition-colors truncate block">{entry.track.title}</Link>
                  <Link href={`/artistes/${entry.track.artist.slug}`} className="text-sm text-dark-400 hover:text-primary-600">{entry.track.artist.artistName}</Link>
                </div>
                <div className="text-right text-xs text-dark-400 flex-shrink-0">
                  <p>{new Date(entry.listenedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</p>
                  <p>{Math.floor(entry.duration / 60)}:{(entry.duration % 60).toString().padStart(2, '0')}</p>
                </div>
                <button onClick={() => playTrack(entry)} className="opacity-0 group-hover:opacity-100 w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white transition-opacity flex-shrink-0">
                  <Play className="w-4 h-4 ml-0.5" fill="white" />
                </button>
                <button onClick={e => { e.stopPropagation(); addToQueue(toPlayerTrack(entry.track as Track)); }}
                  className="opacity-0 group-hover:opacity-100 text-sm text-primary-600 hover:text-primary-300 font-medium transition-opacity ml-2"
                  title="Ajouter à la file">
                  + Queue
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
