import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from './components/Header';
import Footer from './components/Footer';
import PlayerWrapper from './components/player/PlayerWrapper';
import { AuthProvider } from './components/auth/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Ngowamix - Streaming Musical, Billetterie & Live Payant',
  description: 'Plateforme musicale permettant aux artistes de publier, vendre des tickets et diffuser des lives payants.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.png',
    apple: '/icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Ngowamix',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body className={`min-h-screen flex flex-col bg-dark-900 ${inter.className}`}>
        <AuthProvider>
          <PlayerWrapper>
            <Header />
            <main className="flex-1 pb-20">{children}</main>
            <Footer />
          </PlayerWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
