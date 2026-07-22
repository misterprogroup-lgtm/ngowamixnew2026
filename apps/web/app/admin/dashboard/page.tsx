'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../components/auth/AuthContext';
import { api, type PaginatedResponse } from '../../lib/api';
import { Loader2 } from 'lucide-react';

interface GlobalStats {
  totalUsers: number;
  totalArtists: number;
  totalTracks: number;
  totalAlbums: number;
  totalConcerts: number;
  totalLives: number;
  totalRevenue: number;
  pendingReports: number;
}

interface UserRow {
  id: string;
  email: string;
  pseudo: string;
  role: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  artistProfile?: { artistName: string };
  subscription?: { plan: string };
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) router.push('/connexion');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return;

    const fetchStats = async () => {
      try {
        const data = await api.get<GlobalStats>('/admin/stats');
        setStats(data);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };

    const fetchUsers = async () => {
      try {
        const res = await api.get<PaginatedResponse<UserRow>>('/admin/users?limit=20');
        setUsers(res.data || []);
      } catch { /* ignore */ }
      finally { setUsersLoading(false); }
    };

    fetchStats();
    fetchUsers();
  }, [user]);

  const toggleActive = async (userId: string) => {
    try {
      const res = await api.patch<{ id: string; isActive: boolean }>(`/admin/users/${userId}/toggle-active`);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isActive: res.isActive } : u));
    } catch { /* ignore */ }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    if (!confirm(`Confirmer le changement de rôle ?`)) return;
    try {
      await api.patch(`/admin/users/${userId}/role`, { role });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u));
    } catch { alert('Erreur lors du changement de rôle'); }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-dark-900 py-8">
        <div className="max-w-6xl mx-auto px-4 animate-pulse">
          <div className="h-8 bg-dark-700 rounded w-1/3 mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-dark-700 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') return null;

  const statCards = stats ? [
    { label: 'Utilisateurs', value: stats.totalUsers, color: 'bg-blue-500/20 text-blue-400' },
    { label: 'Artistes', value: stats.totalArtists, color: 'bg-primary-500/20 text-primary-600' },
    { label: 'Morceaux', value: stats.totalTracks, color: 'bg-emerald-500/20 text-emerald-400' },
    { label: 'Albums', value: stats.totalAlbums, color: 'bg-amber-500/20 text-amber-400' },
    { label: 'Concerts', value: stats.totalConcerts, color: 'bg-red-500/20 text-red-400' },
    { label: 'Lives', value: stats.totalLives, color: 'bg-pink-500/20 text-pink-400' },
    { label: 'Revenus', value: `${stats.totalRevenue.toLocaleString('fr-FR')} FCFA`, color: 'bg-dark-700 text-dark-300' },
    { label: 'Signalements', value: stats.pendingReports, color: 'bg-orange-500/20 text-orange-400', href: '/admin/signalements' },
  ] : [];

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="mt-2 text-dark-300">Vue d&apos;ensemble de la plateforme Ngowamix</p>
        </div>

        <div className="flex gap-3 mb-6">
          <Link href="/admin/signalements" className="bg-dark-800/50 border border-dark-700 text-dark-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-dark-700/50 transition-colors">
            Signalements
          </Link>
          <Link href="/admin/retraits" className="bg-dark-800/50 border border-dark-700 text-dark-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-dark-700/50 transition-colors">
            Retraits
          </Link>
          <Link href="/admin/moderation" className="bg-dark-800/50 border border-dark-700 text-dark-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-dark-700/50 transition-colors">
            Modération
          </Link>
          <Link href="/admin/commentaires" className="bg-dark-800/50 border border-dark-700 text-dark-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-dark-700/50 transition-colors">
            Commentaires
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((card, i) => {
            const content = (
              <>
                <p className="text-2xl font-bold text-white">{card.value}</p>
                <p className="text-sm text-dark-400 mt-1">{card.label}</p>
              </>
            );
            return card.href ? (
              <a key={i} href={card.href} className="bg-dark-800/50 rounded-xl p-4 hover:bg-dark-700/50 transition-colors cursor-pointer block">{content}</a>
            ) : (
              <div key={i} className="bg-dark-800/50 rounded-xl p-4">{content}</div>
            );
          })}
        </div>

        {/* Users Table */}
        <div className="bg-dark-800/50 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-dark-700/50">
            <h2 className="text-xl font-semibold">Utilisateurs</h2>
          </div>

          {usersLoading ? (
            <div className="p-6 text-center text-dark-400">Chargement...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-dark-900 text-left">
                    <th className="px-3 sm:px-6 py-3 font-medium text-dark-400 text-xs sm:text-sm">Pseudo</th>
                    <th className="hidden sm:table-cell px-3 sm:px-6 py-3 font-medium text-dark-400 text-xs sm:text-sm">Email</th>
                    <th className="px-3 sm:px-6 py-3 font-medium text-dark-400 text-xs sm:text-sm">Rôle</th>
                    <th className="hidden md:table-cell px-3 sm:px-6 py-3 font-medium text-dark-400 text-xs sm:text-sm">Plan</th>
                    <th className="px-3 sm:px-6 py-3 font-medium text-dark-400 text-xs sm:text-sm">Statut</th>
                    <th className="hidden lg:table-cell px-3 sm:px-6 py-3 font-medium text-dark-400 text-xs sm:text-sm">Inscrit le</th>
                    <th className="px-3 sm:px-6 py-3 font-medium text-dark-400 text-xs sm:text-sm">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700/50">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-dark-700/50">
                      <td className="px-3 sm:px-6 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white text-xs sm:text-sm">{u.pseudo}</span>
                          {u.artistProfile && <span className="text-[10px] bg-primary-500/20 text-primary-300 px-1.5 py-0.5 rounded hidden sm:inline">{u.artistProfile.artistName}</span>}
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-3 sm:px-6 py-3 text-dark-300 text-xs sm:text-sm truncate max-w-[120px]">{u.email}</td>
                      <td className="px-3 sm:px-6 py-3">
                        <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}
                          className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium border-0 cursor-pointer focus:ring-2 focus:ring-primary-500 ${
                            u.role === 'ADMIN' ? 'bg-red-500/20 text-red-300' :
                            u.role === 'ARTISTE' ? 'bg-primary-500/20 text-primary-300' :
                            'bg-blue-500/20 text-blue-300'
                          }`}>
                          <option value="FAN" className="bg-dark-800/50 text-white">FAN</option>
                          <option value="ARTISTE" className="bg-dark-800/50 text-white">ARTISTE</option>
                          <option value="ADMIN" className="bg-dark-800/50 text-white">ADMIN</option>
                        </select>
                      </td>
                      <td className="hidden md:table-cell px-3 sm:px-6 py-3 text-dark-300 text-xs sm:text-sm">{u.subscription?.plan || 'Gratuit'}</td>
                      <td className="px-3 sm:px-6 py-3">
                        <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${u.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                          {u.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell px-3 sm:px-6 py-3 text-dark-400 text-xs">
                        {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-3 sm:px-6 py-3">
                        {u.role !== 'ADMIN' && (
                          <button
                            onClick={() => toggleActive(u.id)}
                            className={`text-[10px] sm:text-xs font-medium ${u.isActive ? 'text-red-400 hover:text-red-300' : 'text-emerald-400 hover:text-emerald-300'}`}
                          >
                            {u.isActive ? 'Désactiver' : 'Activer'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
