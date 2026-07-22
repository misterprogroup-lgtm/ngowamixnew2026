'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../components/auth/AuthContext';
import { api } from '../../lib/api';
import { Radio, Play, Square, Trash2, Plus, Eye, Users } from 'lucide-react';

interface Live {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverUrl: string | null;
  price: number;
  isLive: boolean;
  scheduledAt: string | null;
  createdAt: string;
  _count: { accesses: number };
}

export default function ArtistLivesPage() {
  const { user, loading: authLoading } = useAuth();
  const [lives, setLives] = useState<Live[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', price: 0, scheduledAt: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLives = async () => {
      try {
        const res = await api.get<Live[]>('/lives/my-lives');
        setLives(Array.isArray(res) ? res : []);
      } catch { setLives([]); } finally { setLoading(false); }
    };
    if (user?.artistProfile) fetchLives();
    else setLoading(false);
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      const payload: any = { title: formData.title, description: formData.description, price: formData.price };
      if (formData.scheduledAt) payload.scheduledAt = formData.scheduledAt;
      const live = await api.post<Live>('/lives', payload);
      setLives([live, ...lives]);
      setShowForm(false);
      setFormData({ title: '', description: '', price: 0, scheduledAt: '' });
    } catch (err: any) { setError(err.message || 'Erreur'); } finally { setCreating(false); }
  };

  const toggleLive = async (live: Live) => {
    try {
      await api.patch(`/lives/${live.id}/toggle-live`, { isLive: !live.isLive });
      setLives(lives.map(l => l.id === live.id ? { ...l, isLive: !l.isLive } : l));
    } catch {}
  };

  const deleteLive = async (live: Live) => {
    if (!confirm('Supprimer ce live ?')) return;
    try {
      await api.delete(`/lives/${live.id}`);
      setLives(lives.filter(l => l.id !== live.id));
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
          <h1 className="text-2xl font-bold text-white">Mes lives</h1>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
            {showForm ? 'Annuler' : <><Plus className="w-4 h-4" /> Nouveau live</>}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-dark-800/50 rounded-xl p-6 mb-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">Titre *</label>
                <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required
                  className="input-field" placeholder="Ex: Acoustique Session #1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">Prix (FCFA, 0 = gratuit)</label>
                <input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} min={0}
                  className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">Date prévue (optionnel)</label>
                <input type="datetime-local" value={formData.scheduledAt} onChange={e => setFormData({ ...formData, scheduledAt: e.target.value })}
                  className="input-field" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">Description</label>
              <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2}
                className="input-field resize-none" placeholder="Décrivez votre live..." />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={creating} className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors">
              {creating ? 'Création...' : 'Créer le live'}
            </button>
          </form>
        )}

        {lives.length === 0 ? (
          <div className="bg-dark-800/50 rounded-xl p-12 text-center">
            <Radio className="w-16 h-16 text-dark-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Aucun live créé</h3>
            <p className="text-dark-400 text-sm mb-4">Créez votre premier live pour interagir avec vos fans en direct.</p>
            <button onClick={() => setShowForm(true)} className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors">Créer un live</button>
          </div>
        ) : (
          <div className="space-y-3">
            {lives.map(live => (
              <div key={live.id} className="bg-dark-800/50 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-dark-700/50 flex-shrink-0">
                  {live.coverUrl ? (
                    <img src={live.coverUrl} alt={live.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-400 to-primary-600">
                      <Radio className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {live.isLive && (
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                        EN DIRECT
                      </span>
                    )}
                    <span className="text-xs text-dark-400 flex items-center gap-1"><Users className="w-3 h-3" />{live._count.accesses} accès</span>
                  </div>
                  <h3 className="font-semibold text-white truncate">{live.title}</h3>
                  <p className="text-sm text-dark-400">
                    {live.price > 0 ? `${live.price.toLocaleString('fr-FR')} FCFA` : 'Gratuit'}
                    {live.scheduledAt && ` · ${new Date(live.scheduledAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/lives/${live.slug}`} className="flex items-center gap-1 text-xs bg-dark-700/50 text-dark-300 px-3 py-1.5 rounded-lg hover:bg-dark-600/50 transition-colors">
                    <Eye className="w-3.5 h-3.5" /> Voir
                  </Link>
                  <button onClick={() => toggleLive(live)} className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors ${live.isLive ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}>
                    {live.isLive ? <><Square className="w-3.5 h-3.5" /> Arrêter</> : <><Play className="w-3.5 h-3.5" /> Démarrer</>}
                  </button>
                  <button onClick={() => deleteLive(live)} className="text-xs bg-dark-700/50 text-dark-400 px-3 py-1.5 rounded-lg hover:bg-red-100 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
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
