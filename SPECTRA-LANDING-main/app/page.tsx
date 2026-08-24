'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { ArrowDownRight, ArrowUpRight, MoveRight, Plus } from 'lucide-react'
import SiteHeader from '../components/site-header'
import SiteFooter from '../components/site-footer'
import { Reveal } from '../components/reveal'
import { PrintText } from '../components/print-text'

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
        <div className="hero-copy">
          <p className="eyebrow">SPECTRA TECHNOLOGIES</p>
          <h1>Intelligence.<br /><em>Engineered.</em></h1>
          <p className="hero-description">Spectra builds intelligent operating systems and machine intelligence that power critical infrastructure, enterprise operations, security, and complex real-world systems.</p>
          <a className="outline-button" href={`${APP_URL}/request-demo`}>Get Started <MoveRight size={17} /></a>
        </div>
      </section>

      <section className="manifesto-section" id="company">
        <PrintText tag="h2" lines={[{ text: 'The infrastructure' }, { text: 'for intelligence.', style: 'em' }]} />
        <div className="manifesto-meta">
          <PrintText
            tag="p"
            lines="Spectra Technologies builds deep technology — operating environments, machine intelligence, and autonomous systems — engineered for the places where the hardest problems live."
            speed={10}
          />
          <ArrowDownRight size={28} />
        </div>
      </section>

      {/* BastionOS — the small section the nav Overview links to */}
      <section id="bastion" className="bastion-intro bastion-centered">
        <div className="section-kicker"><span className="brand-name">BastionOS</span></div>
        <div className="bastion-hero-center">
          <PrintText tag="h2" lines={[{ text: 'BastionOS', style: 'brand' }, { text: 'Our Flagship', style: 'em' }, { text: 'Product', style: 'em' }]} />
          <a className="text-button" href="/bastionos">Explore BastionOS <ArrowUpRight size={17} /></a>
        </div>
      </section>

      {/* Napoleon — computes what comes next */}
      <section id="napoleon" className="bastion-intro bastion-centered">
        <div className="section-kicker"><span className="brand-name">Napoleon</span><span>THE INTELLIGENCE LAYER</span></div>
        <div className="bastion-hero-center">
          <PrintText tag="h2" lines={[{ text: 'Napoleon', style: 'brand' }, { text: 'Compute What', style: 'em' }, { text: 'Comes Next', style: 'em' }]} />
          <a className="text-button" href="/napoleon">Explore Napoleon <ArrowUpRight size={17} /></a>
        </div>
      </section>

      {/* Architecture — matching the BastionOS comprehensive page */}
      <section id="architecture" className="capabilities-section"><div className="section-kicker"><span>04</span><span>THE ARCHITECTURE</span></div><div className="capabilities-layout"><div className="capability-sticky"><Reveal><p className="eyebrow"><span className="brand-name">BastionOS</span> · <span className="brand-name">Napoleon</span> · ONE FOUNDATION</p><h2>One system.<br /><em>Three layers.</em></h2><p className="body-copy">One architecture — infrastructure, intelligence, data and applications, built to work as a single system. Every layer feeds the next: infrastructure collects the signals, intelligence interprets them, data makes them usable, and applications put them to work.</p></Reveal></div><div className="capability-stage"><div className="capability-animation-wrap"><IsometricPlatform /></div></div></div></section>

      <section className="statement-section"><div className="statement-rule" /><Reveal><p>WE DON&apos;T BUILD SYSTEMS<br />FOR A SINGLE DOMAIN.</p><PrintText tag="h2" lines={[{ text: 'We build' }, { text: "for what's next.", style: 'em' }]} /></Reveal></section>

      {/* The Spectra Workplace */}
      <section id="company-team" className="team-section"><div className="section-kicker"><span>05</span><span>THE SPECTRA WORKPLACE</span></div><div className="team-grid"><div><Reveal><p className="eyebrow">ONE SYSTEM · THREE LAYERS</p><PrintText tag="h2" lines={[{ text: 'Work from' }, { text: 'one workspace.', style: 'em' }]} /><p className="body-copy">The Spectra Workplace is the operational home of your entire security operation — guards, patrols, attendance, incidents and reporting, unified in one real-time command center.</p><a className="text-button" href="/workspace">Explore the Workplace <ArrowUpRight size={17} /></a></Reveal></div><img src="/images/spectra-operator.png" alt="The Spectra Workplace operations view" /></div></section>

      {/* Partners — before news, per brand structure */}
      <section id="partners" className="bastion-intro">
        <div className="section-kicker"><span>PARTNERS</span><span>BUILD WITH US</span></div>
        <div className="bastion-intro-grid">
          <PrintText tag="h2" lines={[{ text: 'Built to' }, { text: 'build on.', style: 'em' }]} />
          <Reveal><div className="bastion-intro-copy">
            <p className="body-copy"><PrintText tag="span" lines="Technology integrations, channel partnerships and co-development — teams building on the Spectra architecture, from first signal to final decision." speed={10} /></p>
            <a className="text-button" href="/partners">Explore partnerships <ArrowUpRight size={17} /></a>
          </div></Reveal>
        </div>
      </section>

      <section className="press-section"><div className="section-kicker"><span>LATEST NEWS</span><span>RESEARCH &amp; INSIGHTS</span></div><div className="press-grid">{newsItems.slice(0, pressExpanded ? 3 : 2).map(([source, title, date]) => <article key={source}><p className="eyebrow">{source}</p><h3>{title}</h3><div><span>{date}</span><ArrowUpRight size={17} /></div></article>)}</div><div className="press-actions"><button className="outline-button center-button" onClick={() => setPressExpanded(!pressExpanded)}>{pressExpanded ? 'Show less' : 'View all articles'} <Plus size={17} /></button><a className="text-button" href="/newsroom">News <ArrowUpRight size={17} /></a><a className="text-button" href="/journal">The Spectra Journal <ArrowUpRight size={17} /></a><a className="text-button" href="/research">Research &amp; Insights <ArrowUpRight size={17} /></a></div></section>

      <section id="careers" className="careers-section"><img src="/images/spectra-careers.png" alt="Engineer on a maritime test pier" /><div className="careers-overlay" /><div className="careers-content"><p className="eyebrow">CAREERS</p><PrintText tag="h2" lines={[{ text: 'Work on' }, { text: "what's next.", style: 'em' }]} /><button className="outline-button" onClick={() => scrollTo('contact')}>See open roles <ArrowUpRight size={17} /></button></div></section>

      <section id="contact" className="contact-section"><div className="section-kicker"><span>07</span><span>WORK WITH US</span></div><PrintText tag="h2" lines={[{ text: "Let's talk about" }, { text: 'the mission.', style: 'em' }]} /><div className="contact-bottom"><PrintText tag="p" lines="Tell us what you're trying to see, understand or protect. We'll show you what's possible." speed={10} /><a className="solid-button" href={`${APP_URL}/request-demo`}>Start a conversation <ArrowUpRight size={17} /></a></div></section>

      <SiteFooter />
    </main>
  )
}
