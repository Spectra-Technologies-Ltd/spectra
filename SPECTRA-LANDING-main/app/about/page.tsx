import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import SiteHeader from '@/components/site-header'
import SiteFooter from '@/components/site-footer'
import { PageHero } from '@/components/page-hero'
import { Reveal } from '@/components/reveal'

export const metadata = {
  title: 'About Spectra — Spectra Technologies',
  description:
    'Spectra Technologies develops Intelligence Operating Systems — deep technology for intelligent infrastructure, AI and autonomous systems.',
}

const pillars = [
  ['01', 'BastionOS', 'The operating foundation. The environment where Spectra\u2019s systems run — secure, observable, built for operations.'],
  ['02', 'Napoleon', 'The intelligence layer. Spectra\u2019s machine learning model that turns fragmented data into decision intelligence.'],
  ['03', 'The Architecture', 'Infrastructure, intelligence, data and applications — engineered as one connected system, from first signal to final decision.'],
] as const

export default function AboutPage() {
  return (
    <main className="spectra-shell">
      <SiteHeader />

      <PageHero kicker="ABOUT SPECTRA / THE COMPANY" title="Deep technology," em="hard problems.">
        <p>
          Spectra Technologies is building a deep technology platform focused on intelligent
          infrastructure, AI, software and autonomous systems — for the places where the hardest
          problems live.
        </p>
        <Link className="outline-button" href="/contact">Work with us <ArrowUpRight size={17} /></Link>
      </PageHero>

      <section className="page-section">
        <div className="page-section-head">
          <Reveal><p className="eyebrow">WHAT WE BUILD</p><h3>Intelligence<br />Operating Systems.</h3></Reveal>
        </div>
        <Reveal>
          <div className="page-prose">
            <p>
              Spectra Technologies develops <strong>Intelligence Operating Systems</strong> — platforms that unify
              operations, data and machine intelligence into one working system. Our first product is{' '}
              <em>BastionOS</em>: an operating system for private security companies that unifies guard
              operations, patrols, attendance, incidents, reporting and analytics.
            </p>
            <p>
              Beneath it runs <em>Napoleon</em>, our machine-learning and AI intelligence layer — the model
              that turns raw operational data into patterns, predictions and recommendations the
              system can act on. Together they form the Spectra Architecture: infrastructure,
              intelligence, data and applications engineered to operate across complex, high-stakes
              environments.
            </p>
          </div>
        </Reveal>
      </section>

      <section className="page-section page-section-alt">
        <div className="page-section-head">
          <Reveal><p className="eyebrow">THE STACK</p><h3>Three layers,<br />one company.</h3></Reveal>
        </div>
        <div className="card-grid">
          {pillars.map(([index, title, copy]) => (
            <Reveal key={title}>
              <div className="page-card">
                <span className="card-index">{index}</span>
                <h4>{title}</h4>
                <p>{copy}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="page-section">
        <div className="page-section-head">
          <Reveal><p className="eyebrow">THE PEOPLE</p><h3>Small team.<br />Big horizon.</h3></Reveal>
        </div>
        <Reveal>
          <div className="page-prose">
            <p>
              Engineers, operators and builders working on the hard problems of intelligent
              infrastructure — systems that reason, learn, and coordinate in the real world.
              Foundational technology, built by people who care about the details.
            </p>
          </div>
        </Reveal>
      </section>

      <section className="cta-band">
        <Reveal>
          <p className="eyebrow">NEXT</p>
          <h2>Let&apos;s talk about<br />the mission.</h2>
          <p className="body-copy">Tell us what you&apos;re trying to see, understand or protect.</p>
          <Link className="outline-button" href="/contact">Start a conversation <ArrowUpRight size={17} /></Link>
        </Reveal>
      </section>

      <SiteFooter />
    </main>
  )
}
