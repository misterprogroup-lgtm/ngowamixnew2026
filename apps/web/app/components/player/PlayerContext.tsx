'use client';

import { useState, useRef, useEffect, useCallback, createContext, useContext } from 'react';
import { api } from '../../lib/api';

interface Track {
  id: string;
  title: string;
  audioUrl: string;
  coverUrl?: string;
  artist: {
    artistName: string;
    slug: string;
  };
}

type RepeatMode = 'off' | 'all' | 'one';

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  queue: Track[];
  queueIndex: number;
  play: (track: Track, queue?: Track[]) => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  previous: () => void;
  setQueue: (tracks: Track[]) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  seek: (time: number) => void;
  volume: number;
  setVolume: (vol: number) => void;
  currentTime: number;
  duration: number;
  shuffle: boolean;
  repeat: RepeatMode;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  quotaBlocked: boolean;
  dismissQuotaBlocked: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within PlayerProvider');
  return context;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueueState] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('off');
  const listenRecordedRef = useRef<Record<string, boolean>>({});
  const [quotaBlocked, setQuotaBlocked] = useState(false);
  const shuffledRef = useRef<Track[]>([]);
  const currentTrackRef = useRef<Track | null>(null);
  const queueRef = useRef<Track[]>([]);
  const queueIndexRef = useRef(0);
  const shuffleRef = useRef(false);
  const repeatRef = useRef<RepeatMode>('off');

  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { queueIndexRef.current = queueIndex; }, [queueIndex]);
  useEffect(() => { shuffleRef.current = shuffle; }, [shuffle]);
  useEffect(() => { repeatRef.current = repeat; }, [repeat]);

  const loadAndPlay = useCallback((track: Track) => {
    currentTrackRef.current = track;
    setCurrentTrack(track);
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = api.streamUrl(track.id);
    audio.play().catch(() => {});
    setIsPlaying(true);
  }, []);

  const autoNext = useCallback(() => {
    const q = queueRef.current;
    const idx = queueIndexRef.current;
    if (q.length === 0) return;

    if (repeatRef.current === 'one') {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
      return;
    }

    let nextIndex: number;
    if (shuffleRef.current) {
      const sq = shuffledRef.current;
      if (sq.length === 0) return;
      const currentIdx = sq.findIndex(t => t.id === currentTrackRef.current?.id);
      nextIndex = q.indexOf(sq[(currentIdx + 1) % sq.length]);
      if (nextIndex < 0) nextIndex = q.indexOf(sq[0]);
    } else {
      nextIndex = (idx + 1) % q.length;
      if (repeatRef.current === 'off' && nextIndex === 0) {
        setIsPlaying(false);
        return;
      }
    }
    setQueueIndex(nextIndex);
    loadAndPlay(q[nextIndex]);
  }, [loadAndPlay]);

  const next = useCallback(() => {
    const q = queueRef.current;
    const idx = queueIndexRef.current;
    if (q.length === 0) return;

    let nextIndex: number;
    if (shuffleRef.current) {
      const sq = shuffledRef.current;
      if (sq.length === 0) return;
      const currentIdx = sq.findIndex(t => t.id === currentTrackRef.current?.id);
      nextIndex = q.indexOf(sq[(currentIdx + 1) % sq.length]);
      if (nextIndex < 0) nextIndex = q.indexOf(sq[0]);
    } else {
      nextIndex = (idx + 1) % q.length;
    }
    setQueueIndex(nextIndex);
    loadAndPlay(q[nextIndex]);
  }, [loadAndPlay]);

  const previous = useCallback(() => {
    const q = queueRef.current;
    const idx = queueIndexRef.current;
    if (q.length === 0) return;

    let prevIndex: number;
    if (shuffleRef.current) {
      const sq = shuffledRef.current;
      if (sq.length === 0) return;
      const currentIdx = sq.findIndex(t => t.id === currentTrackRef.current?.id);
      prevIndex = q.indexOf(sq[currentIdx === 0 ? sq.length - 1 : currentIdx - 1]);
      if (prevIndex < 0) prevIndex = q.indexOf(sq[sq.length - 1]);
    } else {
      prevIndex = idx === 0 ? q.length - 1 : idx - 1;
    }
    setQueueIndex(prevIndex);
    loadAndPlay(q[prevIndex]);
  }, [loadAndPlay]);

  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume;
    audioRef.current = audio;

    audio.addEventListener('timeupdate', () => {
      const time = audio.currentTime;
      setCurrentTime(time);
      if (time >= 30 && currentTrackRef.current && !listenRecordedRef.current[currentTrackRef.current.id]) {
        listenRecordedRef.current[currentTrackRef.current.id] = true;
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (!token) return; // Les écoutes ne sont comptabilisées que pour les utilisateurs connectés
        fetch(`/api/music/listen/${currentTrackRef.current.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ duration: Math.floor(time) }),
        })
          .then((res) => res.json())
          .then((data) => {
            const result = data?.data ?? data;
            if (result?.quotaExceeded) {
              audio.pause();
              setQuotaBlocked(true);
            }
          })
          .catch(() => {});
      }
    });

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration || 0);
    });

    audio.addEventListener('ended', autoNext);

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [autoNext]);

  const play = useCallback((track: Track, newQueue?: Track[]) => {
    if (newQueue) {
      setQueueState(newQueue);
      const idx = newQueue.findIndex(t => t.id === track.id);
      setQueueIndex(idx >= 0 ? idx : 0);
      if (shuffle) {
        const copy = [...newQueue];
        for (let i = copy.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        shuffledRef.current = copy;
      }
    }
    loadAndPlay(track);
  }, [loadAndPlay, shuffle]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    audioRef.current?.play().catch(() => {});
    setIsPlaying(true);
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  }, []);

  const setQueue = useCallback((tracks: Track[]) => {
    setQueueState(tracks);
  }, []);

  const addToQueue = useCallback((track: Track) => {
    setQueueState(prev => [...prev, track]);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueueState(prev => prev.filter((_, i) => i !== index));
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle(prev => {
      const next = !prev;
      if (next) {
        const copy = [...queueRef.current];
        for (let i = copy.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        shuffledRef.current = copy;
      } else {
        shuffledRef.current = [];
      }
      return next;
    });
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeat(prev => prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off');
  }, []);

  useEffect(() => {
    if (!currentTrack || !('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist.artistName,
      artwork: currentTrack.coverUrl
        ? [{ src: currentTrack.coverUrl, sizes: '512x512', type: 'image/*' }]
        : [],
    });
    navigator.mediaSession.setActionHandler('play', () => resume());
    navigator.mediaSession.setActionHandler('pause', () => pause());
    navigator.mediaSession.setActionHandler('previoustrack', () => previous());
    navigator.mediaSession.setActionHandler('nexttrack', () => next());
  }, [currentTrack, resume, pause, previous, next]);

  const dismissQuotaBlocked = useCallback(() => setQuotaBlocked(false), []);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack, isPlaying, queue, queueIndex,
        play, pause, resume, next, previous,
        setQueue, addToQueue, removeFromQueue,
        seek, volume, setVolume, currentTime, duration,
        shuffle, repeat, toggleShuffle, toggleRepeat,
        quotaBlocked, dismissQuotaBlocked,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}
