'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Headphones, Download, Crown } from 'lucide-react';
import { api } from '@/app/lib/api';
import { QuotaStatus } from '@/app/lib/types';

export default function QuotaIndicator() {
  const [quota, setQuota] = useState<QuotaStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<QuotaStatus>('/music/quota')
      .then(setQuota)
      .catch(() => setQuota(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="h-28 bg-dark-800/50 rounded-xl animate-pulse" />;
  }

  if (!quota) return null;

  // Utilisateur premium : badge illimité
  if (quota.isPremium) {
    return (
      <div className="bg-gradient-to-r from-primary-50 to-yellow-50 border border-primary-200 rounded-xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Crown className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm">Compte Premium actif</p>
          <p className="text-dark-500 text-xs">Écoutes et téléchargements illimités</p>
        </div>
      </div>
    );
  }

  const listenPercent = Math.min(100, (quota.listensUsed / quota.listenLimit) * 100);
  const downloadPercent = Math.min(100, (quota.downloadsUsed / quota.downloadLimit) * 100);
  const listensLow = quota.listensRemaining <= 5;
  const downloadsLow = quota.downloadsRemaining <= 1;

  return (
    <div className="bg-dark-800/50 border border-dark-700/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold text-sm">Vos quotas du jour</h3>
        <Link href="/abonnements" className="text-primary-600 hover:text-primary-700 text-xs font-medium flex items-center gap-1 transition-colors">
          <Crown className="w-3.5 h-3.5" />
          Passer Pro
        </Link>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="flex items-center gap-1.5 text-dark-300">
              <Headphones className="w-3.5 h-3.5" />
              Écoutes
            </span>
            <span className={listensLow ? 'text-orange-600 font-medium' : 'text-dark-500'}>
              {quota.listensRemaining} restantes / {quota.listenLimit}
            </span>
          </div>
          <div className="h-1.5 bg-dark-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${listensLow ? 'bg-orange-500' : 'bg-primary-500'}`}
              style={{ width: `${listenPercent}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="flex items-center gap-1.5 text-dark-300">
              <Download className="w-3.5 h-3.5" />
              Téléchargements
            </span>
            <span className={downloadsLow ? 'text-orange-600 font-medium' : 'text-dark-500'}>
              {quota.downloadsRemaining} restants / {quota.downloadLimit}
            </span>
          </div>
          <div className="h-1.5 bg-dark-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${downloadsLow ? 'bg-orange-500' : 'bg-green-500'}`}
              style={{ width: `${downloadPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
