'use client';

import { useState } from 'react';
import { api } from '@/app/lib/api';

const REASONS = [
  { value: 'spam', label: 'Spam / Publicité non désirée' },
  { value: 'adult', label: 'Contenu adulte' },
  { value: 'copyright', label: 'Contrefaçon / Droits d\'auteur' },
  { value: 'violence', label: 'Violence / Contenu offensant' },
  { value: 'other', label: 'Autre' },
];

interface ReportModalProps {
  targetType: string;
  targetId: string;
  onClose: () => void;
}

export default function ReportModal({ targetType, targetId, onClose }: ReportModalProps) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!reason) { setError('Choisissez un motif'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/reports', { targetType, targetId, reason, details });
      setSent(true);
    } catch {
      setError('Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-dark-800 rounded-xl max-w-md w-full p-6 text-center" onClick={e => e.stopPropagation()}>
          <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h3 className="text-white text-lg font-semibold mb-2">Signalement envoyé</h3>
          <p className="text-dark-400 text-sm mb-4">Merci, nous examinerons le contenu sous 24-48h.</p>
          <button onClick={onClose} className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">Fermer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-dark-800 rounded-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-white text-lg font-semibold mb-4">Signaler ce contenu</h3>

        <div className="space-y-2 mb-4">
          {REASONS.map(r => (
            <label key={r.value} className="flex items-center gap-3 p-3 bg-dark-700 rounded-lg cursor-pointer hover:bg-dark-600 transition-colors">
              <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} className="text-primary-500 focus:ring-primary-500" />
              <span className="text-dark-300 text-sm">{r.label}</span>
            </label>
          ))}
        </div>

        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

        <textarea
          value={details}
          onChange={e => setDetails(e.target.value)}
          placeholder="Détails optionnels..."
          rows={3}
          className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-white text-sm placeholder-dark-400 focus:outline-none focus:border-primary-500 resize-none mb-4"
        />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-dark-700 hover:bg-dark-600 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">Annuler</button>
          <button onClick={handleSubmit} disabled={loading || !reason} className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {loading ? 'Envoi...' : 'Signaler'}
          </button>
        </div>
      </div>
    </div>
  );
}
