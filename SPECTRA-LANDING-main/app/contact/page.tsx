import { MapPin, Phone, Mail } from 'lucide-react'
import SiteHeader from '@/components/site-header'
import SiteFooter from '@/components/site-footer'
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
    <main className="spectra-shell contact-light">
      <SiteHeader light />

      {/* Hero — Contact Us / Get In Touch */}
      <div className="contact-hero animate-fade-in">
        <h1>Contact Us</h1>
        <p className="contact-getintouch">Get In Touch</p>
      </div>

      {/* Form demo — wizard + standard form, side by side */}
      <section className="contact-section">
        <Reveal>
          <h2>Contact Form Demo</h2>
          <div className="contact-divider" />
        </Reveal>
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
      <section className="contact-section">
        <Reveal>
          <h2>Contact details</h2>
          <div className="contact-divider" />
        </Reveal>
        <Reveal>
          <div className="contact-detail-grid">
            {details.map(({ icon: Icon, label, value, sub }) => (
              <div key={label} className="contact-detail-item">
                <span className="detail-icon grow-hover"><Icon size={18} /></span>
                <h4>{label}</h4>
                <p>{value}</p>
                <p>{sub}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Newsletter */}
      <section className="contact-section">
        <Reveal>
          <h2>Subscribe now</h2>
          <div className="contact-divider" />
        </Reveal>
        <Reveal>
          <div className="contact-newsletter">
            <div className="newsletter-left">
              <p className="newsletter-kicker">Sign up now!</p>
              <p className="contact-body" style={{ marginTop: 8 }}>
                Join our newsletter to get the latest news, updates, and special offers delivered
                straight to your inbox.
              </p>
            </div>
            <NewsletterInline />
          </div>
        </Reveal>
      </section>

      <SiteFooter light />
    </main>
  )
}
