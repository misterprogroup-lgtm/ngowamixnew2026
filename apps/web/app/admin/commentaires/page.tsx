'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/auth/AuthContext';
import { api, type PaginatedResponse } from '../../lib/api';
import { MessageCircle, EyeOff, Trash2, ExternalLink, Loader2, Search } from 'lucide-react';

interface CommentRow {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; pseudo: string; avatarUrl: string | null; email: string };
  track: { id: string; title: string; slug: string };
}

const MODERATED_CONTENT = '[SUPPRIMÉ PAR MODÉRATION]';

export default function AdminCommentsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [moderating, setModerating] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModerated, setShowModerated] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) router.push('/connexion');
  }, [user, authLoading, router]);

  const fetchComments = async (p = page) => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<CommentRow>>(`/admin/comments?page=${p}&limit=30`);
      setComments(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
    } catch { setComments([]); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return;
    fetchComments();
  }, [user, page]);

  const handleModerate = async (id: string) => {
    setModerating(id);
    try {
      await api.patch(`/admin/moderate/COMMENT/${id}`);
      setComments(prev => prev.map(c => c.id === id ? { ...c, content: MODERATED_CONTENT } : c));
    } catch { alert('Erreur lors de la modération'); } finally { setModerating(null); }
  };

  const filtered = comments.filter(c => {
    const matchesSearch = search === '' ||
      c.content.toLowerCase().includes(search.toLowerCase()) ||
      c.user.pseudo.toLowerCase().includes(search.toLowerCase()) ||
      c.track.title.toLowerCase().includes(search.toLowerCase());
    if (!showModerated) return matchesSearch && c.content !== MODERATED_CONTENT;
    return matchesSearch;
  });

  if (authLoading) return <div className="min-h-screen bg-dark-900 py-8"><div className="max-w-6xl mx-auto px-4 animate-pulse"><div className="h-8 bg-dark-700 rounded w-1/3 mb-8" /></div></div>;

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Commentaires</h1>
            <p className="text-sm text-dark-400 mt-1">Modération des commentaires sur la plateforme</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard" className="bg-dark-800/50 border border-dark-700 text-dark-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-dark-700/50 transition-colors">
              Dashboard
            </Link>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input type="text" placeholder="Rechercher dans les commentaires..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-dark-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <label className="flex items-center gap-2 text-sm text-dark-300 cursor-pointer">
            <input type="checkbox" checked={showModerated} onChange={e => setShowModerated(e.target.checked)}
              className="rounded border-dark-600 text-primary-600 focus:ring-primary-500" />
            Voir les commentaires modérés
          </label>
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-dark-700 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="bg-dark-800/50 rounded-xl p-12 text-center">
            <MessageCircle className="w-12 h-12 text-dark-300 mx-auto mb-3" />
            <p className="text-dark-400">Aucun commentaire trouvé.</p>
          </div>
        ) : (
          <div className="bg-dark-800/50 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-dark-900 text-left border-b border-dark-700/50">
                    <th className="px-4 py-3 font-medium text-dark-400">Contenu</th>
                    <th className="px-4 py-3 font-medium text-dark-400 whitespace-nowrap">Utilisateur</th>
                    <th className="px-4 py-3 font-medium text-dark-400 whitespace-nowrap">Morceau</th>
                    <th className="px-4 py-3 font-medium text-dark-400 whitespace-nowrap">Date</th>
                    <th className="px-4 py-3 font-medium text-dark-400 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700/50">
                  {filtered.map(c => {
                    const isModerated = c.content === MODERATED_CONTENT;
                    return (
                      <tr key={c.id} className={`hover:bg-dark-25 transition-colors ${isModerated ? 'opacity-60' : ''}`}>
                        <td className="px-4 py-3 min-w-[200px]">
                          <p className={`text-white line-clamp-2 ${isModerated ? 'italic text-dark-400' : ''}`}>
                            {c.content}
                          </p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-dark-700 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                              {c.user.avatarUrl ? <img src={c.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                                : <span className="text-xs text-dark-400 font-medium">{c.user.pseudo.charAt(0)}</span>}
                            </div>
                            <span className="text-white">{c.user.pseudo}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-[200px]">
                          <Link href={`/morceaux/${c.track.slug}`} className="text-primary-600 hover:text-primary-300 truncate block">
                            {c.track.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-dark-400">
                          {new Date(c.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!isModerated ? (
                            <button onClick={() => handleModerate(c.id)} disabled={moderating === c.id}
                              className="inline-flex items-center gap-1 text-xs bg-red-500/20 text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-500/40 disabled:opacity-50 transition-colors">
                              {moderating === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <EyeOff className="w-3 h-3" />}
                              Modérer
                            </button>
                          ) : (
                            <span className="text-xs text-dark-400 italic">Modéré</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-primary-600 text-white' : 'bg-dark-800/50 text-dark-300 hover:bg-dark-700'}`}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
