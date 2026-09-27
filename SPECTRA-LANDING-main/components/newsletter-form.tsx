'use client'

import { useId, useState } from 'react'

type Status = 'idle' | 'submitting' | 'done' | 'error'

export function NewsletterForm() {
  const inputId = useId()
  const statusId = `${inputId}-status`
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')

  const submitting = status === 'submitting'
  const done = status === 'done'

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting || done) return
    setStatus('submitting')
    setMessage('')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'Subscription failed.')
      setStatus('done')
      setMessage('Subscribed — thanks for signing up.')
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  return (
    <form className="newsletter" onSubmit={onSubmit} noValidate>
      <label className="sr-only" htmlFor={inputId}>
        Email address
      </label>
      <input
        id={inputId}
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="you@company.com"
        className="newsletter-input"
        value={email}
        disabled={submitting || done}
        aria-invalid={status === 'error'}
        aria-describedby={statusId}
        onChange={(e) => {
          setEmail(e.target.value)
          if (status === 'error') {
            setStatus('idle')
            setMessage('')
          }
        }}
      />
      <button className="newsletter-btn" type="submit" disabled={submitting || done}>
        {done ? 'SUBSCRIBED' : submitting ? 'SENDING…' : 'SUBSCRIBE'}
      </button>
      <span
        id={statusId}
        className={`form-status${status === 'error' ? ' is-error' : ''}${done ? ' is-ok' : ''}`}
        role="status"
        aria-live="polite"
      >
        {message}
      </span>
    </form>
  )
}
