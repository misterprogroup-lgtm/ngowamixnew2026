'use client';

import { useState } from 'react';
import { usePlayer } from './PlayerContext';

export default function PlayerBar() {
  const {
    currentTrack, isPlaying, pause, resume, next, previous,
    currentTime, duration, seek, volume, setVolume,
    shuffle, repeat, toggleShuffle, toggleRepeat,
    queue, queueIndex, removeFromQueue,
  } = usePlayer();
  const [showQueue, setShowQueue] = useState(false);

  if (!currentTrack) return null;

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const repeatIcon = repeat === 'one' ? (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/><rect x="13" y="13" width="2" height="6" fill="currentColor"/></svg>
  ) : (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>
  );

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-dark-950/95 backdrop-blur-xl border-t border-dark-700/50 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Track Info */}
            <div className="flex items-center gap-3 min-w-0 w-56">
              <div className="w-12 h-12 bg-gradient-to-br from-dark-700 to-dark-800 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                {currentTrack.coverUrl ? (
                  <img src={currentTrack.coverUrl} alt={currentTrack.title} className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-6 h-6 text-dark-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{currentTrack.title}</p>
                <p className="text-dark-400 text-xs truncate">{currentTrack.artist.artistName}</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex-1 flex flex-col items-center gap-1">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleShuffle}
                  className={`transition-colors ${shuffle ? 'text-primary-500' : 'text-dark-400 hover:text-white'}`}
                  title="Mode aléatoire"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
                  </svg>
                </button>
                <button onClick={previous} className="text-dark-400 hover:text-white transition-colors" title="Précédent">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
                </button>
                <button
                  onClick={isPlaying ? pause : resume}
                  className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-primary-500/30"
                >
                  {isPlaying ? (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                  ) : (
                    <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  )}
                </button>
                <button onClick={next} className="text-dark-400 hover:text-white transition-colors" title="Suivant">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
                </button>
                <button
                  onClick={toggleRepeat}
                  className={`transition-colors ${repeat !== 'off' ? 'text-primary-500' : 'text-dark-400 hover:text-white'}`}
                  title={repeat === 'off' ? 'Répéter' : repeat === 'all' ? 'Répéter tout' : 'Répéter un'}
                >
                  {repeatIcon}
                </button>
              </div>
              <div className="flex items-center gap-2 w-full max-w-md">
                <span className="text-xs text-dark-400 w-10 text-right">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={(e) => seek(Number(e.target.value))}
                  className="flex-1 h-1 bg-dark-600 rounded-full appearance-none cursor-pointer accent-primary-500 hover:accent-primary-400 transition-all"
                />
                <span className="text-xs text-dark-400 w-10">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Volume + Queue toggle */}
            <div className="flex items-center gap-3 w-44 justify-end">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-dark-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                </svg>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-20 h-1 bg-dark-600 rounded-full appearance-none cursor-pointer accent-primary-500"
                />
              </div>
              <button
                onClick={() => setShowQueue(!showQueue)}
                className={`relative p-1.5 rounded transition-colors ${showQueue ? 'text-primary-500 bg-dark-800' : 'text-dark-400 hover:text-white'}`}
                title="File d'attente"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                {queue.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-primary-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {queue.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Queue Panel */}
      {showQueue && (
        <div className="fixed bottom-20 right-4 w-80 max-h-96 bg-dark-800/95 backdrop-blur-xl border border-dark-700/50 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700/50 bg-gradient-to-r from-dark-800 to-dark-700/50">
            <h3 className="text-white text-sm font-semibold">File d'attente</h3>
            <span className="text-dark-400 text-xs">{queue.length} morceau(x)</span>
          </div>
          <div className="overflow-y-auto max-h-80">
            {queue.length === 0 ? (
              <p className="text-dark-400 text-sm text-center py-8">File d'attente vide</p>
            ) : (
              queue.map((track, i) => (
                <div
                  key={`${track.id}-${i}`}
                  className={`flex items-center gap-3 px-4 py-2.5 hover:bg-dark-700/50 transition-colors ${i === queueIndex ? 'bg-primary-500/10 border-l-2 border-primary-500' : ''}`}
                >
                  <span className="text-dark-500 text-xs w-5 text-right">{i + 1}</span>
                  {track.coverUrl ? (
                    <img src={track.coverUrl} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 bg-dark-600 rounded flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-dark-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></svg>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm truncate ${i === queueIndex ? 'text-primary-400' : 'text-white'}`}>{track.title}</p>
                    <p className="text-dark-400 text-xs truncate">{track.artist.artistName}</p>
                  </div>
                  <button
                    onClick={() => removeFromQueue(i)}
                    className="text-dark-500 hover:text-red-400 transition-colors flex-shrink-0"
                    title="Retirer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
