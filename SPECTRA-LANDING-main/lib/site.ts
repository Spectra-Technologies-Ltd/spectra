export const SITE_NAME = 'Spectra Technologies'

/** Canonical origin for the landing site. Override with NEXT_PUBLIC_SITE_URL. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://spectra-landing-six.vercel.app').replace(/\/$/, '')

export const SITE_TAGLINE = 'Intelligence. Engineered.'

/** Base URL of the Spectra operations app (the Workplace). */
export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://spectra-lime.vercel.app').replace(/\/$/, '')

/** Public contact details. Optional values are hidden when unset. */
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'hello@spectra.tech'
export const CONTACT_PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE || ''
export const CONTACT_LOCATION = process.env.NEXT_PUBLIC_CONTACT_LOCATION || 'Remote / Global'

export const SITE_DESCRIPTION =
  'Spectra builds intelligent operating systems and machine intelligence that power critical infrastructure, enterprise operations, security, and complex real-world systems.'

/** Routes that should appear in sitemap.xml. */
export const SITE_ROUTES = [
  '/',
  '/about',
  '/bastionos',
  '/napoleon',
  '/workspace',
  '/newsroom',
  '/journal',
  '/research',
  '/contact',
  '/request-demo',
  '/privacy',
  '/terms',
] as const
