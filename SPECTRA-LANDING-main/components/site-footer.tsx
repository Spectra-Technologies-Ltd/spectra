'use client'

import Link from 'next/link'
import Image from 'next/image'
import { NewsletterForm } from './newsletter-form'

/** Optional social profiles — configured at build time, hidden when unset. */
const SOCIALS = [
  { label: 'LinkedIn', href: process.env.NEXT_PUBLIC_LINKEDIN_URL },
  { label: 'X', href: process.env.NEXT_PUBLIC_X_URL },
  { label: 'Instagram', href: process.env.NEXT_PUBLIC_INSTAGRAM_URL },
].filter((social): social is { label: string; href: string } => Boolean(social.href))

export default function SiteFooter({ light = false }: { light?: boolean }) {
  return (
    <footer className={light ? 'footer-light' : ''}>
      <div className="footer-top">
        <Link className="wordmark" href="/" aria-label="Spectra home">
          <Image className="brand-logo" src="/spectra-logo-mark-white.png" alt="Spectra" width={104} height={44} />
        </Link>
      </div>
      <div className="footer-links">
        <div>
          <span>EXPLORE</span>
          <Link href="/bastionos">BastionOS</Link>
          <Link href="/napoleon">Napoleon</Link>
          <Link href="/workspace">Spectra Workplace</Link>
          <Link href="/journal">The Spectra Journal</Link>
        </div>
        <div>
          <span>CONNECT</span>
          <Link href="/contact">Contact</Link>
          {SOCIALS.map((social) => (
            <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer">
              {social.label}
            </a>
          ))}
        </div>
        <div>
          <span>COMPANY</span>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
        </div>
        <div>
          <span>MEDIA</span>
          <Link href="/newsroom">News</Link>
          <Link href="/research">Research &amp; Insights</Link>
          <Link href="/journal">The Journal</Link>
        </div>
      </div>
      <div className="footer-newsletter"><span>NEWSLETTER / MONTHLY</span><NewsletterForm /></div>
      <div className="footer-bottom">
        <span>© 2026 SPECTRA TECHNOLOGIES</span>
        <span className="footer-legal">
          <Link href="/privacy">Privacy</Link>
          <span aria-hidden="true">/</span>
          <Link href="/terms">Terms</Link>
        </span>
      </div>
    </footer>
  )
}
