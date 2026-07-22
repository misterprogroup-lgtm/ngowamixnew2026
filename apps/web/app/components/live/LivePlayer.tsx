'use client';

import { useState, useEffect, useRef } from 'react';

interface LivePlayerProps {
  streamUrl?: string;
  isLive: boolean;
  title: string;
  artistName: string;
  viewerCount: number;
}

export default function LivePlayer({ streamUrl, isLive, title, artistName, viewerCount }: LivePlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!streamUrl || !isLive || !videoRef.current) return;

    const video = videoRef.current;
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
    } else {
      import('hls.js').then(({ default: Hls }) => {
        if (Hls.isSupported() && videoRef.current) {
          const hls = new Hls();
          hls.loadSource(streamUrl);
          hls.attachMedia(videoRef.current);
          hls.on(Hls.Events.ERROR, () => setError('Erreur de lecture du flux'));
        }
      }).catch(() => setError('Lecteur non disponible'));
    }
  }, [streamUrl, isLive]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => setError('Impossible de lire le flux'));
    }
    setPlaying(!playing);
  };

  return (
    <div className="bg-dark-900 rounded-xl overflow-hidden">
      <div className="relative aspect-video bg-dark-800">
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted={!playing} />

        {!isLive && (
          <div className="absolute inset-0 flex items-center justify-center bg-dark-800/80">
            <div className="text-center">
              <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-dark-400" fill="currentColor" viewBox="0 0 24 24"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" /></svg>
              </div>
              <p className="text-dark-400 font-medium">Stream pas encore lancé</p>
              <p className="text-dark-400 text-sm mt-1">L&apos;artiste commencera bientôt</p>
            </div>
          </div>
        )}

        {isLive && (
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse flex items-center gap-1.5">
              <span className="w-2 h-2 bg-white rounded-full" />
              LIVE
            </span>
            <span className="bg-dark-900/60 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" /></svg>
              {viewerCount}
            </span>
          </div>
        )}

        {isLive && (
          <button
            onClick={togglePlay}
            className="absolute bottom-3 right-3 w-12 h-12 bg-primary-500 hover:bg-primary-600 rounded-full flex items-center justify-center text-white transition-colors shadow-lg"
          >
            {playing ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
            ) : (
              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>
        )}

        {error && (
          <div className="absolute bottom-3 left-3 bg-red-500/90 text-white text-xs px-3 py-1.5 rounded-lg">{error}</div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-white font-semibold">{title}</h3>
        <p className="text-dark-400 text-sm">{artistName}</p>
      </div>
    </div>
  );
}
