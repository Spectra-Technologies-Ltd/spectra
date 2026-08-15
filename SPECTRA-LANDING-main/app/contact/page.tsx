import { MapPin, Phone, Mail } from 'lucide-react'
import SiteHeader from '@/components/site-header'
import SiteFooter from '@/components/site-footer'
import { PageHero } from '@/components/page-hero'
import { Reveal } from '@/components/reveal'
import { ContactForm } from '@/components/contact-form'
import { NewsletterForm } from '@/components/newsletter-form'

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

      {/* Contact Us */}
      <PageHero kicker="CONTACT / DIRECT INQUIRIES" title="Contact" em="Us." tag="SPECTRA / SIGNAL" />

      {/* Get In Touch */}
      <section className="page-section" style={{ paddingTop: 40 }}>
        <div className="page-section-head">
          <Reveal><p className="eyebrow">GET IN TOUCH</p><h3>Send us<br />a message.</h3></Reveal>
        </div>
        <Reveal><ContactForm /></Reveal>
      </section>

      {/* Contact details */}
      <section className="page-section page-section-alt">
        <div className="page-section-head">
          <Reveal><p className="eyebrow">CONTACT DETAILS</p><h3>Reach us<br />directly.</h3></Reveal>
        </div>
        <div className="card-grid">
          {details.map(({ icon: Icon, label, value, sub }) => (
            <Reveal key={label}>
              <div className="page-card contact-detail-card">
                <span className="card-index"><Icon size={18} /></span>
                <h4>{label}</h4>
                <p className="contact-detail-value">{value}</p>
                <p>{sub}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="page-section">
        <div className="page-section-head">
          <Reveal><p className="eyebrow">NEWSLETTER</p><h3>Subscribe<br />now.</h3></Reveal>
          <Reveal><p className="body-copy">Join our newsletter to get the latest news, updates, and technical notes delivered straight to your inbox.</p></Reveal>
        </div>
        <Reveal>
          <div className="newsletter-block">
            <span className="newsletter-kicker">Sign up now!</span>
            <NewsletterForm />
          </div>
        </Reveal>
      </section>

      <SiteFooter />
    </main>
  )
}
