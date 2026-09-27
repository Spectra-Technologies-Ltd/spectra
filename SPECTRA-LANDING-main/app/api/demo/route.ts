import { NextResponse } from 'next/server'
import { asString, forwardSubmission, isEmail, readJson } from '@/lib/submissions'

const REQUIRED: Array<[key: string, label: string]> = [
  ['firstName', 'First name'],
  ['lastName', 'Last name'],
  ['email', 'Work email'],
  ['phone', 'Phone number'],
  ['jobTitle', 'Job title'],
  ['organizationName', 'Organization'],
  ['country', 'Country'],
]

export async function POST(request: Request) {
  const body = await readJson(request)
  const payload = {
    firstName: asString(body.firstName, 120),
    lastName: asString(body.lastName, 120),
    email: asString(body.email, 320),
    phone: asString(body.phone, 40),
    jobTitle: asString(body.jobTitle, 160),
    organizationName: asString(body.organizationName, 200),
    country: asString(body.country, 120),
    context: asString(body.context, 500),
    message: asString(body.message, 5000),
  }

  const errors: Record<string, string> = {}
  for (const [key, label] of REQUIRED) {
    if (!payload[key as keyof typeof payload]) errors[key] = `${label} is required.`
  }
  if (payload.email && !isEmail(payload.email)) {
    errors.email = 'Please enter a valid email address.'
  }
  if (payload.message.length < 10) {
    errors.message = "Tell us a little about what you're working on."
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: 'Please fix the highlighted fields.', errors }, { status: 400 })
  }

  const result = await forwardSubmission('demo', payload)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
