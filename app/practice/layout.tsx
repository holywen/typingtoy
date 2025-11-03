import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Custom Typing Practice',
  description: 'Practice typing with your own custom text. Perfect for improving typing skills with specific content or practicing for work-related typing.',
  keywords: ['custom typing practice', 'typing practice', 'practice typing', 'custom text typing', 'typing exercises', 'personalized typing'],
  openGraph: {
    title: 'Custom Typing Practice | Typing Toy',
    description: 'Practice typing with your own custom text. Perfect for improving specific typing skills.',
    url: '/practice',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Custom Typing Practice | Typing Toy',
    description: 'Practice typing with your own custom text.',
  },
  alternates: {
    canonical: '/practice',
  },
};

export default function PracticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
