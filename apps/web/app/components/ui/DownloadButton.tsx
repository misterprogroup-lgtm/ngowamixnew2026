'use client';

import { useState } from 'react';
import { Download, Check } from 'lucide-react';
import { api } from '@/app/lib/api';

interface DownloadButtonProps {
  trackId: string;
  trackTitle?: string;
  className?: string;
}

export default function DownloadButton({ trackId, trackTitle, className = '' }: DownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const [done, setDone] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (downloading || done) return;
    setDownloading(true);
    try {
      const result = await api.post<{ allowed: boolean; quotaExceeded?: boolean; message?: string }>(`/music/download/${trackId}`);
      if (result.allowed) {
        window.location.href = `/api/music/stream/${trackId}?download=true`;
        setDone(true);
        setTimeout(() => setDone(false), 3000);
      } else {
        alert(result.message || 'Limite de téléchargements atteinte');
      }
    } catch (err: any) {
      alert(err.message || 'Erreur lors du téléchargement');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button onClick={handleDownload} disabled={downloading} className={`inline-flex items-center gap-1.5 text-dark-400 hover:text-white transition-colors disabled:opacity-50 ${className}`} title="Télécharger">
      {done ? (
        <>
          <Check className="w-4 h-4 text-green-400" />
          <span className="text-xs text-green-400">OK</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span className="text-xs">{downloading ? '...' : 'Télécharger'}</span>
        </>
      )}
    </button>
  );
}
