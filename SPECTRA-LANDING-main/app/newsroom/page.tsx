import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import SiteHeader from '@/components/site-header'
import SiteFooter from '@/components/site-footer'
import { PageHero } from '@/components/page-hero'
import { Reveal } from '@/components/reveal'

export const metadata = {
  title: 'News — Spectra Technologies',
  description:
    'Product updates and announcements from Spectra Technologies — BastionOS, Napoleon and the Spectra Workplace.',
}

const headlines = [
  ['PRODUCT UPDATE', 'The Spectra Workplace is now live.', 'Operators can now manage their entire security operation from the BastionOS command center — guards, patrols, attendance, incidents and reporting in one real-time view.', '05.22.26'],
  ['ANNOUNCEMENT', 'BastionOS 2.0: unified patrols and incident tracking.', 'Patrol verification, incident escalation and reporting now share one workflow — with Napoleon-powered insights layered on top.', '04.14.26'],
  ['ANNOUNCEMENT', 'Napoleon enters preview for enterprise operations.', 'The strategic intelligence engine is now available in preview for select enterprise operations — learning from operational data to surface patterns and predictions.', '03.18.26'],
  ['PRODUCT UPDATE', 'Multi-site visibility, one command center.', 'BastionOS now unifies every site under a single operational picture — coverage, attendance and risk in one view.', '02.09.26'],
  ['ANNOUNCEMENT', 'The Spectra partners program opens.', 'Technology integrations, channel partnerships and co-development — teams building on the Spectra architecture can now apply.', '01.20.26', '/partners'],
] as const

export default function NewsPage() {
  return (
    <main className="spectra-shell">
      <SiteHeader />

      <PageHero kicker="NEWS / PRODUCT UPDATES & ANNOUNCEMENTS" title="What&apos;s<br />new." tag="SPECTRA / NEWS">
        <p>
          Product updates and announcements from Spectra Technologies — BastionOS, Napoleon and
          the Spectra Workplace.
        </p>
      </PageHero>

      {/* Featured story */}
      <section className="page-section" style={{ paddingTop: 110 }}>
        <div className="page-section-head">
          <Reveal><p className="eyebrow">FEATURED</p><h3>The latest<br />from Spectra.</h3></Reveal>
          <Reveal delay={120}><p className="body-copy">Announcements as they land — straight from the team.</p></Reveal>
        </div>
        <Reveal>
          <div className="page-card" style={{ padding: '34px 30px' }}>
            <p className="eyebrow">PRODUCT UPDATE / 05.22.26</p>
            <h4 style={{ fontSize: 'clamp(24px, 3vw, 40px)', fontWeight: 330, letterSpacing: '-.04em', margin: '14px 0 0', lineHeight: 1.05 }}>
              The Spectra Workplace is now live.
            </h4>
            <p style={{ color: 'var(--muted-foreground)', fontSize: 14, lineHeight: 1.7, maxWidth: 640, margin: '16px 0 0' }}>
              Operators can now manage their entire security operation from the BastionOS command
              center — guards, patrols, attendance, incidents and reporting in one real-time view,
              powered by Napoleon.
            </p>
            <Link className="outline-button" href="https://spectra-lime.vercel.app/login" style={{ marginTop: 26 }} target="_blank" rel="noopener noreferrer">
              Enter the Spectra Workplace <ArrowUpRight size={15} />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* All headlines */}
      <section className="page-section page-section-alt">
        <div className="page-section-head">
          <Reveal><p className="eyebrow">ALL STORIES</p><h3>The archive.</h3></Reveal>
        </div>
        <div className="article-list">
          {headlines.map(([source, title, excerpt, date, href], i) => (
            <Reveal key={title} delay={i * 60}>
              <article>
                <span className="article-date">{date}</span>
                <div>
                  <p className="eyebrow">{source}</p>
                  <h4>{title}</h4>
                  <p>{excerpt}</p>
                </div>
                {href ? (
                  <Link className="text-button" href={href} aria-label={title}>
                    Read <ArrowUpRight size={15} />
                  </Link>
                ) : (
                  <Link className="text-button" href="/journal" aria-label={title}>
                    Details <ArrowUpRight size={15} />
                  </Link>
                )}
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Statement CTA */}
      <section className="statement-section">
        <div className="statement-rule" />
        <Reveal>
          <p>NEWS · UPDATES<br />ANNOUNCEMENTS</p>
          <h2>Keep<br /><em>building.</em></h2>
        </Reveal>
        <div className="statement-foot">
          <span>SCROLL / 03</span>
          <Link className="text-button" href="/research">Research &amp; Insights <ArrowUpRight size={17} /></Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
