import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Typing Progress Tracking',
  description: 'Track your typing progress, view statistics, and monitor improvement. See your WPM progress, accuracy trends, and completed lessons.',
  keywords: ['typing progress', 'typing statistics', 'typing improvement', 'WPM tracking', 'typing analytics', 'typing metrics', 'progress tracking'],
  openGraph: {
    title: 'Typing Progress Tracking | Typing Toy',
    description: 'Track your typing progress and monitor improvement with detailed statistics.',
    url: '/progress',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Typing Progress Tracking | Typing Toy',
    description: 'Track your typing progress and monitor improvement.',
  },
  alternates: {
    canonical: '/progress',
  },
};

export default function ProgressLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
