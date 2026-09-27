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
  title: 'Newsroom — Spectra Technologies',
  description: 'News from Spectra Technologies.',
  path: '/newsroom',
})

const headlines = getArticles('newsroom')

export default function NewsroomPage() {
  return (
    <main id="main" className="spectra-shell">
      <SiteHeader />

      <PageHero
        kicker="NEWSROOM"
        title={<>What&apos;s<br />new?</>}
        tag="NEWSROOM"
      />

      <section className="page-section page-section-alt">
        <div className="page-section-head">
          <Reveal>
            <p className="eyebrow">ALL STORIES</p>
            <h2 className="section-heading">The archive.</h2>
          </Reveal>
        </div>
        <div className="article-list">
          {headlines.map((entry, i) => (
            <Reveal key={entry.slug} delay={i * 60}>
              <article>
                <span className="article-date">{entry.date}</span>
                <div>
                  <p className="eyebrow">{entry.source}</p>
                  <h3 className="article-title">
                    <Link href={`/newsroom/${entry.slug}`}>{entry.title}</Link>
                  </h3>
                  <p>{entry.excerpt}</p>
                </div>
                <Link className="text-button" href={`/newsroom/${entry.slug}`} aria-label={`Read: ${entry.title}`}>
                  Read <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="statement-section">
        <div className="statement-rule" />
        <Reveal>
          <p>NEWS · JOURNAL<br />RESEARCH &amp; INSIGHTS</p>
          <h2>Keep<br /><em>building.</em></h2>
        </Reveal>
        <div className="statement-foot">
          <Link className="text-button" href="/research">Research &amp; Insights <ArrowUpRight size={17} aria-hidden="true" /></Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
