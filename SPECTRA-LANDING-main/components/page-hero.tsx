/** Shared hero header for Spectra sub-pages (BastionOS, Napoleon, About, ...). */
export function PageHero({
  kicker,
  title,
  em,
  tag = 'SPECTRA / SYSTEM',
  hideBottom = false,
  compact = false,
  children,
}: {
  kicker: React.ReactNode
  title: React.ReactNode
  em?: React.ReactNode
  tag?: React.ReactNode
  hideBottom?: boolean
  /** Smaller headline scale, for long editorial titles. */
  compact?: boolean
  children?: React.ReactNode
}) {
  return (
    <section className={`page-hero${compact ? ' page-hero-compact' : ''}`}>
      <div className="section-kicker">
        <span>{kicker}</span>
      </div>
      <h1>
        {title}
        {em && (
          <>
            <br />
            <em>{em}</em>
          </>
        )}
      </h1>
      {children && <div className="page-hero-meta">{children}</div>}
      {!hideBottom && (
        <div className="hero-bottom page-hero-bottom">
          <span>{tag}</span>
        </div>
      )}
    </section>
  )
}
