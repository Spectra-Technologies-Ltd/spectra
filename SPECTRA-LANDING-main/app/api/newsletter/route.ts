import { NextResponse } from 'next/server'
import { asString, forwardSubmission, isEmail, readJson } from '@/lib/submissions'

export async function POST(request: Request) {
  const body = await readJson(request)
  const email = asString(body.email, 320)

  if (!email || !isEmail(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  const result = await forwardSubmission('newsletter', { email })
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
