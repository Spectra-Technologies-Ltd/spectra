import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import SiteHeader from '@/components/site-header'
import SiteFooter from '@/components/site-footer'
import { PageHero } from '@/components/page-hero'
import { Reveal } from '@/components/reveal'
import { IsometricPlatform } from '@/components/isometric-platform'

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

      <PageHero kicker={<><span className="brand-name">BastionOS</span> / THE OPERATING FOUNDATION</>} title="Security operations," em="unified." tag={<><span className="brand-name">BastionOS</span> / LIVE</>}>
        <p>
          The operational command center for private security companies. BastionOS unifies guard
          operations, patrols, attendance, incidents, reporting and analytics into a single,
          automated, real-time platform.
        </p>
        <Link className="outline-button" href={`${APP_URL}/register`}>Enter the Workspace <ArrowUpRight size={17} /></Link>
      </PageHero>

      {/* Manifesto — the landing page rhythm: statement, then the system */}
      <section className="manifesto-section" style={{ paddingTop: 130 }}>
        <div className="section-kicker"><span>01</span><span>WHAT IS <span className="brand-name">BastionOS</span></span></div>
        <Reveal><h2>The operating system<br /><em>for security operations.</em></h2></Reveal>
        <div className="manifesto-meta">
          <span>01—04</span>
          <p>Spectra Technologies develops Intelligence Operating Systems. BastionOS is the first — a modular security operations platform that unifies personnel, clients, sites, assets, incidents and operational data into one real-time system.</p>
        </div>
      </section>

      {/* The system — homepage isometric architecture concept */}
      <section id="system" className="capabilities-section" style={{ paddingTop: 110 }}>
        <div className="section-kicker"><span>02</span><span>THE SYSTEM</span></div>
        <div className="capabilities-layout">
          <div className="capability-sticky">
            <Reveal>
              <p className="eyebrow"><span className="brand-name">BastionOS</span> · <span className="brand-name">Napoleon</span> · FOUNDATION</p>
              <h2>One platform.<br /><em>Three layers.</em></h2>
              <p className="body-copy">Built on top of Spectra&apos;s proprietary machine learning and AI model — Napoleon — BastionOS delivers predictive insights, intelligent automation and decision support.</p>
            </Reveal>
            <div className="capability-detail" style={{ paddingTop: 34 }}>
              <div className="fade-swap">
                <h3 style={{ fontSize: 'clamp(22px, 2.4vw, 34px)' }}>The command center for your entire operation.</h3>
                <p className="body-copy">Personnel, clients, sites, assets and incidents — unified, automated and live. Operate more efficiently, respond faster, and continuously improve.</p>
              </div>
              <div className="cap-stat"><strong>1</strong><span>real-time view</span></div>
            </div>
          </div>
          <div className="capability-stage">
            <div className="capability-animation-wrap">
              <IsometricPlatform />
              <div className="image-corner">SPECTRA / SYSTEM ARCHITECTURE</div>
            </div>
          </div>
        </div>
      </section>

      {/* Full-bleed mission card — the landing page architecture-card concept */}
      <section id="capabilities" className="missions-section" style={{ paddingTop: 110 }}>
        <div className="section-kicker"><span>03</span><span>CORE CAPABILITIES</span></div>
        <div className="section-heading-row">
          <Reveal><h2>Everything your<br /><em>operation runs on.</em></h2></Reveal>
          <p className="body-copy">Six modules, one platform — each built to remove friction from a security operation.</p>
        </div>
        <div className="mission-card">
          <img src="/images/spectra-infrastructure.png" alt="BastionOS capabilities" />
          <div className="mission-shade" />
          <div className="mission-number">06</div>
          <div className="mission-content">
            <p className="eyebrow"><span className="brand-name">BastionOS</span> / MODULES</p>
            <h3>Guard operations to analytics — the modules that run the operation.</h3>
          </div>
        </div>
        <div className="card-grid" style={{ marginTop: 40 }}>
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

      {/* Stack specs */}
      <section id="stack" className="page-section">
        <div className="page-section-head">
          <Reveal><p className="eyebrow">04 / THE STACK</p><h3>BastionOS + Napoleon,<br />one system.</h3></Reveal>
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
          <p>BUILT TO OPERATE.<br />BUILT TO IMPROVE.</p>
          <h2>Explore the intelligence<br /><em>layer behind it.</em></h2>
        </Reveal>
        <div className="statement-foot">
          <span>SCROLL / 05</span>
          <Link className="text-button" href="/napoleon">Explore Napoleon <ArrowUpRight size={17} /></Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
