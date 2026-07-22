'use client';

import { useState, useRef, useEffect } from 'react';
import { Copy, Check, Share2, MessageCircle, Send, ExternalLink, Globe } from 'lucide-react';

interface ShareButtonProps {
  url?: string;
  title?: string;
  className?: string;
  iconOnly?: boolean;
}

const PLATFORMS = [
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'hover:bg-green-50 hover:text-green-600' },
  { key: 'telegram', label: 'Telegram', icon: Send, color: 'hover:bg-blue-50 hover:text-blue-500' },
  { key: 'twitter', label: 'Twitter / X', icon: ExternalLink, color: 'hover:bg-dark-700/50 hover:text-white' },
  { key: 'facebook', label: 'Facebook', icon: Globe, color: 'hover:bg-blue-50 hover:text-blue-600' },
] as const;

export default function ShareButton({ url, title, className = '', iconOnly }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareTitle = title || (typeof window !== 'undefined' ? document.title : 'Ngowamix');

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setOpen(false);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: shareTitle, url: shareUrl }); } catch {}
    } else {
      handleCopy();
    }
    setOpen(false);
  };

  const handlePlatform = (platform: string) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(shareTitle);
    let fullUrl = '';
    switch (platform) {
      case 'whatsapp':
        fullUrl = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
        break;
      case 'telegram':
        fullUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case 'twitter':
        fullUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
        break;
      case 'facebook':
        fullUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`;
        break;
    }
    window.open(fullUrl, '_blank', 'noopener,width=600,height=500');
    setOpen(false);
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button onClick={() => setOpen(!open)} className={`inline-flex items-center gap-1.5 text-dark-400 hover:text-primary-600 transition-colors ${className}`} title="Partager">
        <Share2 className="w-4 h-4" />
        {!iconOnly && <span className="text-xs">Partager</span>}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 bg-dark-800/95 backdrop-blur-xl rounded-xl shadow-lg border border-dark-700/50 py-1.5 min-w-[200px] z-50">
          {PLATFORMS.map(p => (
            <button key={p.key} onClick={() => handlePlatform(p.key)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-dark-200 ${p.color} transition-colors`}>
              <p.icon className="w-4 h-4" />
              {p.label}
            </button>
          ))}
          <div className="border-t border-dark-700/50 my-1" />
          <button onClick={handleNativeShare}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-dark-200 hover:bg-dark-700/50 transition-colors">
            <Share2 className="w-4 h-4" />
            Partager (OS)
          </button>
          <button onClick={handleCopy}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-dark-200 hover:bg-dark-700/50 transition-colors">
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Lien copié !' : 'Copier le lien'}
          </button>
        </div>
      )}
    </div>
  );
}
