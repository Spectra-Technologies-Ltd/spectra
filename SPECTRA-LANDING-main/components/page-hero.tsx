/** Shared hero header for Spectra sub-pages (BastionOS, Napoleon, About, ...). */
export function PageHero({
  kicker,
  title,
  em,
  children,
}: {
  kicker: string
  title: string
  em?: string
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
    </section>
  )
}
