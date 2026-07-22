'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePlayer } from '../components/player/PlayerContext';
import { api, type Track, type ArtistProfile, type Album, type PaginatedResponse } from '../lib/api';
import { toPlayerTrack } from '../lib/player-utils';
import { Search, ChevronLeft, ChevronRight, Loader2, Plus } from 'lucide-react';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const { play, addToQueue } = usePlayer();

  const [input, setInput] = useState(query);
  const [results, setResults] = useState<{ tracks: Track[]; artists: ArtistProfile[]; albums: Album[] }>({ tracks: [], artists: [], albums: [] });
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'tracks' | 'artists' | 'albums'>('tracks');
  const [trackPage, setTrackPage] = useState(1);
  const [albumPage, setAlbumPage] = useState(1);
  const [trackTotal, setTrackTotal] = useState(0);
  const [albumTotal, setAlbumTotal] = useState(0);

  const search = useCallback(async (tp: number, ap: number) => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const [tracksRes, artistsRes, albumsRes] = await Promise.allSettled([
        api.get<PaginatedResponse<Track>>(`/music/tracks?search=${encodeURIComponent(query)}&limit=10&page=${tp}`),
        api.get<{ data: ArtistProfile[] } | ArtistProfile[]>(`/artists?search=${encodeURIComponent(query)}&limit=8`),
        api.get<PaginatedResponse<Album>>(`/albums?search=${encodeURIComponent(query)}&limit=8&page=${ap}`),
      ]);

      if (tracksRes.status === 'fulfilled') {
        setResults(prev => ({ ...prev, tracks: tracksRes.value.data || [] }));
        setTrackTotal(tracksRes.value.meta?.total || 0);
      }
      if (artistsRes.status === 'fulfilled') {
        const data = Array.isArray(artistsRes.value) ? artistsRes.value : (artistsRes.value as any).data || [];
        setResults(prev => ({ ...prev, artists: data }));
      }
      if (albumsRes.status === 'fulfilled') {
        setResults(prev => ({ ...prev, albums: albumsRes.value.data || [] }));
        setAlbumTotal(albumsRes.value.meta?.total || 0);
      }
    } catch {
      setResults({ tracks: [], artists: [], albums: [] });
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    setTrackPage(1);
    setAlbumPage(1);
    search(1, 1);
  }, [search]);

  useEffect(() => { search(trackPage, albumPage); }, [trackPage, albumPage, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      router.push(`/recherche?q=${encodeURIComponent(input.trim())}`);
    }
  };

  const playTrack = (track: Track) => {
    play(toPlayerTrack(track), results.tracks.map(toPlayerTrack));
  };

  const trackTotalPages = Math.ceil(trackTotal / 10);
  const albumTotalPages = Math.ceil(albumTotal / 8);

  return (
    <>
      <form onSubmit={handleSearch} className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
        <input
          type="text" value={input} onChange={e => setInput(e.target.value)}
          placeholder="Rechercher des morceaux, artistes, albums..."
          className="input-field w-full pl-12 pr-4 py-3.5 text-lg"
        />
      </form>

      {(query || loading) && (
        <>
          <h1 className="text-3xl font-bold text-white mb-2">
            {query ? `Résultats pour "${query}"` : 'Recherche'}
          </h1>
          <p className="text-dark-400 mb-8">
            {loading ? 'Recherche en cours...' : `${(trackTotal + results.artists.length + albumTotal).toLocaleString()} résultat(s)`}
          </p>

          <div className="flex gap-1 mb-6 bg-dark-800/50 rounded-lg p-1 w-fit">
            {([
              { key: 'tracks' as const, label: 'Morceaux', count: trackTotal },
              { key: 'artists' as const, label: 'Artistes', count: results.artists.length },
              { key: 'albums' as const, label: 'Albums', count: albumTotal },
            ]).map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t.key ? 'bg-primary-600 text-white' : 'text-dark-300 hover:bg-dark-700/50'}`}>
                {t.label} ({t.count})
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-dark-800/50 rounded-xl">
                  <div className="w-12 h-12 bg-dark-700/50 rounded-lg" />
                  <div className="flex-1 space-y-2"><div className="h-4 bg-dark-700/50 rounded w-2/3" /><div className="h-3 bg-dark-700/50 rounded w-1/3" /></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {tab === 'tracks' && (
                <div className="space-y-2">
                  {results.tracks.length === 0 ? (
                    <p className="text-center text-dark-400 py-8">Aucun morceau trouvé</p>
                  ) : (
                    <>
                      {results.tracks.map((track) => (
                        <div key={track.id} className="group flex items-center gap-4 p-4 bg-dark-800/50 rounded-xl hover:bg-dark-700/50 transition-colors cursor-pointer" onClick={() => playTrack(track)}>
                          <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {track.coverUrl ? <img src={track.coverUrl} alt="" className="w-full h-full object-cover" />
                              : <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></svg>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">{track.title}</p>
                            <p className="text-sm text-dark-400">{track.artist.artistName} · {track.playCount.toLocaleString()} écoutes</p>
                          </div>
                          <button onClick={e => { e.stopPropagation(); addToQueue(toPlayerTrack(track)); }}
                            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium transition-opacity">
                            <Plus className="w-4 h-4" /> File
                          </button>
                        </div>
                      ))}
                      {trackTotalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-4">
                          <button onClick={() => setTrackPage(p => Math.max(1, p - 1))} disabled={trackPage <= 1}
                            className="p-2 rounded-lg bg-dark-800/50 text-dark-300 hover:bg-dark-600/50 disabled:opacity-30 transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <span className="text-sm text-dark-400">Page {trackPage} / {trackTotalPages}</span>
                          <button onClick={() => setTrackPage(p => Math.min(trackTotalPages, p + 1))} disabled={trackPage >= trackTotalPages}
                            className="p-2 rounded-lg bg-dark-800/50 text-dark-300 hover:bg-dark-600/50 disabled:opacity-30 transition-colors">
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {tab === 'artists' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {results.artists.length === 0 ? (
                    <p className="col-span-full text-center text-dark-400 py-8">Aucun artiste trouvé</p>
                  ) : (
                    results.artists.map((artist) => (
                      <Link key={artist.id} href={`/artistes/${artist.slug}`} className="bg-dark-800/50 rounded-xl p-4 hover:shadow-md transition-shadow text-center">
                        <div className="w-16 h-16 bg-primary-500 rounded-full mx-auto mb-3 flex items-center justify-center overflow-hidden">
                          {artist.user?.avatarUrl ? <img src={artist.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                            : <span className="text-xl text-white font-bold">{artist.artistName.charAt(0)}</span>}
                        </div>
                        <p className="font-medium text-white truncate">{artist.artistName}</p>
                        <p className="text-xs text-dark-400">{artist.followerCount} abonné{artist.followerCount !== 1 ? 's' : ''}</p>
                      </Link>
                    ))
                  )}
                </div>
              )}

              {tab === 'albums' && (
                <div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {results.albums.length === 0 ? (
                      <p className="col-span-full text-center text-dark-400 py-8">Aucun album trouvé</p>
                    ) : (
                      results.albums.map((album) => (
                        <Link key={album.id} href={`/albums/${album.slug}`} className="bg-dark-800/50 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                          <div className="aspect-square bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                            {album.coverUrl ? <img src={album.coverUrl} alt="" className="w-full h-full object-cover" />
                              : <svg className="w-12 h-12 text-white/60" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></svg>}
                          </div>
                          <div className="p-3">
                            <p className="font-medium text-white truncate text-sm">{album.title}</p>
                            <p className="text-xs text-dark-400">{album.artist.artistName}</p>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                  {albumTotalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-4">
                      <button onClick={() => setAlbumPage(p => Math.max(1, p - 1))} disabled={albumPage <= 1}
                        className="p-2 rounded-lg bg-dark-800/50 text-dark-300 hover:bg-dark-600/50 disabled:opacity-30 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="text-sm text-dark-400">Page {albumPage} / {albumTotalPages}</span>
                      <button onClick={() => setAlbumPage(p => Math.min(albumTotalPages, p + 1))} disabled={albumPage >= albumTotalPages}
                        className="p-2 rounded-lg bg-dark-800/50 text-dark-300 hover:bg-dark-600/50 disabled:opacity-30 transition-colors">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      {!query && !loading && (
        <div className="text-center py-20">
          <Search className="w-16 h-16 text-dark-200 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-dark-700 mb-2">Que souhaitez-vous écouter ?</h2>
          <p className="text-dark-400">Recherchez des morceaux, artistes ou albums</p>
        </div>
      )}
    </>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <Suspense fallback={
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
            <p className="text-dark-400 mt-4">Chargement...</p>
          </div>
        }>
          <SearchContent />
        </Suspense>
      </div>
    </div>
  );
}
