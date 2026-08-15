'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import { NewsletterForm } from './newsletter-form'

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://spectra-lime.vercel.app'

const BASTION_GROUP = [
  ['01', 'Overview', '/#capabilities'],
  ['02', 'Architecture', '/#architecture'],
  ['03', 'Capabilities', '/#capabilities'],
  ['04', 'Applications', '/#fleet'],
  ['05', 'Explore BastionOS', '/bastionos'],
] as const

const NAPOLEON_GROUP = [
  ['01', 'Overview', '/#napoleon'],
  ['02', 'Intelligence capabilities', '/#napoleon'],
  ['03', 'Architecture', '/#architecture'],
  ['04', 'Applications', '/#fleet'],
  ['05', 'Explore Napoleon', '/napoleon'],
] as const

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
  const pathname = usePathname()
  const router = useRouter()

  const go = (target: string) => {
    setMenuOpen(false)
    if (target.startsWith('/#')) {
      const id = target.slice(2)
      if (pathname === '/') {
        scrollToSection(id)
      } else {
        router.push('/')
        setTimeout(() => scrollToSection(id), 450)
      }
      return
    }
    if (target.startsWith('http')) {
      window.open(target, '_blank', 'noopener,noreferrer')
      return
    }
    router.push(target)
  }

  const goTop = () => {
    setMenuOpen(false)
    if (pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      router.push('/')
    }
  }

  return (
    <>
      <header className={`site-header ${menuOpen ? 'header-hidden' : ''}`}>
        <button className="wordmark" onClick={goTop} aria-label="Spectra home">SPECTRA<span>.</span></button>
        <div className="header-center">INTELLIGENT INFRASTRUCTURE / MACHINE INTELLIGENCE</div>
        <button className="menu-trigger" onClick={() => setMenuOpen(true)} aria-label="Open menu"><span>MENU</span><Menu size={17} /></button>
      </header>

      <div className={`menu-panel ${menuOpen ? 'menu-open' : ''}`} aria-hidden={!menuOpen}>
        <div className="menu-panel-top"><span>SPECTRA TECHNOLOGIES / INDEX</span><button onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={20} /></button></div>
        <nav className="menu-links">
          <div className="menu-group">
            <span className="menu-group-title">BastionOS — Operating Foundation</span>
            {BASTION_GROUP.map(([number, label, target]) => <button key={label} onClick={() => go(target)}><span>{number}</span><strong>{label}</strong><ArrowUpRight size={20} /></button>)}
          </div>
          <div className="menu-group">
            <span className="menu-group-title">Napoleon — Intelligence Layer</span>
            {NAPOLEON_GROUP.map(([number, label, target]) => <button key={label} onClick={() => go(target)}><span>{number}</span><strong>{label}</strong><ArrowUpRight size={20} /></button>)}
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
