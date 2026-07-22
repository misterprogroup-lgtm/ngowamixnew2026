'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePlayer } from '../components/player/PlayerContext';
import { api, type Track, type Album, type PaginatedResponse } from '../lib/api';
import { toPlayerTrack } from '../lib/player-utils';
import { Trophy, Music, Users, Disc3, Play, ListPlus, TrendingUp, Loader2 } from 'lucide-react';

interface ArtistSummary {
  id: string;
  artistName: string;
  slug: string;
  followerCount: number;
  user: { avatarUrl: string | null; pseudo: string };
  _count?: { tracks: number; followers: number };
}

type Tab = 'tracks' | 'artists' | 'albums';

export default function ClassementsPage() {
  const { play, addToQueue } = usePlayer();
  const [activeTab, setActiveTab] = useState<Tab>('tracks');
  const [activeGenre, setActiveGenre] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [artists, setArtists] = useState<ArtistSummary[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<string[]>('/music/genres').then(setGenres).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    if (activeTab === 'tracks') {
      const url = `/music/tracks/trending?limit=50${activeGenre ? `&genre=${activeGenre}` : ''}`;
      api.get<PaginatedResponse<Track>>(url).then(res => { setTracks(res.data || []); }).catch(() => setTracks([])).finally(() => setLoading(false));
    } else if (activeTab === 'artists') {
      api.get<PaginatedResponse<ArtistSummary>>('/artists?limit=50').then(res => { setArtists(res.data || []); }).catch(() => setArtists([])).finally(() => setLoading(false));
    } else {
      api.get<PaginatedResponse<Album>>('/albums/top?limit=50').then(res => { setAlbums(res.data || []); }).catch(() => setAlbums([])).finally(() => setLoading(false));
    }
  }, [activeTab, activeGenre]);

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Classements</h1>
            <p className="text-dark-400">Les morceaux, artistes et albums les plus populaires</p>
          </div>
        </div>

        <div className="flex items-center gap-1 mb-6 bg-dark-800/50 border border-dark-700/50 rounded-xl p-1 w-fit">
          {(['tracks', 'artists', 'albums'] as Tab[]).map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setActiveGenre(''); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab ? 'bg-primary-600 text-white shadow-sm' : 'text-dark-300 hover:text-dark-800'
              }`}
            >
              {tab === 'tracks' ? <Music className="w-4 h-4" /> : tab === 'artists' ? <Users className="w-4 h-4" /> : <Disc3 className="w-4 h-4" />}
              {tab === 'tracks' ? 'Morceaux' : tab === 'artists' ? 'Artistes' : 'Albums'}
            </button>
          ))}
        </div>

        {activeTab === 'tracks' && genres.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button onClick={() => setActiveGenre('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!activeGenre ? 'bg-primary-600 text-white' : 'bg-dark-800/50 border border-dark-700/50 text-dark-300 hover:border-dark-500'}`}
            >Tous</button>
            {genres.map(g => g && (
              <button key={g} onClick={() => setActiveGenre(g)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeGenre === g ? 'bg-primary-600 text-white' : 'bg-dark-800/50 border border-dark-700/50 text-dark-300 hover:border-dark-500'}`}
              >{g}</button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : activeTab === 'tracks' ? (
          <div className="bg-dark-800/50 rounded-xl border border-dark-700/50 overflow-hidden">
            <div className="divide-y divide-dark-700/50">
              {tracks.map((track, i) => (
                <div key={track.id} className="flex items-center gap-4 p-3 hover:bg-dark-700/50 transition-colors group">
                  <span className={`w-8 text-center font-bold text-sm flex-shrink-0 ${i < 3 ? 'text-primary-600' : 'text-dark-400'}`}>
                    {i === 0 ? <Trophy className="w-5 h-5 text-yellow-500 mx-auto" /> : i === 1 ? <Trophy className="w-5 h-5 text-gray-400 mx-auto" /> : i === 2 ? <Trophy className="w-5 h-5 text-amber-700 mx-auto" /> : `#${i + 1}`}
                  </span>
                  <button onClick={() => play(toPlayerTrack(track), tracks.map(toPlayerTrack))}
                    className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded flex items-center justify-center flex-shrink-0 overflow-hidden group-hover:opacity-90 transition-opacity"
                  >
                    {track.coverUrl ? <img src={track.coverUrl} alt="" className="w-full h-full object-cover" /> : <Music className="w-5 h-5 text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <Link href={`/morceaux/${track.slug}`} className="font-medium text-white hover:text-primary-600 transition-colors truncate block">{track.title}</Link>
                    <Link href={`/artistes/${track.artist.slug}`} className="text-xs text-dark-400 hover:text-primary-600 transition-colors">{track.artist.artistName}</Link>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-dark-400">
                    {track.genre && <span className="hidden sm:inline text-dark-400">{track.genre}</span>}
                    <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> {track.playCount.toLocaleString()}</span>
                  </div>
                  <button onClick={() => addToQueue(toPlayerTrack(track))}
                    className="p-1.5 text-dark-300 hover:text-primary-600 opacity-0 group-hover:opacity-100 transition-all" title="Ajouter à la file"
                  ><ListPlus className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'artists' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {artists.map((artist, i) => (
              <Link key={artist.id} href={`/artistes/${artist.slug}`}
                className="bg-dark-800/50 rounded-xl border border-dark-700/50 p-4 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-dark-300 w-6 flex-shrink-0">{i + 1}</span>
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {artist.user?.avatarUrl ? <img src={artist.user.avatarUrl} alt="" className="w-full h-full object-cover" /> : <Users className="w-6 h-6 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate group-hover:text-primary-600 transition-colors">{artist.artistName}</p>
                    <p className="text-sm text-dark-400">{artist.followerCount.toLocaleString()} abonné{artist.followerCount !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {albums.map((album, i) => (
              <Link key={album.id} href={`/albums/${album.slug}`}
                className="bg-dark-800/50 rounded-xl overflow-hidden border border-dark-700/50 hover:shadow-md transition-shadow group"
              >
                <div className="aspect-square bg-gradient-to-br from-dark-700 to-dark-900 relative overflow-hidden">
                  {album.coverUrl ? (
                    <img src={album.coverUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Disc3 className="w-16 h-16 text-dark-400" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
                    #{i + 1}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-white truncate group-hover:text-primary-600 transition-colors">{album.title}</h3>
                  <p className="text-sm text-dark-400">{album.artist?.artistName}</p>
                  <p className="text-xs text-dark-400 mt-1">
                    {album._count?.albumPurchases?.toLocaleString() || 0} achat{(album._count?.albumPurchases || 0) !== 1 ? 's' : ''}
                    {typeof album.price === 'number' && album.price > 0 && !album.isFree && <span className="ml-2 font-medium text-dark-300">{album.price.toLocaleString('fr-FR')} FCFA</span>}
                    {album.isFree && <span className="ml-2 text-green-600 font-medium">Gratuit</span>}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
