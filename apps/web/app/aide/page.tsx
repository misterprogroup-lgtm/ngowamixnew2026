'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HelpCircle, ChevronDown, Mail, MessageCircle, FileText, Shield, CreditCard, Headphones, Mic, Download, LogIn } from 'lucide-react';

interface FAQ {
  question: string;
  answer: string;
}

interface Category {
  icon: React.ReactNode;
  title: string;
  items: FAQ[];
}

const categories: Category[] = [
  {
    icon: <LogIn className="w-5 h-5" />,
    title: 'Compte & Inscription',
    items: [
      { question: 'Comment créer un compte ?', answer: 'Cliquez sur "S\'inscrire" en haut à droite, remplissez votre email, pseudo et mot de passe. Vous recevrez un code de vérification par email. Une fois vérifié, vous pouvez commencer à écouter de la musique.' },
      { question: 'Comment devenir artiste sur Ngowamix ?', answer: 'Créez d\'abord un compte auditeur, puis allez dans votre profil et cliquez sur "Devenir artiste". Choisissez votre nom d\'artiste et validez. Vous pourrez ensuite publier vos morceaux et albums.' },
      { question: 'J\'ai oublié mon mot de passe', answer: 'Sur la page de connexion, cliquez sur "Mot de passe oublié". Entrez votre email et vous recevrez un code de réinitialisation.' },
      { question: 'Comment modifier mon profil ?', answer: 'Allez dans votre profil via l\'icône en haut à droite, puis "Paramètres". Vous pouvez modifier votre pseudo, avatar, et autres informations.' },
    ],
  },
  {
    icon: <Headphones className="w-5 h-5" />,
    title: 'Streaming & Écoute',
    items: [
      { question: 'Comment écouter un morceau ?', answer: 'Cliquez sur le bouton play d\'un morceau ou sur sa couverture. La lecture démarre dans le lecteur en bas de l\'écran. Vous pouvez mettre en pause, passer au morceau suivant, ou ajuster le volume.' },
      { question: 'Qu\'est-ce que la Radio ?', answer: 'La Radio Ngowamix vous propose une sélection continue de morceaux par genre. Choisissez un genre (Afrobeat, Pop, R&B...) et laissez-vous porter. Vous pouvez mettre en pause, passer au morceau suivant, ou mélanger.' },
      { question: 'Comment créer une playlist ?', answer: 'Allez dans la section Playlists et cliquez sur "Nouvelle playlist". Donnez-lui un titre, choisissez si elle est publique ou privée, puis ajoutez-y des morceaux depuis la page de détail.' },
      { question: 'Y a-t-il une limite d\'écoute ?', answer: 'Les comptes gratuits ont une limite de 30 écoutes par jour. Pour écouter sans limite, abonnez-vous au plan Pro ou Famille.' },
      { question: 'Puisque écouter hors-ligne ?', answer: 'Le téléchargement de morceaux est disponible selon votre quota journalier (5 téléchargements par jour pour les comptes gratuits, illimité pour les abonnés Pro et Famille).' },
    ],
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Abonnements',
    items: [
      { question: 'Quels sont les forfaits disponibles ?', answer: 'Nous proposons 4 forfaits : Pro à 2000 FCFA/mois, Pro Annuel à 20000 FCFA/an, Famille à 5000 FCFA/mois (jusqu\'à 5 membres), Famille Annuel à 50000 FCFA/an.' },
      { question: 'Quels sont les avantages Pro ?', answer: 'Écoute illimitée, téléchargements illimités, aucune publicité, qualité audio élevée, et accès aux statistiques détaillées pour les artistes.' },
      { question: 'Comment souscrire à un abonnement ?', answer: 'Allez dans la page Abonnements, choisissez votre forfait, puis sélectionnez votre moyen de paiement (Orange Money, MTN Mobile Money, ou Carte Bancaire).' },
      { question: 'Puis-je annuler mon abonnement ?', answer: 'Oui, vous pouvez annuler à tout moment depuis votre profil. L\'abonnement reste actif jusqu\'à la fin de la période payée.' },
    ],
  },
  {
    icon: <CreditCard className="w-5 h-5" />,
    title: 'Paiements',
    items: [
      { question: 'Quels moyens de paiement sont acceptés ?', answer: 'Nous acceptons Orange Money, MTN Mobile Money, et les cartes bancaires (Visa, Mastercard).' },
      { question: 'Comment acheter un album ?', answer: 'Sur la page de l\'album, cliquez sur "Acheter". Choisissez votre moyen de paiement et confirmez. Une fois payé, vous pouvez écouter et télécharger tous les morceaux de l\'album.' },
      { question: 'Comment acheter un ticket de concert ?', answer: 'Sur la page du concert, sélectionnez le nombre de places, puis cliquez sur "Acheter". Choisissez votre moyen de paiement. Vous recevrez vos tickets avec un QR code.' },
      { question: 'Comment les artistes reçoivent-ils leurs gains ?', answer: 'Les gains sont versés sur le portefeuille virtuel de l\'artiste. Vous pouvez faire une demande de retrait à partir de 5000 FCFA vers Orange Money, MTN Mobile Money, ou votre compte bancaire.' },
    ],
  },
  {
    icon: <Mic className="w-5 h-5" />,
    title: 'Artistes & Publication',
    items: [
      { question: 'Comment publier un morceau ?', answer: 'Depuis votre dashboard artiste, cliquez sur "Publier". Remplissez le titre, la description, le genre, les tags, et uploader votre fichier audio (MP3, WAV, OGG, FLAC - max 50 Mo).' },
      { question: 'Comment créer un album ?', answer: 'Depuis votre dashboard, cliquez sur "Créer un album". Donnez-lui un titre, une description, une pochette, et définissez un prix. Ajoutez ensuite vos morceaux à l\'album.' },
      { question: 'Qu\'est-ce que la visibilité d\'un morceau ?', answer: 'Public : visible par tout le monde. Privé : visible seulement par vous. Vous pouvez changer la visibilité à tout moment depuis la section "Mes morceaux".' },
      { question: 'Comment organiser un concert ?', answer: 'Depuis votre dashboard artiste, allez dans la section Concerts et cliquez sur "Créer un concert". Remplissez les informations (titre, date, lieu, prix, places disponibles).' },
    ],
  },
  {
    icon: <Download className="w-5 h-5" />,
    title: 'Téléchargements & Quotas',
    items: [
      { question: 'Comment télécharger un morceau ?', answer: 'Sur la page du morceau ou depuis un album acheté, cliquez sur l\'icône de téléchargement. Le fichier audio sera sauvegardé sur votre appareil.' },
      { question: 'Quelle est la limite de téléchargement ?', answer: 'Les comptes gratuits peuvent télécharger 5 morceaux par jour. Les abonnés Pro et Famille ont des téléchargements illimités.' },
      { question: 'Puis-je télécharger tous les morceaux d\'un album acheté ?', answer: 'Oui ! Une fois un album acheté, vous pouvez télécharger chaque morceau individuellement ou utiliser le bouton "Tout télécharger".' },
    ],
  },
];

export default function AidePage() {
  const [openCategory, setOpenCategory] = useState<number>(0);
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (catIdx: number, itemIdx: number) => {
    const key = `${catIdx}-${itemIdx}`;
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Centre d&apos;aide</h1>
            <p className="mt-1 text-dark-400">Tout ce que vous devez savoir sur Ngowamix</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-10">
          {categories.map((cat, i) => (
            <button
              key={cat.title}
              onClick={() => setOpenCategory(i)}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                openCategory === i ? 'bg-primary-500/20 border-primary-500/50' : 'bg-dark-800/50 border-dark-700 hover:border-dark-600'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                openCategory === i ? 'bg-primary-600 text-white' : 'bg-dark-700 text-dark-400'
              }`}>
                {cat.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white">{cat.title}</p>
                <p className="text-xs text-dark-400">{cat.items.length} questions</p>
              </div>
            </button>
          ))}
        </div>

        <div className="bg-dark-800/50 rounded-xl border border-dark-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-dark-700/50">
            <h2 className="text-lg font-semibold text-white">{categories[openCategory]?.title || 'FAQ'}</h2>
          </div>
          <div className="divide-y divide-dark-700/50">
            {categories[openCategory]?.items.map((faq, idx) => {
              const key = `${openCategory}-${idx}`;
              const isOpen = openItems[key];
              return (
                <div key={idx}>
                  <button
                    onClick={() => toggleItem(openCategory, idx)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-dark-700/50 transition-colors"
                  >
                    <span className="font-medium text-white pr-4">{faq.question}</span>
                    <ChevronDown className={`w-5 h-5 text-dark-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-4 text-sm text-dark-300 leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-10 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-8 text-white text-center">
          <Mail className="w-10 h-10 mx-auto mb-3 text-white/80" />
          <h2 className="text-xl font-bold mb-2">Vous n&apos;avez pas trouvé réponse ?</h2>
          <p className="text-white/70 mb-6">Notre équipe est là pour vous aider</p>
          <div className="flex items-center justify-center gap-3">
            <a href="mailto:support@ngowamix.com" className="inline-flex items-center gap-2 bg-dark-800/50 text-primary-300 px-6 py-3 rounded-xl font-semibold hover:bg-dark-700/50 transition-colors">
              <MessageCircle className="w-5 h-5" /> Nous contacter
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
