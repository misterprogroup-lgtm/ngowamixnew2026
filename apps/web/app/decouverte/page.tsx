'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePlayer } from '../components/player/PlayerContext';
import { api, type Track } from '../lib/api';
import { toPlayerTrack } from '../lib/player-utils';
import { TrendingUp, Clock, Music, Users, Zap, Play, ListPlus } from 'lucide-react';

const GENRES = ['Tous', 'Afrobeat', 'Pop', 'R&B', 'World', 'Blues', 'Dancehall', 'Hip-Hop', 'Zouk', 'Makossa'];

type Tab = 'trending' | 'recent' | 'top';

interface Artist {
  id: string;
  artistName: string;
  slug: string;
  user: { avatarUrl: string | null; pseudo: string };
  _count: { tracks: number; followers: number };
}

export default function DiscoverPage() {
  const { play, addToQueue } = usePlayer();
  const [activeGenre, setActiveGenre] = useState('Tous');
  const [activeTab, setActiveTab] = useState<Tab>('trending');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [topArtists, setTopArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [quota, setQuota] = useState<{ listensUsed: number; listenLimit: number } | null>(null);

  useEffect(() => {
    const fetchTracks = async () => {
      setLoading(true);
      try {
        const genreParam = activeGenre !== 'Tous' ? `genre=${activeGenre}` : '';
        const endpoint = activeTab === 'trending' ? '/music/tracks/trending' : '/music/tracks';
        const separator = genreParam ? '&' : '?';
        const url = `${endpoint}${genreParam ? '?' + genreParam : ''}${activeTab === 'recent' ? (genreParam ? '&' : '?') + 'sort=recent' : ''}`;
        const res = await api.get<{ data: Track[] }>(url);
        setTracks(res.data || []);
      } catch {
        setTracks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTracks();
  }, [activeGenre, activeTab]);

  useEffect(() => {
    const fetchTop = async () => {
      try {
        const res = await api.get<{ data: Artist[] }>('/artists?sort=followers&limit=6');
        setTopArtists(res.data || []);
      } catch { setTopArtists([]); }
    };
    fetchTop();
  }, []);

  useEffect(() => {
    const fetchQuota = async () => {
      try {
        const q = await api.get<{ listensUsed: number; listenLimit: number }>('/music/quota');
        setQuota(q);
      } catch {}
    };
    fetchQuota();
  }, []);

  const playTrack = (track: Track) => {
    play(toPlayerTrack(track), tracks.map(toPlayerTrack));
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'trending', label: 'Tendances', icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'recent', label: 'Récents', icon: <Clock className="w-4 h-4" /> },
    { key: 'top', label: 'Top artistes', icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Quota Banner */}
        {quota && (
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-4 mb-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5" />
              <div>
                <p className="text-sm font-medium">{quota.listenLimit - quota.listensUsed} écoutes restantes aujourd&apos;hui</p>
                <p className="text-xs text-white/70">{quota.listensUsed}/{quota.listenLimit} utilisées</p>
              </div>
            </div>
            <Link href="/abonnements" className="bg-white/20 hover:bg-white/30 px-4 py-1.5 rounded-lg text-xs font-medium transition-colors">Passer au Pro</Link>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Découvrir</h1>
          <p className="mt-2 text-dark-300">Explorez les meilleurs morceaux de la plateforme</p>
        </div>

        {/* Genre filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {GENRES.map((genre) => (
            <button key={genre} onClick={() => setActiveGenre(genre)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeGenre === genre ? 'bg-primary-600 text-white' : 'bg-dark-700/50 text-dark-300 hover:bg-dark-600/50'}`}>
              {genre}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-dark-700/50 rounded-xl p-1">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 flex-1 justify-center py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.key ? 'bg-dark-700 text-white shadow-sm' : 'text-dark-400 hover:text-dark-200'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Top Artists */}
        {activeTab === 'top' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
            {topArtists.map((artist, i) => (
              <Link key={artist.id} href={`/artistes/${artist.slug}`} className="bg-dark-800/50 rounded-xl p-4 text-center hover:shadow-md transition-shadow group">
                <div className="w-20 h-20 rounded-full mx-auto mb-3 overflow-hidden bg-dark-700/50 ring-2 ring-primary-200 group-hover:ring-primary-400 transition-all">
                  {artist.user.avatarUrl ? (
                    <img src={artist.user.avatarUrl} alt={artist.artistName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl font-bold text-primary-500">{artist.artistName.charAt(0)}</div>
                  )}
                </div>
                <p className="font-semibold text-white text-sm truncate">{artist.artistName}</p>
                <p className="text-xs text-dark-400 mt-0.5">{artist._count.followers} abonnés</p>
                {i < 3 && (
                  <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 font-medium">
                    #{i + 1}
                  </span>
                )}
              </Link>
            ))}
          </div>
        ) : (
          /* Track list */
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">{activeTab === 'trending' ? 'Tendances' : 'Récents'}</h2>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-dark-800/50 rounded-xl">
                    <div className="w-8 h-4 bg-dark-700/50 rounded" />
                    <div className="w-12 h-12 bg-dark-700/50 rounded-lg" />
                    <div className="flex-1 space-y-2"><div className="h-4 bg-dark-700/50 rounded w-1/3" /><div className="h-3 bg-dark-700/50 rounded w-1/4" /></div>
                  </div>
                ))}
              </div>
            ) : tracks.length === 0 ? (
              <div className="text-center py-12 bg-dark-800/50 rounded-xl">
                <Music className="w-16 h-16 text-dark-300 mx-auto mb-4" />
                <p className="text-dark-400">Aucun morceau disponible</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tracks.map((track, index) => (
                  <div key={track.id}
                    className="flex items-center gap-4 p-4 bg-dark-800/50 rounded-xl hover:bg-dark-700/50 transition-colors group cursor-pointer"
                    onClick={() => playTrack(track)}>
                    <span className="text-dark-400 font-bold w-8 text-center">{index + 1}</span>
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {track.coverUrl ? (
                        <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                      ) : (
                        <Music className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{track.title}</p>
                      <Link href={`/artistes/${track.artist.slug}`} onClick={e => e.stopPropagation()} className="text-sm text-dark-400 hover:text-primary-600">{track.artist.artistName}</Link>
                    </div>
                    {track.genre && <span className="text-xs bg-dark-700/50 text-dark-300 px-2 py-1 rounded-full hidden sm:inline">{track.genre}</span>}
                    <span className="text-sm text-dark-400">{track.playCount.toLocaleString()} écoutes</span>
                    <div className="flex items-center gap-1">
                      <button onClick={e => { e.stopPropagation(); addToQueue(toPlayerTrack(track)); }}
                        className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full bg-dark-700/50 hover:bg-dark-700/50 flex items-center justify-center text-dark-400 transition-all" title="Ajouter à la file">
                        <ListPlus className="w-4 h-4" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); playTrack(track); }}
                        className="opacity-0 group-hover:opacity-100 w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white transition-all">
                        <Play className="w-4 h-4 ml-0.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Upgrade CTA */}
        <div className="bg-dark-800/50 rounded-xl p-6 border border-dark-700/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold">Compte Gratuit</h3>
              <p className="text-sm text-dark-400">30 écoutes / jour · 5 téléchargements / jour</p>
            </div>
            <Link href="/abonnements" className="ml-auto bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors">Passer au Pro</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
