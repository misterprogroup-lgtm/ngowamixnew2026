export function playlistDetail(id: string) { return `/playlists/${id}`; }
export function concertAttendees(id: string) { return `/artiste/concerts/${id}`; }
export function concertCheckIn(id: string) { return `/artiste/concerts/${id}/check-in`; }

export const ROUTES = {
  HOME: '/',
  RADIO: '/radio',
  CHARTS: '/classements',
  HELP: '/aide',
  DISCOVER: '/decouverte',
  TRACKS: '/morceaux',
  CONCERTS: '/concerts',
  LIVES: '/lives',
  SUBSCRIPTIONS: '/abonnements',
  SEARCH: '/recherche',
  FAVORITES: '/favoris',
  PLAYLISTS: '/playlists',
  PLAYLISTS_CREATE: '/playlists/creer',
  ARTISTS: '/artistes',
  NOTIFICATIONS: '/notifications',
  NOTIFICATION_PREFS: '/parametres/notifications',
  PROFILE: '/profil',
  TICKETS: '/mes-tickets',
  LOGIN: '/connexion',
  REGISTER: '/inscription',
  ONBOARDING: '/onboarding',
  FORGOT_PASSWORD: '/mot-de-passe-oublie',

  // Fan
  FAN_DASHBOARD: '/fan/dashboard',
  FAN_HISTORY: '/fan/historique',
  FAN_DOWNLOADS: '/fan/telechargements',

  // Artist
  ARTIST_DASHBOARD: '/artiste/dashboard',
  ARTIST_UPLOAD: '/artiste/publier',
  ARTIST_ALBUM: '/artiste/publier-album',
  ARTIST_CONCERTS: '/artiste/concerts',
  ARTIST_ALBUMS: '/artiste/albums',
  ARTIST_LIVES: '/artiste/lives',
  ARTIST_STATS: '/artiste/stats',
  ARTIST_EARNINGS: '/artiste/gains',
  ARTIST_TRACKS: '/artiste/morceaux',

  // Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_REPORTS: '/admin/signalements',
  ADMIN_WITHDRAWALS: '/admin/retraits',
  ADMIN_MODERATION: '/admin/moderation',

  // Legal
  LEGAL_MENTIONS: '/mentions-legales',
  PRIVACY: '/confidentialite',
  TERMS: '/conditions',
} as const;

export const NAV_LINKS = [
  { label: 'Accueil', href: ROUTES.HOME },
  { label: 'Découvrir', href: ROUTES.DISCOVER },
  { label: 'Radio', href: ROUTES.RADIO },
  { label: 'Classements', href: ROUTES.CHARTS },
  { label: 'Morceaux', href: ROUTES.TRACKS },
  { label: 'Concerts', href: ROUTES.CONCERTS },
  { label: 'Lives', href: ROUTES.LIVES },
  { label: 'Abonnements', href: ROUTES.SUBSCRIPTIONS },
] as const;

export const MOBILE_NAV_LINKS = [
  { label: 'Accueil', href: ROUTES.HOME, icon: 'Home' },
  { label: 'Découvrir', href: ROUTES.DISCOVER, icon: 'Disc3' },
  { label: 'Radio', href: ROUTES.RADIO, icon: 'Radio' },
  { label: 'Classements', href: ROUTES.CHARTS, icon: 'TrendingUp' },
  { label: 'Morceaux', href: ROUTES.TRACKS, icon: 'Music' },
  { label: 'Concerts', href: ROUTES.CONCERTS, icon: 'Ticket' },
  { label: 'Lives', href: ROUTES.LIVES, icon: 'Radio' },
  { label: 'Favoris', href: ROUTES.FAVORITES, icon: 'Heart' },
  { label: 'Abonnements', href: ROUTES.SUBSCRIPTIONS, icon: 'Star' },
] as const;

export const FAN_QUICK_LINKS = [
  { label: 'Historique', href: ROUTES.FAN_HISTORY },
  { label: 'Téléchargements', href: ROUTES.FAN_DOWNLOADS },
  { label: 'Mes billets', href: ROUTES.TICKETS },
] as const;

export const ARTIST_QUICK_LINKS = [
  { label: 'Stats', href: ROUTES.ARTIST_STATS },
  { label: 'Publier', href: ROUTES.ARTIST_UPLOAD },
  { label: 'Album', href: ROUTES.ARTIST_ALBUM },
  { label: 'Concerts', href: ROUTES.ARTIST_CONCERTS },
  { label: 'Albums', href: ROUTES.ARTIST_ALBUMS },
  { label: 'Lives', href: ROUTES.ARTIST_LIVES },
  { label: 'Gains', href: ROUTES.ARTIST_EARNINGS },
] as const;
