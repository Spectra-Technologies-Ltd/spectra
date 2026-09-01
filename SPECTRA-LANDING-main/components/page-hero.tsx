/** Shared hero header for Spectra sub-pages (BastionOS, Napoleon, About, ...). */
import { PrintText } from './print-text'

export function PageHero({
  kicker,
  title,
  em,
  tag = 'SPECTRA / SYSTEM',
  hideBottom = false,
  animate = true,
  children,
}: {
  kicker: React.ReactNode
  title: string
  em?: string
  tag?: React.ReactNode
  hideBottom?: boolean
  animate?: boolean
  children?: React.ReactNode
}) {
  return (
    <section className="page-hero">
      <div className="section-kicker">
        <span>SPECTRA TECHNOLOGIES</span>
        <span>{kicker}</span>
      </div>
      {animate ? (
        <PrintText
          tag="h2"
          lines={em ? [{ text: title }, { text: em, style: 'em' }] : [{ text: title }]}
        />
      ) : (
        <h2>
          {title}
          {em && (
            <>
              <br />
              <em>{em}</em>
            </>
          )}
        </h2>
      )}
      {children && <div className="page-hero-meta">{children}</div>}
      {!hideBottom && (
        <div className="hero-bottom page-hero-bottom">
          <span>{tag}</span>
        </div>
      )}
    </section>
  )
}
