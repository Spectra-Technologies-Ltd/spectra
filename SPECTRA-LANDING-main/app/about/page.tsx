import Link from 'next/link'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
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

      <PageHero kicker="ABOUT SPECTRA / THE COMPANY" title="Deep technology," em="hard problems." tag="SPECTRA / FOUNDATIONAL">
        <p>
          Spectra Technologies is building a deep technology platform focused on intelligent
          infrastructure, AI, software and autonomous systems — for the places where the hardest
          problems live.
        </p>
        <Link className="outline-button" href="/contact">Work with us <ArrowUpRight size={17} /></Link>
      </PageHero>

      {/* Manifesto — light section, same as the landing page */}
      <section className="manifesto-section" style={{ paddingTop: 130 }}>
        <div className="section-kicker"><span>01</span><span>WHAT WE BUILD</span></div>
        <Reveal><h2>The infrastructure<br /><em>for intelligence.</em></h2></Reveal>
        <div className="manifesto-meta">
          <span>01—04</span>
          <p>Spectra Technologies develops Intelligence Operating Systems — platforms that unify operations, data and machine intelligence into one working system. Built for the places where the hardest problems live.</p>
          <ArrowDownRight size={28} />
        </div>
      </section>

      {/* The stack */}
      <section className="page-section">
        <div className="page-section-head">
          <Reveal><p className="eyebrow">02 / THE STACK</p><h3>Three layers,<br />one company.</h3></Reveal>
        </div>
        <div className="card-grid">
          {pillars.map(([index, title, copy], i) => (
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

      {/* Team — the landing page team-grid concept */}
      <section id="company-team" className="team-section">
        <div className="section-kicker"><span>03</span><span>THE PEOPLE</span></div>
        <div className="team-grid">
          <div>
            <Reveal>
              <p className="eyebrow">BUILT DIFFERENT</p>
              <h2>Small team.<br /><em>Big horizon.</em></h2>
              <p className="body-copy">Engineers, operators, and builders working on the hard problems of intelligent infrastructure — systems that reason, learn, and coordinate in the real world. Foundational technology, built by people who care about the details.</p>
              <Link className="text-button" href="/contact">Work with us <ArrowUpRight size={17} /></Link>
            </Reveal>
          </div>
          <img src="/images/spectra-team.png" alt="Spectra team in an operations room" />
        </div>
      </section>

      {/* Statement CTA */}
      <section className="statement-section">
        <div className="statement-rule" />
        <Reveal>
          <p>WE DON&apos;T BUILD SYSTEMS<br />FOR A SINGLE DOMAIN.</p>
          <h2>Let&apos;s talk about<br /><em>the mission.</em></h2>
        </Reveal>
        <div className="statement-foot">
          <span>SCROLL / 04</span>
          <Link className="text-button" href="/contact">Start a conversation <ArrowUpRight size={17} /></Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
