'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { api, type Track, type ArtistProfile, type PaginatedResponse } from './lib/api';
import { usePlayer } from './components/player/PlayerContext';
import { toPlayerTrack } from './lib/player-utils';
import { Play, Pause, Music, ChevronLeft, ChevronRight, Users, Radio, Calendar, TrendingUp, Trophy, Sparkles } from 'lucide-react';
import { useAuth } from './components/auth/AuthContext';

const DEFAULT_GENRES = ['Tous'];

function TrackCard({ track, allTracks, index }: { track: Track; allTracks: Track[]; index: number }) {
  const { play, addToQueue, currentTrack, isPlaying } = usePlayer();
  const isActive = currentTrack?.id === track.id;
  const isCurrentPlaying = isActive && isPlaying;

  return (
    <button
      onClick={() => play(toPlayerTrack(track), allTracks.map(toPlayerTrack))}
      className="group text-left w-full"
    >
      <div className="relative aspect-square rounded-xl overflow-hidden bg-dark-800 mb-3">
        {track.coverUrl ? (
          <img
            src={track.coverUrl}
            alt={track.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-dark-700 to-dark-800 flex items-center justify-center">
            <Music className="w-12 h-12 text-dark-500" />
          </div>
        )}

        {/* Play overlay */}
        <div className={`absolute inset-0 flex items-center justify-center gap-3 transition-opacity ${
          isCurrentPlaying
            ? 'bg-black/40 opacity-100'
            : 'bg-black/0 group-hover:bg-black/40 opacity-0 group-hover:opacity-100'
        }`}>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all group-hover:scale-100 ${
            isCurrentPlaying
              ? 'bg-primary-500 scale-100'
              : 'bg-primary-500 scale-90 shadow-lg'
          }`}>
            {isCurrentPlaying ? (
              <Pause className="w-6 h-6 text-white" fill="white" />
            ) : (
              <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); addToQueue(toPlayerTrack(track)); }}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all opacity-0 group-hover:opacity-100"
            title="Ajouter à la file"
          >
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Rank number */}
        {index < 3 && (
          <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-dark-900/80 backdrop-blur-sm flex items-center justify-center">
            <span className="text-xs font-bold text-white">{index + 1}</span>
          </div>
        )}

        {/* Genre tag */}
        {track.genre && (
          <div className="absolute top-2 right-2">
            <span className="text-[10px] font-medium bg-dark-900/70 backdrop-blur-sm text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
              {track.genre}
            </span>
          </div>
        )}
      </div>

      <div className="px-1">
        <Link
          href={`/morceaux/${track.slug}`}
          onClick={(e) => e.stopPropagation()}
          className={`font-medium truncate text-sm block hover:text-primary-400 transition-colors ${isActive ? 'text-primary-500' : 'text-white'}`}
        >
          {track.title}
        </Link>
        <Link
          href={`/artistes/${track.artist.slug}`}
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-dark-400 truncate mt-0.5 block hover:text-primary-400 transition-colors"
        >
          {track.artist.artistName}
        </Link>
        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-dark-500">
          <span>{track.playCount.toLocaleString('fr-FR')} lectures</span>
        </div>
      </div>
    </button>
  );
}

function ArtistCard({ artist }: { artist: ArtistProfile }) {
  return (
    <Link
      href={`/artistes/${artist.slug}`}
      className="group flex-shrink-0 w-40 text-center"
    >
      <div className="relative w-32 h-32 mx-auto mb-3 rounded-full overflow-hidden bg-dark-700 ring-2 ring-dark-600 group-hover:ring-primary-500 transition-all">
        {artist.user?.avatarUrl ? (
          <img src={artist.user.avatarUrl} alt={artist.artistName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <span className="text-3xl font-bold text-white">
              {artist.artistName.charAt(0)}
            </span>
          </div>
        )}
      </div>
      <p className="text-sm font-medium text-white truncate group-hover:text-primary-400 transition-colors">
        {artist.artistName}
      </p>
      <p className="text-xs text-dark-400 mt-0.5">
        {artist.followerCount.toLocaleString('fr-FR')} abonnés
      </p>
    </Link>
  );
}

function ScrollRow({ children, title, href }: { children: React.ReactNode; title: string; href: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.offsetWidth - 100;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => scroll('left')} className="w-8 h-8 rounded-full bg-dark-700 hover:bg-dark-600 flex items-center justify-center transition-colors">
            <ChevronLeft className="w-4 h-4 text-dark-300" />
          </button>
          <button onClick={() => scroll('right')} className="w-8 h-8 rounded-full bg-dark-700 hover:bg-dark-600 flex items-center justify-center transition-colors">
            <ChevronRight className="w-4 h-4 text-dark-300" />
          </button>
          <Link href={href} className="text-xs text-dark-400 hover:text-white transition-colors ml-2">
            Tout voir
          </Link>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>
    </section>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [artists, setArtists] = useState<ArtistProfile[]>([]);
  const [recommended, setRecommended] = useState<Track[]>([]);
  const [genres, setGenres] = useState<string[]>(DEFAULT_GENRES);
  const [activeGenre, setActiveGenre] = useState('Tous');
  const [loading, setLoading] = useState(true);
  const [loadingGenre, setLoadingGenre] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tracksRes, artistsRes, genresRes] = await Promise.all([
          api.get<PaginatedResponse<Track>>('/music/tracks?limit=50'),
          api.get<PaginatedResponse<ArtistProfile>>('/artists?limit=10'),
          api.get<string[]>('/music/genres').catch(() => []),
        ]);
        setTracks(tracksRes.data || []);
        setArtists(artistsRes.data || []);
        const dbGenres = Array.isArray(genresRes) ? genresRes : [];
        setGenres([...DEFAULT_GENRES, ...dbGenres]);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!user) return;
    api.get<PaginatedResponse<Track>>('/music/recommended?limit=12')
      .then(res => setRecommended(res.data || []))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (activeGenre === 'Tous' || tracks.some(t => t.genre === activeGenre)) return;
    setLoadingGenre(true);
    api.get<PaginatedResponse<Track>>(`/music/tracks?genre=${encodeURIComponent(activeGenre)}&limit=50`)
      .then(res => {
        setTracks(prev => {
          const existing = new Set(prev.map(t => t.id));
          const newTracks = (res.data || []).filter((t: Track) => !existing.has(t.id));
          return [...prev, ...newTracks];
        });
      })
      .catch(() => {})
      .finally(() => setLoadingGenre(false));
  }, [activeGenre]);

  const filteredTracks = activeGenre === 'Tous'
    ? tracks
    : tracks.filter((t) => t.genre === activeGenre);

  const topTracks = [...tracks].sort((a, b) => b.playCount - a.playCount);
  const displayTracks = activeGenre === 'Tous' ? topTracks : filteredTracks;

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Genre Tabs */}
      <div className="sticky top-12 z-40 bg-dark-900/95 backdrop-blur-sm border-b border-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 py-3 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => setActiveGenre(genre)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeGenre === genre
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-800 text-dark-300 hover:bg-dark-700 hover:text-white'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Charts Section */}
        <section className="pt-8 pb-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">
                {activeGenre === 'Tous' ? 'Classement' : activeGenre}
              </h1>
              <p className="text-sm text-dark-400 mt-1">
                Les morceaux les plus écoutés{activeGenre !== 'Tous' ? ` en ${activeGenre}` : ''}
              </p>
            </div>
            <Link
              href="/morceaux"
              className="text-sm text-dark-400 hover:text-white transition-colors flex items-center gap-1"
            >
              Tout voir <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square rounded-xl bg-dark-800 mb-3" />
                  <div className="h-3 bg-dark-800 rounded w-3/4 mb-1.5" />
                  <div className="h-2.5 bg-dark-800 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : displayTracks.length === 0 ? (
            <div className="text-center py-16">
              <Music className="w-12 h-12 text-dark-300 mx-auto mb-3" />
              <p className="text-dark-400">Aucun morceau dans cette catégorie</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {displayTracks.slice(0, 12).map((track, i) => (
                <TrackCard key={track.id} track={track} allTracks={displayTracks} index={i} />
              ))}
            </div>
          )}
        </section>

        {/* Divider */}
        <div className="border-t border-dark-800 my-4" />

        {/* Artists Row */}
        {artists.length > 0 && (
          <ScrollRow title="Artistes populaires" href="/artistes">
            {artists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </ScrollRow>
        )}

        {/* Divider */}
        <div className="border-t border-dark-800 my-4" />

        {/* Recommendations */}
        {user && recommended.length > 0 && (
          <>
            <ScrollRow title="Recommandations" href="/decouverte">
              {recommended.map((track, i) => (
                <div key={track.id} className="flex-shrink-0 w-48">
                  <TrackCard track={track} allTracks={recommended} index={i} />
                </div>
              ))}
            </ScrollRow>
            <div className="border-t border-dark-800 my-4" />
          </>
        )}

        {/* All Tracks Row */}
        <ScrollRow title="Découvrir" href="/decouverte">
          {tracks.map((track, i) => (
            <div key={track.id} className="flex-shrink-0 w-48">
              <TrackCard track={track} allTracks={tracks} index={i} />
            </div>
          ))}
        </ScrollRow>

        {/* Divider */}
        <div className="border-t border-dark-800 my-4" />

        {/* Classements Teaser */}
        <section className="py-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Classements
            </h2>
            <Link href="/classements" className="text-sm text-dark-400 hover:text-white transition-colors flex items-center gap-1">
              Tout voir <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <Link
            href="/classements"
            className="block rounded-xl overflow-hidden bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-dark-700 hover:border-yellow-600/50 transition-all p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-7 h-7 text-yellow-500" />
              </div>
              <div>
                <p className="font-semibold text-white">Découvrez les tendances</p>
                <p className="text-sm text-dark-400 mt-0.5">Les morceaux, artistes et albums les plus populaires du moment</p>
              </div>
              <ChevronRight className="w-5 h-5 text-dark-500 ml-auto" />
            </div>
          </Link>
        </section>

        {/* Divider */}
        <div className="border-t border-dark-800 my-4" />

        {/* Radio Teaser */}
        <section className="py-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-primary-500" />
              Radio
            </h2>
            <Link href="/radio" className="text-sm text-dark-400 hover:text-white transition-colors flex items-center gap-1">
              Tout voir <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <Link
            href="/radio"
            className="block rounded-xl overflow-hidden bg-gradient-to-r from-primary-600/20 to-purple-800/20 border border-dark-700 hover:border-primary-600/50 transition-all p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                <Radio className="w-7 h-7 text-primary-400" />
              </div>
              <div>
                <p className="font-semibold text-white">Écoutez en continu</p>
                <p className="text-sm text-dark-400 mt-0.5">Choisissez un genre et laissez-vous porter par la musique</p>
              </div>
              <ChevronRight className="w-5 h-5 text-dark-500 ml-auto" />
            </div>
          </Link>
        </section>

        {/* Divider */}
        <div className="border-t border-dark-800 my-4" />

        {/* Concerts Teaser */}
        <section className="py-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-500" />
              Concerts à venir
            </h2>
            <Link href="/concerts" className="text-sm text-dark-400 hover:text-white transition-colors flex items-center gap-1">
              Tout voir <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <Link
            href="/concerts"
            className="block rounded-xl overflow-hidden bg-gradient-to-r from-primary-600/20 to-primary-800/20 border border-dark-700 hover:border-primary-600/50 transition-all p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-7 h-7 text-primary-400" />
              </div>
              <div>
                <p className="font-semibold text-white">Retrouvez vos artistes en live</p>
                <p className="text-sm text-dark-400 mt-0.5">Achetez des tickets et ne manquez aucun concert</p>
              </div>
              <ChevronRight className="w-5 h-5 text-dark-500 ml-auto" />
            </div>
          </Link>
        </section>

        {/* Lives Teaser */}
        <section className="py-4 pb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-red-500" />
              Lives payants
            </h2>
            <Link href="/lives" className="text-sm text-dark-400 hover:text-white transition-colors flex items-center gap-1">
              Tout voir <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <Link
            href="/lives"
            className="block rounded-xl overflow-hidden bg-gradient-to-r from-red-600/20 to-red-800/20 border border-dark-700 hover:border-red-600/50 transition-all p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <Radio className="w-7 h-7 text-red-400" />
              </div>
              <div>
                <p className="font-semibold text-white">Regardez les lives en direct</p>
                <p className="text-sm text-dark-400 mt-0.5">Accédez aux sessions live exclusives de vos artistes préférés</p>
              </div>
              <ChevronRight className="w-5 h-5 text-dark-500 ml-auto" />
            </div>
          </Link>
        </section>
      </div>
    </div>
  );
}
