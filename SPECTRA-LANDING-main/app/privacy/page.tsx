import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/site-header'
import SiteFooter from '@/components/site-footer'
import { PageHero } from '@/components/page-hero'
import { pageMetadata } from '@/lib/seo'
import { SITE_NAME } from '@/lib/site'

export const metadata: Metadata = pageMetadata({
  title: 'Privacy Policy — Spectra Technologies',
  description:
    'How Spectra Technologies collects, uses and protects the information you share through this website.',
  path: '/privacy',
})

const sections = [
  {
    title: 'Information we collect',
    body: [
      'We collect the information you choose to give us. That includes your name, work email, phone number, organisation and the content of any message you send through our contact, demo-request or newsletter forms.',
      'We also collect limited technical information automatically — such as pages visited and general device and browser type — through aggregate analytics. We do not use this website to build advertising profiles.',
    ],
  },
  {
    title: 'How we use your information',
    body: [
      'We use your information to respond to your enquiry, arrange a demonstration of our products, deliver the newsletter you asked for, and improve the website and our services.',
      'We do not sell your personal information. We share it only with service providers who help us operate this website and communicate with you, and only to the extent needed to do so.',
    ],
  },
  {
    title: 'Retention and security',
    body: [
      'We keep enquiry and subscription records only for as long as they are needed for the purpose they were collected, or as required by law. We apply reasonable technical and organisational measures to protect the information we hold.',
    ],
  },
  {
    title: 'Your choices',
    body: [
      'You can unsubscribe from the newsletter at any time using the link in any email we send. You can also ask us to correct or delete the information we hold about you by contacting us.',
    ],
  },
]

export default function PrivacyPage() {
  return (
    <main id="main" className="spectra-shell">
      <SiteHeader />

      <PageHero kicker="LEGAL / PRIVACY" title="Privacy" em="Policy." tag="SPECTRA / LEGAL">
        <p>
          How {SITE_NAME} collects, uses and protects the information you share through this
          website.
        </p>
      </PageHero>

      <section className="page-section legal-section">
        <div className="page-prose">
          <p className="eyebrow">LAST UPDATED — SEPTEMBER 2026</p>
          {sections.map((section) => (
            <div key={section.title} className="legal-block">
              <h2 className="legal-heading">{section.title}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          ))}
          <div className="legal-block">
            <h2 className="legal-heading">Contact</h2>
            <p>
              Questions about this policy can be sent through our <Link href="/contact">contact page</Link>.
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
