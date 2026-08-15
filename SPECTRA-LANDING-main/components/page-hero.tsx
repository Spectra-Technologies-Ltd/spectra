/** Shared hero header for Spectra sub-pages (BastionOS, Napoleon, About, ...). */
export function PageHero({
  kicker,
  title,
  em,
  tag = 'SPECTRA / SYSTEM',
  children,
}: {
  kicker: string
  title: string
  em?: string
  tag?: string
  children?: React.ReactNode
}) {
  return (
    <section className="page-hero">
      <div className="section-kicker">
        <span>SPECTRA TECHNOLOGIES</span>
        <span>{kicker}</span>
      </div>
      <h2>
        {title}
        {em && (
          <>
            <br />
            <em>{em}</em>
          </>
        )}
      </h2>
      {children && <div className="page-hero-meta">{children}</div>}
      <div className="hero-bottom page-hero-bottom">
        <span>LONG BEACH, CA / 33.76° N 118.19° W</span>
        <span className="hero-scroll">
          <span className="scroll-line" /> SCROLL TO DISCOVER
        </span>
        <span>{tag}</span>
      </div>
    </section>
  )
}
