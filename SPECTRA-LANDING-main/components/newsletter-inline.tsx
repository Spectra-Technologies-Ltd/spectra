'use client'

import { useState } from 'react'

/** Inline newsletter row (innov8hub style) — orange subscribe button. */
export function NewsletterInline() {
  const [sent, setSent] = useState(false)

  return (
    <form
      className="newsletter-form-row"
      onSubmit={(e) => {
        e.preventDefault()
        setSent(true)
      }}
    >
      <input type="email" required placeholder="Email" aria-label="Email address" disabled={sent} />
      <button type="submit">{sent ? 'Subscribed!' : 'Subscribe'}</button>
    </form>
  )
}
