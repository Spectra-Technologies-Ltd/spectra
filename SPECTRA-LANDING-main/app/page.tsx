'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { ArrowDownRight, ArrowUpRight, MoveRight, Plus } from 'lucide-react'
import SiteHeader from '../components/site-header'
import SiteFooter from '../components/site-footer'
import { Reveal } from '../components/reveal'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://spectra-lime.vercel.app'

// Heavy 3D scenes are code-split so three.js and the isometric scene don't slow
// down every edit/build of the page.
const CeaserScene = dynamic(() => import('../components/CeaserScene'), { ssr: false })
const IsometricPlatform = dynamic(() => import('../components/isometric-platform').then((m) => m.IsometricPlatform))

const newsItems = [
  ['SPECTRA JOURNAL', 'BastionOS: the operating foundation for intelligent systems.', '08.15.26'],
  ['TECHNICAL BRIEF', 'Napoleon: machine intelligence from signal to action.', '07.28.26'],
  ['ARCHITECTURE NOTES', 'How infrastructure, intelligence, data and applications fit together.', '06.10.26'],
]

export default function Page() {
  const [pressExpanded, setPressExpanded] = useState(false)

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  // Nav "Overview" links land on the BastionOS / Napoleon sections.
  useEffect(() => {
    const handleLayerHash = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash === 'bastion' || hash === 'napoleon') {
        scrollTo(hash)
      }
    }
    handleLayerHash()
    window.addEventListener('hashchange', handleLayerHash)
    return () => window.removeEventListener('hashchange', handleLayerHash)
  }, [])

  return (
    <main className="spectra-shell">
      <SiteHeader />

      <section id="top" className="hero-section">
        <CeaserScene />
        <div className="hero-scrim" />
        <div className="hero-copy"><p className="eyebrow">SPECTRA TECHNOLOGIES</p><h1>Intelligence.<br /><em>Engineered.</em></h1><p className="hero-description">Spectra builds intelligent operating systems and machine intelligence that power critical infrastructure, enterprise operations, security, and complex real-world systems.</p><a className="outline-button" href={`${APP_URL}/request-demo`}>Get Started <MoveRight size={17} /></a></div>
      </section>

      <section className="manifesto-section" id="company"><Reveal><h2>The infrastructure<br /><em>for intelligence.</em></h2></Reveal><div className="manifesto-meta"><p>Spectra Technologies builds deep technology — operating environments, machine intelligence, and autonomous systems — engineered for the places where the hardest problems live.</p><ArrowDownRight size={28} /></div></section>

      {/* Intro copy before the Bastion slide */}
      <section className="bastion-intro">
        <div className="section-kicker"><span>02</span><span>THE OPERATING FOUNDATION</span></div>
        <div className="bastion-intro-grid">
          <Reveal><h2>Security operations run on<br /><em>people, sites and patrols.</em></h2></Reveal>
          <Reveal><div className="bastion-intro-copy">
            <p className="body-copy">Every shift, every guard, every site generates data — but it lives in spreadsheets, radio calls and paper records. The platform below brings it all into one real-time operating picture.</p>
          </div></Reveal>
        </div>
      </section>

      {/* BastionOS — the small section the nav Overview links to */}
      <section id="bastion" className="bastion-intro">
        <div className="section-kicker"><span className="brand-name">BastionOS</span><span>THE OPERATING FOUNDATION</span></div>
        <div className="bastion-intro-grid">
          <Reveal><h2>The command center<br /><em>for security operations.</em></h2></Reveal>
          <Reveal><div className="bastion-intro-copy">
            <p className="body-copy">BastionOS is the operational command center for private security companies — unifying guard operations, patrols, attendance, incidents, reporting and analytics into one automated, real-time platform.</p>
            <a className="text-button" href="/bastionos">Explore BastionOS <ArrowUpRight size={17} /></a>
          </div></Reveal>
        </div>
      </section>

      {/* Napoleon — signals in, intelligence out */}
      <section id="napoleon" className="command-section"><div className="section-kicker"><span>03</span><span>NAPOLEON</span></div><div className="command-layout"><div className="command-copy"><Reveal><p className="eyebrow">MACHINE INTELLIGENCE LAYER</p><h2>Signals in.<br /><em>Intelligence out.</em></h2><p className="body-copy">Napoleon is the intelligence layer of the Spectra platform. It learns from the operational data your teams already produce — attendance, patrols, incidents, sensors — to surface patterns, predict outcomes, and recommend the next action.</p><a className="text-button" href="/napoleon">Explore Napoleon <ArrowUpRight size={17} /></a></Reveal></div><div className="command-visual"><Reveal delay={120}><div className="signal-pipeline"><div className="pipeline-rail"><span className="pipeline-rail-label">SIGNAL IN</span><div className="pipeline-chip-list">{['ATTENDANCE', 'PATROLS', 'INCIDENTS', 'SENSORS'].map((label) => <span key={label} className="pipeline-chip"><span className="chip-dot" />{label}</span>)}</div></div><div className="pipeline-core"><span className="core-ring" /><span className="core-ring core-ring-2" /><span className="core-dot" /><span className="core-label">NAPOLEON</span></div><div className="pipeline-rail pipeline-rail-out"><span className="pipeline-rail-label">INTELLIGENCE OUT</span><div className="pipeline-chip-list">{['PATTERNS', 'PREDICTIONS', 'DECISIONS'].map((label) => <span key={label} className="pipeline-chip chip-out"><span className="chip-dot" />{label}</span>)}</div></div></div></Reveal></div></div></section>

      {/* Architecture — matching the BastionOS comprehensive page */}
      <section id="architecture" className="capabilities-section"><div className="section-kicker"><span>04</span><span>THE ARCHITECTURE</span></div><div className="capabilities-layout"><div className="capability-sticky"><Reveal><p className="eyebrow"><span className="brand-name">BastionOS</span> · <span className="brand-name">Napoleon</span> · ONE FOUNDATION</p><h2>One system.<br /><em>Three layers.</em></h2><p className="body-copy">BastionOS is the operating foundation. Napoleon is the intelligence layer. Together they form one architecture — from raw signal to decision.</p></Reveal><div className="capability-detail" style={{ paddingTop: 34 }}><div className="fade-swap"><p className="body-copy">Personnel, clients, sites, assets and incidents — unified, automated and live. One real-time picture of the entire operation.</p></div><div className="cap-stat"><strong>1</strong><span>real-time view</span></div></div></div><div className="capability-stage"><div className="capability-animation-wrap"><IsometricPlatform /><div className="image-corner">SPECTRA / SYSTEM ARCHITECTURE</div></div></div></div></section>

      <section className="statement-section"><div className="statement-rule" /><Reveal><p>WE DON&apos;T BUILD SYSTEMS<br />FOR A SINGLE DOMAIN.</p><h2>We build<br /><em>for what&apos;s next.</em></h2></Reveal></section>

      {/* The Spectra Workplace */}
      <section id="company-team" className="team-section"><div className="section-kicker"><span>05</span><span>THE SPECTRA WORKPLACE</span></div><div className="team-grid"><div><Reveal><p className="eyebrow">ONE SYSTEM · THREE LAYERS</p><h2>Work from<br /><em>one workspace.</em></h2><p className="body-copy">The Spectra Workplace is the operational home of your entire security operation — guards, patrols, attendance, incidents and reporting, unified in one real-time command center.</p><a className="text-button" href="/workspace">Explore the Workplace <ArrowUpRight size={17} /></a></Reveal></div><img src="/images/spectra-operator.png" alt="The Spectra Workplace operations view" /></div></section>

      {/* Partners — before news, per brand structure */}
      <section id="partners" className="bastion-intro">
        <div className="section-kicker"><span>PARTNERS</span><span>BUILD WITH US</span></div>
        <div className="bastion-intro-grid">
          <Reveal><h2>Built to<br /><em>build on.</em></h2></Reveal>
          <Reveal><div className="bastion-intro-copy">
            <p className="body-copy">Technology integrations, channel partnerships and co-development — teams building on the Spectra architecture, from first signal to final decision.</p>
            <a className="text-button" href="/partners">Explore partnerships <ArrowUpRight size={17} /></a>
          </div></Reveal>
        </div>
      </section>

      <section className="press-section"><div className="section-kicker"><span>LATEST NEWS</span><span>RESEARCH &amp; INSIGHTS</span></div><div className="press-grid">{newsItems.slice(0, pressExpanded ? 3 : 2).map(([source, title, date]) => <article key={source}><p className="eyebrow">{source}</p><h3>{title}</h3><div><span>{date}</span><ArrowUpRight size={17} /></div></article>)}</div><div className="press-actions"><button className="outline-button center-button" onClick={() => setPressExpanded(!pressExpanded)}>{pressExpanded ? 'Show less' : 'View all articles'} <Plus size={17} /></button><a className="text-button" href="/newsroom">News <ArrowUpRight size={17} /></a><a className="text-button" href="/journal">The Spectra Journal <ArrowUpRight size={17} /></a><a className="text-button" href="/research">Research &amp; Insights <ArrowUpRight size={17} /></a></div></section>

      <section id="careers" className="careers-section"><img src="/images/spectra-careers.png" alt="Engineer on a maritime test pier" /><div className="careers-overlay" /><div className="careers-content"><p className="eyebrow">CAREERS</p><h2>Work on<br /><em>what&apos;s next.</em></h2><button className="outline-button" onClick={() => scrollTo('contact')}>See open roles <ArrowUpRight size={17} /></button></div></section>

      <section id="contact" className="contact-section"><div className="section-kicker"><span>07</span><span>WORK WITH US</span></div><Reveal><h2>Let&apos;s talk about<br /><em>the mission.</em></h2></Reveal><div className="contact-bottom"><p>Tell us what you&apos;re trying to see, understand or protect. We&apos;ll show you what&apos;s possible.</p><a className="solid-button" href={`${APP_URL}/request-demo`}>Start a conversation <ArrowUpRight size={17} /></a></div></section>

      <SiteFooter />
    </main>
  )
}
