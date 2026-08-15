import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import SiteHeader from '@/components/site-header'
import SiteFooter from '@/components/site-footer'
import { PageHero } from '@/components/page-hero'
import { Reveal } from '@/components/reveal'

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

      <PageHero kicker="NAPOLEON / THE INTELLIGENCE LAYER" title="Think, learn," em="predict.">
        <p>
          NapoleonOS — the strategic intelligence engine. Named after history&apos;s greatest
          strategist, it represents the power of intelligence, adaptability and precision in
          decision-making.
        </p>
        <Link className="outline-button" href="/bastionos">See it power BastionOS <ArrowUpRight size={17} /></Link>
      </PageHero>

      <section className="page-section">
        <div className="page-section-head">
          <Reveal><p className="eyebrow">THE STRATEGIC INTELLIGENCE ENGINE</p><h3>Victory is decided<br />by intelligence.</h3></Reveal>
        </div>
        <Reveal>
          <div className="page-prose">
            <p>
              Napoleon understood that victory was not determined by force alone — it was determined
              by the ability to <strong>gather information</strong>, <strong>understand the battlefield</strong>,{' '}
              <strong>anticipate movement</strong>, and <strong>make decisions faster</strong> than the opposition.
            </p>
            <p>
              Organizations today face a similar challenge. Their battlefield is not land — it is{' '}
              <em>data</em>. Every operation, transaction, employee action, customer interaction, and
              asset movement creates signals. However, these signals often remain fragmented,
              preventing organizations from seeing the complete picture.
            </p>
            <p>
              Napoleon is Spectra&apos;s machine learning model built to become the{' '}
              <strong>strategic intelligence layer</strong> of modern organizations. Like Napoleon&apos;s
              ability to analyze complex battlefields and coordinate forces, NapoleonOS learns from
              vast operational data to <strong>identify patterns</strong>, <strong>uncover relationships</strong>,{' '}
              <strong>predict outcomes</strong>, and provide <strong>decision intelligence</strong>.
            </p>
          </div>
        </Reveal>
      </section>

      <section className="page-section page-section-alt">
        <div className="page-section-head">
          <Reveal><p className="eyebrow">WHAT NAPOLEON DOES</p><h3>From fragmented signals<br />to complete picture.</h3></Reveal>
        </div>
        <div className="card-grid">
          {capabilities.map(([index, title, copy]) => (
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
          <Reveal><p className="eyebrow">THE RELATIONSHIP</p><h3>Three roles,<br />one system.</h3></Reveal>
          <Reveal><p className="body-copy">Napoleon powers the Intelligence Operating Systems built on the Spectra platform.</p></Reveal>
        </div>
        <Reveal>
          <div className="spec-grid">
            {layers.map(([label, value]) => (
              <div key={label}><span>{label}</span><strong>{value}</strong></div>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="page-section page-section-alt">
        <div className="page-section-head">
          <Reveal><p className="eyebrow">DOMAIN-AGNOSTIC</p><h3>One engine,<br />every industry.</h3></Reveal>
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

      <section className="cta-band">
        <Reveal>
          <p className="eyebrow">NEXT</p>
          <h2>See it in action.<br />Enter the system.</h2>
          <p className="body-copy">BastionOS puts Napoleon&apos;s intelligence to work for security operations.</p>
          <Link className="outline-button" href="/bastionos">Explore BastionOS <ArrowUpRight size={17} /></Link>
        </Reveal>
      </section>

      <SiteFooter />
    </main>
  )
}
