import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/cuenta/',
          '/checkout/',
          '/carrito',
          '/wishlist',
          '/seguimiento',
        ],
      },
    ],
    sitemap: 'https://calleochostore.com/sitemap.xml',
    host: 'https://calleochostore.com',
  };
}
