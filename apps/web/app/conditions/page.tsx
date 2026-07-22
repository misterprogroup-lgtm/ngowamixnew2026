import Link from 'next/link';

export default function Conditions() {
  return (
    <div className="min-h-screen bg-dark-900 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-primary-600 hover:text-primary-300 text-sm mb-6 inline-block">
          &larr; Retour à l&apos;accueil
        </Link>
        <h1 className="text-3xl font-bold text-white mb-8">Conditions d&apos;utilisation</h1>

        <div className="prose prose-dark max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptation des conditions</h2>
            <p className="text-dark-300 leading-relaxed">
              En accédant et en utilisant la plateforme Ngowamix, vous acceptez sans réserve les présentes conditions d&apos;utilisation. Si vous n&apos;acceptez pas ces conditions, veuillez ne pas utiliser la plateforme.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Description du service</h2>
            <p className="text-dark-300 leading-relaxed">
              Ngowamix est une plateforme de streaming musical qui permet aux artistes de publier et vendre leur musique, de proposer des concerts et des lives payants, et aux auditeurs de découvrir et écouter de la musique.
            </p>
            <ul className="list-disc list-inside text-dark-300 mt-2 space-y-1">
              <li>Écoute gratuite limitée (30 morceaux/jour)</li>
              <li>Téléchargement limité (5 morceaux/jour)</li>
              <li>Achat d&apos;albums et de tickets de concert</li>
              <li>Accès aux lives payants</li>
              <li>Abonnements Pro et Famille</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Compte utilisateur</h2>
            <p className="text-dark-300 leading-relaxed">
              Vous êtes responsable de la sécurité de votre compte et de votre mot de passe. Vous vous engagez à :
            </p>
            <ul className="list-disc list-inside text-dark-300 mt-2 space-y-1">
              <li>Fournir des informations exactes lors de l&apos;inscription</li>
              <li>Ne pas partager vos identifiants de connexion</li>
              <li>Notifier immédiatement toute utilisation non autorisée</li>
              <li>Ne pas créer de comptes multiples</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Contenu publié</h2>
            <p className="text-dark-300 leading-relaxed">
              Les artistes qui publient du contenu sur Ngowamix garantissent qu&apos;ils détiennent les droits nécessaires. Ngowamix se réserve le droit de retirout contenu qui enfreint les droits de propriété intellectuelle.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Paiements et remboursements</h2>
            <p className="text-dark-300 leading-relaxed">
              Tous les paiements sont effectués en FCFA. Les remboursements peuvent être accordés dans un délai de 14 jours après l&apos;achat, sous réserve de justification. Les abonnements sont facturés mensuellement ou annuellement selon le plan choisi.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Suspension et résiliation</h2>
            <p className="text-dark-300 leading-relaxed">
              Ngowamix se réserve le droit de suspendre ou résilier votre compte en cas de non-respect des présentes conditions, sans préavis. Vous pouvez également supprimer votre compte à tout moment depuis les paramètres.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Limitation de responsabilité</h2>
            <p className="text-dark-300 leading-relaxed">
              Ngowamix s&apos;efforce d&apos;assurer la disponibilité continue de la plateforme, mais ne peut garantir l&apos;absence d&apos;interruption. La responsabilité de Ngowamix ne saurait être engagée pour les dommages indirects résultant de l&apos;utilisation de la plateforme.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Droit applicable</h2>
            <p className="text-dark-300 leading-relaxed">
              Les présentes conditions sont régies par les lois de la République de Côte d&apos;Ivoire. Tout litige sera soumis à la compétence exclusive des tribunaux d&apos;Abidjan.
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
