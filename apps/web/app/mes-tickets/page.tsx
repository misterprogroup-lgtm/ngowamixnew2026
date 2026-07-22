'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../components/auth/AuthContext';
import { api } from '../lib/api';

interface Ticket {
  id: string;
  quantity: number;
  totalPaid: number;
  qrCode: string;
  qrImage?: string | null;
  status: string;
  createdAt: string;
  concert: {
    title: string;
    venue: string;
    city: string;
    date: string;
    time: string | null;
    artist: { artistName: string; slug: string };
  };
}

export default function MyTicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await api.get<Ticket[]>('/concerts/my-tickets');
        setTickets(Array.isArray(res) ? res : []);
      } catch {
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchTickets();
    else setLoading(false);
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Connectez-vous</h2>
          <p className="text-dark-400 mb-4">Vous devez être connecté pour voir vos tickets.</p>
          <Link href="/connexion" className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">Se connecter</Link>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-emerald-500/20 text-emerald-300',
    USED: 'bg-dark-700 text-dark-300',
    CANCELLED: 'bg-red-500/20 text-red-300',
  };

  const statusLabels: Record<string, string> = {
    ACTIVE: 'Valide',
    USED: 'Utilisé',
    CANCELLED: 'Annulé',
  };

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-white mb-6">Mes billets</h1>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-dark-700 rounded-xl animate-pulse" />)}
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-dark-800/50 rounded-xl p-12 text-center">
            <svg className="w-16 h-16 text-dark-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
            <h3 className="text-lg font-semibold text-white mb-2">Aucun billet</h3>
            <p className="text-dark-400 text-sm mb-4">Vous n&apos;avez pas encore acheté de billet.</p>
            <Link href="/concerts" className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors inline-block">Voir les concerts</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map(ticket => (
              <div key={ticket.id} className="bg-dark-800/50 rounded-xl overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  <div className="flex-1 p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[ticket.status] || statusColors.ACTIVE}`}>
                        {statusLabels[ticket.status] || ticket.status}
                      </span>
                      <span className="text-xs text-dark-400">×{ticket.quantity}</span>
                    </div>
                    <h3 className="font-semibold text-white mb-1">{ticket.concert.title}</h3>
                    <p className="text-sm text-primary-600">{ticket.concert.artist.artistName}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-dark-400">
                      <span>{new Date(ticket.concert.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      {ticket.concert.time && <span>{ticket.concert.time}</span>}
                      <span>{ticket.concert.venue}, {ticket.concert.city}</span>
                    </div>
                    <p className="text-sm font-bold text-white mt-2">{ticket.totalPaid.toLocaleString('fr-FR')} FCFA</p>
                  </div>
                  <div className="sm:w-40 flex items-center justify-center p-4 bg-dark-900 border-t sm:border-t-0 sm:border-l border-dark-700/50">
                    <div className="text-center">
                      {ticket.qrImage ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={ticket.qrImage}
                            alt={`QR Code billet ${ticket.concert.title}`}
                            className="w-28 h-28 rounded-lg mx-auto mb-2 bg-dark-800/50 p-1"
                          />
                          <p className="text-[10px] text-dark-400 font-mono">{ticket.id.slice(0, 8).toUpperCase()}</p>
                        </>
                      ) : (
                        <>
                          <div className="w-20 h-20 bg-dark-900 rounded-lg flex items-center justify-center mb-2">
                            <div className="text-white text-[8px] font-mono break-all px-2 leading-tight text-center">{ticket.qrCode?.slice(0, 16)}</div>
                          </div>
                          <p className="text-[10px] text-dark-400">{ticket.id.slice(0, 8).toUpperCase()}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
