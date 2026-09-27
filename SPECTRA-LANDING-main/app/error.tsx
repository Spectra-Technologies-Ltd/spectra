'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled application error', error)
  }, [error])

  return (
    <main
      id="main"
      className="spectra-shell"
      style={{ alignItems: 'center', display: 'flex', minHeight: '100dvh', justifyContent: 'center', padding: '80px 24px' }}
    >
      <div style={{ maxWidth: 560, textAlign: 'center' }}>
        <p className="eyebrow" style={{ color: 'var(--accent)' }}>
          UNEXPECTED ERROR
        </p>
        <h1 style={{ fontSize: 'clamp(40px, 7vw, 72px)', fontWeight: 330, letterSpacing: '-.06em', lineHeight: 1, margin: '18px 0 22px' }}>
          Something went
          <br />
          <em style={{ color: 'var(--accent)', fontStyle: 'normal' }}>wrong.</em>
        </h1>
        <p className="body-copy" style={{ margin: '0 auto 30px' }}>
          An unexpected error stopped this page from rendering. You can try again, or head back to
          the homepage.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
          <button type="button" className="solid-button" onClick={reset}>
            Try again
          </button>
          <Link className="outline-button" href="/">
            Back to homepage
          </Link>
        </div>
      </div>
    </main>
  )
}
