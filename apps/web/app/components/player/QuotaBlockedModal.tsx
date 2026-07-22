'use client';

import Link from 'next/link';
import { Crown, X } from 'lucide-react';
import { usePlayer } from './PlayerContext';

export default function QuotaBlockedModal() {
  const { quotaBlocked, dismissQuotaBlocked } = usePlayer();

  if (!quotaBlocked) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-dark-800 border border-dark-700 rounded-2xl max-w-md w-full p-6 relative shadow-2xl">
        <button
          onClick={dismissQuotaBlocked}
          className="absolute top-4 right-4 text-dark-400 hover:text-white transition-colors"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Crown className="w-7 h-7 text-primary-400" />
        </div>

        <h2 className="text-xl font-bold text-white text-center mb-2">
          Limite d&apos;écoutes atteinte
        </h2>
        <p className="text-dark-300 text-center text-sm mb-6">
          Vous avez utilisé vos 30 écoutes gratuites du jour. Passez à Ngowamix Pro pour des écoutes et téléchargements illimités.
        </p>

        <div className="bg-dark-900/60 rounded-xl p-4 mb-6 space-y-2">
          <div className="flex items-center gap-2 text-sm text-dark-200">
            <span className="text-primary-400">✓</span> Écoutes illimitées
          </div>
          <div className="flex items-center gap-2 text-sm text-dark-200">
            <span className="text-primary-400">✓</span> Téléchargements illimités
          </div>
          <div className="flex items-center gap-2 text-sm text-dark-200">
            <span className="text-primary-400">✓</span> Qualité HD, sans publicité
          </div>
          <div className="flex items-center gap-2 text-sm text-dark-200">
            <span className="text-primary-400">✓</span> À partir de 2 000 FCFA/mois
          </div>
        </div>

        <Link
          href="/abonnements"
          className="block w-full bg-primary-500 hover:bg-primary-600 text-white text-center font-semibold py-3 rounded-xl transition-colors mb-3"
          onClick={dismissQuotaBlocked}
        >
          Passer à Pro
        </Link>
        <button
          onClick={dismissQuotaBlocked}
          className="block w-full text-dark-400 hover:text-white text-sm py-2 transition-colors"
        >
          Revenir demain
        </button>
      </div>
    </div>
  );
}
