'use client'

import { usePathname, useRouter } from 'next/navigation'
import { NewsletterForm } from './newsletter-form'
import { scrollToSection } from './site-header'

export default function SiteFooter({ light = false }: { light?: boolean }) {
  const pathname = usePathname()
  const router = useRouter()

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
      <div className="footer-top"><span className="wordmark">SPECTRA<span>.</span></span></div>
      <div className="footer-links">
        <div><span>EXPLORE</span><button onClick={() => go('/bastionos')}>BastionOS</button><button onClick={() => go('/napoleon')}>Napoleon</button><button onClick={() => go('/journal')}>The Spectra Journal</button></div>
        <div><span>CONNECT</span><button onClick={() => go('https://www.linkedin.com')}>LinkedIn</button><button onClick={() => go('https://www.instagram.com')}>Instagram</button><button onClick={() => go('/contact')}>Contact</button></div>
        <div><span>COMPANY</span><button onClick={() => go('/partners')}>Partners</button><button onClick={() => go('/contact')}>Work with us</button></div>
        <div><span>MEDIA</span><button onClick={() => go('/newsroom')}>News</button><button onClick={() => go('/research')}>Research &amp; Insights</button><button onClick={() => go('/journal')}>The Journal</button></div>
      </div>
      <div className="footer-newsletter"><span>NEWSLETTER / MONTHLY</span><NewsletterForm /></div>
      <div className="footer-bottom"><span>© 2026 SPECTRA TECHNOLOGIES</span><span>PRIVACY / TERMS</span></div>
    </footer>
  )
}
