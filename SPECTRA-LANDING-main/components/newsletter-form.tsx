'use client'

import { useState } from 'react'

export function NewsletterForm() {
  const [sent, setSent] = useState(false)

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <form className="newsletter" onSubmit={onSubmit}>
      <input type="email" required placeholder="you@company.com" aria-label="Email address" className="newsletter-input" />
      <button className="newsletter-btn" type="submit">{sent ? 'SUBSCRIBED' : 'SUBSCRIBE'}</button>
    </form>
  )
}
