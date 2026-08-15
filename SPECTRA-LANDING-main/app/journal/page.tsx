import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import SiteHeader from '@/components/site-header'
import SiteFooter from '@/components/site-footer'
import { PageHero } from '@/components/page-hero'
import { Reveal } from '@/components/reveal'
import { Ticker } from '@/components/ticker'

export const metadata = {
  title: 'The Spectra Journal — Spectra Technologies',
  description:
    'Notes, essays and field reports from the Spectra team — thoughts on infrastructure, machine intelligence and the systems that run on them.',
}

const entries = [
  ['THE JOURNAL', 'Why we built an operating system for security operations.', 'The short version: spreadsheets and radio chatter are not an operating picture. The long version starts with a patrol route that never gets walked.', '08.10.26', '08 min read'],
  ['THE JOURNAL', 'Signals, not noise: what Napoleon actually learns from.', 'Every operation, transaction and movement creates a signal. Most of it stays fragmented. This is what happens when you put it together.', '07.22.26', '06 min read'],
  ['THE JOURNAL', 'Infrastructure is the strategy.', 'Software that decides is only as good as the environment it runs in. Why we treat the foundation as the product.', '06.30.26', '05 min read'],
  ['THE JOURNAL', 'From first signal to final decision.', 'A walk through the chain that turns a raw sensor reading into a decision an operator can act on — and the humans we keep in the loop.', '06.02.26', '09 min read'],
  ['THE JOURNAL', 'Small team, big horizon.', 'How we build foundational technology with a small group of engineers who care about the details.', '05.11.26', '04 min read'],
] as const

const ticker = ['THE SPECTRA JOURNAL', 'NOTES FROM THE BUILD', 'THOUGHTS ON INFRASTRUCTURE', 'FIELD REPORTS', 'SIGNAL TO DECISION']

export default function JournalPage() {
  return (
    <main className="spectra-shell">
      <SiteHeader />

      <PageHero kicker="THE SPECTRA JOURNAL / NOTES FROM THE BUILD" title="Ideas from<br />the frontier." tag="SPECTRA / JOURNAL">
        <p>
          The Spectra Journal — notes, essays and field reports from the team building
          BastionOS, Napoleon and the architecture beneath them.
        </p>
      </PageHero>

      <Ticker items={ticker} />

      {/* Latest entry */}
      <section className="page-section" style={{ paddingTop: 110 }}>
        <div className="page-section-head">
          <Reveal><p className="eyebrow">LATEST ENTRY</p><h3>The Journal,<br />current issue.</h3></Reveal>
          <Reveal delay={120}><p className="body-copy">New entries published as we build. No press releases — just the work, written down.</p></Reveal>
        </div>
        <Reveal>
          <div className="page-card" style={{ padding: '34px 30px' }}>
            <p className="eyebrow">THE JOURNAL / 08.10.26</p>
            <h4 style={{ fontSize: 'clamp(24px, 3vw, 40px)', fontWeight: 330, letterSpacing: '-.04em', margin: '14px 0 0', lineHeight: 1.05 }}>
              Why we built an operating system for security operations.
            </h4>
            <p style={{ color: 'var(--muted-foreground)', fontSize: 14, lineHeight: 1.7, maxWidth: 640, margin: '16px 0 0' }}>
              The short version: spreadsheets and radio chatter are not an operating picture. The
              long version starts with a patrol route that never gets walked, an incident report
              that took three shifts to file, and an analyst who could see the pattern if only the
              data were in one place. BastionOS is the answer we keep building.
            </p>
            <Link className="text-button" href="/contact" style={{ marginTop: 22 }}>
              Read the full entry <ArrowUpRight size={15} />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* All entries */}
      <section className="page-section page-section-alt">
        <div className="page-section-head">
          <Reveal><p className="eyebrow">ALL ENTRIES</p><h3>The archive.</h3></Reveal>
        </div>
        <div className="article-list">
          {entries.map(([source, title, excerpt, date, read], i) => (
            <Reveal key={title} delay={i * 60}>
              <article>
                <span className="article-date">{date}</span>
                <div>
                  <p className="eyebrow">{source}</p>
                  <h4>{title}</h4>
                  <p>{excerpt}</p>
                </div>
                <Link className="text-button" href="/contact" aria-label={title}>
                  {read} <ArrowUpRight size={15} />
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Statement CTA */}
      <section className="statement-section">
        <div className="statement-rule" />
        <Reveal>
          <p>WRITTEN WHILE BUILDING<br />THE FOUNDATION</p>
          <h2>More from<br /><em>the journal.</em></h2>
        </Reveal>
        <div className="statement-foot">
          <span>SCROLL / 03</span>
          <Link className="text-button" href="/newsroom">Latest news <ArrowUpRight size={17} /></Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
