'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowUpRight, ChevronDown, Menu, X } from 'lucide-react'
import { NewsletterForm } from './newsletter-form'

/* Product entries are direct links — tapping them goes straight to the page. */
const NAV_LINKS = [
  { label: 'BastionOS', href: '/bastionos' },
  { label: 'Napoleon', href: '/napoleon' },
] as const

const NAV_NEWS = {
  label: 'Newsroom',
  eyebrow: 'Newsroom / The Journal',
  links: [
    ['Latest News', '/newsroom'],
    ['The Spectra Journal', '/journal'],
    ['Research & Insights', '/research'],
  ],
  featured: [
    {
      source: 'SPECTRA JOURNAL',
      title: 'BastionOS: the operating foundation for intelligent systems.',
      tag: 'Read Here',
      href: '/journal/why-we-built-an-operating-system-for-security-operations',
    },
    {
      source: 'TECHNICAL BRIEF',
      title: 'Napoleon: machine intelligence from signal to action.',
      tag: 'Read Here',
      href: '/research/napoleon-machine-intelligence-from-signal-to-action',
    },
  ],
} as const

export function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

export default function SiteHeader({ light = false }: { light?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openNav, setOpenNav] = useState<string | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const navRef = useRef<HTMLElement>(null)
  const menuTriggerRef = useRef<HTMLButtonElement>(null)
  const menuCloseRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenNav(null)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpenNav(null)
      setMenuOpen(false)
    }
    // Settle the scroll when the URL hash points at a homepage section — both on
    // first load and after a cross-page anchor navigation.
    const settleHash = () => {
      const id = window.location.hash.replace('#', '')
      if (id) setTimeout(() => scrollToSection(id), 80)
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('hashchange', settleHash)
    settleHash()
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('hashchange', settleHash)
    }
  }, [])

  // While the full-screen menu is open: lock background scroll, move focus into
  // the panel, and hand focus back to the trigger when it closes.
  useEffect(() => {
    if (!menuOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    menuCloseRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [menuOpen])

  const closeNav = () => setOpenNav(null)

  const closeMenu = () => {
    setMenuOpen(false)
    menuTriggerRef.current?.focus()
  }

  const handleMegaLink = (e: React.MouseEvent, target: string) => {
    const [path, hash] = target.split('#')
    if (hash && (path === '' || path === '/' || path === pathname)) {
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
    if (hash && (path === '' || path === '/' || path === pathname)) {
      scrollToSection(hash)
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
        <Link className="wordmark" href="/" onClick={goTop} aria-label="Spectra home">
          <Image className="brand-logo" src="/spectra-logo-mark-white.png" alt="Spectra" width={104} height={44} priority />
        </Link>
        {/* Brand strip: home page only. On sub-pages it clashes with the page's
            own kicker, and on phones there is no room for a line this long. */}
        {pathname === '/' && (
          <div className="header-center">INTELLIGENT INFRASTRUCTURE / MACHINE INTELLIGENCE</div>
        )}

        {/* Desktop nav — products are direct links, no dropdowns */}
        <nav ref={navRef} className="site-nav" aria-label="Primary">
          <Link className="site-nav-trigger" href="/about">About Spectra</Link>
          {NAV_LINKS.map((item) => (
            <Link key={item.label} className="site-nav-trigger" href={item.href}>
              {item.label}
            </Link>
          ))}

          <div className={`site-nav-item ${openNav === NAV_NEWS.label ? 'is-open' : ''}`}>
            <button
              className="site-nav-trigger"
              aria-haspopup="true"
              aria-expanded={openNav === NAV_NEWS.label}
              onClick={() => setOpenNav(openNav === NAV_NEWS.label ? null : NAV_NEWS.label)}
            >
              {NAV_NEWS.label} <ChevronDown size={12} aria-hidden="true" />
            </button>
            <div className="mega-panel">
              <div className="mega-inner mega-inner-news">
                <div className="mega-news-col">
                  <span className="mega-eyebrow">{NAV_NEWS.eyebrow}</span>
                  <div className="mega-links">
                    {NAV_NEWS.links.map(([label, target]) => (
                      <a key={label} className="mega-link" href={target} onClick={(e) => handleMegaLink(e, target)}>
                        {label} <ArrowUpRight size={15} aria-hidden="true" />
                      </a>
                    ))}
                  </div>
                  <div className="mega-newsletter">
                    <span className="mega-eyebrow">Sign up for the newsletter</span>
                    <NewsletterForm />
                  </div>
                </div>
                <div className="mega-news-cards">
                  {NAV_NEWS.featured.map((item) => (
                    <button key={item.title} className="news-card" onClick={() => go(item.href)}>
                      <span className="news-card-source">{item.source}</span>
                      <span className="news-card-title">{item.title}</span>
                      <span className="news-card-tag">{item.tag} <ArrowUpRight size={13} aria-hidden="true" /></span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </nav>

        <div className="header-actions">
          <Link className="header-cta" href="/contact" onClick={closeNav}>Contact Us <ArrowUpRight size={14} aria-hidden="true" /></Link>
          <button
            ref={menuTriggerRef}
            className="menu-trigger"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <Menu size={18} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Mobile full-screen menu */}
      <div
        id="site-menu"
        className={`menu-panel ${menuOpen ? 'menu-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        inert={!menuOpen}
      >
        <div className="menu-panel-top">
          <Link className="menu-panel-brand" href="/" onClick={closeMenu} aria-label="Spectra home">
            <Image className="brand-logo" src="/spectra-logo-mark-white.png" alt="Spectra" width={104} height={44} />
          </Link>
          <button ref={menuCloseRef} onClick={closeMenu} aria-label="Close menu">
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <nav className="menu-links" aria-label="Mobile">
          <div className="menu-group">
            <span className="menu-group-title">Company</span>
            <div className="menu-product-links">
              <button onClick={() => go('/about')}>About Spectra <ArrowUpRight size={15} aria-hidden="true" /></button>
            </div>
          </div>
          <div className="menu-group">
            <span className="menu-group-title">Products</span>
            <div className="menu-product">
              <span className="menu-product-name">BastionOS</span>
              <span className="menu-product-desc">The Operating Foundation</span>
              <div className="menu-product-links">
                <button onClick={() => go('/bastionos')}>Explore BastionOS <ArrowUpRight size={15} aria-hidden="true" /></button>
              </div>
            </div>
            <div className="menu-product">
              <span className="menu-product-name">Napoleon</span>
              <span className="menu-product-desc">The Intelligence Layer</span>
              <div className="menu-product-links">
                <button onClick={() => go('/napoleon')}>Explore Napoleon <ArrowUpRight size={15} aria-hidden="true" /></button>
              </div>
            </div>
          </div>
          <div className="menu-group">
            <span className="menu-group-title">Newsroom</span>
            <div className="menu-product-links">
              <button onClick={() => go('/newsroom')}>Latest News <ArrowUpRight size={15} aria-hidden="true" /></button>
              <button onClick={() => go('/journal')}>The Spectra Journal <ArrowUpRight size={15} aria-hidden="true" /></button>
              <button onClick={() => go('/research')}>Research &amp; Insights <ArrowUpRight size={15} aria-hidden="true" /></button>
            </div>
          </div>
          <div className="menu-group">
            <span className="menu-group-title">Contact</span>
            <div className="menu-product-links">
              <button onClick={() => go('/contact')}>Contact Us <ArrowUpRight size={15} aria-hidden="true" /></button>
            </div>
          </div>
        </nav>
        <div className="menu-newsletter">
          <span className="menu-group-title">Sign up for the newsletter</span>
          <NewsletterForm />
        </div>
        <div className="menu-foot"><span>© SPECTRA 2026</span></div>
      </div>
    </>
  )
}
