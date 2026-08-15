import { MapPin, Phone, Mail } from 'lucide-react'
import SiteHeader from '@/components/site-header'
import SiteFooter from '@/components/site-footer'
import { PageHero } from '@/components/page-hero'
import { Reveal } from '@/components/reveal'
import { ContactForm } from '@/components/contact-form'
import { StandardForm } from '@/components/standard-form'
import { NewsletterInline } from '@/components/newsletter-inline'

export const metadata = {
  title: 'Contact — Spectra Technologies',
  description: 'Get in touch with Spectra Technologies — direct business inquiries, partnerships, enterprise, government and press.',
}

const details = [
  { icon: MapPin, label: 'Meet Us', value: 'Long Beach, CA', sub: '33° 46′ N / 118° 11′ W' },
  { icon: Phone, label: 'Call Us', value: '+1 (555) 000-0000', sub: 'Direct business line' },
  { icon: Mail, label: 'Email Us', value: 'hello@spectra.tech', sub: 'Direct business inquiries' },
] as const

export default function ContactPage() {
  return (
    <main className="spectra-shell">
      <SiteHeader />

      {/* Hero — Contact Us / Get In Touch */}
      <PageHero kicker="CONTACT / GET IN TOUCH" title="Contact" em="Us." tag="SPECTRA / SIGNAL" />

      {/* Contact Form Demo — wizard + standard form, side by side */}
      <section className="page-section" style={{ paddingTop: 40 }}>
        <div className="page-section-head">
          <Reveal><p className="eyebrow">CONTACT FORM DEMO</p><h3>Get in<br />touch.</h3></Reveal>
        </div>
        <Reveal>
          <div className="contact-form-demo">
            <div>
              <p className="contact-form-demo-label">Multi-Step Form</p>
              <ContactForm />
            </div>
            <div>
              <p className="contact-form-demo-label">Standard Form</p>
              <StandardForm />
            </div>
          </div>
        </Reveal>
      </section>

      {/* Contact details */}
      <section className="page-section page-section-alt">
        <div className="page-section-head">
          <Reveal><p className="eyebrow">CONTACT DETAILS</p><h3>Reach us<br />directly.</h3></Reveal>
        </div>
        <Reveal>
          <div className="contact-detail-grid">
            {details.map(({ icon: Icon, label, value, sub }) => (
              <div key={label} className="page-card contact-detail-card">
                <span className="card-index grow-hover"><Icon size={18} /></span>
                <h4>{label}</h4>
                <p className="contact-detail-value">{value}</p>
                <p>{sub}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Newsletter */}
      <section className="page-section">
        <div className="page-section-head">
          <Reveal><p className="eyebrow">NEWSLETTER</p><h3>Subscribe<br />now.</h3></Reveal>
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
