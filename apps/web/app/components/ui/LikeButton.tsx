'use client';

import { useState } from 'react';
import { api } from '../../lib/api';

interface LikeButtonProps {
  trackId: string;
  initialLiked?: boolean;
  initialCount?: number;
  onToggle?: (liked: boolean) => void;
  size?: 'sm' | 'md';
}

export default function LikeButton({ trackId, initialLiked = false, initialCount = 0, onToggle, size = 'md' }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const prevLiked = liked;
    const prevCount = count;
    setLiked(!liked);
    setCount(liked ? count - 1 : count + 1);

    try {
      const res = await api.post<{ liked: boolean }>(`/likes/toggle/${trackId}`);
      setLiked(res.liked);
      setCount(res.liked ? prevCount + 1 : prevCount - 1);
      onToggle?.(res.liked);
    } catch {
      setLiked(prevLiked);
      setCount(prevCount);
    }
  };

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <button
      onClick={handleToggle}
      className={`inline-flex items-center gap-1.5 transition-colors ${
        liked ? 'text-red-500 hover:text-red-600' : 'text-dark-400 hover:text-red-400'
      }`}
    >
      <svg className={iconSize} fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={liked ? 0 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
      {count > 0 && <span className="text-xs font-medium">{count}</span>}
    </button>
  );
}
