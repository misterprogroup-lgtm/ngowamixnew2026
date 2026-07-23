'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../components/auth/AuthContext';
import { usePlayer } from '../../components/player/PlayerContext';
import { api, type Album, type Track } from '../../lib/api';
import { Smartphone, CreditCard, Download, Check, Loader2, ShoppingCart } from 'lucide-react';
import { toPlayerTrack } from '../../lib/player-utils';
import ShareButton from '../../components/ui/ShareButton';
import PaymentModal from '../../components/PaymentModal';

export default function AlbumDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user } = useAuth();
  const { play, addToQueue } = usePlayer();
  const [album, setAlbum] = useState<Album & { _count?: { albumTracks: number; albumPurchases: number } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [error, setError] = useState('');
  const [downloadStates, setDownloadStates] = useState<Record<string, boolean>>({});
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    const fetchAlbum = async () => {
      try {
        const data = await api.get<Album & { _count?: { albumTracks: number; albumPurchases: number } }>(`/albums/${slug}`);
        setAlbum(data);
        try {
          const purchases = await api.get<{ data: any[] }>('/albums/my-purchases');
          const list = purchases.data ?? purchases ?? [];
          if (Array.isArray(list)) setPurchased(list.some((p: any) => p.albumId === data.id));
        } catch {}
      } catch {
        setAlbum(null);
      } finally {
        setLoading(false);
      }
    };
    fetchAlbum();
  }, [slug]);

  const handlePurchase = async (method: string, phone: string) => {
    if (!album) return;
    if (!user) { router.push('/connexion'); return; }
    setPurchasing(true);
    setError('');
    try {
      const res = await api.post<{ payment?: any; status?: string; message?: string }>(`/payments/album/${album.id}`, { method, phone });
      if (res.status === 'PENDING' || res.status === 'ACCEPTED') {
        pollPaymentStatus(res.payment?.id);
      } else {
        setPurchased(true);
        setPurchaseSuccess(true);
        setTimeout(() => setPurchaseSuccess(false), 4000);
      }
      setShowPaymentModal(false);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'achat');
    } finally {
      setPurchasing(false);
    }
  };

  const pollPaymentStatus = async (paymentId: string) => {
    if (!paymentId) return;
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const payment = await api.get<{ id: string; status: string }>(`/payments/${paymentId}/status`);
        if (payment.status === 'COMPLETED') {
          clearInterval(interval);
          setPurchased(true);
          setPurchaseSuccess(true);
          setTimeout(() => setPurchaseSuccess(false), 4000);
        } else if (payment.status === 'FAILED' || attempts >= 20) {
          clearInterval(interval);
          if (payment.status === 'FAILED') setError('Le paiement a échoué.');
        }
      } catch { /* retry */ }
    }, 3000);
  };

  const playAll = () => {
    if (!album?.albumTracks) return;
    const allTracks = album.albumTracks.map((at) => ({
      id: at.track.id,
      title: at.track.title,
      audioUrl: `/api/music/stream/${at.track.id}`,
      coverUrl: at.track.coverUrl || album.coverUrl || undefined,
      artist: { artistName: album.artist.artistName, slug: album.artist.slug },
    }));
    if (allTracks.length > 0) play(allTracks[0], allTracks);
  };

  const playTrack = (track: Track) => {
    play(toPlayerTrack(track), tracks.map(toPlayerTrack));
  };

  const handleDownload = async (e: React.MouseEvent, trackId: string, title: string) => {
    e.stopPropagation();
    if (downloadStates[trackId]) return;
    setDownloadStates(prev => ({ ...prev, [trackId]: true }));
    try {
      const result = await api.post<{ allowed: boolean; quotaExceeded?: boolean; message?: string }>(`/music/download/${trackId}`);
      if (result.allowed) {
        window.location.href = `/api/music/stream/${trackId}?download=true`;
        setTimeout(() => setDownloadStates(prev => ({ ...prev, [trackId]: false })), 3000);
      } else {
        alert(result.message || 'Limite de téléchargements atteinte');
        setDownloadStates(prev => ({ ...prev, [trackId]: false }));
      }
    } catch (err: any) {
      alert(err.message || 'Erreur lors du téléchargement');
      setDownloadStates(prev => ({ ...prev, [trackId]: false }));
    }
  };

  const downloadAll = async () => {
    for (const track of tracks) {
      if (downloadStates[track.id]) continue;
      setDownloadStates(prev => ({ ...prev, [track.id]: true }));
      try {
        const result = await api.post<{ allowed: boolean }>(`/music/download/${track.id}`);
        if (result.allowed) {
          window.location.href = `/api/music/stream/${track.id}?download=true`;
        }
      } catch {}
      setDownloadStates(prev => ({ ...prev, [track.id]: false }));
      await new Promise(r => setTimeout(r, 500));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 py-8">
        <div className="max-w-4xl mx-auto px-4 animate-pulse">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-72 aspect-square bg-dark-700/50 rounded-xl" />
            <div className="flex-1 space-y-4">
              <div className="h-8 bg-dark-700/50 rounded w-1/2" />
              <div className="h-5 bg-dark-700/50 rounded w-1/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Album non trouvé</h2>
          <Link href="/albums" className="text-primary-600 hover:text-primary-700">Retour aux albums</Link>
        </div>
      </div>
    );
  }

  const tracks = album.albumTracks?.map((at) => at.track) ?? [];
  const canListen = album.isFree || purchased;

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="mb-6">
          <Link href="/albums" className="text-primary-600 hover:text-primary-700 text-sm">&larr; Retour aux albums</Link>
        </div>

        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <div className="w-full md:w-72 aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-primary-400 to-primary-600 flex-shrink-0">
            {album.coverUrl ? (
              <img src={album.coverUrl} alt={album.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-20 h-20 text-white/60" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></svg>
              </div>
            )}
          </div>

          <div className="flex-1">
            <p className="text-sm text-dark-400 uppercase tracking-wide mb-1">Album</p>
            <h1 className="text-3xl font-bold text-white mb-2">{album.title}</h1>
            <Link href={`/artistes/${album.artist.slug}`} className="text-primary-600 hover:text-primary-700 font-medium">{album.artist.artistName}</Link>
            {album.description && <p className="mt-3 text-dark-300 text-sm leading-relaxed">{album.description}</p>}

            <div className="flex items-center gap-4 mt-4 text-sm text-dark-400">
              <span>{album._count?.albumTracks ?? tracks.length} morceaux</span>
              {album.releaseDate && <span>Sorti le {new Date(album.releaseDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
            </div>

            <div className="mt-6">
              {album.isFree ? (
                <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium">Gratuit</span>
              ) : purchased ? (
                <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium">Acheté</span>
              ) : album.price != null ? (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-white">{album.price.toLocaleString('fr-FR')} FCFA</span>
                    <button onClick={() => setShowPaymentModal(true)} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-full text-sm font-medium disabled:opacity-50 transition-colors">
                      Acheter
                    </button>
                  </div>
              ) : null}
              {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
            </div>

              {canListen && tracks.length > 0 && (
                <div className="flex items-center gap-2 mt-4">
                  <button onClick={playAll} className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    Tout écouter
                  </button>
                  <button onClick={downloadAll} className="bg-dark-700/50 hover:bg-dark-600/50 text-dark-700 px-4 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 transition-colors" title="Télécharger tous les morceaux">
                    <Download className="w-4 h-4" /> Tout télécharger
                  </button>
                  <ShareButton title={album.title} />
                </div>
              )}
          </div>
        </div>

        <div className="bg-dark-800/50 rounded-xl">
          <div className="px-6 py-4 border-b border-dark-100">
            <h2 className="font-semibold text-white">Morceaux</h2>
          </div>
          {tracks.length === 0 ? (
            <div className="p-8 text-center text-dark-400">Aucun morceau dans cet album</div>
          ) : (
            <div className="divide-y divide-dark-50">
              {tracks.map((track, i) => (
                <div
                  key={track.id}
                  className={`group flex items-center gap-4 px-6 py-3 hover:bg-dark-700/50 transition-colors ${!canListen ? 'opacity-60' : 'cursor-pointer'}`}
                  onClick={() => canListen ? playTrack(track) : null}
                >
                  <span className="text-sm text-dark-400 w-6">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{track.title}</p>
                  </div>
                  <span className="text-xs text-dark-400">{track.genre || ''}</span>
                  {!canListen && (
                    <svg className="w-4 h-4 text-dark-300" fill="currentColor" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" /></svg>
                  )}
                  <button onClick={e => { e.stopPropagation(); addToQueue(toPlayerTrack(track)); }}
                    className="text-dark-400 hover:text-primary-600 transition-colors opacity-0 group-hover:opacity-100 text-xs whitespace-nowrap"
                    title="Ajouter à la file">
                    + Queue
                  </button>
                  {canListen && (
                    <button onClick={e => handleDownload(e, track.id, track.title)}
                      className="text-dark-400 hover:text-primary-600 transition-colors opacity-0 group-hover:opacity-100"
                      title="Télécharger">
                      {downloadStates[track.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Purchase success toast */}
      {purchaseSuccess && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
          <Check className="w-5 h-5" /> Achat réussi ! Vous pouvez maintenant écouter et télécharger les morceaux.
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          amount={album.price ?? 0}
          title="Acheter l'album"
          onConfirm={handlePurchase}
          onClose={() => !purchasing && setShowPaymentModal(false)}
        />
      )}
    </div>
  );
}
