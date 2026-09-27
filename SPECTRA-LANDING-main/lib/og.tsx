import { ImageResponse } from 'next/og'
import { SITE_TAGLINE } from './site'

export const ogSize = { width: 1200, height: 630 }
export const ogContentType = 'image/png'

/** Shared social-preview artwork used by both opengraph-image and twitter-image. */
export function renderOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#070a1c',
          backgroundImage:
            'radial-gradient(circle at 78% 18%, rgba(87,215,212,0.28), transparent 46%), radial-gradient(circle at 12% 92%, rgba(47,168,255,0.22), transparent 52%)',
          padding: '72px 80px',
          color: '#edf4ff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, letterSpacing: '-0.04em' }}>
            SPECTRA
            <span style={{ color: '#57d7d4' }}>.</span>
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 17,
              letterSpacing: '0.22em',
              color: '#9aa9c7',
              textTransform: 'uppercase',
            }}
          >
            Intelligent Infrastructure
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              fontSize: 104,
              fontWeight: 700,
              letterSpacing: '-0.05em',
              lineHeight: 1,
            }}
          >
            Intelligence.
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 104,
              fontWeight: 700,
              letterSpacing: '-0.05em',
              lineHeight: 1,
              color: '#57d7d4',
            }}
          >
            Engineered.
          </div>
        </div>

        <div style={{ display: 'flex', fontSize: 22, color: '#b3bfd3', maxWidth: 820 }}>
          {SITE_TAGLINE} — operating systems and machine intelligence for critical infrastructure,
          enterprise operations and security.
        </div>
      </div>
    ),
    ogSize,
  )
}
