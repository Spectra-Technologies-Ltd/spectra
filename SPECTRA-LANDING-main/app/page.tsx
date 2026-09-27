import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowDownRight, ArrowUpRight, MoveRight } from 'lucide-react'
import SiteHeader from '@/components/site-header'
import SiteFooter from '@/components/site-footer'
import { Reveal } from '@/components/reveal'
import { PrintText } from '@/components/print-text'
import { HeroScene } from '@/components/hero-scene'
import { IsoScene } from '@/components/iso-scene'
import { LayersOverview } from '@/components/layers-overview'
import { getArticles, type Article } from '@/lib/articles'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  title: 'Spectra — Intelligence. Engineered.',
  description:
    'Spectra builds intelligent operating systems and machine intelligence that power critical infrastructure, enterprise operations, security, and complex real-world systems.',
  path: '/',
})

const pressArticles = [getArticles('journal')[0], getArticles('research')[0]].filter(
  (article): article is Article => Boolean(article),
)

export default function Page() {
  return (
    <main id="main" className="spectra-shell">
      <SiteHeader />

      <section id="top" className="hero-section">
        <div className="hero-backdrop" aria-hidden="true" />
        <HeroScene />
        <div className="hero-scrim" />
        <div className="hero-copy">
          <p className="hero-kicker">Spectra Technologies builds</p>
          <h1>Intelligence.<br /><em>Engineered.</em></h1>
          <p className="hero-description">Spectra builds intelligent operating systems and machine intelligence that power critical infrastructure, enterprise operations, security, and complex real-world systems.</p>
          <a className="outline-button" href="/request-demo">Get Started <MoveRight size={17} aria-hidden="true" /></a>
        </div>
      </section>

      <section className="manifesto-section" id="company">
        <PrintText tag="h2" lines={[{ text: 'The infrastructure' }, { text: 'for intelligence.', style: 'em' }]} />
        <div className="manifesto-meta">
          <PrintText
            tag="p"
            lines="Spectra Technologies builds deep technology — operating environments, machine intelligence, and autonomous systems — engineered for the places where the hardest problems live."
          />
          <ArrowDownRight size={28} aria-hidden="true" />
        </div>
      </section>

      {/* BastionOS + Napoleon overviews — the nav "Overview" links land here */}
      <LayersOverview />

      {/* Architecture — matching the BastionOS comprehensive page */}
      <section id="architecture" className="capabilities-section">
        <div className="section-kicker"><span>04</span><span>THE ARCHITECTURE</span></div>
        <div className="capabilities-layout">
          <div className="capability-sticky">
            <Reveal>
              <p className="eyebrow"><span className="brand-name">BastionOS</span> · <span className="brand-name">Napoleon</span> · ONE FOUNDATION</p>
              <h2>One system.<br /><em>Three layers.</em></h2>
              <p className="body-copy layer-copy">The infrastructure layer unifies operational data. The intelligence layer learns from it, predicts outcomes and recommends action.</p>
              <p className="body-copy layer-copy">The application layer organizes the work and puts that intelligence to use. Each layer feeds the next.</p>
            </Reveal>
          </div>
          <div className="capability-stage">
            <div className="capability-animation-wrap">
              <div className="iso-frame">
                <IsoScene />
                <span className="iso-frame-label" aria-hidden="true">Spectra / System Architecture</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="statement-section">
        <div className="statement-rule" />
        <Reveal>
          <h2>We build<br /><em>for what&apos;s next.</em></h2>
        </Reveal>
      </section>

      {/* The Spectra Workplace */}
      <section id="company-team" className="team-section bastion-centered">
        <div className="section-kicker"><span>SPECTRA WORKSPACE</span></div>
        <div className="bastion-hero-center">
          <PrintText tag="h2" lines={[{ text: 'Design' }, { text: 'Your Intelligence', style: 'em' }]} />
          <p className="body-copy">The Spectra Workspace — a tool for conceptualizing intelligence systems. Design ontologies, create Napoleon-powered agents, connect data, and deploy prototypes.</p>
          <Link className="text-button" href="/workspace">Enter the Workspace <ArrowUpRight size={17} aria-hidden="true" /></Link>
        </div>
      </section>

      <section className="press-section">
        <div className="section-kicker"><span>LATEST NEWS</span><span>RESEARCH &amp; INSIGHTS</span></div>
        <div className="press-grid">
          {pressArticles.map((article) => (
            <article key={article.slug}>
              <p className="eyebrow">{article.source}</p>
              <h3>
                <Link href={`/${article.section}/${article.slug}`}>{article.title}</Link>
              </h3>
              <div>
                <span>{article.date}</span>
                <ArrowUpRight size={17} aria-hidden="true" />
              </div>
            </article>
          ))}
        </div>
        <div className="press-actions">
          <Link className="outline-button center-button" href="/newsroom">View all news <ArrowUpRight size={17} aria-hidden="true" /></Link>
          <Link className="text-button" href="/journal">The Spectra Journal <ArrowUpRight size={17} aria-hidden="true" /></Link>
          <Link className="text-button" href="/research">Research &amp; Insights <ArrowUpRight size={17} aria-hidden="true" /></Link>
        </div>
      </section>

      <section id="contact" className="contact-section">
        <div className="section-kicker"><span>07</span><span>CONTACT</span></div>
        <PrintText tag="h2" lines={[{ text: "Let's talk about" }, { text: 'the mission.', style: 'em' }]} />
        <div className="contact-bottom">
          <PrintText tag="p" lines="Tell us what you're trying to see, understand or protect. We'll show you what's possible." />
          <Link className="solid-button" href="/request-demo">Start a conversation <ArrowUpRight size={17} aria-hidden="true" /></Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
