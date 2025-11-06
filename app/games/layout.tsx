import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Typing Games - Fun Ways to Practice Typing Skills',
  description: 'Play interactive typing games to improve your keyboard skills. Choose from Falling Blocks, Blink, Typing Walk, and Falling Words. Practice with targeted lessons focusing on specific keys. Free online typing games for all skill levels.',
  keywords: [
    'typing games',
    'keyboard games',
    'typing practice games',
    'learn typing games',
    'typing skills games',
    'interactive typing',
    'falling blocks typing',
    'blink typing game',
    'typing walk game',
    'falling words game',
    'free typing games',
    'online typing games'
  ],
  openGraph: {
    title: 'Typing Games - Fun Ways to Practice Typing Skills | Typing Toy',
    description: 'Play interactive typing games to improve your keyboard skills. Choose from Falling Blocks, Blink, Typing Walk, and Falling Words.',
    url: '/games',
    siteName: 'Typing Toy',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Typing Games - Fun Ways to Practice Typing Skills',
    description: 'Play interactive typing games to improve your keyboard skills. Free online typing games for all skill levels.',
  },
  alternates: {
    canonical: '/games',
  },
};

export default function GamesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
