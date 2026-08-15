'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowUpRight, ChevronDown, Menu, X } from 'lucide-react'
import { NewsletterForm } from './newsletter-form'

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://spectra-lime.vercel.app'

/* ── Desktop inline nav (Palantir-style dropdowns) ── */
const NAV_GROUPS = [
  {
    label: 'BastionOS',
    eyebrow: 'The Operating Foundation',
    description: '',
    links: [['Overview', '/#fleet-bastion']],
    footer: ['Explore BastionOS', '/bastionos'],
  },
  {
    label: 'Napoleon',
    eyebrow: 'The Intelligence Layer',
    description: '',
    links: [['Overview', '/#fleet-napoleon']],
    footer: ['Explore Napoleon', '/napoleon'],
  },
  {
    label: 'Workspace',
    eyebrow: 'Workspace',
    description: 'Workspace access is coming soon.',
    links: [],
    footer: ['', ''],
  },
  {
    label: 'Work With Us',
    eyebrow: '',
    description: 'Partnerships, enterprise, government and press — direct access to the Spectra team.',
    links: [
      ['Contact Us', '/contact'],
      ['About Spectra', '/about'],
      ['Partners', '/partners'],
      ['News Room', '/newsroom'],
    ],
    footer: ['Start a conversation', '/contact'],
  },
] as const

const NAV_NEWS = {
  label: 'Newsroom',
  eyebrow: 'Newsroom / The Journal',
  links: [
    ['Latest News', '/newsroom'],
    ['About Spectra', '/about'],
    ['News Room', '/newsroom'],
  ],
  featured: [
    {
      source: 'SPECTRA JOURNAL',
      title: 'BastionOS: the operating foundation for intelligent systems.',
      tag: 'Read Here',
      href: '/bastionos',
    },
    {
      source: 'TECHNICAL BRIEF',
      title: 'Napoleon: machine intelligence from signal to action.',
      tag: 'Read Here',
      href: '/napoleon',
    },
  ],
} as const

/* ── Mobile full-screen menu ── */
const WORK_GROUP = [
  ['01', 'Contact Us', '/contact'],
  ['02', 'About Spectra', '/about'],
  ['03', 'Partners', '/partners'],
  ['04', 'News Room', '/newsroom'],
] as const

const MORE_LINKS = [
  ['Home', '/'],
  ['BastionOS', '/bastionos'],
  ['Napoleon', '/napoleon'],
  ['Workspace', `${APP_URL}/login`],
  ['Work with us', '/contact'],
  ['Contact', '/contact'],
] as const

export function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

export default function SiteHeader({ light = false }: { light?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openNav, setOpenNav] = useState<string | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenNav(null)
    }
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenNav(null)
    }
    // Fallback: when the URL hash points at a homepage section (e.g. after a
    // cross-page anchor navigation), settle the scroll once the page paints.
    const onHashChange = () => {
      const id = window.location.hash.replace('#', '')
      if (id) setTimeout(() => scrollToSection(id), 80)
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', esc)
    window.addEventListener('hashchange', onHashChange)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', esc)
      window.removeEventListener('hashchange', onHashChange)
    }
  }, [])

  // Same-page anchor: smooth-scroll without a full reload; otherwise let the
  // native <a href> navigation do its thing (works even without JS).
  const handleMegaLink = (e: React.MouseEvent, target: string) => {
    const [path, hash] = target.split('#')
    const layerHash = hash === 'fleet-bastion' || hash === 'fleet-napoleon'
    if (hash && (path === '' || path === '/' || path === pathname) && !layerHash) {
      e.preventDefault()
      setOpenNav(null)
      scrollToSection(hash)
    } else {
      setOpenNav(null)
    }
  }

  const go = (target: string) => {
    setMenuOpen(false)
    setOpenNav(null)
    if (target.startsWith('http')) {
      window.open(target, '_blank', 'noopener,noreferrer')
      return
    }
    const [path, hash] = target.split('#')
    // Layer-switch hashes: set the URL hash so the homepage can select the
    // matching layer and scroll to the "Built on two layers" section.
    if (hash === 'fleet-bastion' || hash === 'fleet-napoleon') {
      if (path === '' || path === '/' || path === pathname) {
        window.location.hash = hash
      } else {
        router.push(`${path || '/'}#${hash}`)
        setTimeout(() => {
          if (window.location.hash === `#${hash}`) window.dispatchEvent(new Event('hashchange'))
        }, 600)
      }
      return
    }
    if (hash && (path === '' || path === '/' || path === pathname)) {
      scrollToSection(hash)
      return
    }
    if (hash) {
      router.push(`${path || '/'}#${hash}`)
      setTimeout(() => scrollToSection(hash), 600)
      return
    }
    router.push(path || '/')
  }

  const goTop = () => {
    setMenuOpen(false)
    if (pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <>
      <header className={`site-header ${light ? 'site-header-light' : ''} ${menuOpen ? 'header-hidden' : ''}`}>
        <Link className="wordmark" href="/" onClick={goTop} aria-label="Spectra home">SPECTRA<span>.</span></Link>
        <div className="header-center">INTELLIGENT INFRASTRUCTURE / MACHINE INTELLIGENCE</div>

        {/* Desktop inline nav */}
        <nav ref={navRef} className="site-nav" aria-label="Primary">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className={`site-nav-item ${openNav === group.label ? 'is-open' : ''}`}>
              <button
                className="site-nav-trigger"
                aria-haspopup="true"
                aria-expanded={openNav === group.label}
                onClick={() => setOpenNav(openNav === group.label ? null : group.label)}
              >
                {group.label} <ChevronDown size={12} />
              </button>
              <div className="mega-panel">
                <div className="mega-inner">
                  <span className="mega-eyebrow">{group.eyebrow}</span>
                  {group.links.length > 0 && (
                    <div className="mega-links">
                      {group.links.map(([label, target]) => (
                        <a key={label} className="mega-link" href={target} onClick={(e) => handleMegaLink(e, target)}>
                          {label} <ArrowUpRight size={15} />
                        </a>
                      ))}
                    </div>
                  )}
                  {group.description && <p className="mega-desc">{group.description}</p>}
                  {group.footer[0] && group.footer[1] && (
                    <div className="mega-footer">
                      <button onClick={() => go(group.footer[1])}>{group.footer[0]} <ArrowUpRight size={15} /></button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div key={NAV_NEWS.label} className={`site-nav-item ${openNav === NAV_NEWS.label ? 'is-open' : ''}`}>
            <button
              className="site-nav-trigger"
              aria-haspopup="true"
              aria-expanded={openNav === NAV_NEWS.label}
              onClick={() => setOpenNav(openNav === NAV_NEWS.label ? null : NAV_NEWS.label)}
            >
              {NAV_NEWS.label} <ChevronDown size={12} />
            </button>
            <div className="mega-panel">
              <div className="mega-inner mega-inner-news">
                <div className="mega-news-col">
                  <span className="mega-eyebrow">{NAV_NEWS.eyebrow}</span>
                  <div className="mega-links">
                    {NAV_NEWS.links.map(([label, target]) => (
                      <a key={label} className="mega-link" href={target} onClick={(e) => handleMegaLink(e, target)}>
                        {label} <ArrowUpRight size={15} />
                      </a>
                    ))}
                  </div>
                  <div className="mega-newsletter">
                    <span className="mega-eyebrow">Sign up for briefings</span>
                    <NewsletterForm />
                  </div>
                </div>
                <div className="mega-news-cards">
                  {NAV_NEWS.featured.map((item) => (
                    <button key={item.title} className="news-card" onClick={() => go(item.href)}>
                      <span className="news-card-source">{item.source}</span>
                      <span className="news-card-title">{item.title}</span>
                      <span className="news-card-tag">{item.tag} <ArrowUpRight size={13} /></span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </nav>

        <div className="header-actions">
          <Link className="header-cta" href="/contact">Contact Us <ArrowUpRight size={14} /></Link>
          <button className="menu-trigger" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={18} /></button>
        </div>
      </header>

      {/* Mobile full-screen menu */}
      <div className={`menu-panel ${menuOpen ? 'menu-open' : ''}`} aria-hidden={!menuOpen}>
        <div className="menu-panel-top"><span className="menu-panel-brand">SPECTRA<span>.</span></span><span className="header-center">TECHNOLOGIES / INDEX</span><button onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={20} /></button></div>
        <nav className="menu-links">
          <div className="menu-group">
            <span className="menu-group-title menu-group-title--brand">BastionOS — Operating Foundation</span>
            <button onClick={() => go('/#fleet-bastion')}><span>01</span><strong>Overview</strong><ArrowUpRight size={20} /></button>
          </div>
          <div className="menu-group">
            <span className="menu-group-title menu-group-title--brand">Napoleon — Intelligence Layer</span>
            <button onClick={() => go('/#fleet-napoleon')}><span>01</span><strong>Overview</strong><ArrowUpRight size={20} /></button>
          </div>
          <div className="menu-group">
            <span className="menu-group-title">Workspace</span>
            <button onClick={() => go(`${APP_URL}/login`)}><span>01</span><strong>Open Workspace</strong><ArrowUpRight size={20} /></button>
          </div>
          <div className="menu-group">
            <span className="menu-group-title">Work With Us</span>
            {WORK_GROUP.map(([number, label, target]) => <button key={label} onClick={() => go(target)}><span>{number}</span><strong>{label}</strong><ArrowUpRight size={20} /></button>)}
          </div>
        </nav>
        <div className="menu-more">
          <span className="menu-group-title">More</span>
          <div className="menu-more-links">
            {MORE_LINKS.map(([label, target]) => <button key={label} onClick={() => go(target)}>{label}</button>)}
          </div>
        </div>
        <div className="menu-newsletter">
          <span className="menu-group-title">Sign up for briefings</span>
          <NewsletterForm />
        </div>
        <div className="menu-foot"><span>BUILT FOR THE UNSEEN</span><span>© SPECTRA 2026</span></div>
      </div>
    </>
  )
}
