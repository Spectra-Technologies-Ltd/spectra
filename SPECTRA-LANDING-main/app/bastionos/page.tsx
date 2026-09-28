import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowUpRight } from '@/components/icon'
import SiteHeader from '@/components/site-header'
import SiteFooter from '@/components/site-footer'
import { PageHero } from '@/components/page-hero'
import { Reveal } from '@/components/reveal'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  title: 'BastionOS — Spectra Technologies',
  description:
    'BastionOS is Spectra\u2019s modular Security Operations Platform — the operational command center for private security companies.',
  path: '/bastionos',
})

const specs = [
  ['Platform', 'Modular Security Operations Platform'],
  ['Deployment', 'Cloud + edge'],
  ['Data', 'Unified personnel, clients, sites, assets, incidents'],
  ['Intelligence', 'Powered by Napoleon (ML / AI layer)'],
  ['Automation', 'Real-time, automated workflows'],
  ['Security', 'Role-based access, full audit trail'],
] as const

export default function BastionOSPage() {
  return (
    <main id="main" className="spectra-shell">
      <SiteHeader />

      <PageHero
        kicker={<><span className="brand-name">BastionOS</span> / THE OPERATING FOUNDATION</>}
        title="Security operations,"
        em="unified."
        tag={<span className="brand-name">BastionOS</span>}
      >
        <p>
          The operational command center for private security companies. BastionOS unifies guard
          operations, patrols, attendance, incidents, reporting and analytics into a single,
          automated, real-time platform.
        </p>
      </PageHero>

      {/* Manifesto — the landing page rhythm: statement, then the system */}
      <section className="manifesto-section">
        <div className="section-kicker"><span>01</span><span>WHAT IS <span className="brand-name">BastionOS</span></span></div>
        <Reveal><h2>The operating system<br /><em>for security operations.</em></h2></Reveal>
        <div className="manifesto-meta">
          <span>01—04</span>
          <p>BastionOS is the first Intelligence Operating System from Spectra — a modular security operations platform that unifies personnel, clients, sites, assets, incidents and operational data into one real-time system.</p>
        </div>
      </section>

      {/* Stack specs */}
      <section id="stack" className="page-section">
        <div className="page-section-head">
          <Reveal>
            <p className="eyebrow">02 / THE STACK</p>
            <h2 className="section-heading">BastionOS + Napoleon,<br />one system.</h2>
          </Reveal>
          <Reveal><p className="body-copy">The operating foundation and the intelligence layer are built to work as a single architecture.</p></Reveal>
        </div>
        <Reveal>
          <div className="spec-grid">
            {specs.map(([label, value]) => (
              <div key={label}><span>{label}</span><strong>{value}</strong></div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Statement CTA — the landing page statement concept */}
      <section className="statement-section">
        <div className="statement-rule" />
        <Reveal>
          <h2>Explore the intelligence<br /><em>layer behind it.</em></h2>
        </Reveal>
        <div className="statement-foot">
          <Link className="text-button" href="/napoleon">Explore Napoleon <ArrowUpRight size={17} aria-hidden="true" /></Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
