import type { Metadata } from "next";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";

export const metadata: Metadata = {
  title: {
    default: "Typing Toy - Learn Touch Typing",
    template: "%s | Typing Toy"
  },
  description: "Master touch typing with progressive lessons, speed tests, and multilingual support. Free online typing tutor with 15 lessons covering all keyboard keys.",
  keywords: ["typing tutor", "touch typing", "typing practice", "learn typing", "typing lessons", "typing speed test", "keyboard practice", "typing skills", "free typing course"],
  authors: [{ name: "Typing Toy" }],
  creator: "Typing Toy",
  publisher: "Typing Toy",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Typing Toy - Learn Touch Typing",
    description: "Master touch typing with progressive lessons, speed tests, and multilingual support. Free online typing tutor.",
    url: '/',
    siteName: 'Typing Toy',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/icon.svg',
        width: 512,
        height: 512,
        alt: 'Typing Toy Logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: "Typing Toy - Learn Touch Typing",
    description: "Master touch typing with progressive lessons, speed tests, and multilingual support.",
    images: ['/icon.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon.svg', type: 'image/svg+xml', sizes: '512x512' },
    ],
    apple: [
      { url: '/apple-touch-icon.svg', type: 'image/svg+xml', sizes: '180x180' },
    ],
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
