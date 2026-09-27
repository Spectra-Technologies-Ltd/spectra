import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/site-header'
import SiteFooter from '@/components/site-footer'
import { PageHero } from '@/components/page-hero'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  title: 'Terms of Use — Spectra Technologies',
  description:
    'The terms that govern your use of the Spectra Technologies website and the information published on it.',
  path: '/terms',
})

const sections = [
  {
    title: 'Use of this website',
    body: [
      'This website is provided for general information about Spectra Technologies and our products. By using it you agree to use it lawfully and not to interfere with its operation or security.',
    ],
  },
  {
    title: 'Information and content',
    body: [
      'We work to keep the information on this website accurate and current, but product descriptions, capabilities and availability may change. Nothing on this website is a binding offer, and product commitments are made only in a signed agreement.',
      'All trademarks, product names and content on this website belong to Spectra Technologies or their respective owners and may not be reproduced without permission.',
    ],
  },
  {
    title: 'Submissions',
    body: [
      'When you submit a form on this website you confirm that the information you provide is accurate and that you are entitled to share it. We handle that information as described in our privacy policy.',
    ],
  },
  {
    title: 'Limitation of liability',
    body: [
      'This website is provided on an "as is" basis. To the extent permitted by law, Spectra Technologies is not liable for any loss arising from your use of, or reliance on, this website.',
    ],
  },
  {
    title: 'Changes',
    body: ['We may update these terms from time to time. Continued use of the website means you accept the current version.'],
  },
]

export default function TermsPage() {
  return (
    <main id="main" className="spectra-shell">
      <SiteHeader />

      <PageHero kicker="LEGAL / TERMS" title="Terms" em="of Use." tag="SPECTRA / LEGAL">
        <p>The terms that govern your use of the Spectra Technologies website.</p>
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
            <h2 className="legal-heading">Questions</h2>
            <p>
              For anything relating to these terms, use our <Link href="/contact">contact page</Link>.
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
