import SiteHeader from '@/components/site-header'
import SiteFooter from '@/components/site-footer'
import { PageHero } from '@/components/page-hero'
import { Reveal } from '@/components/reveal'
import { ContactForm } from '@/components/contact-form'

export const metadata = {
  title: 'Contact — Spectra Technologies',
  description: 'Direct business inquiries with Spectra Technologies — partnerships, enterprise, government and press.',
}

const channels = [
  ['01', 'Partnerships', 'Integrations, channel and co-development.'],
  ['02', 'Enterprise', 'Deploying BastionOS and Napoleon across your operation.'],
  ['03', 'Government', 'Public sector and national interest programs.'],
  ['04', 'Press / Media', 'News room and press inquiries.'],
] as const

export default function ContactPage() {
  return (
    <main className="spectra-shell">
      <SiteHeader />

      <PageHero kicker="CONTACT / DIRECT INQUIRIES" title="Let's talk about<br />the mission." tag="SPECTRA / SIGNAL">
        <p>
          Direct business inquiries — partnerships, enterprise, government and press. Tell us what
          you&apos;re trying to see, understand or protect.
        </p>
      </PageHero>

      {/* Form */}
      <section className="page-section">
        <div className="page-section-head">
          <Reveal><p className="eyebrow">01 / SEND AN INQUIRY</p><h3>Start a<br />conversation.</h3></Reveal>
        </div>
        <Reveal><ContactForm /></Reveal>
      </section>

      {/* Channels */}
      <section className="page-section page-section-alt">
        <div className="page-section-head">
          <Reveal><p className="eyebrow">02 / WHO TO REACH</p><h3>Every inquiry<br />goes somewhere.</h3></Reveal>
        </div>
        <div className="card-grid">
          {channels.map(([index, title, copy]) => (
            <Reveal key={title}>
              <div className="page-card">
                <span className="card-index">{index}</span>
                <h4>{title}</h4>
                <p>{copy}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
