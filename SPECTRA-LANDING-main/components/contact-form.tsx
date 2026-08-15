'use client'

import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

export function ContactForm() {
  const [sent, setSent] = useState(false)

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSent(true)
  }

  if (sent) {
    return (
      <div className="page-card" style={{ maxWidth: 680 }}>
        <CheckCircle2 size={22} color="var(--accent)" />
        <h4>Message received.</h4>
        <p>
          Your inquiry has been logged. A member of the Spectra team will respond directly — expect
          to hear from us within two business days.
        </p>
      </div>
    )
  }

  return (
    <form className="contact-form" onSubmit={onSubmit}>
      <div className="contact-form-row">
        <div className="field">
          <label htmlFor="name">Full Name</label>
          <input id="name" name="name" type="text" required placeholder="Alex Mercer" />
        </div>
        <div className="field">
          <label htmlFor="email">Work Email</label>
          <input id="email" name="email" type="email" required placeholder="you@company.com" />
        </div>
      </div>
      <div className="contact-form-row">
        <div className="field">
          <label htmlFor="org">Organization</label>
          <input id="org" name="org" type="text" placeholder="Organization name" />
        </div>
        <div className="field">
          <label htmlFor="topic">Inquiry Type</label>
          <select id="topic" name="topic" defaultValue="Business inquiry">
            <option>Business inquiry</option>
            <option>Partnership</option>
            <option>Enterprise</option>
            <option>Government</option>
            <option>Press / Media</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="message">Message</label>
        <textarea id="message" name="message" required placeholder="Tell us what you're trying to see, understand or protect." />
      </div>
      <div>
        <button className="solid-button" type="submit">Send message</button>
      </div>
    </form>
  )
}
