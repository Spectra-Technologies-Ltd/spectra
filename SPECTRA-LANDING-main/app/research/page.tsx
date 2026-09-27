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
  title: 'Research & Insights — Spectra Technologies',
  description:
    'Technical briefs, architecture notes and research from Spectra Technologies — how BastionOS, Napoleon and the platform beneath actually work.',
  path: '/research',
})

const briefs = getArticles('research')

const topics = [
  ['01', 'Intelligence', 'How Napoleon turns data into decisions — relationships, patterns, predictions and recommendations.'],
  ['02', 'Infrastructure', 'The operating foundation beneath the intelligence — secure, observable, built for operations.'],
  ['03', 'Architecture', 'How the layers fit together — from first signal to final decision, end to end.'],
] as const

export default function ResearchPage() {
  return (
    <main id="main" className="spectra-shell">
      <SiteHeader />

      <PageHero
        kicker="RESEARCH & INSIGHTS / THE TECHNICAL ARM"
        title={<>How it<br />works.</>}
        tag="SPECTRA / RESEARCH"
      >
        <p>
          Technical briefs, architecture notes and research from the Spectra team — the
          engineering behind BastionOS, Napoleon and the platform beneath them.
        </p>
      </PageHero>

      <section className="page-section">
        <div className="page-section-head">
          <Reveal>
            <p className="eyebrow">01 / FOCUS AREAS</p>
            <h2 className="section-heading">Three lines<br />of research.</h2>
          </Reveal>
        </div>
        <div className="card-grid">
          {topics.map(([index, title, copy], i) => (
            <Reveal key={title} delay={i * 80}>
              <div className="page-card">
                <span className="card-index">{index}</span>
                <h3 className="card-title">{title}</h3>
                <p>{copy}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="page-section page-section-alt">
        <div className="page-section-head">
          <Reveal>
            <p className="eyebrow">02 / THE BRIEFS</p>
            <h2 className="section-heading">Read the<br />technical work.</h2>
          </Reveal>
        </div>
        <div className="article-list">
          {briefs.map((entry, i) => (
            <Reveal key={entry.slug} delay={i * 60}>
              <article>
                <span className="article-date">{entry.date}</span>
                <div>
                  <p className="eyebrow">{entry.source}</p>
                  <h3 className="article-title">
                    <Link href={`/research/${entry.slug}`}>{entry.title}</Link>
                  </h3>
                  <p>{entry.excerpt}</p>
                </div>
                <Link className="text-button" href={`/research/${entry.slug}`} aria-label={`Read: ${entry.title}`}>
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
          <p>ENGINEERED, DOCUMENTED,<br />PUBLISHED</p>
          <h2>Deep work,<br /><em>in the open.</em></h2>
        </Reveal>
        <div className="statement-foot">
          <Link className="text-button" href="/journal">The Spectra Journal <ArrowUpRight size={17} aria-hidden="true" /></Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
