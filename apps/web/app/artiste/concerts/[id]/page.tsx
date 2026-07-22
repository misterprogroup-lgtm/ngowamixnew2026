'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../components/auth/AuthContext';
import { api } from '../../../lib/api';
import { ROUTES, concertCheckIn } from '../../../lib/routes';

interface Attendee {
  id: string;
  userId: string;
  concertId: string;
  quantity: number;
  totalPaid: number;
  qrCode: string | null;
  status: string;
  createdAt: string;
  user: {
    id: string;
    pseudo: string;
    avatarUrl: string | null;
    email: string;
  };
}

export default function ConcertAttendeesPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user?.artistProfile) { router.push(ROUTES.HOME); return; }
    fetchAttendees();
  }, [user, authLoading]);

  const fetchAttendees = async () => {
    try {
      const res = await api.get<Attendee[]>(`/concerts/${id}/attendees`);
      setAttendees(Array.isArray(res) ? res : []);
    } catch (err: any) {
      setError(err.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return <div className="min-h-screen bg-dark-900 py-8"><div className="max-w-4xl mx-auto px-4 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-dark-700/50 rounded-xl animate-pulse" />)}</div></div>;
  }

  if (error) {
    return <div className="min-h-screen bg-dark-900 flex items-center justify-center"><p className="text-red-500">{error}</p></div>;
  }

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <Link href={ROUTES.ARTIST_CONCERTS} className="text-dark-400 hover:text-dark-300 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <h1 className="text-2xl font-bold text-white">Participants</h1>
          <div className="flex-1" />
          <Link href={concertCheckIn(id)} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Scanner QR</Link>
        </div>

        {attendees.length === 0 ? (
          <div className="bg-dark-800/50 rounded-xl p-12 text-center">
            <p className="text-dark-400">Aucun participant pour ce concert.</p>
          </div>
        ) : (
          <div className="bg-dark-800/50 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-700/50 text-left">
                    <th className="px-4 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider">Participant</th>
                    <th className="px-4 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider text-center">Places</th>
                    <th className="px-4 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider text-right">Total payé</th>
                    <th className="px-4 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider text-center">Statut</th>
                    <th className="px-4 py-3 text-xs font-medium text-dark-400 uppercase tracking-wider text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700/50">
                  {attendees.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-dark-25 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-600 overflow-hidden flex-shrink-0">
                            {ticket.user.avatarUrl ? (
                              <img src={ticket.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              ticket.user.pseudo?.charAt(0).toUpperCase() || '?'
                            )}
                          </div>
                          <span className="text-sm font-medium text-white">{ticket.user.pseudo || 'Anonyme'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-dark-400">{ticket.user.email}</td>
                      <td className="px-4 py-3 text-sm text-white text-center font-medium">{ticket.quantity}</td>
                      <td className="px-4 py-3 text-sm text-white text-right font-medium">{ticket.totalPaid.toLocaleString('fr-FR')} FCFA</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          ticket.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                          ticket.status === 'USED' ? 'bg-dark-700/50 text-dark-300' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-dark-400 text-right whitespace-nowrap">
                        {new Date(ticket.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
