import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Multiplayer Typing - Real-time Typing Battles',
  description: 'Compete with other players in real-time multiplayer typing games. Join rooms, quick match with players at your skill level, or create custom games. Practice typing competitively with falling blocks, blink, typing walk, and falling words multiplayer modes.',
  keywords: [
    'multiplayer typing',
    'typing battles',
    'online typing competition',
    'typing multiplayer games',
    'real-time typing game',
    'competitive typing',
    'typing race online',
    'quick match typing',
    'typing matchmaking',
    'multiplayer keyboard practice',
    'typing pvp',
    'typing competition online'
  ],
  openGraph: {
    title: 'Multiplayer Typing - Real-time Typing Battles | Typing Toy',
    description: 'Compete with other players in real-time multiplayer typing games. Join rooms or quick match with players at your skill level.',
    url: '/multiplayer',
    siteName: 'Typing Toy',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Multiplayer Typing - Real-time Typing Battles',
    description: 'Compete with other players in real-time multiplayer typing games. Quick match or create custom rooms.',
  },
  alternates: {
    canonical: '/multiplayer',
  },
};

export default function MultiplayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
