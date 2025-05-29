import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://visitvostok.ru'
  const currentDate = new Date().toISOString()

  return [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/activities`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/transport`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    }
  ]
} 