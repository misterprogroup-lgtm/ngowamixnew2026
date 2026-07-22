'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

interface NotificationPrefs {
  emailFollows: boolean;
  emailLikes: boolean;
  emailPurchases: boolean;
  emailConcerts: boolean;
  emailLives: boolean;
  emailSystem: boolean;
  pushFollows: boolean;
  pushLikes: boolean;
  pushPurchases: boolean;
}

const SECTIONS: { key: keyof NotificationPrefs; label: string; type: 'email' | 'push' }[] = [
  { key: 'emailFollows', label: 'Nouvel abonné', type: 'email' },
  { key: 'emailLikes', label: 'Like sur vos morceaux', type: 'email' },
  { key: 'emailPurchases', label: 'Achat / vente', type: 'email' },
  { key: 'emailConcerts', label: 'Nouveau concert', type: 'email' },
  { key: 'emailLives', label: 'Live à venir', type: 'email' },
  { key: 'emailSystem', label: 'Notifications système', type: 'email' },
  { key: 'pushFollows', label: 'Nouvel abonné', type: 'push' },
  { key: 'pushLikes', label: 'Like sur vos morceaux', type: 'push' },
  { key: 'pushPurchases', label: 'Achat / vente', type: 'push' },
];

export default function NotificationPrefsPage() {
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get<NotificationPrefs>('/notifications/prefs')
      .then(setPrefs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (key: keyof NotificationPrefs) => {
    if (!prefs) return;
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    setSaving(true);
    try {
      await api.patch('/notifications/prefs', { [key]: updated[key] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setPrefs(prefs);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 py-8">
        <div className="max-w-xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-dark-700/50 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  const emailPrefs = SECTIONS.filter(s => s.type === 'email');
  const pushPrefs = SECTIONS.filter(s => s.type === 'push');

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-white">Préférences de notification</h1>
          {saved && <span className="text-sm text-green-600 font-medium">Enregistré ✓</span>}
        </div>
        <p className="text-dark-400 mb-8">Choisissez les notifications que vous souhaitez recevoir</p>

        {!prefs ? (
          <p className="text-dark-400 text-center py-8">Impossible de charger les préférences</p>
        ) : (
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-white mb-3">Notifications email</h2>
              <div className="bg-dark-800/50 rounded-xl divide-y divide-dark-700/50">
                {emailPrefs.map(({ key, label }) => (
                  <label key={key} className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-dark-700/50 transition-colors">
                    <span className="text-sm text-dark-200">{label}</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={prefs[key]}
                      onClick={() => toggle(key)}
                      disabled={saving}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                        prefs[key] ? 'bg-primary-600' : 'bg-dark-300'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${prefs[key] ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-3">Notifications push</h2>
              <div className="bg-dark-800/50 rounded-xl divide-y divide-dark-700/50">
                {pushPrefs.map(({ key, label }) => (
                  <label key={key} className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-dark-700/50 transition-colors">
                    <span className="text-sm text-dark-200">{label}</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={prefs[key]}
                      onClick={() => toggle(key)}
                      disabled={saving}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                        prefs[key] ? 'bg-primary-600' : 'bg-dark-300'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${prefs[key] ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
