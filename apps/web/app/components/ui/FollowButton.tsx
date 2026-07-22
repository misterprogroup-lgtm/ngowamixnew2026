'use client';

import { useState } from 'react';
import { api } from '../../lib/api';

interface FollowButtonProps {
  artistId: string;
  initialFollowing?: boolean;
  initialCount?: number;
  onToggle?: (following: boolean) => void;
}

export default function FollowButton({ artistId, initialFollowing = false, initialCount = 0, onToggle, size = 'md' }: FollowButtonProps & { size?: 'sm' | 'md' }) {
  const [following, setFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(initialCount);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const prevFollowing = following;
    const prevCount = count;
    setFollowing(!following);
    setCount(following ? count - 1 : count + 1);

    try {
      const res = await api.post<{ followed: boolean }>(`/follows/toggle/${artistId}`);
      setFollowing(res.followed);
      setCount(res.followed ? prevCount + 1 : prevCount - 1);
      onToggle?.(res.followed);
    } catch {
      setFollowing(prevFollowing);
      setCount(prevCount);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
        following
          ? 'bg-dark-900 text-white hover:bg-dark-800'
          : 'bg-primary-600 text-white hover:bg-primary-700'
      }`}
    >
      {following ? 'Suivi' : 'Suivre'}
    </button>
  );
}
