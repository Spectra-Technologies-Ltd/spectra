'use client'

import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

/** Standard one-page contact form — the second form in the innov8hub demo. */
export function StandardForm() {
  const [sent, setSent] = useState(false)

  if (sent) {
    return (
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', color: '#0c0c0c', fontSize: 14 }}>
        <CheckCircle2 size={20} color="#FB880B" />
        Message received — we&apos;ll be in touch.
      </div>
    )
  }

  return (
    <form
      className="contact-form"
      onSubmit={(e) => {
        e.preventDefault()
        setSent(true)
      }}
    >
      <div className="contact-form-row" style={{ display: 'grid', gap: 14, gridTemplateColumns: '1fr 1fr' }}>
        <div className="field">
          <label htmlFor="first">First Name</label>
          <input id="first" name="first" type="text" required placeholder="First name" />
        </div>
        <div className="field">
          <label htmlFor="last">Last Name</label>
          <input id="last" name="last" type="text" required placeholder="Last name" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="std-email">Email</label>
        <input id="std-email" name="email" type="email" required placeholder="you@company.com" />
      </div>
      <div className="field">
        <label htmlFor="subject">Subject</label>
        <input id="subject" name="subject" type="text" required placeholder="What is this about?" />
      </div>
      <div className="field">
        <label htmlFor="std-message">Your Message</label>
        <textarea id="std-message" name="message" required placeholder="Tell us about your inquiry..." />
      </div>
      <div>
        <button type="submit" className="form-nav-btn form-nav-primary">Submit Form</button>
      </div>
    </form>
  )
}
