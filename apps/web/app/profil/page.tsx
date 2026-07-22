'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../components/auth/AuthContext';
import { api } from '../lib/api';
import { Shield, Lock, Key, Eye, EyeOff, Mail, Star, CreditCard, Trash2 } from 'lucide-react';

export default function ProfilPage() {
  const { user, refreshUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [pseudo, setPseudo] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [upgradeName, setUpgradeName] = useState('');
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');

  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upgradeName.trim()) return;
    setUpgrading(true);
    setUpgradeError('');
    try {
      await api.post('/users/upgrade-to-artist', { artistName: upgradeName });
      window.location.href = '/onboarding';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la demande';
      setUpgradeError(msg);
    } finally {
      setUpgrading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.push('/connexion');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setPseudo(user.pseudo || '');
      setCountry(user.country || '');
      setCity(user.city || '');
      setAvatarPreview(user.avatarUrl || null);
    }
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (avatarFile) {
        await api.upload('/users/avatar', avatarFile, 'avatar');
      }
      await api.patch('/users/me', { pseudo, country, city });
      setSuccess('Profil mis à jour !');
      refreshUser?.();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Min. 8 caractères');
      return;
    }
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');
    try {
      await api.patch('/users/me/password', { currentPassword, newPassword });
      setPasswordSuccess('Mot de passe modifié !');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (err: any) {
      setPasswordError(err.message || 'Erreur');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setEmailLoading(true);
    setEmailError('');
    setEmailSuccess('');
    try {
      await api.patch('/users/me/email', { email: newEmail, password: emailPassword });
      setEmailSuccess('Adresse email modifiée !');
      setShowEmailForm(false);
      setNewEmail('');
      setEmailPassword('');
      refreshUser?.();
    } catch (err: any) {
      setEmailError(err.message || 'Erreur');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText !== 'SUPPRIMER') return;
    setDeleting(true);
    setDeleteError('');
    try {
      await api.delete('/users/me', { password: deletePassword });
      window.location.href = '/';
    } catch (err: any) {
      setDeleteError(err.message || 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-lg mx-auto px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-white mb-8">Mon profil</h1>

        <form onSubmit={handleSubmit} className="bg-dark-800/50 rounded-xl p-6 space-y-6">
          {error && <div className="bg-red-500/10 text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>}
          {success && <div className="bg-emerald-500/20 text-emerald-300 px-4 py-3 rounded-lg text-sm">{success}</div>}

          {/* Subscription Badge */}
          {user.subscription && user.subscription.plan !== 'FREE' && (
            <div className="bg-gradient-to-r from-primary-500/10 to-amber-500/10 border border-primary-500/50 rounded-xl p-4 flex items-center gap-3">
              <Star className="w-6 h-6 text-primary-500" />
              <div className="flex-1">
                <p className="font-semibold text-white">Abonnement {user.subscription.plan}</p>
                <p className="text-xs text-dark-400">
                  Statut : {user.subscription.status === 'ACTIVE' ? 'Actif' : user.subscription.status}
                  {user.subscription.endDate && ` · Expire le ${new Date(user.subscription.endDate).toLocaleDateString('fr-FR')}`}
                </p>
              </div>
              <Link href="/abonnements" className="text-sm text-primary-600 hover:text-primary-300 font-medium">
                Gérer
              </Link>
            </div>
          )}

          {/* Avatar */}
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-dark-700 flex items-center justify-center overflow-hidden flex-shrink-0">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-dark-400">{pseudo.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <label className="cursor-pointer">
              <span className="bg-dark-700 hover:bg-dark-600 text-dark-200 px-4 py-2 rounded-lg text-sm transition-colors">
                Changer l&apos;avatar
              </span>
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          </div>

          {/* Email */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-dark-200">Email</label>
              <button type="button" onClick={() => setShowEmailForm(!showEmailForm)}
                className="text-xs text-primary-600 hover:text-primary-300 font-medium">
                {showEmailForm ? 'Annuler' : 'Modifier'}
              </button>
            </div>
            <input type="email" value={user.email} disabled
              className="w-full border border-dark-700 rounded-lg px-4 py-2.5 bg-dark-900 text-dark-400 cursor-not-allowed" />
            {showEmailForm && (
              <div className="mt-3 space-y-3 p-4 bg-dark-900 rounded-lg border border-dark-700">
                <div>
                  <label className="block text-xs font-medium text-dark-300 mb-1">Nouvel email</label>
                  <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required
                    className="w-full border border-dark-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-dark-300 mb-1">Mot de passe actuel</label>
                  <input type="password" value={emailPassword} onChange={e => setEmailPassword(e.target.value)} required
                    className="w-full border border-dark-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                </div>
                {emailError && <p className="text-red-500 text-xs">{emailError}</p>}
                {emailSuccess && <p className="text-emerald-400 text-xs">{emailSuccess}</p>}
                <button type="button" onClick={handleEmailChange} disabled={emailLoading || !newEmail || !emailPassword}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
                  {emailLoading ? 'Modification...' : 'Confirmer'}
                </button>
              </div>
            )}
          </div>

          {/* Pseudo */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1">Pseudo</label>
            <input
              type="text"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              className="w-full border border-dark-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">Pays</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full border border-dark-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="ex: Cameroun"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">Ville</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full border border-dark-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="ex: Douala"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <p className="text-xs text-dark-400">Rôle : {user.role} {user.isVerified && '• Vérifié'}</p>
            <button
              type="submit"
              disabled={loading}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>

        {/* Upgrade to Artist */}
        {user.role === 'FAN' && (
          <div className="mt-8 bg-dark-800/50 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-white">Devenir artiste</h2>
            </div>
            <p className="text-sm text-dark-400 mb-4">
              Publiez vos morceaux, créez des albums, organisez des concerts et diffusez des lives payants.
            </p>
            <form onSubmit={handleUpgrade} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">Nom d'artiste</label>
                <input
                  type="text"
                  value={upgradeName}
                  onChange={e => setUpgradeName(e.target.value)}
                  required
                  placeholder="ex: Magic System"
                  className="w-full border border-dark-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
              {upgradeError && <p className="text-red-500 text-sm">{upgradeError}</p>}
              <button type="submit" disabled={upgrading || !upgradeName.trim()}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
                {upgrading ? 'Création...' : 'Devenir artiste'}
              </button>
            </form>
          </div>
        )}

        {/* Password Section */}
        <div className="mt-8 bg-dark-800/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-dark-400" />
              <h2 className="text-lg font-semibold text-white">Mot de passe</h2>
            </div>
            <button onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="text-sm text-primary-600 hover:text-primary-300 font-medium">
              {showPasswordForm ? 'Annuler' : 'Modifier'}
            </button>
          </div>

          {showPasswordForm && (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">Mot de passe actuel</label>
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required
                  className="w-full border border-dark-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">Nouveau mot de passe</label>
                <div className="relative">
                  <input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8}
                    className="w-full border border-dark-700 rounded-lg px-4 py-2.5 pr-10 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="Min. 8 caractères" />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-300">
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">Confirmer</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                  className="w-full border border-dark-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
              </div>
              {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
              {passwordSuccess && <p className="text-emerald-400 text-sm">{passwordSuccess}</p>}
              <button type="submit" disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
                {passwordLoading ? 'Modification...' : 'Modifier le mot de passe'}
              </button>
            </form>
          )}
        </div>

        {/* Delete Account */}
        <div className="mt-8 bg-dark-800/50 rounded-xl p-6 border border-red-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-red-400">
              <Trash2 className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Supprimer mon compte</h2>
            </div>
            <button onClick={() => setShowDeleteForm(!showDeleteForm)}
              className="text-sm text-red-400 hover:text-red-300 font-medium">
              {showDeleteForm ? 'Annuler' : 'Supprimer'}
            </button>
          </div>
          <p className="text-sm text-dark-400 mb-4">
            Cette action est irréversible. Toutes vos données personnelles seront anonymisées.
          </p>

          {showDeleteForm && (
            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">Mot de passe</label>
                <input type="password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)} required
                  className="w-full border border-dark-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1">
                  Tapez <span className="font-bold text-red-400">SUPPRIMER</span> pour confirmer
                </label>
                <input type="text" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)}
                  className="w-full border border-dark-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none" />
              </div>
              {deleteError && <p className="text-red-500 text-sm">{deleteError}</p>}
              <button type="submit" disabled={deleting || deleteConfirmText !== 'SUPPRIMER' || !deletePassword}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
                {deleting ? 'Suppression...' : 'Supprimer définitivement'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
