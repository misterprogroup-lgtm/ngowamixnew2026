'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, type PaginatedResponse } from '../lib/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get<PaginatedResponse<Notification>>('/notifications?limit=50');
        setNotifications(res.data || []);
      } catch {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  };

  const markRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch {
      // ignore
    }
  };

  const deleteNotif = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // ignore
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'follow': return { color: 'bg-blue-500/20 text-blue-400', icon: '👤' };
      case 'like': return { color: 'bg-red-500/20 text-red-400', icon: '❤️' };
      case 'purchase': return { color: 'bg-emerald-500/20 text-emerald-400', icon: '🎫' };
      case 'concert': return { color: 'bg-primary-500/20 text-primary-600', icon: '🎵' };
      case 'live': return { color: 'bg-amber-500/20 text-amber-400', icon: '📡' };
      default: return { color: 'bg-dark-700 text-dark-300', icon: '🔔' };
    }
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Notifications</h1>
            {unreadCount > 0 && <p className="mt-1 text-sm text-dark-400">{unreadCount} non lue(s)</p>}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-sm text-primary-600 hover:text-primary-300 font-medium">
              Tout marquer lu
            </button>
          )}
        </div>
        <div className="mb-6">
          <Link href="/parametres/notifications" className="text-sm text-dark-400 hover:text-primary-600 transition-colors">
            Préférences de notification &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-dark-800/50 rounded-xl">
                <div className="w-10 h-10 bg-dark-700 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-dark-700 rounded w-2/3" />
                  <div className="h-3 bg-dark-700 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 bg-dark-800/50 rounded-xl">
            <svg className="w-16 h-16 text-dark-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-dark-400">Aucune notification</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => {
              const { color, icon } = getIcon(notif.type);
              return (
                <div
                  key={notif.id}
                  className={`flex items-start gap-4 p-4 bg-dark-800/50 rounded-xl transition-colors ${!notif.isRead ? 'border-l-4 border-primary-500' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg ${color}`}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`text-sm ${!notif.isRead ? 'font-semibold text-white' : 'text-dark-200'}`}>
                          {notif.title}
                        </p>
                        <p className="text-sm text-dark-400 mt-0.5">{notif.message}</p>
                      </div>
                      {!notif.isRead && (
                        <button onClick={() => markRead(notif.id)} className="text-xs text-primary-600 hover:text-primary-300 whitespace-nowrap">
                          Marquer lu
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-dark-400">{formatTime(notif.createdAt)}</span>
                      {notif.linkUrl && (
                        <Link href={notif.linkUrl} className="text-xs text-primary-600 hover:text-primary-300">
                          Voir &rarr;
                        </Link>
                      )}
                      <button onClick={() => deleteNotif(notif.id)} className="text-xs text-dark-400 hover:text-red-500 ml-auto">
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
