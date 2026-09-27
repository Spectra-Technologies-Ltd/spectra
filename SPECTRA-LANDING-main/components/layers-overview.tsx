import Link from 'next/link'
import { ScrollReveal } from './scroll-reveal'

function ArrowUpRight() {
  return (
    <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M3.5 8.5 8.5 3.5M8.5 3.5H4.25M8.5 3.5V7.75"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function LayersOverview() {
  return (
    <>
      {/* BastionOS overview */}
      <section id="bastion" className="sp-overview" aria-labelledby="bastion-heading">
        <ScrollReveal>
          <div className="sp-overview-inner">
            <div className="sp-kicker-row">
              <span className="sp-eyebrow">BastionOS</span>
            </div>
            <h2 className="sp-display" id="bastion-heading">
              BastionOS /<br />
              Our Flagship <em>Product</em>
            </h2>
            <Link href="/bastionos" className="sp-textlink">
              Explore BastionOS
              <ArrowUpRight />
            </Link>
          </div>
        </ScrollReveal>
      </section>

      {/* Napoleon overview */}
      <section
        id="napoleon"
        className="sp-overview is-alt"
        aria-labelledby="napoleon-heading"
      >
        <ScrollReveal>
          <div className="sp-overview-inner">
            <div className="sp-kicker-row">
              <span className="sp-eyebrow">Napoleon</span>
              <span className="sp-kicker-sep" aria-hidden="true" />
              <span className="sp-eyebrow sp-kicker-alt">The Intelligence Layer</span>
            </div>
            <h2 className="sp-display" id="napoleon-heading">
              Napoleon / Compute What <em>Comes Next</em>
            </h2>
            <Link href="/napoleon" className="sp-textlink">
              Explore Napoleon
              <ArrowUpRight />
            </Link>
          </div>
        </ScrollReveal>
      </section>
    </>
  )
}

export default LayersOverview
