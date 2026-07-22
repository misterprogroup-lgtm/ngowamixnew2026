export interface Track {
  id: string;
  title: string;
  slug: string;
  description?: string;
  audioUrl: string;
  audioSize: number;
  audioDuration: number;
  coverUrl?: string;
  genre?: string;
  tags: string[];
  visibility: string;
  playCount: number;
  downloadCount: number;
  likeCount: number;
  isExplicit: boolean;
  publishedAt?: string;
  createdAt: string;
  artist: {
    id?: string;
    artistName: string;
    slug: string;
    user?: { avatarUrl?: string; pseudo?: string };
  };
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
  user: {
    pseudo: string;
    avatarUrl?: string;
    country?: string;
    city?: string;
  };
  tracks?: Track[];
  albums?: Album[];
}

export interface Album {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverUrl?: string;
  releaseDate?: string;
  price?: number;
  isFree?: boolean;
  trackCount?: number;
  createdAt?: string;
  artist: {
    artistName: string;
    slug: string;
  };
  albumTracks?: { track: Track; position: number }[];
  _count?: { albumTracks: number; albumPurchases: number };
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  coverUrl?: string;
  isPublic: boolean;
  trackCount: number;
  createdAt: string;
  user: { pseudo: string };
  playlistTracks?: { track: Track; position: number }[];
}

export interface User {
  id: string;
  email: string;
  pseudo: string;
  role: string;
  avatarUrl?: string;
  country?: string;
  city?: string;
  isVerified: boolean;
  createdAt: string;
  subscription?: {
    plan: string;
    status: string;
    endDate?: string;
  };
  artistProfile?: {
    id: string;
    slug: string;
    artistName: string;
  };
}

export interface Concert {
  id: string;
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
  status: string;
  createdAt: string;
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
  qrImage?: string;
  status: string;
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
  artist: { artistName: string; slug: string; user?: { avatarUrl?: string } };
  _count?: { accesses: number };
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface QuotaStatus {
  listensUsed: number;
  listenLimit: number;
  listensRemaining: number;
  downloadsUsed: number;
  downloadLimit: number;
  downloadsRemaining: number;
  isPremium: boolean;
  plan?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
