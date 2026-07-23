'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../components/auth/AuthContext';
import { api } from '../../lib/api';
import ShareButton from '../../components/ui/ShareButton';
import TicketLink from '../../components/ui/TicketLink';
import DownloadButton from '../../components/ui/DownloadButton';
import PaymentModal from '../../components/PaymentModal';
import { AlertTriangle } from 'lucide-react';

interface Concert {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  venue: string;
  city: string;
  country: string;
  date: string;
  time: string | null;
  ticketPrice: number;
  totalSeats: number;
  soldSeats: number;
  status: string;
  artist: {
    id: string;
    artistName: string;
    slug: string;
    user: { name: string; avatar: string | null };
  };
}

interface Ticket {
  id: string;
  quantity: number;
  totalPaid: number;
  qrCode: string;
}

export default function ConcertDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [concert, setConcert] = useState<Concert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [purchasing, setPurchasing] = useState(false);
  const [myTicket, setMyTicket] = useState<Ticket | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    const fetchConcert = async () => {
      try {
        const slug = params.slug as string;
        const data = await api.get<Concert>(`/concerts/${slug}`);
        setConcert(data);
      } catch { setError('Concert non trouvé'); }
      finally { setLoading(false); }
    };
    fetchConcert();
  }, [params.slug]);

  useEffect(() => {
    if (user && concert) {
      api.get<Ticket[]>(`/concerts/${concert.id}/my-tickets`).then((tickets) => {
        if (Array.isArray(tickets) && tickets.length > 0) setMyTicket(tickets[0]);
      }).catch(() => {});
    }
  }, [user, concert]);

  const handlePurchase = async (method: string, phone: string) => {
    if (!concert) return;
    if (!user) { router.push('/connexion'); return; }
    setPurchasing(true);
    try {
      const res = await api.post<{ payment: any; ticket: Ticket; status?: string; message?: string }>(`/payments/concert/${concert.id}`, {
        quantity,
        method,
        phone,
      });
      if (res.status === 'PENDING') {
        alert(res.message || 'Confirmez le paiement sur votre téléphone (USSD)');
      } else {
        setMyTicket(res.ticket);
        setConcert(c => c ? { ...c, soldSeats: c.soldSeats + quantity } : c);
      }
      setShowPaymentModal(false);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'achat');
    } finally { setPurchasing(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 py-8">
        <div className="max-w-4xl mx-auto px-4 space-y-4">
          <div className="h-8 w-48 bg-dark-700/50 rounded animate-pulse" />
          <div className="h-64 bg-dark-700/50 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !concert) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-dark-300 mx-auto mb-3" />
          <p className="text-dark-400 mb-4">{error || 'Concert non trouvé'}</p>
          <Link href="/concerts" className="text-primary-600 hover:text-primary-700 text-sm font-medium">Retour aux concerts</Link>
        </div>
      </div>
    );
  }

  const available = concert.totalSeats - concert.soldSeats;
  const dateObj = new Date(concert.date);

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/concerts" className="text-dark-400 hover:text-dark-300 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{concert.title}</h1>
            <p className="text-primary-600 text-sm">{concert.artist.artistName}</p>
          </div>
          <ShareButton title={concert.title} />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-dark-800/50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Link href={`/artistes/${concert.artist.slug}`} className="w-12 h-12 rounded-full overflow-hidden bg-dark-700/50">
                  {concert.artist.user.avatar ? (
                    <img src={concert.artist.user.avatar} alt={concert.artist.artistName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg font-bold text-primary-500">{concert.artist.artistName.charAt(0)}</div>
                  )}
                </Link>
                <div>
                  <Link href={`/artistes/${concert.artist.slug}`} className="font-semibold text-white hover:text-primary-600 transition-colors">{concert.artist.artistName}</Link>
                  <p className="text-xs text-dark-400">Artiste</p>
                </div>
              </div>
              {concert.description && <p className="text-dark-300 text-sm leading-relaxed">{concert.description}</p>}
            </div>

            <div className="bg-dark-800/50 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-white mb-3 uppercase tracking-wide">Lien billetterie</h2>
              <TicketLink artistSlug={concert.artist.slug} />
            </div>

            <div className="bg-dark-800/50 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-white mb-3 uppercase tracking-wide">Détails</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div><span className="text-dark-400">Date</span><p className="font-medium text-white">{dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
                <div><span className="text-dark-400">Heure</span><p className="font-medium text-white">{concert.time || 'À confirmer'}</p></div>
                <div><span className="text-dark-400">Lieu</span><p className="font-medium text-white">{concert.venue}</p></div>
                <div><span className="text-dark-400">Ville</span><p className="font-medium text-white">{concert.city}, {concert.country}</p></div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-dark-800/50 rounded-xl p-6">
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-primary-600">{concert.ticketPrice.toLocaleString('fr-FR')} <span className="text-sm font-normal text-dark-400">FCFA</span></p>
                <p className={`text-sm mt-1 ${available > 10 ? 'text-green-600' : available > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                  {available > 0 ? `${available} place(s) restante(s)` : 'Complet'}
                </p>
              </div>

              {myTicket ? (
                <div className="text-center">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-3">
                    <p className="text-green-700 text-sm font-medium mb-1">Vous avez un billet !</p>
                    <p className="text-xs text-green-600">×{myTicket.quantity} · {myTicket.totalPaid.toLocaleString('fr-FR')} FCFA</p>
                  </div>
                  <p className="text-xs text-dark-400 mb-2">QR Code:</p>
                  <div className="bg-dark-900 rounded-lg p-3 inline-block">
                    <div className="w-24 h-24 bg-dark-800/50 rounded-lg flex items-center justify-center">
                      <span className="text-white text-[8px] font-mono break-all px-2 text-center">{myTicket.qrCode}</span>
                    </div>
                  </div>
                  <Link href="/mes-tickets" className="block mt-3 text-xs text-primary-600 hover:text-primary-700 font-medium">Voir mes billets</Link>
                </div>
              ) : available > 0 ? (
                <>
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-full bg-dark-700/50 text-dark-300 flex items-center justify-center hover:bg-dark-600/50">-</button>
                    <span className="text-lg font-bold text-white w-8 text-center">{quantity}</span>
                    <button onClick={() => setQuantity(Math.min(available, quantity + 1))} className="w-8 h-8 rounded-full bg-dark-700/50 text-dark-300 flex items-center justify-center hover:bg-dark-600/50">+</button>
                  </div>
                  <button onClick={() => setShowPaymentModal(true)}
                    className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-xl font-medium transition-colors">
                    Acheter · {(concert.ticketPrice * quantity).toLocaleString('fr-FR')} FCFA
                  </button>
                </>
              ) : (
                <button disabled className="w-full bg-dark-700/50 text-dark-400 py-3 rounded-xl font-medium cursor-not-allowed">Complet</button>
              )}
            </div>

            <DownloadButton trackId={concert.id} className="bg-dark-800/50 rounded-xl p-4 flex items-center justify-center gap-2 text-dark-300 hover:text-primary-400" />
          </div>
        </div>
      </div>

      {showPaymentModal && (
        <PaymentModal
          amount={concert.ticketPrice}
          title="Acheter un billet"
          onConfirm={handlePurchase}
          onClose={() => !purchasing && setShowPaymentModal(false)}
          quantity={quantity}
          onQuantityChange={setQuantity}
        />
      )}
    </div>
  );
}
