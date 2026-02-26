import type { MetadataRoute } from 'next'
import { PAINTINGS, COLLECTIONS } from '@/lib/paintings'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://catalog.moodspace.ru'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  // Главная и каталог
  const static_pages: MetadataRoute.Sitemap = [
    {
      url:              SITE_URL,
      lastModified:     now,
      changeFrequency:  'weekly',
      priority:         1,
    },
    {
      url:              `${SITE_URL}/catalog`,
      lastModified:     now,
      changeFrequency:  'daily',
      priority:         0.9,
    },
  ]

  // Страницы коллекций
  const collection_pages: MetadataRoute.Sitemap = COLLECTIONS
    .filter(c => c !== 'Все коллекции')
    .map(col => ({
      url:             `${SITE_URL}/catalog/collection/${encodeURIComponent(col)}`,
      lastModified:    now,
      changeFrequency: 'weekly' as const,
      priority:        0.8,
    }))

  // Страницы размеров
  const size_pages: MetadataRoute.Sitemap = [
    '80x120', '100x150', '120x180', '90x180', '100x200', '120x240', '100x100', '120x120',
  ].map(size => ({
    url:             `${SITE_URL}/catalog/size/${size}`,
    lastModified:    now,
    changeFrequency: 'weekly' as const,
    priority:        0.7,
  }))

  // Страницы отдельных картин
  const painting_pages: MetadataRoute.Sitemap = PAINTINGS.map(p => ({
    url:             `${SITE_URL}/catalog/${p.id}`,
    lastModified:    now,
    changeFrequency: 'monthly' as const,
    priority:        0.6,
  }))

  return [...static_pages, ...collection_pages, ...size_pages, ...painting_pages]
}
