'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../components/auth/AuthContext';
import { api } from '../../lib/api';
import { Shield, AlertTriangle, UserX, EyeOff, CheckCircle, XCircle, Filter } from 'lucide-react';

interface ModerationLog {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  details: Record<string, any> | null;
  createdAt: string;
  admin: { pseudo: string; avatarUrl: string | null };
}

const ACTION_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  moderate: { label: 'Contenu masqué', icon: <EyeOff className="w-4 h-4" />, color: 'bg-red-500/20 text-red-300' },
  toggle_active: { label: 'Utilisateur activé/désactivé', icon: <UserX className="w-4 h-4" />, color: 'bg-amber-500/20 text-amber-300' },
  resolve_report: { label: 'Signalement résolu', icon: <CheckCircle className="w-4 h-4" />, color: 'bg-emerald-500/20 text-emerald-300' },
  dismiss_report: { label: 'Signalement rejeté', icon: <XCircle className="w-4 h-4" />, color: 'bg-dark-700 text-dark-300' },
};

const TARGET_LABELS: Record<string, string> = {
  TRACK: 'Morceau',
  COMMENT: 'Commentaire',
  ALBUM: 'Album',
  USER: 'Utilisateur',
  REPORT: 'Signalement',
};

export default function AdminModerationPage() {
  const { user, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return;
    const fetchLogs = async () => {
      try {
        const query = filterAction ? `?action=${filterAction}` : '';
        const data = await api.get<ModerationLog[]>(`/admin/moderation-logs${query}`);
        setLogs(Array.isArray(data) ? data : []);
      } catch { setLogs([]); } finally { setLoading(false); }
    };
    fetchLogs();
  }, [user, filterAction]);

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-primary-500" />
          <h1 className="text-2xl font-bold text-white">Historique de modération</h1>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button onClick={() => setFilterAction('')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${!filterAction ? 'bg-primary-500 text-white' : 'bg-dark-800/50 text-dark-300 hover:bg-dark-700'}`}>
            <Filter className="w-4 h-4" /> Toutes
          </button>
          {Object.entries(ACTION_CONFIG).map(([key, config]) => (
            <button key={key} onClick={() => setFilterAction(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filterAction === key ? 'bg-primary-500 text-white' : 'bg-dark-800/50 text-dark-300 hover:bg-dark-700'}`}>
              {config.icon} {config.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(8)].map((_, i) => <div key={i} className="h-16 bg-dark-700 rounded-xl animate-pulse" />)}</div>
        ) : logs.length === 0 ? (
          <div className="bg-dark-800/50 rounded-xl p-12 text-center">
            <Shield className="w-12 h-12 text-dark-300 mx-auto mb-3" />
            <p className="text-dark-400">Aucune action de modération pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map(log => {
              const actionConfig = ACTION_CONFIG[log.action] || { label: log.action, icon: <AlertTriangle className="w-4 h-4" />, color: 'bg-dark-700 text-dark-300' };
              const date = new Date(log.createdAt);
              return (
                <div key={log.id} className="bg-dark-800/50 rounded-xl overflow-hidden">
                  <button onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                    className="w-full p-4 flex items-center gap-4 hover:bg-dark-700/50 transition-colors text-left">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${actionConfig.color}`}>
                      {actionConfig.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-white text-sm">{log.admin.pseudo}</span>
                        <span className="text-xs text-dark-400">{actionConfig.label}</span>
                        <span className="text-xs bg-dark-700 text-dark-300 px-2 py-0.5 rounded-full">{TARGET_LABELS[log.targetType] || log.targetType}</span>
                      </div>
                      <p className="text-xs text-dark-400 mt-0.5">{date.toLocaleString('fr-FR')}</p>
                    </div>
                    <svg className={`w-4 h-4 text-dark-400 transition-transform flex-shrink-0 ${expanded === log.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expanded === log.id && log.details && (
                    <div className="px-4 pb-4 pt-0">
                      <div className="bg-dark-900 rounded-lg p-3 text-xs font-mono">
                        <pre className="whitespace-pre-wrap text-dark-300">{JSON.stringify(log.details, null, 2)}</pre>
                      </div>
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
