import type { MetadataRoute } from 'next'
import { ARTICLES } from '@/lib/articles'
import { SITE_ROUTES, SITE_URL } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  const staticRoutes: MetadataRoute.Sitemap = SITE_ROUTES.map((route) => ({
    url: route === '/' ? SITE_URL : `${SITE_URL}${route}`,
    lastModified,
    changeFrequency: route === '/' ? 'weekly' : 'monthly',
    priority: route === '/' ? 1 : 0.7,
  }))

  const articleRoutes: MetadataRoute.Sitemap = ARTICLES.map((article) => ({
    url: `${SITE_URL}/${article.section}/${article.slug}`,
    lastModified,
    changeFrequency: 'yearly',
    priority: 0.6,
  }))

  return [...staticRoutes, ...articleRoutes]
}
