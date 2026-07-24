'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../components/auth/AuthContext';
import { api } from '../../lib/api';
import LivePlayer from '../../components/live/LivePlayer';
import PaymentModal from '../../components/PaymentModal';

interface PaidLive {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverUrl?: string;
  streamUrl?: string;
  price: number;
  scheduledAt?: string;
  isLive: boolean;
  viewerCount: number;
  artist: { artistName: string; slug: string; user?: { avatarUrl?: string } };
  _count?: { accesses: number };
}

export default function LiveDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const slug = params.slug as string;
  const [live, setLive] = useState<PaidLive | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentPending, setPaymentPending] = useState(false);

  useEffect(() => {
    const fetchLive = async () => {
      try {
        const data = await api.get<PaidLive>(`/lives/${slug}`);
        setLive(data);
      } catch {
        setLive(null);
      } finally {
        setLoading(false);
      }
    };
    fetchLive();
  }, [slug]);

  const handlePurchase = async (method: string, phone: string) => {
    if (!live) return;
    if (!user) { router.push('/connexion'); return; }
    setPurchasing(true);
    setError('');
    try {
      const res = await api.post<{ payment?: any; status?: string; message?: string }>(`/payments/live/${live.id}`, { method, phone });
      setShowPaymentModal(false);
      if (res.status === 'PENDING' || res.status === 'ACCEPTED') {
        setPaymentPending(true);
        pollPaymentStatus(res.payment?.id);
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setShowPaymentModal(false);
      setError(err.message || 'Erreur lors de l\'achat');
    } finally {
      setPurchasing(false);
    }
  };

  const handleFreeAccess = async () => {
    if (!live) return;
    if (!user) { router.push('/connexion'); return; }
    setSuccess(true);
  };

  const pollPaymentStatus = async (paymentId: string) => {
    if (!paymentId) { setPaymentPending(false); return; }
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const payment = await api.get<{ id: string; status: string }>(`/payments/${paymentId}/status`);
        if (payment.status === 'COMPLETED') {
          clearInterval(interval);
          setPaymentPending(false);
          setSuccess(true);
        } else if (payment.status === 'FAILED' || attempts >= 20) {
          clearInterval(interval);
          setPaymentPending(false);
          setError(payment.status === 'FAILED' ? 'Le paiement a échoué.' : 'Délai dépassé.');
        }
      } catch { /* retry */ }
    }, 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 py-8">
        <div className="max-w-4xl mx-auto px-4 animate-pulse">
          <div className="h-64 bg-dark-700/50 rounded-xl mb-6" />
          <div className="h-8 bg-dark-700/50 rounded w-1/2 mb-4" />
        </div>
      </div>
    );
  }

  if (!live) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Live non trouvé</h2>
          <Link href="/lives" className="text-primary-600 hover:text-primary-700">Retour aux lives</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <Link href="/lives" className="text-primary-600 hover:text-primary-700 text-sm mb-6 inline-block">&larr; Retour aux lives</Link>

        <div className="bg-dark-800/50 rounded-xl overflow-hidden">
          {live.isLive && live.streamUrl && (
            <div className="p-4">
              <LivePlayer streamUrl={live.streamUrl} isLive={live.isLive} title={live.title} artistName={live.artist.artistName} viewerCount={live.viewerCount} />
            </div>
          )}

          <div className="h-64 bg-gradient-to-br from-red-400 to-red-600 relative">
            {live.coverUrl ? (
              <img src={live.coverUrl} alt={live.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-20 h-20 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            {live.isLive && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-full animate-pulse">
                <div className="w-2.5 h-2.5 bg-white rounded-full" />
                EN DIRECT
              </div>
            )}
          </div>

          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">{live.title}</h1>
                <Link href={`/artistes/${live.artist.slug}`} className="text-primary-600 hover:text-primary-700 font-medium">
                  {live.artist.artistName}
                </Link>

                {live.description && (
                  <p className="mt-4 text-dark-300 leading-relaxed">{live.description}</p>
                )}

                <div className="flex items-center gap-4 mt-4 text-sm text-dark-400">
                  {live.scheduledAt && (
                    <span>Programmé le {new Date(live.scheduledAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  )}
                  <span>{live._count?.accesses || 0} spectateur(s)</span>
                </div>
              </div>

              <div className="bg-dark-700/50 rounded-xl p-6 md:w-72 flex-shrink-0">
                {paymentPending ? (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-white font-semibold mb-1">Confirmation en cours...</p>
                    <p className="text-sm text-dark-400">Validez le paiement sur votre téléphone</p>
                  </div>
                ) : success ? (
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="font-semibold text-white mb-1">Accès acquis !</p>
                    <p className="text-sm text-dark-400">Vous pouvez regarder ce live</p>
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-4">
                      <p className="text-3xl font-bold text-white">
                        {live.price === 0 ? 'Gratuit' : `${live.price.toLocaleString('fr-FR')} FCFA`}
                      </p>
                    </div>

                    {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

                    {live.isLive ? (
                      <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-colors animate-pulse"
                      >
                        Regarder le live
                      </button>
                    ) : (
                      <button
                        onClick={() => live.price === 0 ? handleFreeAccess() : setShowPaymentModal(true)}
                        disabled={purchasing}
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50 transition-colors"
                      >
                        {live.price === 0 ? 'Accéder gratuitement' : 'Acheter l\'accès'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPaymentModal && (
        <PaymentModal
          amount={live.price}
          title="Accéder au live"
          onConfirm={handlePurchase}
          onClose={() => !purchasing && setShowPaymentModal(false)}
        />
      )}
    </div>
  );
}
