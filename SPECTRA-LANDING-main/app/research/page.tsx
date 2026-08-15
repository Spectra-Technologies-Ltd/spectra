import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import SiteHeader from '@/components/site-header'
import SiteFooter from '@/components/site-footer'
import { PageHero } from '@/components/page-hero'
import { Reveal } from '@/components/reveal'

export const metadata = {
  title: 'Research & Insights — Spectra Technologies',
  description:
    'Technical briefs, architecture notes and research from Spectra Technologies — how BastionOS, Napoleon and the platform beneath actually work.',
}

const briefs = [
  ['TECHNICAL BRIEF', 'Napoleon: machine intelligence from signal to action.', 'How the strategic intelligence engine learns from fragmented organizational data and turns it into decision intelligence — relationships, patterns, predictions, recommendations.', '07.28.26', '/napoleon'],
  ['ARCHITECTURE NOTES', 'How infrastructure, intelligence, data and applications fit together.', 'A walk through the Spectra Architecture — the integrated stack from first signal to final decision, and where each layer lives.', '06.10.26', '/#architecture'],
  ['TECHNICAL BRIEF', 'Multi-sensor fusion in the intelligence layer.', 'Video, radar, acoustic and environmental signals — how Napoleon aligns disparate sources into a single operational picture.', '05.19.26', '/napoleon'],
  ['ARCHITECTURE NOTES', 'The latency question: decision support at the edge.', 'Why response time is a design property, not a performance metric — and how the architecture keeps the loop short.', '04.08.26', '/#architecture'],
  ['RESEARCH NOTE', 'Anomaly detection on operational data.', 'What it takes to flag the pattern before the incident — and how continuous learning changes what the model can see.', '03.02.26', '/napoleon'],
] as const

const topics = [
  ['01', 'Intelligence', 'How Napoleon turns data into decisions — relationships, patterns, predictions and recommendations.'],
  ['02', 'Infrastructure', 'The operating foundation beneath the intelligence — secure, observable, built for operations.'],
  ['03', 'Architecture', 'How the layers fit together — from first signal to final decision, end to end.'],
] as const

export default function ResearchPage() {
  return (
    <main className="spectra-shell">
      <SiteHeader />

      <PageHero kicker="RESEARCH & INSIGHTS / THE TECHNICAL ARM" title="How it<br />works." tag="SPECTRA / RESEARCH">
        <p>
          Technical briefs, architecture notes and research from the Spectra team — the
          engineering behind BastionOS, Napoleon and the platform beneath them.
        </p>
      </PageHero>

      {/* Focus areas */}
      <section className="page-section" style={{ paddingTop: 110 }}>
        <div className="page-section-head">
          <Reveal><p className="eyebrow">01 / FOCUS AREAS</p><h3>Three lines<br />of research.</h3></Reveal>
        </div>
        <div className="card-grid">
          {topics.map(([index, title, copy], i) => (
            <Reveal key={title} delay={i * 80}>
              <div className="page-card">
                <span className="card-index">{index}</span>
                <h4>{title}</h4>
                <p>{copy}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Briefs */}
      <section className="page-section page-section-alt">
        <div className="page-section-head">
          <Reveal><p className="eyebrow">02 / THE BRIEFS</p><h3>Read the<br />technical work.</h3></Reveal>
        </div>
        <div className="article-list">
          {briefs.map(([source, title, excerpt, date, href], i) => (
            <Reveal key={title} delay={i * 60}>
              <article>
                <span className="article-date">{date}</span>
                <div>
                  <p className="eyebrow">{source}</p>
                  <h4>{title}</h4>
                  <p>{excerpt}</p>
                </div>
                <Link className="text-button" href={href} aria-label={title}>
                  Read <ArrowUpRight size={15} />
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Statement CTA */}
      <section className="statement-section">
        <div className="statement-rule" />
        <Reveal>
          <p>ENGINEERED, DOCUMENTED,<br />PUBLISHED</p>
          <h2>Deep work,<br /><em>in the open.</em></h2>
        </Reveal>
        <div className="statement-foot">
          <span>SCROLL / 03</span>
          <Link className="text-button" href="/journal">The Spectra Journal <ArrowUpRight size={17} /></Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
