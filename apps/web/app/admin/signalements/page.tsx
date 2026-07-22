'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/auth/AuthContext';
import { api } from '../../lib/api';
import { ExternalLink, Trash2, EyeOff } from 'lucide-react';

interface Report {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  user: { pseudo: string; avatarUrl: string | null };
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'En attente', color: 'bg-amber-500/20 text-amber-300' },
  REVIEWED: { label: 'Examiné', color: 'bg-blue-500/20 text-blue-300' },
  RESOLVED: { label: 'Résolu', color: 'bg-emerald-500/20 text-emerald-300' },
  DISMISSED: { label: 'Rejeté', color: 'bg-dark-700 text-dark-300' },
};

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  adult: 'Contenu adulte',
  copyright: 'Contrefaçon',
  violence: 'Violence',
  other: 'Autre',
};

const TARGET_TYPE_LABELS: Record<string, string> = {
  TRACK: 'Morceau',
  COMMENT: 'Commentaire',
  ALBUM: 'Album',
  USER: 'Utilisateur',
  CONCERT: 'Concert',
  LIVE: 'Live',
};

const TARGET_ROUTES: Record<string, (id: string) => string> = {
  TRACK: (id) => `/morceaux/${id}`,
  COMMENT: (id) => '#',
  USER: (id) => `/artistes/${id}`,
  ALBUM: (id) => `/albums/${id}`,
};

export default function AdminReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [actionTarget, setActionTarget] = useState<{ reportId: string; targetType: string; targetId: string } | null>(null);
  const [actionStatus, setActionStatus] = useState<'idle' | 'loading' | 'done'>('idle');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) router.push('/connexion');
  }, [user, authLoading, router]);

  const fetchReports = async (status?: string) => {
    setLoading(true);
    try {
      const query = status ? `?status=${status}` : '';
      const res = await api.get<{ data: Report[] }>(`/reports${query}`);
      setReports(res.data || []);
    } catch { setReports([]); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return;
    fetchReports(filter || undefined);
  }, [user, filter]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/reports/${id}/status`, { status });
      setReports(reports.map(r => r.id === id ? { ...r, status } : r));
    } catch {}
  };

  const handleModerate = async () => {
    if (!actionTarget) return;
    setActionStatus('loading');
    try {
      // Mark as resolved after moderation
      await api.patch(`/reports/${actionTarget.reportId}/status`, { status: 'RESOLVED' });
      // Update the target visibility to PRIVATE (hide content)
      await api.patch(`/admin/moderate/${actionTarget.targetType}/${actionTarget.targetId}`, {});
      setReports(reports.map(r => r.id === actionTarget.reportId ? { ...r, status: 'RESOLVED' } : r));
      setActionStatus('done');
      setTimeout(() => { setActionTarget(null); setActionStatus('idle'); }, 1500);
    } catch { setActionStatus('idle'); }
  };

  if (authLoading) return <div className="min-h-screen bg-dark-900 py-8"><div className="max-w-6xl mx-auto px-4 animate-pulse"><div className="h-8 bg-dark-700 rounded w-1/3 mb-8" /></div></div>;

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Signalements</h1>
          <span className="text-sm text-dark-400">{reports.filter(r => r.status === 'PENDING').length} en attente</span>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['', 'PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'].map(s => (
            <button key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === s ? 'bg-primary-500 text-white' : 'bg-dark-800/50 text-dark-300 hover:bg-dark-700'}`}>
              {s === '' ? 'Tous' : STATUS_LABELS[s]?.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-dark-700 rounded-xl animate-pulse" />)}</div>
        ) : reports.length === 0 ? (
          <div className="bg-dark-800/50 rounded-xl p-12 text-center">
            <p className="text-dark-400">Aucun signalement.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map(report => {
              const statusInfo = STATUS_LABELS[report.status] || STATUS_LABELS.PENDING;
              const targetRoute = TARGET_ROUTES[report.targetType]?.(report.targetId);
              return (
                <div key={report.id} className="bg-dark-800/50 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-medium text-white">{report.user.pseudo}</span>
                        <span className="text-xs text-dark-400">a signalé</span>
                        <span className="text-xs bg-dark-700 text-dark-300 px-2 py-0.5 rounded-full">{TARGET_TYPE_LABELS[report.targetType] || report.targetType}</span>
                        {targetRoute && (
                          <Link href={targetRoute} target="_blank" className="text-xs text-primary-600 hover:text-primary-300 inline-flex items-center gap-0.5">
                            <ExternalLink className="w-3 h-3" /> Voir
                          </Link>
                        )}
                      </div>
                      <p className="text-sm text-dark-300">
                        Motif : <span className="font-medium">{REASON_LABELS[report.reason] || report.reason}</span>
                      </p>
                      {report.details && <p className="text-sm text-dark-400 mt-1">{report.details}</p>}
                      <p className="text-xs text-dark-400 mt-2">{new Date(report.createdAt).toLocaleString('fr-FR')}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                      {report.status === 'PENDING' && (
                        <div className="flex flex-col gap-1.5">
                          <div className="flex gap-1.5">
                            <button onClick={() => updateStatus(report.id, 'RESOLVED')} className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg hover:bg-emerald-500/40">Résoudre</button>
                            <button onClick={() => updateStatus(report.id, 'DISMISSED')} className="text-xs bg-dark-700 text-dark-300 px-2.5 py-1 rounded-lg hover:bg-dark-600">Rejeter</button>
                          </div>
                          {actionTarget?.reportId !== report.id && (
                            <button onClick={() => setActionTarget({ reportId: report.id, targetType: report.targetType, targetId: report.targetId })}
                              className="text-xs bg-red-500/10 text-red-400 px-2.5 py-1 rounded-lg hover:bg-red-500/30 flex items-center justify-center gap-1">
                              <Trash2 className="w-3 h-3" /> Masquer
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Moderate confirmation */}
                  {actionTarget?.reportId === report.id && (
                    <div className="mt-3 pt-3 border-t border-dark-700/50">
                      {actionStatus === 'done' ? (
                        <p className="text-sm text-emerald-400 text-center">✓ Contenu masqué et signalement résolu</p>
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-dark-300">
                            <EyeOff className="w-4 h-4 inline mr-1 text-red-500" />
                            Rendre ce contenu privé ?
                          </p>
                          <div className="flex gap-2">
                            <button onClick={() => setActionTarget(null)} className="text-xs bg-dark-700 text-dark-300 px-3 py-1.5 rounded-lg hover:bg-dark-600">Annuler</button>
                            <button onClick={handleModerate} disabled={actionStatus === 'loading'}
                              className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 disabled:opacity-50">Confirmer</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
