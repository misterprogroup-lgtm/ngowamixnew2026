// ============================================================
// @ngowamix/shared — Types TypeScript partagés API ↔ Web
// ============================================================

// ─── Enums ──────────────────────────────────────────────────

export enum UserRole {
  FAN = 'FAN',
  ARTISTE = 'ARTISTE',
  ADMIN = 'ADMIN',
}

export enum SubscriptionPlan {
  GRATUIT = 'GRATUIT',
  PRO_MENSUEL = 'PRO_MENSUEL',
  PRO_ANNUEL = 'PRO_ANNUEL',
  FAMILLE_MENSUEL = 'FAMILLE_MENSUEL',
  FAMILLE_ANNUEL = 'FAMILLE_ANNUEL',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDUE = 'SUSPENDUE',
  EXPIREE = 'EXPIREE',
  ANNULEE = 'ANNULEE',
}

export enum TrackVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  UNLISTED = 'UNLISTED',
}

// ─── Plan Info ──────────────────────────────────────────────

export interface PlanInfo {
  id: string;
  name: string;
  price: number;
  listenLimit: number;  // -1 = illimité
  downloadLimit: number; // -1 = illimité
  features: string[];
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, PlanInfo> = {
  [SubscriptionPlan.GRATUIT]: {
    id: 'GRATUIT',
    name: 'Gratuit',
    price: 0,
    listenLimit: 30,
    downloadLimit: 5,
    features: ['30 écoutes/jour', '5 téléchargements/jour', 'Qualité standard'],
  },
  [SubscriptionPlan.PRO_MENSUEL]: {
    id: 'PRO_MENSUEL',
    name: 'Pro Mensuel',
    price: 2000,
    listenLimit: -1,
    downloadLimit: -1,
    features: ['Écoutes illimitées', 'Téléchargements illimités', 'Qualité HD', 'Sans publicité'],
  },
  [SubscriptionPlan.PRO_ANNUEL]: {
    id: 'PRO_ANNUEL',
    name: 'Pro Annuel',
    price: 20000,
    listenLimit: -1,
    downloadLimit: -1,
    features: ['Écoutes illimitées', 'Téléchargements illimités', 'Qualité HD', 'Sans publicité', '2 mois offerts'],
  },
  [SubscriptionPlan.FAMILLE_MENSUEL]: {
    id: 'FAMILLE_MENSUEL',
    name: 'Famille Mensuel',
    price: 5000,
    listenLimit: -1,
    downloadLimit: -1,
    features: ["Jusqu'à 5 comptes", 'Écoutes illimitées', 'Téléchargements illimités', 'Qualité HD', 'Sans publicité'],
  },
  [SubscriptionPlan.FAMILLE_ANNUEL]: {
    id: 'FAMILLE_ANNUEL',
    name: 'Famille Annuel',
    price: 50000,
    listenLimit: -1,
    downloadLimit: -1,
    features: ["Jusqu'à 5 comptes", 'Écoutes illimitées', 'Téléchargements illimités', 'Qualité HD', 'Sans publicité', '2 mois offerts'],
  },
};

// ─── Models ─────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  phone?: string;
  pseudo: string;
  role: UserRole;
  avatarUrl?: string;
  country?: string;
  city?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ArtistProfile {
  id: string;
  userId: string;
  slug: string;
  artistName: string;
  bio?: string;
  bannerUrl?: string;
  genres: string[];
  socialLinks?: Record<string, string>;
  followerCount: number;
  createdAt: string;
  updatedAt: string;
  user: Pick<User, 'pseudo' | 'avatarUrl' | 'country' | 'city'>;
  tracks?: Track[];
  albums?: Album[];
}

export interface Track {
  id: string;
  artistId: string;
  title: string;
  slug: string;
  description?: string;
  audioUrl: string;
  audioSize: number;
  audioDuration: number;
  coverUrl?: string;
  genre?: string;
  tags: string[];
  visibility: TrackVisibility;
  playCount: number;
  downloadCount: number;
  likeCount: number;
  isExplicit: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  artist: {
    id?: string;
    artistName: string;
    slug: string;
    user?: { avatarUrl?: string; pseudo?: string };
  };
}

export interface Album {
  id: string;
  artistId: string;
  title: string;
  slug: string;
  description?: string;
  coverUrl?: string;
  releaseDate?: string;
  price: number;
  isFree: boolean;
  createdAt: string;
  updatedAt: string;
  artist: {
    artistName: string;
    slug: string;
  };
  albumTracks?: { track: Track; position: number }[];
  _count?: { albumTracks: number; albumPurchases: number };
}

export interface Playlist {
  id: string;
  userId: string;
  title: string;
  description?: string;
  coverUrl?: string;
  isPublic: boolean;
  trackCount: number;
  createdAt: string;
  updatedAt: string;
  user: { pseudo: string };
  playlistTracks?: { track: Track; position: number }[];
}

export interface Concert {
  id: string;
  artistId: string;
  title: string;
  slug: string;
  description?: string;
  coverUrl?: string;
  venue: string;
  city: string;
  country: string;
  date: string;
  time?: string;
  ticketPrice: number;
  totalSeats: number;
  soldSeats: number;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  artist: { artistName: string; slug: string; user?: { avatarUrl?: string } };
  _count?: { tickets: number };
}

export interface Ticket {
  id: string;
  userId: string;
  concertId: string;
  quantity: number;
  totalPaid: number;
  qrCode?: string;
  status: 'ACTIVE' | 'USED' | 'CANCELLED';
  createdAt: string;
  concert: {
    title: string;
    venue: string;
    city: string;
    date: string;
    time?: string;
    artist?: { artistName: string; slug: string };
  };
}

export interface PaidLive {
  id: string;
  artistId: string;
  title: string;
  slug: string;
  description?: string;
  coverUrl?: string;
  streamUrl?: string;
  price: number;
  scheduledAt?: string;
  isLive: boolean;
  viewerCount: number;
  createdAt: string;
  updatedAt: string;
  artist: { artistName: string; slug: string; user?: { avatarUrl?: string } };
  _count?: { accesses: number };
}

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: string;
  endDate?: string;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  income: number;
  pending: number;
  updatedAt: string;
}

export interface Withdrawal {
  id: string;
  userId: string;
  walletId: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  method: 'orange_money' | 'mtn_money' | 'carte_bancaire';
  account: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  method: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  targetType: string;
  targetId: string;
  reference?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface DailyQuota {
  id: string;
  userId: string;
  date: string;
  listensUsed: number;
  downloadsUsed: number;
  listenLimit: number;
  downloadLimit: number;
}

export interface Comment {
  id: string;
  userId: string;
  trackId: string;
  content: string;
  createdAt: string;
  user: { pseudo: string; avatarUrl?: string };
}

export interface Report {
  id: string;
  userId: string;
  targetType: string;
  targetId: string;
  reason: string;
  details?: string;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
}

// ─── API Response Types ─────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages?: number;
  };
}

export interface ApiResponse<T> {
  data: T;
  statusCode: number;
  timestamp: string;
}

export interface QuotaStatus {
  listensUsed: number;
  listenLimit: number;
  listensRemaining: number;
  downloadsUsed: number;
  downloadLimit: number;
  downloadsRemaining: number;
  isPremium: boolean;
}

// ─── Payment Methods ────────────────────────────────────────

export type PaymentMethod = 'orange_money' | 'mtn_money' | 'carte_bancaire';

export const PAYMENT_METHODS: { id: PaymentMethod; name: string; icon: string }[] = [
  { id: 'orange_money', name: 'Orange Money', icon: 'orange' },
  { id: 'mtn_money', name: 'MTN Mobile Money', icon: 'mtn' },
  { id: 'carte_bancaire', name: 'Carte Bancaire', icon: 'card' },
];

// ─── Platform Config ────────────────────────────────────────

export const PLATFORM_CONFIG = {
  COMMISSION_RATE: 0.15, // 15% commission sur les ventes
  MIN_WITHDRAWAL: 5000, // 5000 FCFA minimum pour un retrait
  FREE_LISTEN_LIMIT: 30,
  FREE_DOWNLOAD_LIMIT: 5,
  MIN_LISTEN_DURATION: 30, // secondes pour compter une écoute
  MAX_UPLOAD_SIZE_MB: 50,
  SUPPORTED_AUDIO_FORMATS: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac', 'audio/mp4', 'audio/webm'],
} as const;
