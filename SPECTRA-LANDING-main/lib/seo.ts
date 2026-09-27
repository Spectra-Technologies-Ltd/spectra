import type { Metadata } from 'next'
import { SITE_NAME, SITE_URL } from './site'

type PageMetaInput = {
  /** Page title, including the brand, e.g. `About Spectra — Spectra Technologies`. */
  title: string
  description: string
  /** Route path, e.g. `/about`. Use `/` for the homepage. */
  path: string
}

/**
 * Builds consistent per-page metadata: canonical URL, OpenGraph and Twitter
 * cards. Every page should use this instead of a bare `{ title, description }`
 * object so search engines and social previews get complete data.
 */
export function pageMetadata({ title, description, path }: PageMetaInput): Metadata {
  const url = path === '/' ? SITE_URL : `${SITE_URL}${path}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url,
      siteName: SITE_NAME,
      title,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}
