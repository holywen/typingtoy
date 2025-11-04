import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Typing Games',
  description: 'Practice typing with fun games including Falling Blocks, Blink, Typing Walk, and Falling Words. Choose lessons to focus on specific keys.',
  keywords: ['typing games', 'keyboard games', 'typing practice games', 'learn typing games', 'typing skills games'],
};

export default function GamesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
