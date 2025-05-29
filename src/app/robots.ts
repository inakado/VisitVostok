import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/_next/', '/static/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
      },
      {
        userAgent: 'Yandex',
        allow: '/',
      },
      {
        userAgent: 'Bingbot', 
        allow: '/',
      }
    ],
    sitemap: 'https://visitvostok.ru/sitemap.xml',
  }
} 