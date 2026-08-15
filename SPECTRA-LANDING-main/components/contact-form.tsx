'use client'

import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

const STEPS = ['Name', 'Email', 'Message']

/** Multi-step contact form, modeled on the innov8hub contact wizard. */
export function ContactForm() {
  const [step, setStep] = useState(1)
  const [sent, setSent] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

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
    <form
      className="contact-form"
      onSubmit={(e) => {
        e.preventDefault()
        setSent(true)
      }}
    >
      {/* Step indicators */}
      <div className="contact-steps">
        {STEPS.map((label, i) => {
          const n = i + 1
          return (
            <span key={label} className={n === step ? 'active' : n < step ? 'done' : ''}>
              {n} {label}
            </span>
          )
        })}
      </div>

      {step === 1 && (
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
        </div>
      )}
      {step === 2 && (
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
        </div>
      )}
      {step === 3 && (
        <div className="field">
          <label htmlFor="message">Message</label>
          <textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us what you're trying to see, understand or protect." />
        </div>
      )}

      <div className="contact-form-nav">
        {step > 1 && (
          <button type="button" className="form-nav-btn" onClick={() => setStep(step - 1)}>Previous</button>
        )}
        {step < 3 ? (
          <button type="button" className="form-nav-btn form-nav-primary" onClick={() => setStep(step + 1)}>Next</button>
        ) : (
          <button type="submit" className="form-nav-btn form-nav-primary">Send</button>
        )}
      </div>
    </form>
  )
}
