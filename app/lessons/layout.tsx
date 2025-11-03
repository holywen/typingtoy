import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '15 Progressive Typing Lessons',
  description: 'Learn touch typing with 15 comprehensive lessons covering all keyboard keys. From home row basics to advanced typing techniques.',
  keywords: ['typing lessons', 'touch typing course', 'keyboard lessons', 'learn typing', 'typing exercises', 'home row practice'],
  openGraph: {
    title: '15 Progressive Typing Lessons | Typing Toy',
    description: 'Master touch typing with 15 comprehensive lessons covering all keyboard keys.',
    url: '/lessons',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: '15 Progressive Typing Lessons | Typing Toy',
    description: 'Master touch typing with 15 comprehensive lessons covering all keyboard keys.',
  },
  alternates: {
    canonical: '/lessons',
  },
};

export default function LessonsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
