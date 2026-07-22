'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/auth/AuthContext';
import { api, type PaginatedResponse } from '../../lib/api';
import { ROUTES, FAN_QUICK_LINKS } from '../../lib/routes';
import { Clock, Download, Ticket, Heart, Headphones, PlaySquare } from 'lucide-react';
import QuotaIndicator from '../../components/ui/QuotaIndicator';

interface Ticket {
  id: string;
  quantity: number;
  totalPaid: number;
  qrCode?: string;
  status: string;
  createdAt: string;
  concert: {
    title: string;
    venue: string;
    city: string;
    date: string;
    time?: string;
    artist: { artistName: string; slug: string };
  };
}

export default function FanDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState({ ticketCount: 0, totalSpent: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push(ROUTES.LOGIN);
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const ticketsRes = await api.get<Ticket[]>('/concerts/my-tickets');
        const ticketList = Array.isArray(ticketsRes) ? ticketsRes : [];
        setTickets(ticketList);
        setStats({
          ticketCount: ticketList.length,
          totalSpent: ticketList.reduce((sum: number, t: Ticket) => sum + t.totalPaid, 0),
        });
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-dark-900 py-8">
        <div className="max-w-4xl mx-auto px-4 animate-pulse">
          <div className="h-8 bg-dark-700 rounded w-1/3 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-dark-700 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Mon espace</h1>
          <p className="mt-2 text-dark-300">Bienvenue, {user.pseudo}</p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Link href={ROUTES.FAVORITES} className="card hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-white">Mes favoris</p>
                <p className="text-sm text-dark-400">Morceaux likés</p>
              </div>
            </div>
          </Link>

          <Link href={ROUTES.SUBSCRIPTIONS} className="card hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-white">Abonnement</p>
                <p className="text-sm text-dark-400">{user.subscription?.plan || 'Gratuit'}</p>
              </div>
            </div>
          </Link>

          <Link href={ROUTES.FAN_HISTORY} className="card hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="font-semibold text-white">Historique</p>
                <p className="text-sm text-dark-400">Écoutes récentes</p>
              </div>
            </div>
          </Link>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-white">{stats.ticketCount} ticket(s)</p>
                <p className="text-sm text-dark-400">{stats.totalSpent.toLocaleString('fr-FR')} FCFA dépensés</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quotas du jour */}
        <div className="mb-8">
          <QuotaIndicator />
        </div>

        {/* Quick links */}
        <div className="flex flex-wrap gap-2 mb-8">
          {FAN_QUICK_LINKS.map(link => (
            <Link key={link.href} href={link.href} className="flex items-center gap-1.5 bg-dark-800/50 border border-dark-700 text-dark-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-dark-700/50 transition-colors">
              {link.href === ROUTES.FAN_HISTORY ? <Clock className="w-4 h-4" /> :
               link.href === ROUTES.FAN_DOWNLOADS ? <Download className="w-4 h-4" /> :
               <Ticket className="w-4 h-4" />}
              {link.label}
            </Link>
          ))}
          <Link href={ROUTES.PLAYLISTS} className="flex items-center gap-1.5 bg-dark-800/50 border border-dark-700 text-dark-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-dark-700/50 transition-colors">
            <Headphones className="w-4 h-4" /> Playlists
          </Link>
          <Link href={ROUTES.DISCOVER} className="flex items-center gap-1.5 bg-dark-800/50 border border-dark-700 text-dark-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-dark-700/50 transition-colors">
            <PlaySquare className="w-4 h-4" /> Découvrir
          </Link>
        </div>

        {/* My tickets */}
        <div className="bg-dark-800/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Mes tickets</h2>
            <Link href={ROUTES.CONCERTS} className="text-primary-600 hover:text-primary-300 text-sm font-medium">
              Découvrir des concerts
            </Link>
          </div>

          {tickets.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-dark-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              <p className="text-dark-400 mb-4">Vous n&apos;avez pas encore de tickets</p>
              <Link href={ROUTES.CONCERTS} className="text-primary-600 hover:text-primary-300 font-medium">
                Voir les concerts &rarr;
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center gap-4 p-4 rounded-lg border border-dark-700/50 hover:bg-dark-700/50 transition-colors">
                  <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{ticket.concert.title}</p>
                    <p className="text-sm text-dark-400">
                      {ticket.concert.artist.artistName} • {ticket.concert.venue}, {ticket.concert.city}
                    </p>
                    <p className="text-xs text-dark-400 mt-0.5">
                      {new Date(ticket.concert.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {ticket.concert.time && ` à ${ticket.concert.time}`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium text-white">{ticket.totalPaid.toLocaleString('fr-FR')} FCFA</p>
                    <p className={`text-xs px-2 py-0.5 rounded-full mt-1 ${
                      ticket.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-dark-700 text-dark-400'
                    }`}>
                      {ticket.quantity} ticket(s) • {ticket.status === 'ACTIVE' ? 'Valide' : ticket.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
