import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import SiteHeader from '@/components/site-header'
import SiteFooter from '@/components/site-footer'
import { PageHero } from '@/components/page-hero'
import { Reveal } from '@/components/reveal'

export const metadata = {
  title: 'The Spectra Journal — Spectra Technologies',
  description: 'Thoughts, research and insights from Spectra Technologies — BastionOS, Napoleon and the architecture beneath.',
}

const articles = [
  ['SPECTRA JOURNAL', 'BastionOS: the operating foundation for intelligent systems.', 'How the security operations platform unifies personnel, patrols, incidents and analytics into one real-time command center.', '08.15.26', '/bastionos'],
  ['TECHNICAL BRIEF', 'Napoleon: machine intelligence from signal to action.', 'The strategic intelligence engine — how NapoleonOS learns from fragmented data and turns it into decisions.', '07.28.26', '/napoleon'],
  ['ARCHITECTURE NOTES', 'How infrastructure, intelligence, data and applications fit together.', 'A walk through the Spectra Architecture — the integrated stack from first signal to final decision.', '06.10.26', '/#architecture'],
  ['PRODUCT UPDATE', 'The Spectra Workplace is now live.', 'Operators can now manage their entire security operation from the BastionOS command center.', '05.22.26', 'https://spectra-lime.vercel.app/login'],
] as const

export default function NewsRoomPage() {
  return (
    <main className="spectra-shell">
      <SiteHeader />

      <PageHero kicker="THE SPECTRA JOURNAL / LATEST" title="From the frontier." tag="SPECTRA / JOURNAL">
        <p>
          The Spectra Journal — thoughts, research and insights from the team. Technical briefs,
          architecture notes and field reports from BastionOS, Napoleon and the platform beneath.
        </p>
      </PageHero>

      {/* Press grid — the landing page light press-section concept */}
      <section className="press-section" style={{ paddingTop: 110 }}>
        <div className="section-kicker"><span>LATEST NEWS</span><span>RESEARCH &amp; INSIGHTS</span></div>
        <div className="press-grid">
          {articles.map(([source, title, excerpt, date, href]) => (
            <article key={title}>
              <p className="eyebrow">{source}</p>
              <h3>{title}</h3>
              <p style={{ color: '#51617b', fontSize: 13, lineHeight: 1.6, marginTop: 12 }}>{excerpt}</p>
              <div>
                <span>{date}</span>
                {href.startsWith('http') ? (
                  <a href={href} target="_blank" rel="noopener noreferrer" aria-label={title}><ArrowUpRight size={17} /></a>
                ) : (
                  <Link href={href} aria-label={title}><ArrowUpRight size={17} /></Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Statement CTA */}
      <section className="statement-section">
        <div className="statement-rule" />
        <Reveal>
          <p>PRESS &amp; MEDIA<br />INQUIRIES</p>
          <h2>Get the<br /><em>full picture.</em></h2>
        </Reveal>
        <div className="statement-foot">
          <span>SCROLL / 02</span>
          <Link className="text-button" href="/contact">Contact the team <ArrowUpRight size={17} /></Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
