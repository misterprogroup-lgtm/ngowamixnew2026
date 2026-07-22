'use client';

import { PlayerProvider } from './PlayerContext';
import PlayerBar from './PlayerBar';
import QuotaBlockedModal from './QuotaBlockedModal';

export default function PlayerWrapper({ children }: { children: React.ReactNode }) {
  return (
    <PlayerProvider>
      {children}
      <PlayerBar />
      <QuotaBlockedModal />
    </PlayerProvider>
  );
}
