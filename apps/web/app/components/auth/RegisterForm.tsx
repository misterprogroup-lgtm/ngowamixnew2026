'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from './AuthContext';

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    pseudo: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: '',
    city: '',
    role: 'FAN' as 'FAN' | 'ARTISTE',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);

    try {
      await register({
        pseudo: formData.pseudo,
        email: formData.email,
        password: formData.password,
        country: formData.country || undefined,
        city: formData.city || undefined,
        role: formData.role,
      });
      if (formData.role === 'ARTISTE') {
        window.location.href = '/onboarding';
      } else {
        window.location.href = '/';
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-dark-200 mb-2">Je suis</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, role: 'FAN' })}
            className={`py-3 rounded-xl text-sm font-medium border-2 transition-all duration-200 ${
              formData.role === 'FAN' ? 'border-primary-500 bg-primary-500/10 text-primary-400 shadow-lg shadow-primary-500/10' : 'border-dark-600 text-dark-300 hover:border-dark-500 hover:bg-dark-700/50'
            }`}
          >
            Fan
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, role: 'ARTISTE' })}
            className={`py-3 rounded-xl text-sm font-medium border-2 transition-all duration-200 ${
              formData.role === 'ARTISTE' ? 'border-primary-500 bg-primary-500/10 text-primary-400 shadow-lg shadow-primary-500/10' : 'border-dark-600 text-dark-300 hover:border-dark-500 hover:bg-dark-700/50'
            }`}
          >
            Artiste
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="pseudo" className="block text-sm font-medium text-dark-200 mb-2">Pseudo *</label>
        <input
          id="pseudo" name="pseudo" type="text" value={formData.pseudo} onChange={handleChange}
          className="input-field" placeholder="MonPseudo123" required minLength={3}
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-dark-200 mb-2">Email *</label>
        <input
          id="email" name="email" type="email" value={formData.email} onChange={handleChange}
          className="input-field" placeholder="votre@email.com" required
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-dark-200 mb-2">Mot de passe *</label>
        <input
          id="password" name="password" type="password" value={formData.password} onChange={handleChange}
          className="input-field" placeholder="Min. 8 caractères" required minLength={8}
        />
        <p className="mt-1 text-xs text-dark-500">1 majuscule, 1 minuscule, 1 chiffre et 1 caractère spécial</p>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-dark-200 mb-2">Confirmer le mot de passe *</label>
        <input
          id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange}
          className="input-field" placeholder="••••••••" required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-dark-200 mb-2">Pays</label>
          <input
            id="country" name="country" type="text" value={formData.country} onChange={handleChange}
            className="input-field" placeholder="Côte d'Ivoire"
          />
        </div>
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-dark-200 mb-2">Ville</label>
          <input
            id="city" name="city" type="text" value={formData.city} onChange={handleChange}
            className="input-field" placeholder="Abidjan"
          />
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Inscription en cours...' : 'Créer mon compte'}
      </button>

      <p className="text-center text-sm text-dark-400">
        Déjà un compte ?{' '}
        <Link href="/connexion" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">Se connecter</Link>
      </p>
    </form>
  );
}
