export function BrandSidebar() {
  return (
    <aside className="relative flex w-14 shrink-0 flex-col border-r border-hairline md:w-[72px]">
      {/* Logo mark */}
      <div className="flex aspect-square w-14 items-center justify-center bg-foreground md:w-[72px]">
        <SpectraMark />
      </div>

      {/* Vertical brand lockup */}
      <div className="flex flex-1 items-start justify-center pt-6">
        <span
          className="whitespace-nowrap font-sans text-[13px] tracking-tight md:text-sm"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          <span className="text-foreground">Spectra Technologies</span>
          <span className="text-muted-foreground">{'  →  Powered by Napoleon'}</span>
        </span>
      </div>
    </aside>
  )
}

function SpectraMark() {
  return (
    <svg
      viewBox="0 0 40 40"
      className="size-7 md:size-8"
      fill="none"
      stroke="var(--background)"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* incoming beam */}
      <line x1="3" y1="20" x2="15" y2="20" />
      {/* prism */}
      <path d="M15 12 L27 20 L15 28 Z" />
      {/* refracted spectrum */}
      <line x1="27" y1="20" x2="37" y2="12" />
      <line x1="27" y1="20" x2="37" y2="20" stroke="var(--mint-strong)" />
      <line x1="27" y1="20" x2="37" y2="28" />
    </svg>
  )
}
