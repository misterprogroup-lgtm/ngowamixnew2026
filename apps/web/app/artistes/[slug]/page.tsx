'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePlayer } from '../../components/player/PlayerContext';
import { api, type ArtistProfile, type Track, type Album } from '../../lib/api';
import FollowButton from '../../components/ui/FollowButton';
import LikeButton from '../../components/ui/LikeButton';
import ShareButton from '../../components/ui/ShareButton';
import { toPlayerTrack } from '../../lib/player-utils';
import { Disc3, Ticket, Plus } from 'lucide-react';

interface ConcertSummary {
  id: string;
  title: string;
  slug: string;
  venue: string;
  city: string;
  date: string;
  ticketPrice: number;
  totalSeats: number;
  soldSeats: number;
}

export default function ArtistProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { play, addToQueue } = usePlayer();
  const [artist, setArtist] = useState<ArtistProfile | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [concerts, setConcerts] = useState<ConcertSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState('');

  useEffect(() => {
    params.then(({ slug: s }) => setSlug(s));
  }, [params]);

  useEffect(() => {
    if (!slug) return;
    const fetchData = async () => {
      try {
        const data = await api.get<ArtistProfile>(`/artists/${slug}`);
        setArtist(data);
        if (data.tracks) setTracks(data.tracks);
        if (data.albums) setAlbums(data.albums);
      } catch {
        setArtist(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  const playTrack = (track: Track) => {
    play(toPlayerTrack(track), tracks.map(toPlayerTrack));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900">
        <div className="h-64 bg-dark-700/50 animate-pulse" />
        <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-10">
          <div className="w-32 h-32 bg-dark-700/50 rounded-full animate-pulse" />
          <div className="h-8 bg-dark-700/50 rounded w-1/3 mt-6 animate-pulse" />
          <div className="h-4 bg-dark-700/50 rounded w-1/4 mt-4 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Artiste non trouvé</h1>
          <Link href="/artistes" className="text-primary-600 hover:text-primary-700">Retour aux artistes</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <div className="h-64 bg-gradient-to-r from-primary-600 to-primary-800 relative">
        {artist.bannerUrl && <img src={artist.bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
          <div className="w-32 h-32 bg-primary-500 rounded-full border-4 border-white flex items-center justify-center shadow-lg overflow-hidden">
            {artist.user?.avatarUrl ? (
              <img src={artist.user.avatarUrl} alt={artist.artistName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl text-white font-bold">{artist.artistName.charAt(0)}</span>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white">{artist.artistName}</h1>
            {(artist.user.country || artist.user.city) && (
              <p className="text-dark-300 mt-1">{[artist.user.country, artist.user.city].filter(Boolean).join(', ')}</p>
            )}
            <p className="text-dark-500 mt-1">{artist.followerCount.toLocaleString()} abonné{artist.followerCount !== 1 ? 's' : ''}</p>
          </div>

          <div className="flex items-center gap-3">
            <FollowButton artistId={artist.id} initialCount={artist.followerCount} />
            <ShareButton title={artist.artistName} iconOnly />
          </div>
        </div>

        {artist.bio && (
          <div className="mt-8 bg-dark-800/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">À propos</h2>
            <p className="text-dark-300">{artist.bio}</p>
          </div>
        )}

        {artist.genres.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Genres</h2>
            <div className="flex flex-wrap gap-2">
              {artist.genres.map((genre) => (
                <span key={genre} className="bg-primary-100 text-primary-700 px-4 py-2 rounded-full font-medium">{genre}</span>
              ))}
            </div>
          </div>
        )}

        {albums.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Albums ({albums.length})</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {albums.map((album) => (
                <Link key={album.id} href={`/albums/${album.slug}`} className="bg-dark-800/50 rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
                  <div className="aspect-square bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                    {album.coverUrl ? (
                      <img src={album.coverUrl} alt={album.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <Disc3 className="w-12 h-12 text-white/60" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-white truncate text-sm">{album.title}</p>
                    <p className="text-xs text-dark-400">{album.trackCount || 0} morceau{(album.trackCount || 0) !== 1 ? 'x' : ''}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {tracks.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Morceaux</h2>
            <div className="space-y-2">
              {tracks.map((track) => (
                <div key={track.id} className="group flex items-center gap-4 p-4 bg-dark-800/50 rounded-xl hover:bg-dark-700/50 transition-colors cursor-pointer" onClick={() => playTrack(track)}>
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {track.coverUrl ? (
                      <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{track.title}</p>
                    <p className="text-sm text-dark-500">{track.playCount.toLocaleString()} écoutes</p>
                  </div>
                  {track.genre && <span className="text-xs bg-dark-700/50 text-dark-300 px-2 py-1 rounded-full hidden sm:inline">{track.genre}</span>}
                  <LikeButton trackId={track.id} initialCount={track.likeCount} size="sm" />
                  <button onClick={e => { e.stopPropagation(); addToQueue(toPlayerTrack(track)); }}
                    className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium transition-opacity">
                    <Plus className="w-4 h-4" /> File
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 mb-12">
          <div className="flex flex-wrap gap-4">
            {artist.socialLinks && Object.entries(artist.socialLinks).length > 0 && (
              <div className="w-full mb-2">
                <h3 className="text-sm font-medium text-dark-500 mb-2">Réseaux sociaux</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(artist.socialLinks).map(([platform, url]) => (
                    <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                      className="btn-outline px-4 py-2 rounded-lg text-sm font-medium">
                      {platform}
                    </a>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-4">
              <Link href={`/concerts`} className="btn-outline px-5 py-2.5 rounded-xl font-medium flex items-center gap-2">
                <Ticket className="w-4 h-4" /> Concerts
              </Link>
              <Link href={`/lives`} className="btn-outline px-5 py-2.5 rounded-xl font-medium">
                Lives à venir
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
