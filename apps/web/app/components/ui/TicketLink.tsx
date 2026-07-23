'use client';

import { useState } from 'react';
import { Link2, Copy, Check } from 'lucide-react';

interface TicketLinkProps {
  artistSlug: string;
  className?: string;
}

export default function TicketLink({ artistSlug, className = '' }: TicketLinkProps) {
  const [copied, setCopied] = useState(false);
  const ticketUrl = `https://${artistSlug}ticket.ngowamix.com`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ticketUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = ticketUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 flex items-center gap-2 bg-dark-700/50 border border-dark-600/50 rounded-lg px-3 py-2 min-w-0">
        <Link2 className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
        <span className="text-sm text-dark-300 truncate">{ticketUrl}</span>
      </div>
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 flex-shrink-0"
      >
        {copied ? <><Check className="w-3.5 h-3.5" /> Copié</> : <><Copy className="w-3.5 h-3.5" /> Copier</>}
      </button>
    </div>
  );
}
