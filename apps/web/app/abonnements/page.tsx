'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../components/auth/AuthContext';
import { api } from '../lib/api';
import PaymentModal from '../components/PaymentModal';

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
}

interface Subscription {
  plan: string;
  status: string;
  endDate?: string;
}

export default function AbonnementsPage() {
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSub, setCurrentSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<Plan | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const plansData = await api.get<Plan[]>('/subscriptions/plans');
        setPlans(plansData);
        if (user) {
          try {
            const subData = await api.get<Subscription>('/subscriptions/me');
            setCurrentSub(subData);
          } catch {
            setCurrentSub({ plan: 'GRATUIT', status: 'ACTIVE' });
          }
        }
      } catch {
        setPlans([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      window.location.href = '/connexion';
      return;
    }
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    if (plan.price > 0) {
      setPendingPlan(plan);
      setShowPayment(true);
      return;
    }
    await doSubscribe(planId);
  };

  const handlePaymentConfirm = async (method: string, phone: string) => {
    if (!pendingPlan) return;
    setShowPayment(false);
    await doSubscribe(pendingPlan.id, method, phone);
    setPendingPlan(null);
  };

  const doSubscribe = async (planId: string, paymentMethod?: string, phone?: string) => {
    setSubscribing(true);
    setSelectedPlan(planId);
    setError('');
    setSuccess('');
    try {
      const res = await api.post<{ status?: string; message?: string; payment?: any }>('/subscriptions/subscribe', { planId, paymentMethod, phone });
      if (res.status === 'PENDING' || res.status === 'ACCEPTED') {
        pollPaymentStatus(res.payment?.id);
      } else {
        const subData = await api.get<Subscription>('/subscriptions/me');
        setCurrentSub(subData);
        setSuccess('Abonnement activé avec succès !');
        refreshUser?.();
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la souscription');
    } finally {
      setSubscribing(false);
      setSelectedPlan(null);
    }
  };

  const pollPaymentStatus = async (paymentId: string) => {
    if (!paymentId) return;
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const payment = await api.get<{ id: string; status: string }>(`/payments/${paymentId}/status`);
        if (payment.status === 'COMPLETED') {
          clearInterval(interval);
          const subData = await api.get<Subscription>('/subscriptions/me');
          setCurrentSub(subData);
          setSuccess('Abonnement activé avec succès !');
          refreshUser?.();
        } else if (payment.status === 'FAILED' || attempts >= 20) {
          clearInterval(interval);
          if (payment.status === 'FAILED') setError('Le paiement a échoué.');
        }
      } catch { /* retry */ }
    }, 3000);
  };

  const handleCancel = async () => {
    if (!confirm('Voulez-vous vraiment annuler votre abonnement ?')) return;
    setSubscribing(true);
    try {
      await api.patch('/subscriptions/cancel');
      setCurrentSub({ plan: 'GRATUIT', status: 'ACTIVE' });
      setSuccess('Abonnement annulé');
      refreshUser?.();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'annulation');
    } finally {
      setSubscribing(false);
    }
  };

  const formatPrice = (price: number) => {
    return price === 0 ? 'Gratuit' : `${price.toLocaleString('fr-FR')} FCFA`;
  };

  const isCurrentPlan = (planId: string) => currentSub?.plan === planId;

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 py-8">
        <div className="max-w-5xl mx-auto px-4 animate-pulse">
          <div className="h-8 bg-dark-700/50 rounded w-1/3 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-80 bg-dark-700/50 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white">Choisissez votre plan</h1>
          <p className="mt-2 text-dark-300">Débloquez toute la puissance de Ngowamix</p>
        </div>

        {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-6 max-w-xl mx-auto">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm mb-6 max-w-xl mx-auto">{success}</div>}

        {currentSub && currentSub.plan !== 'GRATUIT' && (
          <div className="bg-dark-800/50 rounded-xl p-4 mb-8 max-w-xl mx-auto flex items-center justify-between border border-primary-200">
            <div>
              <p className="text-sm text-dark-400">Abonnement actuel</p>
              <p className="font-semibold text-white">{plans.find((p) => p.id === currentSub.plan)?.name || currentSub.plan}</p>
              {currentSub.endDate && <p className="text-xs text-dark-400">Expire le {new Date(currentSub.endDate).toLocaleDateString('fr-FR')}</p>}
            </div>
            <button onClick={handleCancel} disabled={subscribing} className="text-sm text-red-600 hover:text-red-700 font-medium">
              Annuler
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.filter((p) => !p.id.includes('ANNUEL') && !p.id.includes('FAMILLE')).map((plan) => (
            <div key={plan.id} className={`bg-dark-800/50 rounded-xl p-6 border-2 transition-all ${
              isCurrentPlan(plan.id) ? 'border-primary-500 shadow-lg' : 'border-dark-700/50 hover:border-primary-300'
            }`}>
              <h3 className="text-xl font-bold text-white">{plan.name}</h3>
              <p className="mt-2 text-3xl font-bold text-primary-600">{formatPrice(plan.price)}</p>
              {plan.price > 0 && <p className="text-sm text-dark-400">/mois</p>}
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-dark-300">
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={subscribing || isCurrentPlan(plan.id)}
                className={`w-full mt-6 py-3 rounded-lg font-semibold transition-colors ${
                  isCurrentPlan(plan.id)
                    ? 'bg-dark-700/50 text-dark-400 cursor-default'
                    : 'bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50'
                }`}
              >
                {isCurrentPlan(plan.id) ? 'Plan actuel' : subscribing && selectedPlan === plan.id ? 'Activation...' : 'Choisir'}
              </button>
            </div>
          ))}
        </div>

        {/* Family plans */}
        <h2 className="text-xl font-bold text-white text-center mt-12 mb-6">Plan Famille</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {plans.filter((p) => p.id.includes('FAMILLE')).map((plan) => (
            <div key={plan.id} className={`bg-dark-800/50 rounded-xl p-6 border-2 ${
              isCurrentPlan(plan.id) ? 'border-primary-500 shadow-lg' : 'border-dark-700/50'
            }`}>
              <h3 className="text-lg font-bold text-white">{plan.name}</h3>
              <p className="mt-2 text-2xl font-bold text-primary-600">{formatPrice(plan.price)}</p>
              {plan.price > 0 && <p className="text-sm text-dark-400">{plan.id.includes('ANNUEL') ? '/an' : '/mois'}</p>}
              <ul className="mt-4 space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-dark-300">
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={subscribing || isCurrentPlan(plan.id)}
                className={`w-full mt-4 py-3 rounded-lg font-semibold transition-colors ${
                  isCurrentPlan(plan.id)
                    ? 'bg-dark-700/50 text-dark-400 cursor-default'
                    : 'bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50'
                }`}
              >
                {isCurrentPlan(plan.id) ? 'Plan actuel' : subscribing && selectedPlan === plan.id ? 'Activation...' : 'Choisir'}
              </button>
            </div>
          ))}
        </div>

        {showPayment && pendingPlan && (
          <PaymentModal
            amount={pendingPlan.price}
            title={`Souscription ${pendingPlan.name}`}
            onConfirm={handlePaymentConfirm}
            onClose={() => { setShowPayment(false); setPendingPlan(null); }}
          />
        )}
      </div>
    </div>
  );
}
