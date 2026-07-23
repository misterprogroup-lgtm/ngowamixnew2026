'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, type PaginatedResponse } from '../../lib/api';
import { useAuth } from '../../components/auth/AuthContext';
import PaymentModal from '../../components/PaymentModal';
import { Calendar, MapPin, Users, Music, ExternalLink } from 'lucide-react';

interface Concert {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverUrl?: string;
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
    user: { name: string; avatarUrl: string | null };
  };
}

interface Ticket {
  id: string;
  quantity: number;
  totalPaid: number;
  qrCode: string;
}

export default function TicketPage() {
  const params = useParams();
  const { user } = useAuth();
  const artistSlug = params.slug as string;
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConcert, setSelectedConcert] = useState<Concert | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [myTickets, setMyTickets] = useState<Record<string, Ticket>>({});

  useEffect(() => {
    const fetchConcerts = async () => {
      try {
        const res = await api.get<PaginatedResponse<Concert>>(`/concerts?artistSlug=${artistSlug}`);
        setConcerts(res.data || []);
      } catch {
        setConcerts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchConcerts();
  }, [artistSlug]);

  useEffect(() => {
    if (!user || concerts.length === 0) return;
    for (const concert of concerts) {
      api.get<Ticket[]>(`/concerts/${concert.id}/my-tickets`).then((tickets) => {
        if (Array.isArray(tickets) && tickets.length > 0) {
          setMyTickets(prev => ({ ...prev, [concert.id]: tickets[0] }));
        }
      }).catch(() => {});
    }
  }, [user, concerts]);

  const handlePurchase = async (method: string) => {
    if (!selectedConcert || !user) return;
    setPurchasing(true);
    try {
      const res = await api.post<{ payment: any; ticket: Ticket }>(`/payments/concert/${selectedConcert.id}`, {
        quantity,
        method,
      });
      setMyTickets(prev => ({ ...prev, [selectedConcert.id]: res.ticket }));
      setConcerts(prev => prev.map(c =>
        c.id === selectedConcert.id ? { ...c, soldSeats: c.soldSeats + quantity } : c
      ));
      setShowPayment(false);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'achat');
    } finally {
      setPurchasing(false);
    }
  };

  const artistName = concerts[0]?.artist?.artistName || artistSlug;
  const activeConcerts = concerts.filter(c => c.status !== 'COMPLETED' && c.status !== 'CANCELLED');
  const pastConcerts = concerts.filter(c => c.status === 'COMPLETED');

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary-600/20 to-dark-900 border-b border-dark-800">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          {concerts[0]?.artist?.user?.avatarUrl ? (
            <img src={concerts[0].artist.user.avatarUrl} alt={artistName} className="w-20 h-20 rounded-full mx-auto mb-4 object-cover ring-2 ring-primary-500" />
          ) : (
            <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center ring-2 ring-primary-500">
              <span className="text-2xl font-bold text-white">{artistName.charAt(0)}</span>
            </div>
          )}
          <h1 className="text-3xl font-bold text-white">{artistName}</h1>
          <p className="text-dark-400 mt-2">Billets & Concerts</p>
          <p className="text-xs text-dark-500 mt-1">{artistSlug}ticket.ngowamix.com</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="space-y-6">
            {[1, 2].map(i => (
              <div key={i} className="animate-pulse bg-dark-800/50 rounded-xl p-6">
                <div className="h-6 bg-dark-700/50 rounded w-2/3 mb-4" />
                <div className="h-4 bg-dark-700/50 rounded w-1/2 mb-2" />
                <div className="h-4 bg-dark-700/50 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : concerts.length === 0 ? (
          <div className="text-center py-16">
            <Music className="w-16 h-16 text-dark-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Aucun concert</h2>
            <p className="text-dark-400">Cet artiste n'a pas encore de concert à venir.</p>
          </div>
        ) : (
          <>
            {/* Active concerts */}
            {activeConcerts.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-white mb-4">Concerts à venir</h2>
                <div className="space-y-4">
                  {activeConcerts.map((concert) => {
                    const available = concert.totalSeats - concert.soldSeats;
                    const myTicket = myTickets[concert.id];
                    const dateObj = new Date(concert.date);

                    return (
                      <div key={concert.id} className="bg-dark-800/50 rounded-xl overflow-hidden border border-dark-700/50 hover:border-primary-600/30 transition-colors">
                        {concert.coverUrl && (
                          <img src={concert.coverUrl} alt={concert.title} className="w-full h-40 object-cover" />
                        )}
                        <div className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-bold text-white">{concert.title}</h3>
                              <div className="flex items-center gap-4 mt-2 text-sm text-dark-400">
                                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {dateObj.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}{concert.time ? ` · ${concert.time}` : ''}</span>
                                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {concert.venue}, {concert.city}</span>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-2xl font-bold text-primary-500">{concert.ticketPrice.toLocaleString('fr-FR')} <span className="text-xs font-normal text-dark-400">FCFA</span></p>
                              <p className={`text-xs mt-0.5 ${available > 10 ? 'text-green-500' : available > 0 ? 'text-orange-500' : 'text-red-500'}`}>
                                {available > 0 ? `${available} place(s)` : 'Complet'}
                              </p>
                            </div>
                          </div>

                          {concert.description && (
                            <p className="text-sm text-dark-300 mb-4 line-clamp-2">{concert.description}</p>
                          )}

                          {myTicket ? (
                            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center justify-between">
                              <div>
                                <p className="text-green-400 text-sm font-medium">Billet acheté</p>
                                <p className="text-xs text-dark-400">×{myTicket.quantity} · {myTicket.totalPaid.toLocaleString('fr-FR')} FCFA</p>
                              </div>
                              <Link href="/mes-tickets" className="text-xs text-green-400 hover:text-green-300">Voir</Link>
                            </div>
                          ) : available > 0 ? (
                            <button
                              onClick={() => { setSelectedConcert(concert); setShowPayment(true); setQuantity(1); }}
                              className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-xl font-medium transition-colors"
                            >
                              Acheter un billet
                            </button>
                          ) : (
                            <button disabled className="w-full bg-dark-700/50 text-dark-400 py-3 rounded-xl font-medium cursor-not-allowed">
                              Complet
                            </button>
                          )}

                          <Link
                            href={`/concerts/${concert.slug}`}
                            className="flex items-center justify-center gap-1.5 mt-3 text-xs text-dark-400 hover:text-primary-400 transition-colors"
                          >
                            Voir la page complète <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Past concerts */}
            {pastConcerts.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-dark-400 mb-4">Concerts passés</h2>
                <div className="space-y-3">
                  {pastConcerts.map((concert) => (
                    <div key={concert.id} className="bg-dark-800/30 rounded-xl p-4 opacity-60">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-dark-300">{concert.title}</h3>
                          <p className="text-xs text-dark-500 mt-1">{new Date(concert.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })} · {concert.venue}</p>
                        </div>
                        <span className="text-xs text-dark-500 bg-dark-700/50 px-2 py-1 rounded-full">Terminé</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Branding footer */}
            <div className="mt-12 pt-6 border-t border-dark-800 text-center">
              <p className="text-xs text-dark-500">
                Propulsé par <Link href="/" className="text-primary-500 hover:text-primary-400 font-medium">Ngowamix</Link> ·
                <Link href="/concerts" className="text-dark-400 hover:text-white ml-1">Tous les concerts</Link>
              </p>
            </div>
          </>
        )}
      </div>

      {showPayment && selectedConcert && (
        <PaymentModal
          amount={selectedConcert.ticketPrice}
          title={`Billet · ${selectedConcert.title}`}
          onConfirm={handlePurchase}
          onClose={() => !purchasing && setShowPayment(false)}
          quantity={quantity}
          onQuantityChange={setQuantity}
        />
      )}
    </div>
  );
}
