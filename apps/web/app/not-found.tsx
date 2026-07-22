import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-8xl font-bold text-primary-500 mb-4">404</p>
        <h1 className="text-2xl font-bold text-white mb-2">Page introuvable</h1>
        <p className="text-dark-400 mb-8 max-w-md mx-auto">
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-500 transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
          <Link
            href="/decouverte"
            className="border border-dark-700/50 text-dark-200 px-6 py-3 rounded-lg font-medium hover:bg-dark-700/50 transition-colors"
          >
            Découvrir
          </Link>
        </div>
      </div>
    </div>
  );
}
