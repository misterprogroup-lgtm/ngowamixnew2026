import Link from 'next/link';

export default function MentionsLegales() {
  return (
    <div className="min-h-screen bg-dark-900 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-primary-600 hover:text-primary-300 text-sm mb-6 inline-block">
          &larr; Retour à l&apos;accueil
        </Link>
        <h1 className="text-3xl font-bold text-white mb-8">Mentions légales</h1>

        <div className="prose prose-dark max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Éditeur du site</h2>
            <p className="text-dark-300 leading-relaxed">
              <strong>Ngowamix</strong><br />
              Plateforme de streaming musical, billetterie et live payant.<br />
              Siège social : Abidjan, Côte d&apos;Ivoire<br />
              Email : contact@ngowamix.com
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Hébergeur</h2>
            <p className="text-dark-300 leading-relaxed">
              Ce site est hébergé par Vercel Inc., 440 N Barranca Ave #413, Covina, CA 91723, United States.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Propriété intellectuelle</h2>
            <p className="text-dark-300 leading-relaxed">
              L&apos;ensemble du contenu de ce site (textes, images, graphismes, logos, icônes, sons, logiciels) est la propriété exclusive de Ngowamix ou de ses partenaires et est protégé par les lois internationales relatives à la propriété intellectuelle.
            </p>
            <p className="text-dark-300 leading-relaxed mt-2">
              Toute reproduction, représentation, modification, publication, transmission ou dénaturation du site ou de son contenu, par quelque procédé que ce soit, est interdite sans autorisation préalable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Données personnelles</h2>
            <p className="text-dark-300 leading-relaxed">
              Conformement au Règlement Général sur la Protection des Données (RGPD) et aux lois applicables en matière de protection des données personnelles, vous disposez de droits sur vos données.
            </p>
            <p className="text-dark-300 leading-relaxed mt-2">
              Pour toute question relative à la protection de vos données, contactez-nous à : privacy@ngowamix.com
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Cookies</h2>
            <p className="text-dark-300 leading-relaxed">
              Ce site utilise des cookies nécessaires à son fonctionnement. Vous pouvez gérer vos préférences de cookies dans les paramètres de votre navigateur.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Contact</h2>
            <p className="text-dark-300 leading-relaxed">
              Pour toute question concernant ces mentions légales, contactez-nous à : legal@ngowamix.com
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
