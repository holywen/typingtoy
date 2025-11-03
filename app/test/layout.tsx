import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Typing Speed Test',
  description: 'Test your typing speed and accuracy with random generated text. Measure your WPM (words per minute) and improve your typing skills.',
  keywords: ['typing speed test', 'WPM test', 'typing test', 'words per minute', 'typing accuracy', 'speed typing', 'typing measurement'],
  openGraph: {
    title: 'Typing Speed Test | Typing Toy',
    description: 'Test your typing speed and accuracy. Measure your WPM and improve your skills.',
    url: '/test',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Typing Speed Test | Typing Toy',
    description: 'Test your typing speed and accuracy. Measure your WPM and improve your skills.',
  },
  alternates: {
    canonical: '/test',
  },
};

export default function TestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
