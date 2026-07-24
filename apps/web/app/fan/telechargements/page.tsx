'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../components/auth/AuthContext';
import { api } from '../../lib/api';
import { Download, Music, ArrowDown } from 'lucide-react';

interface DownloadHistoryEntry {
  id: string;
  downloadedAt: string;
  track: {
    id: string;
    title: string;
    slug: string;
    coverUrl: string | null;
    genre: string | null;
    artist: { artistName: string; slug: string };
  };
}

export default function FanTelechargementsPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DownloadHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await api.get<DownloadHistoryEntry[]>('/music/download-history');
        setEntries(Array.isArray(data) ? data : []);
      } catch { setEntries([]); } finally { setLoading(false); }
    };
    if (user) fetchHistory();
    else setLoading(false);
  }, [user]);

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
          <Download className="w-6 h-6 text-primary-500" />
          <h1 className="text-2xl font-bold text-white">Mes téléchargements</h1>
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-dark-700 rounded-xl animate-pulse" />)}</div>
        ) : entries.length === 0 ? (
          <div className="bg-dark-800/50 rounded-xl p-12 text-center">
            <ArrowDown className="w-12 h-12 text-dark-300 mx-auto mb-3" />
            <p className="text-dark-400 mb-4">Aucun téléchargement pour le moment.</p>
            <Link href="/decouverte" className="text-primary-600 hover:text-primary-300 font-medium text-sm">Découvrir des morceaux</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map(entry => (
              <div key={entry.id} className="bg-dark-800/50 rounded-xl p-4 flex items-center gap-4 hover:bg-dark-700/50 transition-colors">
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
                  <p>Téléchargé le</p>
                  <p>{new Date(entry.downloadedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <a href={api.streamUrl(entry.track.id, true)}
                  className="flex items-center gap-1.5 bg-dark-700 hover:bg-dark-600 text-dark-300 px-3 py-2 rounded-lg text-sm transition-colors flex-shrink-0">
                  <Download className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
