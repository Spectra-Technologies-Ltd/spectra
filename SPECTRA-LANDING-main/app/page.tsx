'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, MoveRight, Plus } from 'lucide-react'
import SiteHeader from '../components/site-header'
import SiteFooter from '../components/site-footer'
import { Reveal } from '../components/reveal'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://spectra-lime.vercel.app'

// Heavy 3D scenes are code-split so three.js and the isometric scene don't slow
// down every edit/build of the page.
const CeaserScene = dynamic(() => import('../components/CeaserScene'), { ssr: false })
const IsometricPlatform = dynamic(() => import('../components/isometric-platform').then((m) => m.IsometricPlatform))

const products = [
  { name: 'BASTIONOS', type: 'OPERATING FOUNDATION / INFRASTRUCTURE', image: '/images/spectra-infrastructure.png', description: 'The secure operating environment where Spectra\u2019s systems run — infrastructure that is observable, resilient, and built for autonomy.', stats: [['Uptime', '99.99%'], ['Security', 'Zero trust'], ['Deployment', 'Edge + cloud'], ['Observability', 'Native']] },
  { name: 'NAPOLEON', type: 'INTELLIGENCE LAYER / MACHINE LEARNING', image: '/images/spectra-command.png', description: 'Spectra\u2019s machine-intelligence layer. Models that turn raw signals — video, radar, AIS, acoustic — into capability the system can act on.', stats: [['Inference', '< 90 sec'], ['Signals', 'Multi-sensor'], ['Learning', 'Continuous'], ['Latency', 'Real time']] },
]

const capabilities = [
  { label: '01 / DEPLOY', title: 'Put autonomy where the mission is.', copy: 'Launch from a ship, road, airfield or remote edge. Spectra systems get to work without a crew onboard or a new operating base.', stat: '18 hr', statLabel: 'aerial persistence' },
  { label: '02 / UNDERSTAND', title: 'Turn every signal into context.', copy: 'Our mission software fuses video, radar, AIS, acoustic and environmental data into one shared operational picture.', stat: '1 view', statLabel: 'for every domain' },
  { label: '03 / ACT', title: 'Move at the speed of information.', copy: 'Retask assets, coordinate fleets and close the loop from detection to decision in seconds — with a human in control.', stat: '< 90s', statLabel: 'tasking latency' },
]

const architectureCards = [
  { layer: 'BASTIONOS', tag: 'FOUNDATION / OPERATING LAYER', image: '/images/spectra-infrastructure.png', title: 'The secure operating foundation for intelligent systems.', copy: 'The environment where Spectra&apos;s systems run — infrastructure that is secure, observable, and built for autonomy.', number: '01', anchor: 'capabilities' },
  { layer: 'NAPOLEON', tag: 'INTELLIGENCE / ML LAYER', image: '/images/spectra-command.png', title: 'Machine intelligence that turns signals into capability.', copy: 'Models that reason, learn, and act across complex, high-stakes environments.', number: '02', anchor: 'napoleon' },
  { layer: 'SPECTRA ARCHITECTURE', tag: 'INTEGRATED / END TO END', image: '/images/spectra-operator.png', title: 'Infrastructure, intelligence, data and applications — one system.', copy: 'The architecture that connects every layer of the stack, from first signal to final decision.', number: '03', anchor: 'architecture' },
]

const newsItems = [
  ['SPECTRA JOURNAL', 'BastionOS: the operating foundation for intelligent systems.', '08.15.26'],
  ['TECHNICAL BRIEF', 'Napoleon: machine intelligence from signal to action.', '07.28.26'],
  ['ARCHITECTURE NOTES', 'How infrastructure, intelligence, data and applications fit together.', '06.10.26'],
]

export default function Page() {
  const [capability, setCapability] = useState(0)
  const [product, setProduct] = useState(1)
  const [missionIndex, setMissionIndex] = useState(0)
  const [pressExpanded, setPressExpanded] = useState(false)

  const activeProduct = products[product]
  const activeCapability = capabilities[capability]
  const activeArch = architectureCards[missionIndex % architectureCards.length]

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  // Nav "Overview" links land on the "Built on two layers" section and select
  // the matching layer (BastionOS or Napoleon) via the URL hash.
  useEffect(() => {
    const handleLayerHash = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash === 'fleet-bastion') {
        setProduct(0)
        scrollTo('fleet')
      } else if (hash === 'fleet-napoleon') {
        setProduct(1)
        scrollTo('fleet')
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
        <div className="hero-copy"><p className="eyebrow">SPECTRA TECHNOLOGIES / FOUNDATIONAL SYSTEMS</p><h1>Intelligence.<br /><em>Engineered.</em></h1><p className="hero-description">Spectra builds the operating infrastructure and machine intelligence for systems that reason, learn, and act in complex, high-stakes environments.</p><a className="outline-button" href={`${APP_URL}/register`}>Enter the System <MoveRight size={17} /></a></div>
        <div className="hero-bottom"><span>LONG BEACH, CA / 33.76° N 118.19° W</span><span className="hero-scroll"><span className="scroll-line" /> SCROLL TO DISCOVER</span><span>LIVE / AUTONOMOUS</span></div>
      </section>

      <section className="manifesto-section" id="company"><div className="section-kicker"><span>01</span><span>WHAT IS SPECTRA</span></div><Reveal><h2>The infrastructure<br /><em>for intelligence.</em></h2></Reveal><div className="manifesto-meta"><span>01—03</span><p>Spectra Technologies builds deep technology — operating environments, machine intelligence, and autonomous systems — engineered for the places where the hardest problems live.</p><ArrowDownRight size={28} /></div></section>

      {/* BastionOS overview — the small section the nav Overview links to */}
      <section id="bastion" className="bastion-intro">
        <div className="section-kicker"><span>BASTIONOS</span><span>THE OPERATING FOUNDATION</span></div>
        <div className="bastion-intro-grid">
          <Reveal><h2>The command center<br /><em>for security operations.</em></h2></Reveal>
          <Reveal><div className="bastion-intro-copy">
            <p className="body-copy">BastionOS is the operational command center for private security companies — unifying guard operations, patrols, attendance, incidents, reporting and analytics into one automated, real-time platform.</p>
            <a className="text-button" href="/bastionos">Explore BastionOS <ArrowUpRight size={17} /></a>
          </div></Reveal>
        </div>
      </section>

      <section id="capabilities" className="capabilities-section"><div className="section-kicker"><span>02</span><span>THE ARCHITECTURE</span></div><div className="capabilities-layout"><div className="capability-sticky"><Reveal><p className="eyebrow">BASTIONOS · NAPOLEON · FOUNDATION</p><h2>From signal<br /><em>to action.</em></h2><p className="body-copy">Three layers, one system. The operating foundation, the intelligence layer, and the infrastructure beneath — built to work as a single architecture.</p></Reveal><div className="capability-tabs">{capabilities.map((item, index) => <button className={capability === index ? 'active' : ''} key={item.label} onClick={() => setCapability(index)}><span>{item.label}</span><span className="tab-bar" /></button>)}</div></div><div className="capability-stage"><div className="capability-animation-wrap"><IsometricPlatform /><div className="image-corner">SPECTRA / SYSTEM ARCHITECTURE</div></div><div className="capability-detail"><div key={capability} className="fade-swap"><p className="eyebrow">{activeCapability.label}</p><h3>{activeCapability.title}</h3><p className="body-copy">{activeCapability.copy}</p></div><div className="cap-stat"><strong>{activeCapability.stat}</strong><span>{activeCapability.statLabel}</span></div></div></div></div></section>

      <section id="architecture" className="missions-section"><div className="section-kicker"><span>03</span><span>THE ARCHITECTURE</span></div><div className="section-heading-row"><Reveal><h2>How Spectra&apos;s<br /><em>systems fit together.</em></h2></Reveal><p className="body-copy">Infrastructure, intelligence, data and applications — engineered as one connected system, from first signal to final decision.</p></div><div className="mission-card"><img src={activeArch.image} alt={`${activeArch.layer} architecture layer`} /><div className="mission-shade" /><div className="mission-number">{activeArch.number}</div><div className="mission-content"><p className="eyebrow">{activeArch.layer} / {activeArch.tag}</p><h3>{activeArch.title}</h3><p className="mission-copy">{activeArch.copy}</p><button className="text-button" onClick={() => scrollTo(activeArch.anchor)}>Explore {activeArch.layer} <ArrowUpRight size={17} /></button></div><div className="carousel-controls"><button onClick={() => setMissionIndex((index) => (index - 1 + architectureCards.length) % architectureCards.length)} aria-label="Previous layer"><ChevronLeft /></button><button onClick={() => setMissionIndex((index) => (index + 1) % architectureCards.length)} aria-label="Next layer"><ChevronRight /></button></div></div></section>

      <section id="fleet" className="fleet-section"><div className="section-kicker"><span>04</span><span>THE PLATFORM</span></div><div className="fleet-intro"><Reveal><h2>Built on<br /><em>two layers.</em></h2></Reveal><p className="body-copy">BastionOS and Napoleon — the operating foundation and the intelligence layer at the core of the Spectra architecture. Select a layer.</p></div><div className="product-switcher"><div className="product-nav">{products.map((item, index) => <button key={item.name} className={product === index ? 'active' : ''} onClick={() => setProduct(index)}><span>0{index + 1}</span>{item.name}</button>)}</div><div className="product-layout"><div className="product-visual"><img key={activeProduct.name} className="product-in" src={activeProduct.image} alt={`${activeProduct.name} product layer`} /><div className="image-corner">{activeProduct.name} / SPECTRA</div></div><div className="product-info"><p className="eyebrow">{activeProduct.type}</p><h3>{activeProduct.name}</h3><p className="body-copy">{activeProduct.description}</p><div className="spec-list">{activeProduct.stats.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><a className="outline-button" href={activeProduct.name === 'BASTIONOS' ? '/bastionos' : '/napoleon'}>View technical specs <ArrowUpRight size={17} /></a></div></div></div></section>

      <section className="statement-section"><div className="statement-rule" /><Reveal><p>WE DON&apos;T BUILD SYSTEMS<br />FOR A SINGLE DOMAIN.</p><h2>We build<br /><em>for what&apos;s next.</em></h2></Reveal><div className="statement-foot"><span>SCROLL / 05</span><span>THE SPECTRA WAY</span></div></section>

      <section id="napoleon" className="command-section"><div className="section-kicker"><span>05</span><span>NAPOLEON</span></div><div className="command-layout"><div className="command-copy"><Reveal><p className="eyebrow">MACHINE INTELLIGENCE LAYER</p><h2>Signals in.<br /><em>Intelligence out.</em></h2><p className="body-copy">Napoleon is Spectra&apos;s machine-learning layer. It turns raw signals — sensor, environmental, operational — into models that reason, learn and coordinate across the system.</p><a className="outline-button" href="/napoleon">Explore Napoleon <ArrowUpRight size={17} /></a></Reveal></div><div className="command-visual"><img src="/images/spectra-command.png" alt="Napoleon intelligence layer" /><div className="command-overlay"><span>NAPOLEON / INFERENCE</span><strong>MODEL // RUNNING</strong><span>LATENCY 00:00:04</span></div><div className="command-marker marker-a"><i />TRACK / 0041</div><div className="command-marker marker-b"><i />SIGNAL / CLASSIFIED</div></div></div></section>

      <section id="company-team" className="team-section"><div className="section-kicker"><span>06</span><span>THE PEOPLE</span></div><div className="team-grid"><div><Reveal><p className="eyebrow">BUILT DIFFERENT</p><h2>Small team.<br /><em>Big horizon.</em></h2><p className="body-copy">Engineers, operators, and builders working on the hard problems of intelligent infrastructure — infrastructure that has to work.</p><a className="text-button" href="/about">Meet the team <ArrowUpRight size={17} /></a></Reveal></div><img src="/images/spectra-team.png" alt="Spectra team in an operations room" /></div></section>

      <section className="press-section"><div className="section-kicker"><span>07</span><span>NEWS &amp; ARTICLES</span></div><div className="press-grid">{newsItems.slice(0, pressExpanded ? 3 : 2).map(([source, title, date]) => <article key={source}><p className="eyebrow">{source}</p><h3>{title}</h3><div><span>{date}</span><ArrowUpRight size={17} /></div></article>)}</div><div className="press-actions"><button className="outline-button center-button" onClick={() => setPressExpanded(!pressExpanded)}>{pressExpanded ? 'Show less' : 'View all articles'} <Plus size={17} /></button><a className="text-button" href="/newsroom">Open the News Room <ArrowUpRight size={17} /></a></div></section>

      <section id="careers" className="careers-section"><img src="/images/spectra-careers.png" alt="Engineer on a maritime test pier" /><div className="careers-overlay" /><div className="careers-content"><p className="eyebrow">CAREERS</p><h2>Work on<br /><em>what&apos;s next.</em></h2><button className="outline-button" onClick={() => scrollTo('contact')}>See open roles <ArrowUpRight size={17} /></button></div></section>

      <section id="contact" className="contact-section"><div className="section-kicker"><span>08</span><span>WORK WITH US</span></div><Reveal><h2>Let&apos;s talk about<br /><em>the mission.</em></h2></Reveal><div className="contact-bottom"><p>Tell us what you&apos;re trying to see, understand or protect. We&apos;ll show you what&apos;s possible.</p><a className="solid-button" href="/contact">Start a conversation <ArrowUpRight size={17} /></a></div></section>

      <SiteFooter />
    </main>
  )
}
