import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowUpRight, ArrowDownRight } from '@/components/icon'
import SiteHeader from '@/components/site-header'
import SiteFooter from '@/components/site-footer'
import { PageHero } from '@/components/page-hero'
import { Reveal } from '@/components/reveal'
import { APP_URL } from '@/lib/site'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  title: 'The Spectra Workplace — Spectra Technologies',
  description:
    'The Spectra Workplace is the operational home of BastionOS — guards, patrols, attendance, incidents and reporting in one real-time command center.',
  path: '/workspace',
})

const modules = [
  ['01', 'Guard Operations', 'Personnel, assignments and coverage managed in one real-time view.'],
  ['02', 'Patrols', 'Patrol planning, live tracking and automatic verification.'],
  ['03', 'Attendance', 'Digital clock-in tied to shifts, sites and payroll-ready records.'],
  ['04', 'Incidents', 'Logging, classification and escalation with a full audit trail.'],
  ['05', 'Reporting', 'Operational reports generated automatically from live data.'],
  ['06', 'Analytics', 'Predictive insights and decision support powered by Napoleon.'],
] as const

const liveOps = [
  ['Attendance', 'Check-ins land the moment they happen — no end-of-day reconciliation.'],
  ['Incidents', 'Reports appear as they are filed, with severity and escalation state attached.'],
  ['Patrols', 'Checkpoint scans verify themselves against the planned route.'],
  ['Coverage', 'Every site, shift and gap visible on one operational picture.'],
] as const

export default function WorkspacePage() {
  return (
    <main id="main" className="spectra-shell">
      <SiteHeader />

      <PageHero kicker="SPECTRA WORKPLACE / THE OPERATING PLATFORM" title="One workspace," em="every operation." tag="SPECTRA / WORKPLACE">
        <p>
          The Spectra Workplace is the operational home of your security operation — guards, patrols,
          attendance, incidents and reporting, unified in one real-time command center.
        </p>
        <Link
          className="outline-button"
          href={`${APP_URL}/login`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Enter the Spectra Workplace <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </PageHero>

      {/* Manifesto */}
      <section className="manifesto-section">
        <div className="section-kicker"><span>01</span><span>ONE SYSTEM · THREE LAYERS</span></div>
        <Reveal><h2>The command center<br /><em>for security operations.</em></h2></Reveal>
        <div className="manifesto-meta">
          <span>01—03</span>
          <p>BastionOS is the operating foundation. Napoleon is the intelligence layer. The Spectra Workplace is where both come together — one system, three layers, a single view of your operation.</p>
          <ArrowDownRight size={28} aria-hidden="true" />
        </div>
      </section>

      {/* What runs in the workplace */}
      <section className="page-section">
        <div className="page-section-head">
          <Reveal>
            <p className="eyebrow">02 / WHAT RUNS IN THE WORKPLACE</p>
            <h2 className="section-heading">Every part of the<br />operation, connected.</h2>
          </Reveal>
          <Reveal><p className="body-copy">The modules that run a security operation — each built to remove friction, all sharing one real-time view.</p></Reveal>
        </div>
        <div className="card-grid">
          {modules.map(([index, title, copy], i) => (
            <Reveal key={title} delay={i * 70}>
              <div className="page-card">
                <span className="card-index">{index}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Live ops */}
      <section className="page-section page-section-alt">
        <div className="page-section-head">
          <Reveal>
            <p className="eyebrow">03 / LIVE OPERATIONS</p>
            <h2 className="section-heading">Built to operate<br />in real time.</h2>
          </Reveal>
          <Reveal><p className="body-copy">Attendance check-ins land the moment they happen. Incidents appear as they are reported. Patrols verify themselves. The workplace never waits for a report.</p></Reveal>
        </div>
        <Reveal>
          <div className="spec-grid two-col">
            {liveOps.map(([label, value]) => (
              <div key={label}><span>{label}</span><strong>{value}</strong></div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Statement CTA */}
      <section className="statement-section">
        <div className="statement-rule" />
        <Reveal>
          <p>BASTIONOS · NAPOLEON<br />ONE SYSTEM, THREE LAYERS</p>
          <h2>Step into<br /><em>the Workplace.</em></h2>
        </Reveal>
        <div className="statement-foot">
          <Link
            className="text-button"
            href={`${APP_URL}/login`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Enter the Spectra Workplace <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
