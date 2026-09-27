import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowUpRight } from '@/components/icon'
import SiteHeader from '@/components/site-header'
import SiteFooter from '@/components/site-footer'
import { PageHero } from '@/components/page-hero'
import { Reveal } from '@/components/reveal'
import { getArticles } from '@/lib/articles'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  title: 'The Spectra Journal — Spectra Technologies',
  description:
    'Notes, essays and field reports from the Spectra team — thoughts on infrastructure, machine intelligence and the systems that run on them.',
  path: '/journal',
})

const entries = getArticles('journal')
const latest = entries[0]
const archive = entries.slice(1)

export default function JournalPage() {
  return (
    <main id="main" className="spectra-shell">
      <SiteHeader />

      <PageHero
        kicker="THE SPECTRA JOURNAL / NOTES FROM THE BUILD"
        title={<>Ideas from<br />the frontier.</>}
        tag="SPECTRA / JOURNAL"
      >
        <p>
          The Spectra Journal — notes, essays and field reports from the team building
          BastionOS, Napoleon and the architecture beneath them.
        </p>
      </PageHero>

      {latest && (
        <section className="page-section">
          <div className="page-section-head">
            <Reveal>
              <p className="eyebrow">LATEST ENTRY</p>
              <h2 className="section-heading">The Journal,<br />current issue.</h2>
            </Reveal>
            <Reveal delay={120}>
              <p className="body-copy">New entries published as we build. No press releases — just the work, written down.</p>
            </Reveal>
          </div>
          <Reveal>
            <div className="page-card latest-card">
              <p className="eyebrow">THE JOURNAL / {latest.date}</p>
              <h3 className="latest-title">{latest.title}</h3>
              <p className="latest-excerpt">{latest.excerpt}</p>
              <Link className="text-button" href={`/journal/${latest.slug}`}>
                Read the full entry <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
        </section>
      )}

      <section className="page-section page-section-alt">
        <div className="page-section-head">
          <Reveal>
            <p className="eyebrow">ALL ENTRIES</p>
            <h2 className="section-heading">The archive.</h2>
          </Reveal>
        </div>
        <div className="article-list">
          {archive.map((entry, i) => (
            <Reveal key={entry.slug} delay={i * 60}>
              <article>
                <span className="article-date">{entry.date}</span>
                <div>
                  <p className="eyebrow">{entry.source}</p>
                  <h3 className="article-title">
                    <Link href={`/journal/${entry.slug}`}>{entry.title}</Link>
                  </h3>
                  <p>{entry.excerpt}</p>
                </div>
                <Link className="text-button" href={`/journal/${entry.slug}`} aria-label={`Read: ${entry.title}`}>
                  {entry.readTime} <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="statement-section">
        <div className="statement-rule" />
        <Reveal>
          <p>WRITTEN WHILE BUILDING<br />THE FOUNDATION</p>
          <h2>More from<br /><em>the journal.</em></h2>
        </Reveal>
        <div className="statement-foot">
          <Link className="text-button" href="/newsroom">Latest news <ArrowUpRight size={17} aria-hidden="true" /></Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
