import type { Metadata } from 'next'
import RequestDemoForm from './request-demo-form'

export const metadata: Metadata = {
  title: 'Request a Demo — Spectra Technologies',
  description:
    'Request a demo of Spectra — intelligent operating systems and machine intelligence that solve hard problems.',
}

export default function RequestDemoPage() {
  return <RequestDemoForm />
}
