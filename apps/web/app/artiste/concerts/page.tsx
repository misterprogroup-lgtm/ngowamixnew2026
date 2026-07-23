'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../components/auth/AuthContext';
import { api } from '../../lib/api';
import { concertAttendees } from '../../lib/routes';
import TicketLink from '../../components/ui/TicketLink';

interface Concert {
  id: string;
  title: string;
  slug: string;
  venue: string;
  city: string;
  country: string;
  date: string;
  time: string | null;
  ticketPrice: number;
  totalSeats: number;
  soldSeats: number;
  status: string;
  _count: { tickets: number };
}

export default function ArtistConcertsPage() {
  const { user, loading: authLoading } = useAuth();
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', venue: '', city: '', country: "Côte d'Ivoire", date: '', time: '', ticketPrice: 0, totalSeats: 100 });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchConcerts = async () => {
      try {
        const res = await api.get<Concert[]>('/concerts/my-concerts');
        setConcerts(Array.isArray(res) ? res : []);
      } catch { setConcerts([]); } finally { setLoading(false); }
    };
    if (user?.artistProfile) fetchConcerts();
    else setLoading(false);
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      const concert = await api.post<Concert>('/concerts', formData);
      setConcerts([concert, ...concerts]);
      setShowForm(false);
      setFormData({ title: '', description: '', venue: '', city: '', country: "Côte d'Ivoire", date: '', time: '', ticketPrice: 0, totalSeats: 100 });
    } catch (err: any) { setError(err.message || 'Erreur'); } finally { setCreating(false); }
  };

  const toggleStatus = async (concert: Concert) => {
    const newStatus = concert.status === 'UPCOMING' ? 'CANCELLED' : 'UPCOMING';
    try {
      await api.patch(`/concerts/${concert.id}`, { status: newStatus });
      setConcerts(concerts.map(c => c.id === concert.id ? { ...c, status: newStatus } : c));
    } catch {}
  };

  if (authLoading || loading) {
    return <div className="min-h-screen bg-dark-900 py-8"><div className="max-w-5xl mx-auto px-4 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-dark-700/50 rounded-xl animate-pulse" />)}</div></div>;
  }

  if (!user?.artistProfile) {
    return <div className="min-h-screen bg-dark-900 flex items-center justify-center"><p className="text-dark-400">Profil artiste requis.</p></div>;
  }

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Mes concerts</h1>
          <button onClick={() => setShowForm(!showForm)} className="bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
            {showForm ? 'Annuler' : '+ Concert'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-dark-800/50 rounded-xl p-6 mb-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">Titre *</label>
                <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required
                  className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">Lieu *</label>
                <input type="text" value={formData.venue} onChange={e => setFormData({ ...formData, venue: e.target.value })} required
                  className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">Ville *</label>
                <input type="text" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} required
                  className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">Date *</label>
                <input type="datetime-local" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required
                  className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">Prix ticket (FCFA)</label>
                <input type="number" value={formData.ticketPrice} onChange={e => setFormData({ ...formData, ticketPrice: Number(e.target.value) })} min={0}
                  className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">Places totales</label>
                <input type="number" value={formData.totalSeats} onChange={e => setFormData({ ...formData, totalSeats: Number(e.target.value) })} min={1}
                  className="input-field" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">Description</label>
              <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2}
                className="input-field resize-none" />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={creating} className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors">
              {creating ? 'Création...' : 'Créer le concert'}
            </button>
          </form>
        )}

        {concerts.length === 0 ? (
          <div className="bg-dark-800/50 rounded-xl p-12 text-center">
            <p className="text-dark-400 mb-4">Aucun concert créé.</p>
            <button onClick={() => setShowForm(true)} className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors">Créer un concert</button>
          </div>
        ) : (
          <div className="space-y-3">
            {concerts.map(concert => (
              <div key={concert.id} className="bg-dark-800/50 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${concert.status === 'UPCOMING' ? 'bg-green-100 text-green-700' : concert.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-dark-700/50 text-dark-300'}`}>
                      {concert.status}
                    </span>
                    <span className="text-xs text-dark-400">{concert._count.tickets} ticket(s) vendus</span>
                  </div>
                  <h3 className="font-semibold text-white truncate">{concert.title}</h3>
                  <p className="text-sm text-dark-400">{concert.venue}, {concert.city}</p>
                  <p className="text-xs text-dark-400 mt-1">{new Date(concert.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} · {concert.soldSeats}/{concert.totalSeats} places · {concert.ticketPrice.toLocaleString('fr-FR')} FCFA</p>
                  {user?.artistProfile && (
                    <div className="mt-2">
                      <TicketLink artistSlug={user.artistProfile.slug} />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link href={concertAttendees(concert.id)} className="text-xs bg-primary-50 text-primary-600 px-3 py-1.5 rounded-lg hover:bg-primary-100 transition-colors">Participants</Link>
                  <Link href={`/concerts/${concert.slug}`} className="text-xs bg-dark-700/50 text-dark-300 px-3 py-1.5 rounded-lg hover:bg-dark-600/50 transition-colors">Voir</Link>
                  <button onClick={() => toggleStatus(concert)} className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${concert.status === 'UPCOMING' ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}>
                    {concert.status === 'UPCOMING' ? 'Annuler' : 'Réactiver'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
