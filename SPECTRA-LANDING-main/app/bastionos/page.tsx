import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import SiteHeader from '@/components/site-header'
import SiteFooter from '@/components/site-footer'
import { PageHero } from '@/components/page-hero'
import { Reveal } from '@/components/reveal'

export const metadata = {
  title: 'BastionOS — Spectra Technologies',
  description:
    'BastionOS is Spectra\u2019s modular Security Operations Platform — the operational command center for private security companies.',
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://spectra-lime.vercel.app'

const capabilities = [
  ['01', 'Guard Operations', 'Personnel, assignments and coverage managed in one real-time view. No spreadsheets, no radio noise.'],
  ['02', 'Patrols', 'Patrol planning, live tracking and automatic verification — routes that actually get walked, and proof that they did.'],
  ['03', 'Attendance', 'Digital clock-in and attendance tracking tied to shifts, sites and payroll-ready records.'],
  ['04', 'Incidents', 'Incident logging, classification and escalation with a full audit trail from report to resolution.'],
  ['05', 'Reporting', 'Operational reports generated automatically — daily, weekly and per-client, straight from live data.'],
  ['06', 'Analytics', 'Predictive insights and decision support powered by Napoleon, Spectra\u2019s machine intelligence layer.'],
] as const

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
    <main className="spectra-shell">
      <SiteHeader />

      <PageHero kicker="BASTIONOS / THE OPERATING FOUNDATION" title="Security operations," em="unified.">
        <p>
          The operational command center for private security companies. BastionOS unifies guard
          operations, patrols, attendance, incidents, reporting and analytics into a single,
          automated, real-time platform.
        </p>
        <Link className="outline-button" href={`${APP_URL}/register`}>Enter the Workspace <ArrowUpRight size={17} /></Link>
      </PageHero>

      <section className="page-section">
        <div className="page-section-head">
          <Reveal><p className="eyebrow">WHAT IS BASTIONOS</p><h3>The operating system<br />for security operations.</h3></Reveal>
          <Reveal><p className="body-copy">Spectra Technologies develops Intelligence Operating Systems. BastionOS is the first.</p></Reveal>
        </div>
        <Reveal>
          <div className="page-prose">
            <p>
              BastionOS is a <strong>modular Security Operations Platform</strong> that serves as the operational
              command center for private security companies. It unifies personnel, clients, sites,
              assets, incidents, and operational data into a single, automated real-time platform.
            </p>
            <p>
              Built on top of Spectra&apos;s proprietary machine learning and AI model — <em>Napoleon</em> —
              BastionOS delivers <strong>predictive insights</strong>, <strong>intelligent automation</strong> and{' '}
              <strong>decision support</strong>, enabling organizations to operate more efficiently, respond
              faster, and continuously improve their security operations.
            </p>
          </div>
        </Reveal>
      </section>

      <section className="page-section page-section-alt">
        <div className="page-section-head">
          <Reveal><p className="eyebrow">CORE CAPABILITIES</p><h3>Everything your<br />operation runs on.</h3></Reveal>
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
          <Reveal><p className="eyebrow">THE STACK</p><h3>BastionOS + Napoleon,<br />one system.</h3></Reveal>
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

      <section className="cta-band">
        <Reveal>
          <p className="eyebrow">NEXT</p>
          <h2>Explore the intelligence<br />layer behind it.</h2>
          <p className="body-copy">Napoleon is the machine intelligence that turns operational data into capability.</p>
          <Link className="outline-button" href="/napoleon">Explore Napoleon <ArrowUpRight size={17} /></Link>
        </Reveal>
      </section>

      <SiteFooter />
    </main>
  )
}
