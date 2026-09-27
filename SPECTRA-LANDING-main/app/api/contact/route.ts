import { NextResponse } from 'next/server'
import { asString, forwardSubmission, isEmail, readJson } from '@/lib/submissions'

export async function POST(request: Request) {
  const body = await readJson(request)

  const firstName = asString(body.firstName, 120)
  const lastName = asString(body.lastName, 120)
  const email = asString(body.email, 320)
  const subject = asString(body.subject, 200)
  const message = asString(body.message, 5000)

  const errors: Record<string, string> = {}
  if (!firstName) errors.firstName = 'First name is required.'
  if (!lastName) errors.lastName = 'Last name is required.'
  if (!email || !isEmail(email)) errors.email = 'Please enter a valid email address.'
  if (!subject) errors.subject = 'Please add a subject.'
  if (message.length < 10) errors.message = 'Please include a short message.'

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: 'Please fix the highlighted fields.', errors }, { status: 400 })
  }

  const result = await forwardSubmission('contact', { firstName, lastName, email, subject, message })
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
