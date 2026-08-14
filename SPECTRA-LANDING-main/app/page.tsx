'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Crosshair, Menu, MoveRight, Play, Plus, Radar, Scan, X } from 'lucide-react'

const products = [
  { name: 'SKYFIN', type: 'AERIAL / VTOL', image: '/images/spectra-drone-fleet.png', description: 'A persistent aerial scout for mapping, inspection and perimeter awareness across complex terrain.', stats: [['Range', '120 km'], ['Endurance', '18 hr'], ['Payload', '18 kg'], ['Launch', 'VTOL']] },
  { name: 'SEAFIN', type: 'MARITIME / USV', image: '/images/spectra-product.png', description: 'A modular surface vehicle that turns coastlines, ports and offshore infrastructure into observable territory.', stats: [['Range', '900 nm'], ['Endurance', '30 days'], ['Payload', '450 kg'], ['Top speed', '18 kn']] },
  { name: 'COMMAND NODE', type: 'SOFTWARE / MISSION OS', image: '/images/spectra-command.png', description: 'The operating layer for every asset, operator and signal — one live picture from first tasking to final decision.', stats: [['Assets', '1,000+'], ['Latency', '< 90 sec'], ['Users', 'Multi-domain'], ['Uptime', '99.99%']] },
]

const capabilities = [
  { label: '01 / DEPLOY', title: 'Put autonomy where the mission is.', copy: 'Launch from a ship, road, airfield or remote edge. Spectra systems get to work without a crew onboard or a new operating base.', image: '/images/spectra-operator.png', stat: '18 hr', statLabel: 'aerial persistence' },
  { label: '02 / UNDERSTAND', title: 'Turn every signal into context.', copy: 'Our mission software fuses video, radar, AIS, acoustic and environmental data into one shared operational picture.', image: '/images/spectra-command.png', stat: '1 view', statLabel: 'for every domain' },
  { label: '03 / ACT', title: 'Move at the speed of information.', copy: 'Retask assets, coordinate fleets and close the loop from detection to decision in seconds — with a human in control.', image: '/images/spectra-infrastructure.png', stat: '< 90s', statLabel: 'tasking latency' },
]

const missions = [
  { category: 'SECURITY', title: 'A persistent line of sight across the perimeter.', location: 'NORTH ATLANTIC / 2026', image: '/images/spectra-drone-hero.png', number: '01' },
  { category: 'INFRASTRUCTURE', title: 'Inspecting the systems that keep the world moving.', location: 'NORTH SEA / 2025', image: '/images/spectra-infrastructure.png', number: '02' },
  { category: 'LOGISTICS', title: 'Making remote operations visible and responsive.', location: 'PACIFIC / 2025', image: '/images/spectra-operator.png', number: '03' },
]

function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`reveal ${className}`}>{children}</div>
}

export default function Page() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [capability, setCapability] = useState(0)
  const [product, setProduct] = useState(1)
  const [missionFilter, setMissionFilter] = useState('ALL')
  const [missionIndex, setMissionIndex] = useState(0)
  const [xray, setXray] = useState(false)
  const [pressExpanded, setPressExpanded] = useState(false)
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

  const filteredMissions = useMemo(() => missionFilter === 'ALL' ? missions : missions.filter((mission) => mission.category === missionFilter), [missionFilter])
  const activeProduct = products[product]
  const activeCapability = capabilities[capability]

  const scrollTo = (id: string) => {
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main className="spectra-shell">
      <header className={`site-header ${menuOpen ? 'header-hidden' : ''}`}>
        <button className="wordmark" onClick={() => scrollTo('top')} aria-label="Spectra home">SPECTRA<span>.</span></button>
        <div className="header-center">AUTONOMOUS SYSTEMS / MISSION INTELLIGENCE</div>
        <button className="menu-trigger" onClick={() => setMenuOpen(true)} aria-label="Open menu"><span>MENU</span><Menu size={17} /></button>
      </header>

      <div className={`menu-panel ${menuOpen ? 'menu-open' : ''}`} aria-hidden={!menuOpen}>
        <div className="menu-panel-top"><span>SPECTRA / INDEX 00—26</span><button onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={20} /></button></div>
        <nav className="menu-links">
          {[['01', 'The platform', 'top'], ['02', 'Capabilities', 'capabilities'], ['03', 'Missions', 'missions'], ['04', 'The fleet', 'fleet'], ['05', 'Mission OS', 'mission-os'], ['06', 'Company', 'company'], ['07', 'Contact', 'contact']].map(([number, label, id]) => <button key={id} onClick={() => scrollTo(id)}><span>{number}</span><strong>{label}</strong><ArrowUpRight size={20} /></button>)}
        </nav>
        <div className="menu-foot"><span>BUILT FOR THE UNSEEN</span><span>© SPECTRA 2026</span></div>
      </div>

      <section id="top" ref={heroRef} className="hero-section">
        <img src="/images/spectra-drone-hero.png" alt="Autonomous aerial drone surveying a coastline" className="hero-image" />
        <div className="hero-overlay" />
        <div className="hero-grid" />
        <div className="hero-copy"><p className="eyebrow">MISSION INTELLIGENCE / SYSTEM 01</p><h1>See more.<br /><em>Do more.</em></h1><p className="hero-description">Spectra builds autonomous systems and mission software for the places where human reach stops — across air, sea and the critical infrastructure between.</p><button className="outline-button" onClick={() => scrollTo('capabilities')}>Explore the platform <MoveRight size={17} /></button></div>
        <div className="hero-bottom"><span>36° 12′ 44″ N / 115° 09′ 18″ W</span><span className="hero-scroll"><span className="scroll-line" /> SCROLL TO DISCOVER</span><span>LIVE / AUTONOMOUS</span></div>
      </section>

      <section className="manifesto-section" id="company"><div className="section-kicker"><span>01</span><span>THE PREMISE</span></div><Reveal><h2>The world is full of places we cannot always reach. We&apos;re building the systems that can.</h2></Reveal><div className="manifesto-meta"><span>01—03</span><p>Spectra connects autonomous hardware, human operators and mission data into one operating system for the physical world.</p><ArrowDownRight size={28} /></div></section>

      <section id="capabilities" className="capabilities-section"><div className="section-kicker"><span>02</span><span>WHAT WE DO</span></div><div className="capabilities-layout"><div className="capability-sticky"><Reveal><p className="eyebrow">ONE PLATFORM / MANY MISSIONS</p><h2>From signal<br /><em>to action.</em></h2><p className="body-copy">Every Spectra system is part of a larger network — a platform that learns, adapts and compounds with every mile.</p></Reveal><div className="capability-tabs">{capabilities.map((item, index) => <button className={capability === index ? 'active' : ''} key={item.label} onClick={() => setCapability(index)}><span>{item.label}</span><span className="tab-bar" /></button>)}</div></div><div className="capability-stage"><div className="capability-image-wrap"><img src={activeCapability.image} alt={activeCapability.title} className="capability-image" key={activeCapability.image} /><div className="image-corner">SPECTRA / FIELD NOTE 0{capability + 1}</div></div><div className="capability-detail"><div><p className="eyebrow">{activeCapability.label}</p><h3>{activeCapability.title}</h3><p className="body-copy">{activeCapability.copy}</p></div><div className="cap-stat"><strong>{activeCapability.stat}</strong><span>{activeCapability.statLabel}</span></div></div></div></div></section>

      <section id="missions" className="missions-section"><div className="section-kicker"><span>03</span><span>IN THE FIELD</span></div><div className="section-heading-row"><Reveal><h2>Real missions.<br /><em>Real stakes.</em></h2></Reveal><div className="filter-list">{['ALL', 'SECURITY', 'INFRASTRUCTURE', 'LOGISTICS'].map((filter) => <button className={missionFilter === filter ? 'active' : ''} key={filter} onClick={() => { setMissionFilter(filter); setMissionIndex(0) }}>{filter}</button>)}</div></div><div className="mission-card"><img src={filteredMissions[missionIndex % filteredMissions.length].image} alt={filteredMissions[missionIndex % filteredMissions.length].title} /><div className="mission-shade" /><div className="mission-number">{filteredMissions[missionIndex % filteredMissions.length].number}</div><div className="mission-content"><p className="eyebrow">{filteredMissions[missionIndex % filteredMissions.length].category} / {filteredMissions[missionIndex % filteredMissions.length].location}</p><h3>{filteredMissions[missionIndex % filteredMissions.length].title}</h3><button className="text-button">Read the mission brief <ArrowUpRight size={17} /></button></div><div className="carousel-controls"><button onClick={() => setMissionIndex((index) => (index - 1 + filteredMissions.length) % filteredMissions.length)} aria-label="Previous mission"><ChevronLeft /></button><button onClick={() => setMissionIndex((index) => (index + 1) % filteredMissions.length)} aria-label="Next mission"><ChevronRight /></button></div></div></section>

      <section id="fleet" className="fleet-section"><div className="section-kicker"><span>04</span><span>THE FLEET</span></div><div className="fleet-intro"><Reveal><h2>One system.<br /><em>Every domain.</em></h2></Reveal><p className="body-copy">A family of autonomous systems, designed to work alone or together. Select a platform to explore the architecture.</p></div><div className="product-switcher"><div className="product-nav">{products.map((item, index) => <button key={item.name} className={product === index ? 'active' : ''} onClick={() => setProduct(index)}><span>0{index + 1}</span>{item.name}</button>)}</div><div className="product-layout"><div className={`product-visual ${xray ? 'xray' : ''}`}><img src={activeProduct.image} alt={`${activeProduct.name} autonomous vessel`} /><div className="radar-lines" /><button className="xray-toggle" onClick={() => setXray(!xray)}><Scan size={15} /> {xray ? 'SOLID VIEW' : 'X-RAY VIEW'}</button><div className="hotspot hotspot-one"><button aria-label="View propulsion hotspot"><Plus /></button><span>PROPULSION / 02</span></div><div className="hotspot hotspot-two"><button aria-label="View sensor hotspot"><Plus /></button><span>SENSOR ARRAY / 04</span></div></div><div className="product-info"><p className="eyebrow">{activeProduct.type}</p><h3>{activeProduct.name}<sup>™</sup></h3><p className="body-copy">{activeProduct.description}</p><div className="spec-list">{activeProduct.stats.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><button className="outline-button">View technical specs <ArrowUpRight size={17} /></button></div></div></div></section>

      <section className="statement-section"><div className="statement-rule" /><Reveal><p>WE DON&apos;T BUILD SYSTEMS<br />FOR A SINGLE DOMAIN.</p><h2>We build<br /><em>for what&apos;s next.</em></h2></Reveal><div className="statement-foot"><span>SCROLL / 05</span><span>THE SPECTRA WAY</span></div></section>

      <section id="mission-os" className="command-section"><div className="section-kicker"><span>05</span><span>MISSION OS</span></div><div className="command-layout"><div className="command-copy"><Reveal><p className="eyebrow">A SINGLE OPERATIONAL PICTURE</p><h2>Every asset.<br /><em>One view.</em></h2><p className="body-copy">Spectra Mission OS turns distributed sensors and autonomous systems into a shared layer of context. Operators see what changed, why it matters and what to do next.</p><button className="outline-button">Explore Mission OS <ArrowUpRight size={17} /></button></Reveal></div><div className="command-visual"><img src="/images/spectra-command.png" alt="Operators coordinating autonomous missions" /><div className="command-overlay"><span>LIVE MISSION / 04</span><strong>12 ASSETS ONLINE</strong><span>SYNC 00:00:04</span></div><div className="command-marker marker-a"><i />TRACK / 0041</div><div className="command-marker marker-b"><i />ALERT / LOW BAND</div></div></div></section>

      <section id="company-team" className="team-section"><div className="section-kicker"><span>06</span><span>THE PEOPLE</span></div><div className="team-grid"><div><Reveal><p className="eyebrow">BUILT DIFFERENT</p><h2>Small team.<br /><em>Big horizon.</em></h2><p className="body-copy">We are engineers, operators, oceanographers and builders who believe the hardest problems are worth solving.</p><button className="text-button">Meet the team <ArrowUpRight size={17} /></button></Reveal></div><img src="/images/spectra-team.png" alt="Spectra team in an operations room" /></div></section>

      <section className="press-section"><div className="section-kicker"><span>07</span><span>IN THE CURRENT</span></div><div className="press-grid">{[['DEFENSE ONE', 'The autonomy stack bringing a live picture to the edge.', '08.14.26'], ['FAST COMPANY', 'The industrial frontier is becoming software-defined.', '05.02.26'], ['WIRED', 'A new generation of machines is learning the physical world.', '11.21.25']].slice(0, pressExpanded ? 3 : 2).map(([source, title, date]) => <article key={source}><p className="eyebrow">{source}</p><h3>{title}</h3><div><span>{date}</span><ArrowUpRight size={17} /></div></article>)}</div><button className="outline-button center-button" onClick={() => setPressExpanded(!pressExpanded)}>{pressExpanded ? 'Show less' : 'View all dispatches'} <Plus size={17} /></button></section>

      <section className="careers-section"><img src="/images/spectra-careers.png" alt="Engineer on a maritime test pier" /><div className="careers-overlay" /><div className="careers-content"><p className="eyebrow">JOIN THE CREW</p><h2>The next horizon<br /><em>starts here.</em></h2><button className="outline-button" onClick={() => scrollTo('contact')}>See open roles <ArrowUpRight size={17} /></button></div></section>

      <section id="contact" className="contact-section"><div className="section-kicker"><span>07</span><span>MAKE CONTACT</span></div><Reveal><h2>Let&apos;s talk about<br /><em>the mission.</em></h2></Reveal><div className="contact-bottom"><p>Tell us what you&apos;re trying to see, understand or protect. We&apos;ll show you what&apos;s possible.</p><button className="solid-button">Start a conversation <ArrowUpRight size={17} /></button></div></section>

      <footer><div className="footer-top"><span className="wordmark">SPECTRA<span>.</span></span><span className="footer-tagline">BUILT FOR THE UNSEEN</span><span className="odometer"><strong>{String(miles).padStart(2, '0')}</strong><small>MI / SCROLLED</small></span></div><div className="footer-links"><div><span>EXPLORE</span><button onClick={() => scrollTo('capabilities')}>Platform</button><button onClick={() => scrollTo('missions')}>Missions</button><button onClick={() => scrollTo('fleet')}>Fleet</button></div><div><span>CONNECT</span><button>LinkedIn</button><button>Instagram</button><button>Press</button></div><div><span>OFFICE</span><p>Long Beach, CA<br />33° 46′ N / 118° 11′ W</p></div></div><div className="footer-bottom"><span>© 2026 SPECTRA SYSTEMS, INC.</span><span>PRIVACY / TERMS</span><span>NO DECISION LEFT BEHIND</span></div></footer>
    </main>
  )
}
