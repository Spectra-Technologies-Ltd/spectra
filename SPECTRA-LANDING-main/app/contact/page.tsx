import type { Metadata } from 'next'
import { MapPin, Phone, Mail } from '@/components/icon'
import SiteHeader from '@/components/site-header'
import SiteFooter from '@/components/site-footer'
import { PageHero } from '@/components/page-hero'
import { Reveal } from '@/components/reveal'
import { StandardForm } from '@/components/standard-form'
import { NewsletterInline } from '@/components/newsletter-inline'
import { CONTACT_EMAIL, CONTACT_LOCATION, CONTACT_PHONE } from '@/lib/site'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  title: 'Contact — Spectra Technologies',
  description:
    'Get in touch with Spectra Technologies — direct business inquiries, partnerships, enterprise, government and press.',
  path: '/contact',
})

type Detail = {
  icon: typeof MapPin
  label: string
  value: string
  sub: string
  href?: string
}

const details: Detail[] = [
  { icon: MapPin, label: 'Meet Us', value: CONTACT_LOCATION, sub: 'Operating across time zones' },
  ...(CONTACT_PHONE
    ? [
        {
          icon: Phone,
          label: 'Call Us',
          value: CONTACT_PHONE,
          sub: 'Direct business line',
          href: `tel:${CONTACT_PHONE.replace(/[^+\d]/g, '')}`,
        },
      ]
    : []),
  {
    icon: Mail,
    label: 'Email Us',
    value: CONTACT_EMAIL,
    sub: 'Direct business inquiries',
    href: `mailto:${CONTACT_EMAIL}`,
  },
]

export default function ContactPage() {
  return (
    <main id="main" className="spectra-shell">
      <SiteHeader />

      {/* Hero — Contact Us / Get In Touch */}
      <PageHero kicker="CONTACT / GET IN TOUCH" title="Contact" em="Us." hideBottom />

      {/* Contact form */}
      <section className="page-section page-section-tight">
        <div className="page-section-head">
          <Reveal>
            <p className="eyebrow">CONTACT FORM</p>
            <h2 className="section-heading">Get in<br />touch.</h2>
          </Reveal>
        </div>
        <Reveal><StandardForm /></Reveal>
      </section>

      {/* Contact details */}
      <section className="page-section page-section-alt">
        <div className="page-section-head">
          <Reveal>
            <p className="eyebrow">CONTACT DETAILS</p>
            <h2 className="section-heading">Reach us<br />directly.</h2>
          </Reveal>
        </div>
        <Reveal>
          <div className="contact-detail-grid">
            {details.map(({ icon: Icon, label, value, sub, href }) => (
              <div key={label} className="page-card contact-detail-card">
                <span className="card-index grow-hover"><Icon size={18} aria-hidden="true" /></span>
                <h3>{label}</h3>
                <p className="contact-detail-value">
                  {href ? <a href={href}>{value}</a> : value}
                </p>
                <p>{sub}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Newsletter */}
      <section className="page-section">
        <div className="page-section-head">
          <Reveal>
            <p className="eyebrow">NEWSLETTER</p>
            <h2 className="section-heading">Subscribe<br />now.</h2>
          </Reveal>
          <Reveal><p className="body-copy">Join our newsletter to get the latest news, updates, and special offers delivered straight to your inbox.</p></Reveal>
        </div>
        <Reveal>
          <div className="contact-newsletter">
            <p className="newsletter-kicker">Sign up now!</p>
            <NewsletterInline />
          </div>
        </Reveal>
      </section>

      <SiteFooter />
    </main>
  )
}
