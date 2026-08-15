import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import SiteHeader from '@/components/site-header'
import SiteFooter from '@/components/site-footer'
import { PageHero } from '@/components/page-hero'
import { Reveal } from '@/components/reveal'
import { IntelligenceDiagram } from '@/components/napoleon/intelligence-diagram'
import { Ticker } from '@/components/ticker'

export const metadata = {
  title: 'Napoleon — Spectra Technologies',
  description:
    'NapoleonOS is Spectra\u2019s strategic intelligence engine — a machine learning model that turns fragmented organizational data into decision intelligence.',
}

const capabilities = [
  ['01', 'Learn', 'Learns from structured and unstructured organizational data to understand relationships and build a complete picture of operations.'],
  ['02', 'Predict', 'Detects patterns and anomalies, and predicts future events before they unfold.'],
  ['03', 'Recommend', 'Recommends actions — turning analysis into decisions an operator can act on with confidence.'],
  ['04', 'Coordinate', 'Powers every Intelligence Operating System built on the Spectra platform, coordinating the layers beneath it.'],
] as const

const layers = [
  ['Napoleon', 'Thinks, learns, predicts.'],
  ['BastionOS', 'Organizes workflows, presents insights, enables users to act.'],
  ['Spectra', 'The company and ecosystem that develops both.'],
] as const

const specs = [
  ['Type', 'Domain-agnostic intelligence engine'],
  ['Input', 'Structured + unstructured organizational data'],
  ['Capabilities', 'Relationships, patterns, anomalies, predictions, recommendations'],
  ['Scope', 'Across industries'],
  ['Continuous', 'Improves operational decision-making over time'],
] as const

export default function NapoleonPage() {
  return (
    <main className="spectra-shell">
      <SiteHeader />

      <PageHero kicker="NAPOLEON / THE INTELLIGENCE LAYER" title="Think, learn," em="predict." tag="NAPOLEON / INFERENCE">
        <p>
          NapoleonOS — the strategic intelligence engine. Named after history&apos;s greatest
          strategist, it represents the power of intelligence, adaptability and precision in
          decision-making.
        </p>
        <Link className="outline-button" href="/bastionos">See it power BastionOS <ArrowUpRight size={17} /></Link>
      </PageHero>

      <Ticker items={['NAPOLEON', 'THE INTELLIGENCE LAYER', 'THINKS · LEARNS · PREDICTS', 'FROM SIGNAL TO ACTION']} />

      {/* Full-width intelligence scene — the animated Napoleon layer */}
      <section id="inference" className="napoleon-scene">
        <div className="section-kicker"><span>01</span><span>INFERENCE</span></div>
        <div className="napoleon-scene-head">
          <Reveal><p className="eyebrow">MACHINE INTELLIGENCE LAYER</p><h2>Signals in.<br /><em>Intelligence out.</em></h2></Reveal>
          <Reveal delay={120}><p className="body-copy">Napoleon is Spectra&apos;s machine learning model — the strategic intelligence layer of modern organizations. It learns from vast operational data to identify patterns, uncover relationships, predict outcomes, and provide decision intelligence.</p></Reveal>
        </div>
        <div className="napoleon-scene-inner">
          <IntelligenceDiagram />
        </div>
      </section>

      {/* Manifesto rhythm */}
      <section className="manifesto-section" style={{ paddingTop: 130 }}>
        <div className="section-kicker"><span>02</span><span>THE STRATEGIC INTELLIGENCE ENGINE</span></div>
        <Reveal><h2>Victory is decided<br /><em>by intelligence.</em></h2></Reveal>
        <div className="manifesto-meta">
          <span>01—06</span>
          <p>Napoleon understood that victory was not determined by force alone — it was determined by the ability to gather information, understand the battlefield, anticipate movement, and make decisions faster than the opposition.</p>
        </div>
      </section>

      {/* The signal-to-intelligence narrative */}
      <section className="page-section">
        <div className="page-section-head">
          <Reveal><p className="eyebrow">03 / THE PROBLEM</p><h3>Your battlefield<br />is data.</h3></Reveal>
        </div>
        <Reveal>
          <div className="page-prose">
            <p>
              Organizations today face a similar challenge to the battlefield. Their terrain is not
              land — it is <em>data</em>. Every operation, transaction, employee action, customer
              interaction, and asset movement creates signals. However, these signals often remain{' '}
              <strong>fragmented</strong>, preventing organizations from seeing the complete picture.
            </p>
          </div>
        </Reveal>
      </section>

      {/* Capabilities */}
      <section id="capabilities" className="page-section">
        <div className="page-section-head">
          <Reveal><p className="eyebrow">04 / WHAT NAPOLEON DOES</p><h3>From fragmented signals<br />to complete picture.</h3></Reveal>
        </div>
        <div className="card-grid">
          {capabilities.map(([index, title, copy], i) => (
            <Reveal key={title} delay={i * 70}>
              <div className="page-card">
                <span className="card-index">{index}</span>
                <h4>{title}</h4>
                <p>{copy}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Relationship + domain-agnostic */}
      <section id="industries" className="page-section page-section-alt">
        <div className="page-section-head">
          <Reveal><p className="eyebrow">05 / THE RELATIONSHIP</p><h3>Three roles,<br />one system.</h3></Reveal>
          <Reveal><p className="body-copy">Napoleon powers the Intelligence Operating Systems built on the Spectra platform.</p></Reveal>
        </div>
        <Reveal>
          <div className="spec-grid">
            {layers.map(([label, value]) => (
              <div key={label}><span>{label}</span><strong>{value}</strong></div>
            ))}
          </div>
        </Reveal>
        <div className="page-section-head" style={{ marginTop: 70 }}>
          <Reveal><p className="eyebrow">06 / DOMAIN-AGNOSTIC</p><h3>One engine,<br />every industry.</h3></Reveal>
        </div>
        <Reveal>
          <div className="page-prose">
            <p>
              Napoleon is a domain-agnostic intelligence engine that learns from structured and
              unstructured organizational data to understand relationships, identify patterns, detect
              anomalies, predict future events, recommend actions, and continuously improve
              operational decision-making <strong>across industries</strong>.
            </p>
          </div>
          <div className="spec-grid" style={{ marginTop: 40 }}>
            {specs.map(([label, value]) => (
              <div key={label}><span>{label}</span><strong>{value}</strong></div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Statement CTA */}
      <section className="statement-section">
        <div className="statement-rule" />
        <Reveal>
          <p><span className="brand-name">Napoleon</span> = THINKS, LEARNS, PREDICTS.<br /><span className="brand-name">BastionOS</span> = ORGANIZES, PRESENTS, ACTS.</p>
          <h2>See it in action.<br /><em>Enter the system.</em></h2>
        </Reveal>
        <div className="statement-foot">
          <span>SCROLL / 07</span>
          <Link className="text-button" href="/bastionos">Explore BastionOS <ArrowUpRight size={17} /></Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
