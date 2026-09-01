import Link from 'next/link'
import { ArrowUpRight } from '@/components/icon'
import SiteHeader from '@/components/site-header'
import SiteFooter from '@/components/site-footer'
import { PageHero } from '@/components/page-hero'
import { Reveal } from '@/components/reveal'
import { PrintText } from '@/components/print-text'

export const metadata = {
  title: 'About Spectra — Spectra Technologies',
  description:
    'Spectra Technologies develops Intelligence Operating Systems — deep technology for intelligent infrastructure, AI and autonomous systems.',
}

const principles = [
  ['01', 'Foundational technology', 'We build the layer beneath the application — operating environments, machine intelligence and the architecture that connects them.'],
  ['02', 'Signal to decision', 'Data is only useful when it becomes action. Every system we build shortens the distance between raw signal and confident decision.'],
  ['03', 'Engineered in Africa', 'We design, develop and own our technology stack in Nigeria — building indigenous capability and reducing dependence on imported systems.'],
  ['04', 'Built for the hard places', 'Security operations, critical infrastructure and national resilience — the environments where failure is not an option.'],
] as const

export default function AboutPage() {
  return (
    <main className="spectra-shell">
      <SiteHeader />

      <PageHero kicker="ABOUT SPECTRA / THE COMPANY" title="Deep technology," em="hard problems." tag="SPECTRA / FOUNDATIONAL">
        <p>
          Spectra Technologies is a Nigerian technology company building Intelligence
          Operating Systems — platforms that unify operations, data and machine
          intelligence into one working system.
        </p>
        <Link className="outline-button" href="/request-demo">Work with us <ArrowUpRight size={17} /></Link>
      </PageHero>

      {/* Who we are — the company in one breath */}
      <section className="manifesto-section" style={{ paddingTop: 130 }}>
        <div className="section-kicker"><span>01</span><span>WHO WE ARE</span></div>
        <PrintText tag="h2" lines={[{ text: 'A technology company' }, { text: 'building for what comes next.', style: 'em' }]} />
        <div className="manifesto-meta">
          <p>Spectra Technology and Development Ltd. builds Intelligence Operating Systems that turn fragmented operational data into actionable intelligence. Our first product, BastionOS, digitizes private security operations — and the same architecture is built to scale across logistics, manufacturing, finance, energy, government and critical infrastructure.</p>
        </div>
      </section>

      {/* What we believe */}
      <section className="page-section">
        <div className="page-section-head">
          <Reveal><p className="eyebrow">02 / PRINCIPLES</p><h3>What we<br />believe.</h3></Reveal>
        </div>
        <div className="card-grid">
          {principles.map(([index, title, copy], i) => (
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

      {/* Mission & vision */}
      <section className="bastion-intro">
        <div className="section-kicker"><span>MISSION</span><span>WHY SPECTRA</span></div>
        <div className="bastion-intro-grid">
          <Reveal><h2>Built to<br /><em>strengthen what matters.</em></h2></Reveal>
          <Reveal><div className="bastion-intro-copy">
            <p className="body-copy">Our mission is to empower organizations with intelligent technologies that automate operations, strengthen security and enable data-driven decision-making — while fostering the innovation that advances Nigeria&apos;s technological sovereignty.</p>
            <p className="body-copy">Our long-term vision is to become Africa&apos;s leading defense, security and operational intelligence technology company — engineering world-class systems that protect critical infrastructure, advance public safety and strengthen national resilience.</p>
          </div></Reveal>
        </div>
      </section>

      {/* Company statement — unique to this page */}
      <section className="statement-section">
        <div className="statement-rule" />
        <Reveal>
          <p>SPECTRA = THE COMPANY.<br />BASTIONOS = THE OPERATING FOUNDATION.<br />NAPOLEON = THE INTELLIGENCE.</p>
          <h2>The company behind<br /><em>the system.</em></h2>
        </Reveal>
        <div className="statement-foot">
          <Link className="text-button" href="/request-demo">Start a conversation <ArrowUpRight size={17} /></Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
