/**
 * Shared form-submission plumbing.
 *
 * Every form posts JSON to a Route Handler, which validates the payload here and
 * forwards it server-to-server to the Spectra API:
 *
 *     POST <SUBMISSIONS_WEBHOOK_URL>   →   POST /api/v1/leads   →   Postgres
 *
 * That forward is server-to-server, so CORS never applies.
 *
 * Configure with `SUBMISSIONS_WEBHOOK_URL` (all forms) or a per-form override
 * such as `CONTACT_WEBHOOK_URL`. The expected value is the leads endpoint, e.g.
 * `https://spectra-api-wq5x.onrender.com/api/v1/leads`.
 *
 * If no destination is configured, or the destination rejects the submission,
 * this reports the failure. It deliberately does NOT pretend to succeed — a
 * visitor being told "thanks, we'll be in touch" for a lead that was never
 * stored is worse than an honest error.
 */

export type SubmissionKind = 'newsletter' | 'contact' | 'demo'

export type SubmissionPayload = Record<string, string>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** The API validates `kind` against an enum. */
const API_KIND: Record<SubmissionKind, string> = {
  newsletter: 'NEWSLETTER',
  contact: 'CONTACT',
  demo: 'DEMO',
}

export function asString(value: unknown, maxLength = 5000): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

export function isEmail(value: string): boolean {
  return EMAIL_RE.test(value)
}

export function webhookFor(kind: SubmissionKind): string | undefined {
  const perForm = process.env[`${kind.toUpperCase()}_WEBHOOK_URL`]
  return perForm?.trim() || process.env.SUBMISSIONS_WEBHOOK_URL?.trim() || undefined
}

export type ForwardResult = { ok: true } | { ok: false; error: string }

export async function forwardSubmission(
  kind: SubmissionKind,
  payload: SubmissionPayload,
): Promise<ForwardResult> {
  const endpoint = webhookFor(kind)

  if (!endpoint) {
    console.error(
      `[submission:${kind}] dropped — no SUBMISSIONS_WEBHOOK_URL configured. ` +
        'Set it to the API leads endpoint to capture submissions.',
      JSON.stringify(payload),
    )
    return {
      ok: false,
      error: 'Submissions are temporarily unavailable. Please email us directly.',
    }
  }

  const body = JSON.stringify({
    kind: API_KIND[kind],
    source: `landing:${kind}`,
    ...payload,
  })

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      // Never let a slow upstream hold the request open indefinitely.
      signal: AbortSignal.timeout(20_000),
    })

    const detail: unknown = await response.json().catch(() => null)
    const record = detail && typeof detail === 'object' ? (detail as Record<string, unknown>) : null

    const describe = (): string => {
      const message = record?.message
      if (Array.isArray(message)) return message.join(', ')
      if (typeof message === 'string') return message
      return `Submission failed (${response.status})`
    }

    if (!response.ok) {
      console.error(`[submission:${kind}] rejected: ${response.status} ${describe()}`)
      // 4xx comes from our own API's validation and is safe to show. Anything
      // else may leak internals, so the visitor gets a generic message.
      return {
        ok: false,
        error:
          response.status >= 400 && response.status < 500
            ? describe()
            : 'We could not send that just now. Please try again in a moment.',
      }
    }

    // A 2xx is not sufficient on its own: older API builds answered 200 with
    // `{success: false}` for a rejected payload. Treat an explicit negative as
    // failure so the form never claims to have stored something it did not.
    if (record && (record.ok === false || record.success === false)) {
      console.error(`[submission:${kind}] destination reported failure: ${describe()}`)
      return {
        ok: false,
        error: 'We could not send that just now. Please try again in a moment.',
      }
    }

    return { ok: true }
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'unknown error'
    console.error(`[submission:${kind}] could not reach destination: ${reason}`)
    return {
      ok: false,
      error: 'We could not send that just now. Please try again in a moment.',
    }
  }
}

/** Parses a JSON request body, tolerating malformed input. */
export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json()
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}
