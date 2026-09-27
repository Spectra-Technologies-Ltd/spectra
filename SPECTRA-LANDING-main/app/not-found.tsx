import Link from 'next/link'
import type { Metadata } from 'next'
import SiteHeader from '@/components/site-header'
import SiteFooter from '@/components/site-footer'
import { PageHero } from '@/components/page-hero'
import { ArrowUpRight } from '@/components/icon'

export const metadata: Metadata = {
  title: 'Page not found — Spectra Technologies',
  description: 'The page you were looking for could not be found.',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <main id="main" className="spectra-shell">
      <SiteHeader />
      <PageHero
        kicker="404 / NOT FOUND"
        title="This page"
        em="doesn't exist."
        tag="SPECTRA / 404"
      >
        <p>
          The page you were looking for has moved, been renamed, or never existed. Head back to
          the homepage, or tell us what you were looking for.
        </p>
        <div className="hero-actions">
          <Link className="outline-button" href="/">
            Back to homepage <ArrowUpRight size={17} />
          </Link>
          <Link className="text-button" href="/contact">
            Contact us <ArrowUpRight size={17} />
          </Link>
        </div>
      </PageHero>
      <SiteFooter />
    </main>
  )
}
