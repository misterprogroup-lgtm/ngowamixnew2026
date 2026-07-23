'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, type PaginatedResponse } from '../lib/api';
import { Calendar, MapPin, Link2 } from 'lucide-react';

interface Concert {
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
  artist: { artistName: string; slug: string; user?: { avatarUrl?: string } };
  _count?: { tickets: number };
}

export default function ConcertsPage() {
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConcerts = async () => {
      try {
        const res = await api.get<PaginatedResponse<Concert>>('/concerts?upcoming=true');
        setConcerts(res.data || []);
      } catch {
        try {
          const res = await api.get<PaginatedResponse<Concert>>('/concerts');
          setConcerts(res.data || []);
        } catch {
          setConcerts([]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchConcerts();
  }, []);

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Concerts</h1>
          <p className="mt-2 text-dark-300">Les concerts à venir sur Ngowamix</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-dark-800/50 rounded-xl overflow-hidden">
                <div className="h-48 bg-dark-700/50" />
                <div className="p-4 space-y-2">
                  <div className="h-5 bg-dark-700/50 rounded w-2/3" />
                  <div className="h-4 bg-dark-700/50 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : concerts.length === 0 ? (
          <div className="text-center py-16 bg-dark-800/50 rounded-xl">
            <svg className="w-16 h-16 text-dark-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
            <p className="text-dark-500 mb-2">Aucun concert à venir</p>
            <p className="text-sm text-dark-400">Les artistes bientôt publieront leurs concerts</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {concerts.map((concert) => (
              <Link key={concert.id} href={`/concerts/${concert.slug}`} className="bg-dark-800/50 rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
                <div className="h-48 bg-gradient-to-br from-primary-400 to-primary-600 relative">
                  {concert.coverUrl ? (
                    <img src={concert.coverUrl} alt={concert.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-white/40" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      concert.ticketPrice === 0 ? 'bg-green-500 text-white' : 'bg-dark-900/80 text-white'
                    }`}>
                      {concert.ticketPrice === 0 ? 'Gratuit' : `${concert.ticketPrice.toLocaleString('fr-FR')} FCFA`}
                    </span>
                  </div>
                  {concert.totalSeats > 0 && (
                    <div className="absolute bottom-3 right-3">
                      <span className="bg-dark-900/60 text-white text-xs px-2 py-1 rounded-full">
                        {concert.totalSeats - concert.soldSeats} place(s)
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-white group-hover:text-primary-600 transition-colors truncate">{concert.title}</h3>
                  <p className="text-sm text-dark-500 mt-1">{concert.artist.artistName}</p>
                  <div className="flex items-center gap-2 mt-3 text-xs text-dark-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{new Date(concert.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span>•</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <span>{concert.venue}, {concert.city}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-[11px] text-primary-400">
                    <Link2 className="w-3 h-3" />
                    <span>{concert.artist.slug.replace(/-/g, '')}ticket.ngowamix.com</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
