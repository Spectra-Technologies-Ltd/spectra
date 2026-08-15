'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Menu, MoveRight, Plus, X } from 'lucide-react'

// Heavy 3D scenes are code-split so three.js and the isometric scene don't slow
// down every edit/build of the page.
const CeaserScene = dynamic(() => import('../components/CeaserScene'), { ssr: false })
const IsometricPlatform = dynamic(() => import('../components/isometric-platform').then((m) => m.IsometricPlatform))

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://spectra-lime.vercel.app'

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

function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`reveal ${className}`}>{children}</div>
}

export default function Page() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [capability, setCapability] = useState(0)
  const [product, setProduct] = useState(1)
  const [missionIndex, setMissionIndex] = useState(0)
  const [pressExpanded, setPressExpanded] = useState(false)
  const [newsletterSent, setNewsletterSent] = useState(false)
  const [miles, setMiles] = useState(0)
  const heroRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const onScroll = () => setMiles(Math.round(window.scrollY / 1000))
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('is-visible')), { threshold: 0.12 })
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const activeProduct = products[product]
  const activeCapability = capabilities[capability]
  const activeArch = architectureCards[missionIndex % architectureCards.length]

  const scrollTo = (id: string) => {
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const onNewsletter = (e: React.FormEvent) => {
    e.preventDefault()
    setNewsletterSent(true)
  }

  const newsletterForm = (
    <form className="newsletter" onSubmit={onNewsletter}>
      <input type="email" required placeholder="you@company.com" aria-label="Email address" className="newsletter-input" />
      <button className="newsletter-btn" type="submit">{newsletterSent ? 'SUBSCRIBED' : 'SUBSCRIBE'}</button>
    </form>
  )

  return (
    <main className="spectra-shell">
      <header className={`site-header ${menuOpen ? 'header-hidden' : ''}`}>
        <button className="wordmark" onClick={() => scrollTo('top')} aria-label="Spectra home">SPECTRA<span>.</span></button>
        <div className="header-center">INTELLIGENT INFRASTRUCTURE / MACHINE INTELLIGENCE</div>
        <button className="menu-trigger" onClick={() => setMenuOpen(true)} aria-label="Open menu"><span>MENU</span><Menu size={17} /></button>
      </header>

      <div className={`menu-panel ${menuOpen ? 'menu-open' : ''}`} aria-hidden={!menuOpen}>
        <div className="menu-panel-top"><span>SPECTRA TECHNOLOGIES / INDEX</span><button onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={20} /></button></div>
        <nav className="menu-links">
          <div className="menu-group">
            <span className="menu-group-title">BastionOS — Operating Foundation</span>
            {[['01', 'Overview', 'capabilities'], ['02', 'Architecture', 'architecture'], ['03', 'Capabilities', 'capabilities'], ['04', 'Applications', 'fleet']].map(([number, label, id]) => <button key={label} onClick={() => scrollTo(id)}><span>{number}</span><strong>{label}</strong><ArrowUpRight size={20} /></button>)}
          </div>
          <div className="menu-group">
            <span className="menu-group-title">Napoleon — Intelligence Layer</span>
            {[['01', 'Overview', 'napoleon'], ['02', 'Intelligence capabilities', 'napoleon'], ['03', 'Architecture', 'architecture'], ['04', 'Applications', 'fleet']].map(([number, label, id]) => <button key={label} onClick={() => scrollTo(id)}><span>{number}</span><strong>{label}</strong><ArrowUpRight size={20} /></button>)}
          </div>
          <div className="menu-group">
            <span className="menu-group-title">Architecture</span>
            <button onClick={() => scrollTo('architecture')}><span>01</span><strong>How Spectra&apos;s systems fit together</strong><ArrowUpRight size={20} /></button>
          </div>
          <div className="menu-group">
            <span className="menu-group-title">Work With Us</span>
            {[['01', 'Partnerships', 'contact'], ['02', 'Enterprise', 'contact'], ['03', 'Government', 'contact'], ['04', 'Contact', 'contact']].map(([number, label, id]) => <button key={label} onClick={() => scrollTo(id)}><span>{number}</span><strong>{label}</strong><ArrowUpRight size={20} /></button>)}
          </div>
        </nav>
        <div className="menu-more">
          <span className="menu-group-title">More</span>
          <div className="menu-more-links">
            <button onClick={() => scrollTo('capabilities')}>BastionOS</button>
            <button onClick={() => scrollTo('napoleon')}>Napoleon</button>
            <a href={`${APP_URL}/login`} target="_blank" rel="noopener noreferrer">Workspace</a>
            <button onClick={() => scrollTo('contact')}>Work with us</button>
            <button onClick={() => scrollTo('contact')}>Contact</button>
          </div>
        </div>
        <div className="menu-newsletter">
          <span className="menu-group-title">Sign up for briefings</span>
          {newsletterForm}
        </div>
        <div className="menu-foot"><span>BUILT FOR THE UNSEEN</span><span>© SPECTRA 2026</span></div>
      </div>

      <section id="top" ref={heroRef} className="hero-section">
        <CeaserScene />
        <div className="hero-scrim" />
        <div className="hero-copy"><p className="eyebrow">SPECTRA TECHNOLOGIES / FOUNDATIONAL SYSTEMS</p><h1>Intelligence.<br /><em>Engineered.</em></h1><p className="hero-description">Spectra builds the operating infrastructure and machine intelligence for systems that reason, learn, and act in complex, high-stakes environments.</p><a className="outline-button" href={`${APP_URL}/register`}>Enter the System <MoveRight size={17} /></a></div>
        <div className="hero-bottom"><span>LONG BEACH, CA / 33.76° N 118.19° W</span><span className="hero-scroll"><span className="scroll-line" /> SCROLL TO DISCOVER</span><span>LIVE / AUTONOMOUS</span></div>
      </section>

      <section className="manifesto-section" id="company"><div className="section-kicker"><span>01</span><span>WHAT IS SPECTRA</span></div><Reveal><h2>The infrastructure<br /><em>for intelligence.</em></h2></Reveal><div className="manifesto-meta"><span>01—03</span><p>Spectra Technologies builds deep technology — operating environments, machine intelligence, and autonomous systems — engineered for the places where the hardest problems live.</p><ArrowDownRight size={28} /></div></section>

      <section id="capabilities" className="capabilities-section"><div className="section-kicker"><span>02</span><span>THE ARCHITECTURE</span></div><div className="capabilities-layout"><div className="capability-sticky"><Reveal><p className="eyebrow">BASTIONOS · NAPOLEON · FOUNDATION</p><h2>From signal<br /><em>to action.</em></h2><p className="body-copy">Three layers, one system. The operating foundation, the intelligence layer, and the infrastructure beneath — built to work as a single architecture.</p></Reveal><div className="capability-tabs">{capabilities.map((item, index) => <button className={capability === index ? 'active' : ''} key={item.label} onClick={() => setCapability(index)}><span>{item.label}</span><span className="tab-bar" /></button>)}</div></div><div className="capability-stage"><div className="capability-animation-wrap"><IsometricPlatform /><div className="image-corner">SPECTRA / SYSTEM ARCHITECTURE</div></div><div className="capability-detail"><div><p className="eyebrow">{activeCapability.label}</p><h3>{activeCapability.title}</h3><p className="body-copy">{activeCapability.copy}</p></div><div className="cap-stat"><strong>{activeCapability.stat}</strong><span>{activeCapability.statLabel}</span></div></div></div></div></section>

      <section id="architecture" className="missions-section"><div className="section-kicker"><span>03</span><span>THE ARCHITECTURE</span></div><div className="section-heading-row"><Reveal><h2>How Spectra&apos;s<br /><em>systems fit together.</em></h2></Reveal><p className="body-copy">Infrastructure, intelligence, data and applications — engineered as one connected system, from first signal to final decision.</p></div><div className="mission-card"><img src={activeArch.image} alt={`${activeArch.layer} architecture layer`} /><div className="mission-shade" /><div className="mission-number">{activeArch.number}</div><div className="mission-content"><p className="eyebrow">{activeArch.layer} / {activeArch.tag}</p><h3>{activeArch.title}</h3><p className="mission-copy">{activeArch.copy}</p><button className="text-button" onClick={() => scrollTo(activeArch.anchor)}>Explore {activeArch.layer} <ArrowUpRight size={17} /></button></div><div className="carousel-controls"><button onClick={() => setMissionIndex((index) => (index - 1 + architectureCards.length) % architectureCards.length)} aria-label="Previous layer"><ChevronLeft /></button><button onClick={() => setMissionIndex((index) => (index + 1) % architectureCards.length)} aria-label="Next layer"><ChevronRight /></button></div></div></section>

      <section id="fleet" className="fleet-section"><div className="section-kicker"><span>04</span><span>THE PLATFORM</span></div><div className="fleet-intro"><Reveal><h2>Built on<br /><em>two layers.</em></h2></Reveal><p className="body-copy">BastionOS and Napoleon — the operating foundation and the intelligence layer at the core of the Spectra architecture. Select a layer.</p></div><div className="product-switcher"><div className="product-nav">{products.map((item, index) => <button key={item.name} className={product === index ? 'active' : ''} onClick={() => setProduct(index)}><span>0{index + 1}</span>{item.name}</button>)}</div><div className="product-layout"><div className="product-visual"><img src={activeProduct.image} alt={`${activeProduct.name} product layer`} /><div className="image-corner">{activeProduct.name} / SPECTRA</div></div><div className="product-info"><p className="eyebrow">{activeProduct.type}</p><h3>{activeProduct.name}</h3><p className="body-copy">{activeProduct.description}</p><div className="spec-list">{activeProduct.stats.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><button className="outline-button">View technical specs <ArrowUpRight size={17} /></button></div></div></div></section>

      <section className="statement-section"><div className="statement-rule" /><Reveal><p>WE DON&apos;T BUILD SYSTEMS<br />FOR A SINGLE DOMAIN.</p><h2>We build<br /><em>for what&apos;s next.</em></h2></Reveal><div className="statement-foot"><span>SCROLL / 05</span><span>THE SPECTRA WAY</span></div></section>

      <section id="napoleon" className="command-section"><div className="section-kicker"><span>05</span><span>NAPOLEON</span></div><div className="command-layout"><div className="command-copy"><Reveal><p className="eyebrow">MACHINE INTELLIGENCE LAYER</p><h2>Signals in.<br /><em>Intelligence out.</em></h2><p className="body-copy">Napoleon is Spectra&apos;s machine-learning layer. It turns raw signals — sensor, environmental, operational — into models that reason, learn and coordinate across the system.</p><button className="outline-button">Explore Napoleon <ArrowUpRight size={17} /></button></Reveal></div><div className="command-visual"><img src="/images/spectra-command.png" alt="Napoleon intelligence layer" /><div className="command-overlay"><span>NAPOLEON / INFERENCE</span><strong>MODEL // RUNNING</strong><span>LATENCY 00:00:04</span></div><div className="command-marker marker-a"><i />TRACK / 0041</div><div className="command-marker marker-b"><i />SIGNAL / CLASSIFIED</div></div></div></section>

      <section id="company-team" className="team-section"><div className="section-kicker"><span>06</span><span>THE PEOPLE</span></div><div className="team-grid"><div><Reveal><p className="eyebrow">BUILT DIFFERENT</p><h2>Small team.<br /><em>Big horizon.</em></h2><p className="body-copy">Engineers, operators, and builders working on the hard problems of intelligent infrastructure — infrastructure that has to work.</p><button className="text-button">Meet the team <ArrowUpRight size={17} /></button></Reveal></div><img src="/images/spectra-team.png" alt="Spectra team in an operations room" /></div></section>

      <section className="press-section"><div className="section-kicker"><span>07</span><span>NEWS &amp; ARTICLES</span></div><div className="press-grid">{newsItems.slice(0, pressExpanded ? 3 : 2).map(([source, title, date]) => <article key={source}><p className="eyebrow">{source}</p><h3>{title}</h3><div><span>{date}</span><ArrowUpRight size={17} /></div></article>)}</div><button className="outline-button center-button" onClick={() => setPressExpanded(!pressExpanded)}>{pressExpanded ? 'Show less' : 'View all articles'} <Plus size={17} /></button></section>

      <section className="careers-section"><img src="/images/spectra-careers.png" alt="Engineer on a maritime test pier" /><div className="careers-overlay" /><div className="careers-content"><p className="eyebrow">CAREERS</p><h2>Work on<br /><em>what&apos;s next.</em></h2><button className="outline-button" onClick={() => scrollTo('contact')}>See open roles <ArrowUpRight size={17} /></button></div></section>

      <section id="contact" className="contact-section"><div className="section-kicker"><span>08</span><span>WORK WITH US</span></div><Reveal><h2>Let&apos;s talk about<br /><em>the mission.</em></h2></Reveal><div className="contact-bottom"><p>Tell us what you&apos;re trying to see, understand or protect. We&apos;ll show you what&apos;s possible.</p><button className="solid-button">Start a conversation <ArrowUpRight size={17} /></button></div></section>

      <footer>
        <div className="footer-top"><span className="wordmark">SPECTRA<span>.</span></span><span className="footer-tagline">BUILT FOR THE UNSEEN</span><span className="odometer"><strong>{String(miles).padStart(2, '0')}</strong><small>MI / SCROLLED</small></span></div>
        <div className="footer-links"><div><span>EXPLORE</span><button onClick={() => scrollTo('architecture')}>Architecture</button><button onClick={() => scrollTo('capabilities')}>BastionOS</button><button onClick={() => scrollTo('napoleon')}>Napoleon</button></div><div><span>CONNECT</span><button>LinkedIn</button><button>Instagram</button><button>Press</button></div><div><span>OFFICE</span><p>Long Beach, CA<br />33° 46′ N / 118° 11′ W</p></div></div>
        <div className="footer-newsletter"><span>BRIEFINGS / MONTHLY</span>{newsletterForm}</div>
        <div className="footer-bottom"><span>© 2026 SPECTRA SYSTEMS, INC.</span><span>PRIVACY / TERMS</span><span>NO DECISION LEFT BEHIND</span></div>
      </footer>
    </main>
  )
}
