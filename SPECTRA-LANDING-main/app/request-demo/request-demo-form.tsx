'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Shield, Loader2, AlertCircle, CheckCircle2, ArrowLeft, Globe } from 'lucide-react'

const COUNTRIES = [
  'United States', 'United Kingdom', 'Nigeria', 'Canada', 'Australia', 'South Africa',
  'Germany', 'France', 'Netherlands', 'United Arab Emirates', 'Ghana', 'Kenya',
  'India', 'Singapore', 'Japan', 'Brazil', 'Mexico', 'Spain', 'Italy', 'Saudi Arabia',
  'Egypt', 'Morocco', 'Qatar', 'Kuwait', 'Norway', 'Sweden', 'Switzerland', 'Poland',
  'Ireland', 'New Zealand', 'Portugal', 'Belgium', 'Denmark', 'Finland', 'Austria',
  'Israel', 'Turkey', 'China', 'South Korea', 'Other',
]

type FormValues = {
  firstName: string
  lastName: string
  email: string
  phone: string
  jobTitle: string
  organizationName: string
  country: string
  context: string
  message: string
}

const initialValues: FormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  jobTitle: '',
  organizationName: '',
  country: '',
  context: '',
  message: '',
}

export default function RequestDemoForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [values, setValues] = useState<FormValues>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({})

  const set = (key: keyof FormValues) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setValues((v) => ({ ...v, [key]: e.target.value }))
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }))
  }

  const validate = () => {
    const er: Partial<Record<keyof FormValues, string>> = {}
    if (!values.firstName.trim()) er.firstName = 'First name is required'
    if (!values.lastName.trim()) er.lastName = 'Last name is required'
    if (!values.email.trim()) er.email = 'Work email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) er.email = 'Please enter a valid email address'
    if (!values.phone.trim()) er.phone = 'Phone number is required'
    if (!values.jobTitle.trim()) er.jobTitle = 'Job title is required'
    if (!values.organizationName.trim()) er.organizationName = 'Organization / company name is required'
    if (!values.country) er.country = 'Please select a country'
    if (values.message.trim().length < 10) er.message = "Tell us a little about what you're working on"
    return er
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const er = validate()
    if (Object.keys(er).some((k) => er[k as keyof FormValues])) {
      setErrors(er)
      return
    }
    setError(null)
    setIsSubmitting(true)
    try {
      // Lead-capture stub — wire this to a backend endpoint when one is available.
      console.log('LEAD SUBMISSION', values)
      await new Promise((r) => setTimeout(r, 900))
      setSubmitted(true)
    } catch {
      setError('Something went wrong submitting your request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const labelClass = 'font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500'
  const inputClass = (hasError: boolean) =>
    `w-full rounded-md border bg-white py-2.5 px-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 sm:text-sm ${
      hasError
        ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
        : 'border-zinc-200 focus:border-[#57d7d4] focus:ring-[#b9efed]'
    }`

  /* ── Success state — swapped in place, no page navigation ── */
  if (submitted) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white px-4 py-12">
        <div className="w-full max-w-[460px] text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
          </div>
          <h1 className="mt-6 text-2xl font-black tracking-tight text-zinc-950">
            Thanks — we&apos;ll be in touch shortly.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-500">
            A member of the Spectra team will follow up with you shortly to discuss what
            you&apos;re working on and how we can help.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-2 rounded-md bg-[#57d7d4] px-5 py-3 text-sm font-bold text-[#061a20] shadow-lg shadow-[#57d7d4]/30 transition-all hover:bg-[#4cc9c6]"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Homepage
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      {/* Simple top bar */}
      <header className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 sm:px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#57d7d4] text-[#061a20] shadow-md shadow-[#57d7d4]/30">
            <Shield className="h-4 w-4" />
          </div>
          <span className="font-mono text-sm font-bold tracking-[0.25em] text-zinc-900">
            SPECTRA
          </span>
        </div>
        <Link
          href="/"
          className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 transition-colors hover:text-[#57d7d4]"
        >
          Home
        </Link>
      </header>

      <main className="flex flex-1 justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-[560px]">
          <p className="font-mono text-[11px] font-bold tracking-[0.28em] text-[#57d7d4]">
            CONTACT · DEMO REQUEST · PARTNERSHIP INQUIRIES
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950">
            Interested in solving a problem with Spectra?
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">
            Tell us what you&apos;re trying to build, operate or solve — we&apos;ll show you what
            Spectra&apos;s intelligent systems can do for you.
          </p>

          {error && (
            <div className="mt-6 flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-bold">Submission failed</p>
                <p className="mt-0.5 text-red-600">{error}</p>
              </div>
            </div>
          )}

          <form className="mt-8 space-y-5" onSubmit={onSubmit} noValidate>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className={labelClass}>First Name</label>
                <input
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  placeholder="Alex"
                  value={values.firstName}
                  onChange={set('firstName')}
                  className={`mt-1.5 ${inputClass(!!errors.firstName)}`}
                />
                {errors.firstName && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{errors.firstName}</p>
                )}
              </div>
              <div>
                <label htmlFor="lastName" className={labelClass}>Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  autoComplete="family-name"
                  placeholder="Mercer"
                  value={values.lastName}
                  onChange={set('lastName')}
                  className={`mt-1.5 ${inputClass(!!errors.lastName)}`}
                />
                {errors.lastName && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="email" className={labelClass}>Work Email</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={values.email}
                  onChange={set('email')}
                  className={`mt-1.5 ${inputClass(!!errors.email)}`}
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{errors.email}</p>
                )}
              </div>
              <div>
                <label htmlFor="phone" className={labelClass}>Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+1 (555) 000-0000"
                  value={values.phone}
                  onChange={set('phone')}
                  className={`mt-1.5 ${inputClass(!!errors.phone)}`}
                />
                {errors.phone && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{errors.phone}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="jobTitle" className={labelClass}>Job Title</label>
                <input
                  id="jobTitle"
                  type="text"
                  autoComplete="organization-title"
                  placeholder="Director of Operations"
                  value={values.jobTitle}
                  onChange={set('jobTitle')}
                  className={`mt-1.5 ${inputClass(!!errors.jobTitle)}`}
                />
                {errors.jobTitle && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{errors.jobTitle}</p>
                )}
              </div>
              <div>
                <label htmlFor="organizationName" className={labelClass}>Organization / Company</label>
                <input
                  id="organizationName"
                  type="text"
                  autoComplete="organization"
                  placeholder="Acme Industries"
                  value={values.organizationName}
                  onChange={set('organizationName')}
                  className={`mt-1.5 ${inputClass(!!errors.organizationName)}`}
                />
                {errors.organizationName && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{errors.organizationName}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="country" className={labelClass}>Country</label>
                <div className="relative mt-1.5">
                  <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <select
                    id="country"
                    value={values.country}
                    onChange={set('country')}
                    className={`${inputClass(!!errors.country)} appearance-none pl-9 pr-8`}
                  >
                    <option value="" disabled>Select a country</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                {errors.country && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{errors.country}</p>
                )}
              </div>
              <div>
                <label htmlFor="context" className={labelClass}>
                  Additional Context <span className="text-zinc-400">(optional)</span>
                </label>
                <input
                  id="context"
                  type="text"
                  placeholder="e.g. scale, timeline, related projects"
                  value={values.context}
                  onChange={set('context')}
                  className={`mt-1.5 ${inputClass(false)}`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="message" className={labelClass}>Tell us what you&apos;re working on</label>
              <textarea
                id="message"
                rows={4}
                placeholder="Describe the problem you're trying to solve — what you're building, operating or improving."
                value={values.message}
                onChange={set('message')}
                className={`mt-1.5 ${inputClass(!!errors.message)} resize-none`}
              />
              {errors.message && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{errors.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group flex w-full items-center justify-center gap-2 rounded-md bg-[#57d7d4] px-4 py-3 text-sm font-bold text-[#061a20] shadow-lg shadow-[#57d7d4]/30 transition-all hover:bg-[#4cc9c6] focus:outline-none focus:ring-2 focus:ring-[#57d7d4] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                </>
              ) : (
                'Submit'
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
