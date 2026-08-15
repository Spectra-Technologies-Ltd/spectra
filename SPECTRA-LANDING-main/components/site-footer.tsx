'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { NewsletterForm } from './newsletter-form'
import { scrollToSection } from './site-header'

export default function SiteFooter({ light = false }: { light?: boolean }) {
  const [miles, setMiles] = useState(0)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const onScroll = () => setMiles(Math.round(window.scrollY / 1000))
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const go = (target: string) => {
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

  return (
    <footer className={light ? 'footer-light' : ''}>
      <div className="footer-top"><span className="wordmark">SPECTRA<span>.</span></span><span className="footer-tagline">BUILT FOR THE UNSEEN</span><span className="odometer"><strong>{String(miles).padStart(2, '0')}</strong><small>MI / SCROLLED</small></span></div>
      <div className="footer-links">
        <div><span>EXPLORE</span><button onClick={() => go('/bastionos')}>BastionOS</button><button onClick={() => go('/napoleon')}>Napoleon</button><button onClick={() => go('/newsroom')}>News Room</button></div>
        <div><span>CONNECT</span><button onClick={() => go('https://www.linkedin.com')}>LinkedIn</button><button onClick={() => go('https://www.instagram.com')}>Instagram</button><button onClick={() => go('/newsroom')}>News Room</button></div>
        <div><span>OFFICE</span><p>Long Beach, CA<br />33° 46′ N / 118° 11′ W</p></div>
      </div>
      <div className="footer-newsletter"><span>BRIEFINGS / MONTHLY</span><NewsletterForm /></div>
      <div className="footer-bottom"><span>© 2026 SPECTRA SYSTEMS, INC.</span><span>PRIVACY / TERMS</span><span>NO DECISION LEFT BEHIND</span></div>
    </footer>
  )
}
