'use client';

import { useState, useEffect, useRef } from 'react';
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

export default function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const res = await api.get<PaginatedResponse<Notification>>('/notifications?limit=20');
        setNotifications(res.data || []);
        const countRes = await api.get<number>('/notifications/unread-count');
        setUnreadCount(countRes || 0);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [open]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const count = await api.get<number>('/notifications/unread-count');
        setUnreadCount(count);
      } catch {
        // ignore
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'follow': return { color: 'bg-blue-500/20 text-blue-400', icon: '👤' };
      case 'like': return { color: 'bg-red-500/20 text-red-400', icon: '❤️' };
      case 'purchase': return { color: 'bg-emerald-500/20 text-emerald-400', icon: '🎫' };
      case 'concert': return { color: 'bg-primary-500/20 text-primary-400', icon: '🎵' };
      case 'live': return { color: 'bg-amber-500/20 text-amber-400', icon: '📡' };
      default: return { color: 'bg-dark-600 text-dark-300', icon: '🔔' };
    }
  };

  const formatTime = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "à l'instant";
    if (mins < 60) return `il y a ${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours}h`;
    return `il y a ${Math.floor(hours / 24)}j`;
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative p-2 text-dark-300 hover:text-white transition-colors">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-dark-800 rounded-xl shadow-xl border border-dark-700/50 z-50 max-h-96 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700/50">
            <h3 className="font-semibold text-white text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary-600 hover:text-primary-700">
                Tout marquer lu
              </button>
            )}
          </div>
          <div className="overflow-y-auto max-h-72">
            {loading ? (
              <div className="p-4 text-center text-dark-400 text-sm">Chargement...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-dark-400 text-sm">Aucune notification</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const { color, icon } = getIcon(notif.type);
                return (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-dark-700/50 transition-colors cursor-pointer border-b border-dark-700/30 ${!notif.isRead ? 'bg-primary-500/10' : ''}`}
                    onClick={() => {
                      if (notif.linkUrl) {
                        window.location.href = notif.linkUrl;
                      }
                      setOpen(false);
                    }}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm ${color}`}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notif.isRead ? 'font-semibold text-white' : 'text-dark-200'}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-dark-400 truncate">{notif.message}</p>
                      <p className="text-[10px] text-dark-500 mt-0.5">{formatTime(notif.createdAt)}</p>
                    </div>
                    {!notif.isRead && <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1.5" />}
                  </div>
                );
              })
            )}
          </div>
          <Link href="/notifications" onClick={() => setOpen(false)} className="block text-center py-2.5 text-xs text-primary-400 hover:bg-dark-700/50 font-medium border-t border-dark-700/50">
            Voir toutes les notifications
          </Link>
        </div>
      )}
    </div>
  );
}
