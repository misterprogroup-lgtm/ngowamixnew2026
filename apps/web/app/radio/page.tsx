'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePlayer } from '../components/player/PlayerContext';
import { api, type Track } from '../lib/api';
import { toPlayerTrack } from '../lib/player-utils';
import { Radio, Play, Pause, SkipForward, Music, ListPlus, Shuffle, Loader2 } from 'lucide-react';

export default function RadioPage() {
  const { play, currentTrack, isPlaying, pause, resume, next, addToQueue } = usePlayer();
  const [genres, setGenres] = useState<string[]>([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [radioTracks, setRadioTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPlayingRadio, setIsPlayingRadio] = useState(false);

  useEffect(() => {
    api.get<string[]>('/music/genres').then(setGenres).catch(() => {});
    const recentGenre = localStorage.getItem('radioGenre');
    if (recentGenre) setSelectedGenre(recentGenre);
  }, []);

  const fetchRadio = useCallback(async (genre: string) => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Track[]; total: number }>(`/music/radio?genre=${encodeURIComponent(genre || 'Tous')}&limit=50`);
      setRadioTracks(res.data || []);
    } catch {
      setRadioTracks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedGenre) {
      localStorage.setItem('radioGenre', selectedGenre);
      fetchRadio(selectedGenre);
    }
  }, [selectedGenre, fetchRadio]);

  const startRadio = () => {
    if (radioTracks.length === 0) return;
    const pt = toPlayerTrack(radioTracks[0]);
    play(pt, radioTracks.map(toPlayerTrack));
    setIsPlayingRadio(true);
  };

  const togglePlay = () => {
    if (isPlayingRadio) {
      if (isPlaying) pause();
      else resume();
    } else {
      startRadio();
    }
  };

  const skipTrack = () => {
    if (radioTracks.length > 0) next();
  };

  const handleGenreChange = (genre: string) => {
    setSelectedGenre(genre);
    setIsPlayingRadio(false);
  };

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center">
            <Radio className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Radio</h1>
            <p className="text-dark-400">Une sélection continue de morceaux par genre</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-purple-800 rounded-2xl p-8 mb-8 text-white">
          <div className="flex flex-col items-center text-center">
            <div className={`w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mb-4 ${isPlayingRadio ? 'animate-pulse' : ''}`}>
              <Radio className="w-10 h-10 text-white/80" />
            </div>
            <h2 className="text-2xl font-bold mb-1">Radio {selectedGenre || 'Ngowamix'}</h2>
            <p className="text-white/60 text-sm mb-6">
              {radioTracks.length > 0 ? `${radioTracks.length} morceaux disponibles` : 'Sélectionnez un genre'}
            </p>

            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={skipTrack}
                disabled={!isPlayingRadio || radioTracks.length === 0}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors disabled:opacity-30"
              >
                <SkipForward className="w-5 h-5" />
              </button>
              <button
                onClick={togglePlay}
                disabled={radioTracks.length === 0}
                className="w-16 h-16 rounded-full bg-white flex items-center justify-center hover:bg-white/90 transition-colors disabled:opacity-30 shadow-lg"
              >
                {isPlayingRadio && isPlaying ? (
                  <Pause className="w-7 h-7 text-primary-700" />
                ) : (
                  <Play className="w-7 h-7 text-primary-700 ml-0.5" />
                )}
              </button>
              <button
                onClick={startRadio}
                disabled={radioTracks.length === 0}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors disabled:opacity-30"
                title="Nouveau shuffle"
              >
                <Shuffle className="w-5 h-5" />
              </button>
            </div>

            {isPlayingRadio && currentTrack && (
              <div className="text-center">
                <p className="font-semibold">{currentTrack.title}</p>
                <p className="text-sm text-white/60">{currentTrack.artist?.artistName}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-dark-700 mb-3">Choisir un genre</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleGenreChange('')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                !selectedGenre ? 'bg-primary-600 text-white shadow-sm' : 'bg-dark-800/50 border border-dark-700/50 text-dark-300 hover:border-dark-500'
              }`}
            >
              Tous les genres
            </button>
            {genres.map(g => g && (
              <button
                key={g}
                onClick={() => handleGenreChange(g)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  selectedGenre === g ? 'bg-primary-600 text-white shadow-sm' : 'bg-dark-800/50 border border-dark-700/50 text-dark-300 hover:border-dark-500'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : radioTracks.length === 0 ? (
          <div className="text-center py-12 bg-dark-800/50 rounded-xl border border-dark-700/50">
            <Radio className="w-12 h-12 text-dark-300 mx-auto mb-4" />
            <p className="text-dark-400">Aucun morceau trouvé pour ce genre</p>
          </div>
        ) : (
          <div className="bg-dark-800/50 rounded-xl border border-dark-700/50 overflow-hidden">
            <div className="divide-y divide-dark-700/50">
              {radioTracks.slice(0, 20).map((track, i) => (
                <div key={track.id} className="flex items-center gap-3 p-3 hover:bg-dark-700/50 transition-colors group">
                  <span className="text-sm text-dark-400 w-6 text-center flex-shrink-0">{i + 1}</span>
                  <button
                    onClick={() => { play(toPlayerTrack(track), radioTracks.map(toPlayerTrack)); setIsPlayingRadio(true); }}
                    className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded flex items-center justify-center flex-shrink-0 overflow-hidden"
                  >
                    {track.coverUrl ? <img src={track.coverUrl} alt="" className="w-full h-full object-cover" /> : <Music className="w-5 h-5 text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => { play(toPlayerTrack(track), radioTracks.map(toPlayerTrack)); setIsPlayingRadio(true); }}
                      className="font-medium text-white hover:text-primary-600 transition-colors truncate block text-left w-full"
                    >
                      {track.title}
                    </button>
                    <Link href={`/artistes/${track.artist.slug}`} className="text-xs text-dark-400 hover:text-primary-600 transition-colors">
                      {track.artist.artistName}
                    </Link>
                  </div>
                  {track.genre && <span className="text-xs text-dark-400 hidden sm:inline">{track.genre}</span>}
                  <button
                    onClick={() => addToQueue(toPlayerTrack(track))}
                    className="p-1.5 text-dark-300 hover:text-primary-600 opacity-0 group-hover:opacity-100 transition-all"
                    title="Ajouter à la file"
                  >
                    <ListPlus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
