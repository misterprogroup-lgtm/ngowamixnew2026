import type { Track } from './types';

export interface PlayerTrack {
  id: string;
  title: string;
  audioUrl: string;
  coverUrl?: string;
  artist: { artistName: string; slug: string };
}

export function toPlayerTrack(track: Track): PlayerTrack {
  return {
    id: track.id,
    title: track.title,
    audioUrl: `/api/music/stream/${track.id}`,
    coverUrl: track.coverUrl || undefined,
    artist: { artistName: track.artist.artistName, slug: track.artist.slug },
  };
}
