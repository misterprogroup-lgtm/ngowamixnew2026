'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../../components/auth/AuthContext';
import { api } from '../../../../lib/api';
import { ROUTES, concertAttendees } from '../../../../lib/routes';

interface CheckInLog {
  qrCode: string;
  success: boolean;
  message: string;
  user?: { pseudo: string };
  ticket?: { quantity: number; totalPaid: number };
  timestamp: Date;
}

export default function ConcertCheckInPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [qrCode, setQrCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [logs, setLogs] = useState<CheckInLog[]>([]);
  const [lastResult, setLastResult] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ARTISTE')) router.replace(ROUTES.HOME);
  }, [user, authLoading, router]);

  const handleCheckIn = async () => {
    const code = qrCode.trim();
    if (!code || checking) return;
    setChecking(true);
    setLastResult(null);
    try {
      const res = await api.post<{ message: string; ticket: { quantity: number; totalPaid: number }; user: { pseudo: string } }>(`/concerts/${id}/check-in`, { qrCode: code });
      setLogs(prev => [{ qrCode: code, success: true, message: res.message, user: res.user, ticket: res.ticket, timestamp: new Date() }, ...prev]);
      setLastResult({ ok: true, text: `✓ ${res.user.pseudo} — ${res.ticket.quantity} billet(s) (${res.ticket.totalPaid.toLocaleString()} FCFA)` });
      setQrCode('');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erreur de validation';
      setLogs(prev => [{ qrCode: code, success: false, message: msg, timestamp: new Date() }, ...prev]);
      setLastResult({ ok: false, text: `✗ ${msg}` });
    } finally {
      setChecking(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-dark-800/50 pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href={concertAttendees(id)} className="text-dark-400 hover:text-dark-300 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <h1 className="text-xl font-bold text-white">Scan QR</h1>
        </div>

        <div className="bg-dark-700/50 rounded-xl p-6 space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark-200">Code QR du billet</label>
            <input
              type="text"
              value={qrCode}
              onChange={e => setQrCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCheckIn()}
              placeholder="Entrez ou scannez le code QR..."
              className="input-field"
              disabled={checking}
              autoFocus
            />
          </div>
          <button
            onClick={handleCheckIn}
            disabled={!qrCode.trim() || checking}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-dark-300 text-white py-3 rounded-lg font-semibold text-base transition-colors"
          >
            {checking ? 'Validation...' : 'Valider l\'entrée'}
          </button>
        </div>

        {lastResult && (
          <div className={`mt-4 p-4 rounded-xl text-sm font-medium ${lastResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {lastResult.text}
          </div>
        )}

        <div className="mt-2 text-xs text-dark-400 text-center">
          <div className="flex items-center justify-center gap-2">
            <span>Sur {logs.length} scan(s)</span>
            <span className="w-1 h-1 rounded-full bg-dark-300" />
            <span className="text-green-600">{logs.filter(l => l.success).length} validé(s)</span>
            <span className="w-1 h-1 rounded-full bg-dark-300" />
            <span className="text-red-500">{logs.filter(l => !l.success).length} refusé(s)</span>
          </div>
        </div>

        {logs.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-dark-200 mb-3">Derniers scans</h2>
            <div className="space-y-2">
              {logs.map((log, i) => (
                <div key={i} className={`p-3 rounded-lg text-sm ${log.success ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-dark-400">{log.qrCode.slice(0, 20)}...</span>
                    <span className={`text-xs font-medium ${log.success ? 'text-green-700' : 'text-red-700'}`}>
                      {log.success ? '✓ Validé' : '✗ Refusé'}
                    </span>
                  </div>
                  <p className={`text-xs mt-1 ${log.success ? 'text-green-600' : 'text-red-600'}`}>
                    {log.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
