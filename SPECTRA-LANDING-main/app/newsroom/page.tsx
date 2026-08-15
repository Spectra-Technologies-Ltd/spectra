import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import SiteHeader from '@/components/site-header'
import SiteFooter from '@/components/site-footer'
import { PageHero } from '@/components/page-hero'
import { Reveal } from '@/components/reveal'

export const metadata = {
  title: 'News Room — Spectra Technologies',
  description: 'News and articles from Spectra Technologies — BastionOS, Napoleon and the architecture beneath.',
}

const articles = [
  ['SPECTRA JOURNAL', 'BastionOS: the operating foundation for intelligent systems.', 'How the security operations platform unifies personnel, patrols, incidents and analytics into one real-time command center.', '08.15.26', '/bastionos'],
  ['TECHNICAL BRIEF', 'Napoleon: machine intelligence from signal to action.', 'The strategic intelligence engine — how NapoleonOS learns from fragmented data and turns it into decisions.', '07.28.26', '/napoleon'],
  ['ARCHITECTURE NOTES', 'How infrastructure, intelligence, data and applications fit together.', 'A walk through the Spectra Architecture — the integrated stack from first signal to final decision.', '06.10.26', '/#architecture'],
  ['PRODUCT UPDATE', 'The Spectra Workspace is now live.', 'Operators can now manage their entire security operation from the BastionOS command center.', '05.22.26', 'https://spectra-lime.vercel.app/login'],
] as const

export default function NewsRoomPage() {
  return (
    <main className="spectra-shell">
      <SiteHeader />

      <PageHero kicker="NEWS ROOM / THE JOURNAL" title="From the frontier.">
        <p>
          News, technical briefs and architecture notes from Spectra Technologies — BastionOS,
          Napoleon and the platform beneath.
        </p>
      </PageHero>

      <section className="page-section" style={{ paddingTop: 40 }}>
        <Reveal>
          <div className="article-list">
            {articles.map(([source, title, excerpt, date, href]) => (
              <article key={title}>
                <span className="eyebrow">{source}</span>
                <div>
                  <h4>{title}</h4>
                  <p>{excerpt}</p>
                </div>
                <div className="article-date">
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
        </Reveal>
      </section>

      <section className="cta-band">
        <Reveal>
          <p className="eyebrow">PRESS</p>
          <h2>Press &amp; media<br />inquiries.</h2>
          <p className="body-copy">Reach the Spectra team directly for interviews, briefings and comments.</p>
          <Link className="outline-button" href="/contact">Contact the team <ArrowUpRight size={17} /></Link>
        </Reveal>
      </section>

      <SiteFooter />
    </main>
  )
}
