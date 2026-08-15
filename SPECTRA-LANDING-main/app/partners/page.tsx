import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import SiteHeader from '@/components/site-header'
import SiteFooter from '@/components/site-footer'
import { PageHero } from '@/components/page-hero'
import { Reveal } from '@/components/reveal'

export const metadata = {
  title: 'Partners — Spectra Technologies',
  description:
    'Partnerships, integrations and collaborations on the Spectra architecture — BastionOS, Napoleon and the platform beneath.',
}

const programs = [
  ['01', 'Technology Integrations', 'Connect your systems to BastionOS and Napoleon — access control, HR, payroll, IoT, video and beyond. Built on open, documented interfaces.'],
  ['02', 'Channel & Reseller', 'Deliver Intelligence Operating Systems to your customers with the training, enablement and support of the Spectra team behind you.'],
  ['03', 'Co-Development', 'Work with our engineers on new capabilities — from new domains and sensors to entirely new operating systems built on the Spectra platform.'],
] as const

const points = [
  ['API Access', 'Documented interfaces for the full stack'],
  ['Sandbox', 'Test environment for every partner'],
  ['Support', 'Direct engineering access'],
  ['Co-marketing', 'Joint go-to-market opportunities'],
] as const

export default function PartnersPage() {
  return (
    <main className="spectra-shell">
      <SiteHeader />

      <PageHero kicker="PARTNERS / COLLABORATIONS" title="Build on the<br />Spectra architecture." tag="PARTNERS / ECOSYSTEM">
        <p>
          Partnerships, integrations and collaborations — teams building on BastionOS, Napoleon and
          the infrastructure beneath them.
        </p>
        <Link className="outline-button" href="/contact">Become a partner <ArrowUpRight size={17} /></Link>
      </PageHero>

      {/* Manifesto rhythm */}
      <section className="manifesto-section" style={{ paddingTop: 130 }}>
        <div className="section-kicker"><span>01</span><span>THE ECOSYSTEM</span></div>
        <Reveal><h2>Built to<br /><em>build on.</em></h2></Reveal>
        <div className="manifesto-meta">
          <span>01—03</span>
          <p>An Intelligence Operating System is only as strong as what it connects to. Spectra partners extend the architecture — integrations, channels and co-development.</p>
        </div>
      </section>

      {/* Programs */}
      <section className="page-section">
        <div className="page-section-head">
          <Reveal><p className="eyebrow">02 / PARTNERSHIP PROGRAMS</p><h3>Ways to work<br />together.</h3></Reveal>
        </div>
        <div className="card-grid">
          {programs.map(([index, title, copy]) => (
            <Reveal key={title}>
              <div className="page-card">
                <span className="card-index">{index}</span>
                <h4>{title}</h4>
                <p>{copy}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* What partners get */}
      <section className="page-section page-section-alt">
        <div className="page-section-head">
          <Reveal><p className="eyebrow">03 / WHAT PARTNERS GET</p><h3>Built to build on.</h3></Reveal>
        </div>
        <Reveal>
          <div className="spec-grid two-col">
            {points.map(([label, value]) => (
              <div key={label}><span>{label}</span><strong>{value}</strong></div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Statement CTA */}
      <section className="statement-section">
        <div className="statement-rule" />
        <Reveal>
          <p>PARTNERSHIPS · INTEGRATIONS ·<br />COLLABORATIONS</p>
          <h2>Build with us.</h2>
        </Reveal>
        <div className="statement-foot">
          <span>SCROLL / 04</span>
          <Link className="text-button" href="/contact">Start the conversation <ArrowUpRight size={17} /></Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
