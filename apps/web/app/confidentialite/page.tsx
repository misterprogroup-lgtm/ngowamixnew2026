import Link from 'next/link';

export default function Confidentialite() {
  return (
    <div className="min-h-screen bg-dark-900 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-primary-600 hover:text-primary-300 text-sm mb-6 inline-block">
          &larr; Retour à l&apos;accueil
        </Link>
        <h1 className="text-3xl font-bold text-white mb-8">Politique de confidentialité</h1>

        <div className="prose prose-dark max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Collecte des données</h2>
            <p className="text-dark-300 leading-relaxed">
              Nous collectons les données que vous nous fournissez directement lors de votre inscription :
            </p>
            <ul className="list-disc list-inside text-dark-300 mt-2 space-y-1">
              <li>Adresse e-mail</li>
              <li>Pseudonyme</li>
              <li>Mot de passe (chiffré)</li>
              <li>Pays et ville</li>
              <li>Photo de profil (optionnel)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Utilisation des données</h2>
            <p className="text-dark-300 leading-relaxed">
              Vos données sont utilisées pour :
            </p>
            <ul className="list-disc list-inside text-dark-300 mt-2 space-y-1">
              <li>Gérer votre compte et vous authentifier</li>
              <li>Vous permettre d&apos;écouter, publier et interagir avec la musique</li>
              <li>Gérer vos achats de tickets et d&apos;albums</li>
              <li>Vous envoyer des notifications pertinentes</li>
              <li>Améliorer nos services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Partage des données</h2>
            <p className="text-dark-300 leading-relaxed">
              Nous ne vendons pas vos données personnelles. Vos données peuvent être partagées uniquement dans les cas suivants :
            </p>
            <ul className="list-disc list-inside text-dark-300 mt-2 space-y-1">
              <li>Avec votre consentement explicite</li>
              <li>Pour respecter une obligation légale</li>
              <li>Pour protéger nos droits et notre sécurité</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Sécurité</h2>
            <p className="text-dark-300 leading-relaxed">
              Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles contre tout accès non autorisé, modification, divulgation ou destruction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Vos droits</h2>
            <p className="text-dark-300 leading-relaxed">
              Conformément au RGPD, vous disposez des droits suivants :
            </p>
            <ul className="list-disc list-inside text-dark-300 mt-2 space-y-1">
              <li><strong>Droit d&apos;accès</strong> : obtenir une copie de vos données</li>
              <li><strong>Droit de rectification</strong> : corriger vos données inexactes</li>
              <li><strong>Droit à l&apos;effacement</strong> : demander la suppression de vos données</li>
              <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
              <li><strong>Droit d&apos;opposition</strong> : vous opposer au traitement de vos données</li>
            </ul>
            <p className="text-dark-300 mt-2">
              Pour exercer ces droits : privacy@ngowamix.com
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Conservation</h2>
            <p className="text-dark-300 leading-relaxed">
              Vos données sont conservées tant que votre compte est actif. En cas de suppression de compte, vos données sont supprimées dans un délai de 30 jours.
            </p>
          </section>
        </div>

        <p className="text-sm text-dark-400 mt-12">
          Dernière mise à jour : juillet 2026
        </p>
      </div>
    </div>
  );
}
