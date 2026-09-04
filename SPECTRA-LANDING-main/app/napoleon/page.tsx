import SiteHeader from '@/components/site-header'
import SiteFooter from '@/components/site-footer'
import { PageHero } from '@/components/page-hero'
import { Reveal } from '@/components/reveal'
import { IntelligenceDiagram } from '@/components/napoleon/intelligence-diagram'

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
      </PageHero>

      {/* Full-width intelligence scene — the animated Napoleon layer */}
      		<section id="inference" className="napoleon-scene">
      			<div className="section-kicker"><span>01</span><span>INFERENCE</span></div>
			<div className="napoleon-scene-inner">
				<IntelligenceDiagram />
			</div>
      </section>

      {/* Manifesto rhythm — the Napoleon quote sits to the left of the heading */}
      <section className="manifesto-section" style={{ paddingTop: 130 }}>
        <div className="section-kicker"><span>02</span><span>THE STRATEGIC INTELLIGENCE ENGINE</span></div>
        <div style={{ alignItems: 'flex-start', display: 'flex', flexWrap: 'wrap', gap: '6vw', justifyContent: 'space-between' }}>
          <div style={{ borderLeft: '1px solid rgba(6,21,43,.2)', marginTop: 70, maxWidth: 330, paddingLeft: 24 }}>
            <p style={{ color: '#3c4c63', fontStyle: 'italic', fontSize: 16, lineHeight: 1.65 }}>“Nothing is more difficult, and therefore more precious, than to be able to decide.”</p>
            <p style={{ color: '#637087', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 10, letterSpacing: '.14em', marginTop: 12, textTransform: 'uppercase' }}>— Napoleon</p>
          </div>
          <div style={{ flex: 1, minWidth: 300 }}>
            <Reveal><h2>Victory is decided<br /><em>by intelligence.</em></h2></Reveal>
            <div className="manifesto-meta">
              <span>01—06</span>
              <p>Napoleon understood that victory was not determined by force alone — it was determined by the ability to gather information, understand the battlefield, anticipate movement, and make decisions faster than the opposition.</p>
            </div>
          </div>
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
          <h2>Make data your<br /><em>strategic assets.</em></h2>
        </Reveal>
      </section>

      <SiteFooter />
    </main>
  )
}
