/** Animated marquee ticker strip used between page sections. */
export function Ticker({ items }: { items: string[] }) {
  const doubled = [...items, ...items]
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-track">
        {doubled.map((item, i) => (
          <span key={i}>
            {item} <em>·</em>
          </span>
        ))}
      </div>
    </div>
  )
}
