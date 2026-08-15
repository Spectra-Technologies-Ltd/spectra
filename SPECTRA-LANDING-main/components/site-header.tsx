'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowUpRight, ChevronDown, Menu, X } from 'lucide-react'
import { NewsletterForm } from './newsletter-form'

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://spectra-lime.vercel.app'

/* ── Desktop mega-menu (Palantir-style full-width bar) ── */
const NAV_GROUPS = [
  {
    label: 'BastionOS',
    eyebrow: 'The Operating Foundation',
    items: [['Overview', '/bastionos']],
  },
  {
    label: 'Napoleon',
    eyebrow: 'The Intelligence Layer',
    items: [['Overview', '/napoleon']],
  },
  {
    label: 'Work With Us',
    eyebrow: '',
    items: [
      ['Contact Us', '/contact'],
      ['About Spectra', '/about'],
      ['Partners', '/partners'],
      ['News Room', '/newsroom'],
    ],
  },
  {
    label: 'Workspace',
    eyebrow: '',
    items: [
      ['Open Workspace', `${APP_URL}/login`],
      ['Sign In', `${APP_URL}/login`],
      ['Create Account', `${APP_URL}/register`],
    ],
  },
] as const

/* ── Mobile full-screen menu ── */
const WORK_GROUP = [
  ['01', 'Contact Us', '/contact'],
  ['02', 'About Spectra', '/about'],
  ['03', 'Partners', '/partners'],
  ['04', 'News Room', '/newsroom'],
] as const

const WORKSPACE_GROUP = [
  ['01', 'Open Workspace', `${APP_URL}/login`],
  ['02', 'Sign In', `${APP_URL}/login`],
  ['03', 'Create Account', `${APP_URL}/register`],
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

export default function SiteHeader() {
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
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', esc)
    }
  }, [])

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
      <header className={`site-header ${menuOpen ? 'header-hidden' : ''}`}>
        <Link className="wordmark" href="/" onClick={goTop} aria-label="Spectra home">SPECTRA<span>.</span></Link>

        {/* Desktop mega-menu nav */}
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
                  {group.eyebrow && <span className="mega-eyebrow">{group.eyebrow}</span>}
                  <div className="mega-columns">
                    {group.items.map(([label, target]) => (
                      <button key={label} className="mega-link" onClick={() => go(target)}>
                        {label} <ArrowUpRight size={15} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </nav>

        <div className="header-actions">
          <Link className="header-cta" href="/contact">Contact Us <ArrowUpRight size={14} /></Link>
          <button className="menu-trigger" onClick={() => setMenuOpen(true)} aria-label="Open menu"><span>MENU</span><Menu size={17} /></button>
        </div>
      </header>

      {/* Mobile full-screen menu */}
      <div className={`menu-panel ${menuOpen ? 'menu-open' : ''}`} aria-hidden={!menuOpen}>
        <div className="menu-panel-top"><span>SPECTRA TECHNOLOGIES / INDEX</span><button onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={20} /></button></div>
        <nav className="menu-links">
          <div className="menu-group">
            <span className="menu-group-title">BastionOS — Operating Foundation</span>
            <button onClick={() => go('/bastionos')}><span>01</span><strong>Overview</strong><ArrowUpRight size={20} /></button>
          </div>
          <div className="menu-group">
            <span className="menu-group-title">Napoleon — Intelligence Layer</span>
            <button onClick={() => go('/napoleon')}><span>01</span><strong>Overview</strong><ArrowUpRight size={20} /></button>
          </div>
          <div className="menu-group">
            <span className="menu-group-title">Work With Us</span>
            {WORK_GROUP.map(([number, label, target]) => <button key={label} onClick={() => go(target)}><span>{number}</span><strong>{label}</strong><ArrowUpRight size={20} /></button>)}
          </div>
          <div className="menu-group">
            <span className="menu-group-title">Spectra Workspace</span>
            {WORKSPACE_GROUP.map(([number, label, target]) => <button key={label} onClick={() => go(target)}><span>{number}</span><strong>{label}</strong><ArrowUpRight size={20} /></button>)}
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
