'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from './auth/AuthContext';
import NotificationsDropdown from './NotificationsDropdown';
import { Search, Upload, Menu, X, Music, Radio, Ticket, Star, Home, Disc3, Heart, User, LogOut, Settings, ChevronDown, Receipt, ListMusic, Bell, Clock, TrendingUp } from 'lucide-react';
import { NAV_LINKS, MOBILE_NAV_LINKS, ROUTES } from '../lib/routes';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, logout } = useAuth();

  const getDashboardLink = () => {
    if (!user) return ROUTES.LOGIN;
    if (user.role === 'ADMIN') return ROUTES.ADMIN_DASHBOARD;
    if (user.artistProfile) return ROUTES.ARTIST_DASHBOARD;
    return ROUTES.FAN_DASHBOARD;
  };

  return (
    <>
      <header className="bg-dark-950/80 backdrop-blur-xl border-b border-dark-800/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14">
            {/* Logo - left */}
            <Link href="/" className="flex-shrink-0 mr-4">
              <img src="/icon.png" alt="Ngowamix" className="h-8 w-8 rounded-lg" />
            </Link>

            {/* Nav Links */}
            <nav className="hidden lg:flex items-center gap-0.5 ml-4">
              {NAV_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-2.5 py-1 text-[13px] text-dark-400 hover:text-white transition-colors rounded hover:bg-dark-800 whitespace-nowrap"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Search + Actions - right */}
            <div className="hidden md:flex items-center gap-3 flex-shrink-0 ml-auto">
              {/* Search Bar */}
              <form action={ROUTES.SEARCH} method="GET" className="w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                  <input
                    type="text"
                    name="q"
                    placeholder="Rechercher..."
                    className="w-full bg-dark-800/50 border border-dark-700/50 text-white text-sm rounded-full pl-10 pr-4 py-2 outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 placeholder-dark-500 transition-all duration-200"
                  />
                </div>
              </form>

              {user ? (
                <>
                  <Link
                    href={ROUTES.ARTIST_UPLOAD}
                    className="flex items-center gap-1.5 bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white text-sm px-3 py-1.5 rounded-full transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="hidden xl:inline">Publier</span>
                  </Link>
                  <NotificationsDropdown />
                  <div className="relative">
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="flex items-center gap-1.5"
                    >
                      <div className="w-8 h-8 rounded-full bg-dark-700 hover:bg-dark-600 flex items-center justify-center overflow-hidden transition-colors ring-2 ring-transparent hover:ring-dark-500">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-dark-400" />
                        )}
                      </div>
                      <ChevronDown className={`w-3 h-3 text-dark-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isProfileOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                        <div className="absolute right-0 top-full mt-2 w-56 bg-dark-800/95 backdrop-blur-xl border border-dark-700/50 rounded-xl shadow-2xl z-50 py-1">
                          <div className="px-4 py-3 border-b border-dark-700/50">
                            <p className="text-sm font-medium text-white truncate">{user.artistProfile?.artistName || user.pseudo}</p>
                            <p className="text-xs text-dark-400 truncate mt-0.5">{user.email}</p>
                          </div>
                          <Link
                            href={getDashboardLink()}
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-dark-300 hover:bg-dark-700 hover:text-white transition-colors"
                          >
                            <User className="w-4 h-4" />
                            Mon espace
                          </Link>
                          <Link
                            href={ROUTES.PROFILE}
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-dark-300 hover:bg-dark-700 hover:text-white transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                            Paramètres
                          </Link>
                          <Link
                            href={ROUTES.TICKETS}
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-dark-300 hover:bg-dark-700 hover:text-white transition-colors"
                          >
                            <Receipt className="w-4 h-4" />
                            Mes billets
                          </Link>
                          <div className="border-t border-dark-700 mt-1 pt-1">
                            <button
                              onClick={() => { logout(); setIsProfileOpen(false); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-dark-700 hover:text-red-300 transition-colors"
                            >
                              <LogOut className="w-4 h-4" />
                              Déconnexion
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <Link href={ROUTES.LOGIN}>
                  <div className="w-8 h-8 rounded-full bg-dark-700 hover:bg-dark-600 flex items-center justify-center transition-colors">
                    <User className="w-4 h-4 text-dark-400" />
                  </div>
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-1.5 rounded-lg hover:bg-dark-800 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-5 h-5 text-dark-300" />
              ) : (
                <Menu className="w-5 h-5 text-dark-300" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsMenuOpen(false)} />
          <div className="absolute top-14 left-0 right-0 bg-dark-900/95 backdrop-blur-xl border-b border-dark-800/50 max-h-[calc(100vh-56px)] overflow-y-auto">
            <nav className="p-4 space-y-1">
              {[
                { href: ROUTES.HOME, label: 'Accueil', icon: <Home className="w-5 h-5" /> },
                { href: ROUTES.DISCOVER, label: 'Découvrir', icon: <Disc3 className="w-5 h-5" /> },
                { href: ROUTES.RADIO, label: 'Radio', icon: <Radio className="w-5 h-5" /> },
                { href: ROUTES.CHARTS, label: 'Classements', icon: <TrendingUp className="w-5 h-5" /> },
                { href: ROUTES.TRACKS, label: 'Morceaux', icon: <Music className="w-5 h-5" /> },
                { href: ROUTES.FAVORITES, label: 'Favoris', icon: <Heart className="w-5 h-5" /> },
                { href: ROUTES.CONCERTS, label: 'Concerts', icon: <Ticket className="w-5 h-5" /> },
                { href: ROUTES.LIVES, label: 'Lives', icon: <Radio className="w-5 h-5" /> },
                { href: ROUTES.PLAYLISTS, label: 'Playlists', icon: <ListMusic className="w-5 h-5" /> },
                { href: ROUTES.SUBSCRIPTIONS, label: 'Abonnements', icon: <Star className="w-5 h-5" /> },
                { href: ROUTES.NOTIFICATIONS, label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-dark-300 hover:bg-dark-800 hover:text-white transition-colors"
                >
                  {item.icon}
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              ))}

              <div className="border-t border-dark-800 my-2 pt-2">
                {user ? (
                  <>
                    <Link
                      href={getDashboardLink()}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-dark-300 hover:bg-dark-800 hover:text-white transition-colors"
                    >
                      <User className="w-5 h-5" />
                      <span className="text-sm font-medium">Mon espace</span>
                    </Link>
                    <Link
                      href={ROUTES.ARTIST_UPLOAD}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-dark-300 hover:bg-dark-800 hover:text-white transition-colors"
                    >
                      <Upload className="w-5 h-5" />
                      <span className="text-sm font-medium">Publier</span>
                    </Link>
                  <Link
                    href={ROUTES.PROFILE}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-dark-300 hover:bg-dark-800 hover:text-white transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                    <span className="text-sm font-medium">Paramètres</span>
                  </Link>
                  <Link
                    href={ROUTES.FAN_HISTORY}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-dark-300 hover:bg-dark-800 hover:text-white transition-colors"
                  >
                    <Clock className="w-5 h-5" />
                    <span className="text-sm font-medium">Historique</span>
                  </Link>
                  <Link
                    href={ROUTES.TICKETS}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-dark-300 hover:bg-dark-800 hover:text-white transition-colors"
                  >
                    <Receipt className="w-5 h-5" />
                    <span className="text-sm font-medium">Mes billets</span>
                  </Link>
                  <button
                      onClick={() => { logout(); setIsMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-dark-300 hover:bg-dark-800 hover:text-white transition-colors"
                    >
                      <span className="text-sm font-medium">Déconnexion</span>
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2 px-3 pt-2">
                    <Link href={ROUTES.LOGIN} className="flex-1 text-center text-dark-300 hover:text-white text-sm py-2.5 rounded-lg border border-dark-700 transition-colors">
                      Se connecter
                    </Link>
                    <Link href={ROUTES.REGISTER} className="flex-1 text-center bg-primary-500 text-white text-sm py-2.5 rounded-lg font-medium hover:bg-primary-600 transition-colors">
                      S&apos;inscrire
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
