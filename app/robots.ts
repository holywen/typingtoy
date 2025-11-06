import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/lessons',
          '/lessons/*',
          '/test',
          '/practice',
          '/progress',
          '/games',
          '/games/*',
          '/multiplayer',
        ],
        disallow: [
          '/api/',
          '/auth/',
          '/admin',
          '/admin/*',
          '/multiplayer/room/*',
        ],
        crawlDelay: 1,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
