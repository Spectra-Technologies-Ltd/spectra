'use client'

import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

type FieldErrors = Partial<Record<'firstName' | 'lastName' | 'email' | 'subject' | 'message', string>>

const EMPTY = { firstName: '', lastName: '', email: '', subject: '', message: '' }

/** Standard one-page contact form. */
export function StandardForm() {
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const set = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }))
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status === 'submitting') return
    setStatus('submitting')
    setMessage('')
    setErrors({})
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (data?.errors && typeof data.errors === 'object') setErrors(data.errors as FieldErrors)
        throw new Error(typeof data?.error === 'string' ? data.error : 'Message could not be sent.')
      }
      setStatus('done')
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  if (status === 'done') {
    return (
      <div className="page-card" style={{ maxWidth: 680 }} role="status">
        <CheckCircle2 size={22} color="var(--accent)" aria-hidden="true" />
        <h4>Message received.</h4>
        <p>
          Your inquiry has been logged. A member of the Spectra team will respond directly — expect
          to hear from us within two business days.
        </p>
      </div>
    )
  }

  return (
    <form className="contact-form" onSubmit={onSubmit} noValidate>
      <div className="contact-form-row">
        <div className="field">
          <label htmlFor="first">First Name</label>
          <input
            id="first"
            name="firstName"
            type="text"
            required
            placeholder="First name"
            value={values.firstName}
            onChange={set('firstName')}
            aria-invalid={!!errors.firstName}
            aria-describedby={errors.firstName ? 'first-error' : undefined}
          />
          {errors.firstName && <span className="field-error" id="first-error">{errors.firstName}</span>}
        </div>
        <div className="field">
          <label htmlFor="last">Last Name</label>
          <input
            id="last"
            name="lastName"
            type="text"
            required
            placeholder="Last name"
            value={values.lastName}
            onChange={set('lastName')}
            aria-invalid={!!errors.lastName}
            aria-describedby={errors.lastName ? 'last-error' : undefined}
          />
          {errors.lastName && <span className="field-error" id="last-error">{errors.lastName}</span>}
        </div>
      </div>
      <div className="field">
        <label htmlFor="std-email">Email</label>
        <input
          id="std-email"
          name="email"
          type="email"
          required
          placeholder="you@company.com"
          value={values.email}
          onChange={set('email')}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'std-email-error' : undefined}
        />
        {errors.email && <span className="field-error" id="std-email-error">{errors.email}</span>}
      </div>
      <div className="field">
        <label htmlFor="subject">Subject</label>
        <input
          id="subject"
          name="subject"
          type="text"
          required
          placeholder="What is this about?"
          value={values.subject}
          onChange={set('subject')}
          aria-invalid={!!errors.subject}
          aria-describedby={errors.subject ? 'subject-error' : undefined}
        />
        {errors.subject && <span className="field-error" id="subject-error">{errors.subject}</span>}
      </div>
      <div className="field">
        <label htmlFor="std-message">Your Message</label>
        <textarea
          id="std-message"
          name="message"
          required
          placeholder="Tell us about your inquiry..."
          value={values.message}
          onChange={set('message')}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? 'std-message-error' : undefined}
        />
        {errors.message && <span className="field-error" id="std-message-error">{errors.message}</span>}
      </div>
      <div className="contact-form-nav">
        <button type="submit" className="form-nav-btn form-nav-primary" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Sending…' : 'Submit Form'}
        </button>
      </div>
      <span
        className={`form-status${status === 'error' ? ' is-error' : ''}`}
        role="status"
        aria-live="polite"
      >
        {message}
      </span>
    </form>
  )
}
