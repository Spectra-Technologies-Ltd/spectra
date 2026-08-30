import type { CSSProperties, ReactNode } from "react"

/* ---------------------------------------------------------------- */
/* Low-level 3D box (an extruded isometric slab / structure)         */
/* ---------------------------------------------------------------- */

type BoxProps = {
  w: number
  d: number
  t: number
  z: number
  x?: number
  y?: number
  topClassName?: string
  sideClassName?: string
  children?: ReactNode
}

function Box({ w, d, t, z, x = 0, y = 0, topClassName = "", sideClassName = "", children }: BoxProps) {
  const face = (style: CSSProperties, className: string, content?: ReactNode) => (
    <div className={className} style={{ position: "absolute", left: "50%", top: "50%", ...style }}>
      {content}
    </div>
  )

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transformStyle: "preserve-3d",
        transform: `translate(-50%, -50%) translate3d(${x}px, ${y}px, ${z}px)`,
      }}
    >
      {/* top */}
      {face({ width: w, height: d, transform: `translate(-50%, -50%) translateZ(${t / 2}px)` }, topClassName, children)}
      {/* bottom */}
      {face(
        { width: w, height: d, transform: `translate(-50%, -50%) translateZ(${-t / 2}px) rotateX(180deg)` },
        sideClassName,
      )}
      {/* front (+y) */}
      {face(
        { width: w, height: t, transform: `translate(-50%, -50%) translateY(${d / 2}px) rotateX(-90deg)` },
        sideClassName,
      )}
      {/* back (-y) */}
      {face(
        { width: w, height: t, transform: `translate(-50%, -50%) translateY(${-d / 2}px) rotateX(90deg)` },
        sideClassName,
      )}
      {/* right (+x) */}
      {face(
        { width: t, height: d, transform: `translate(-50%, -50%) translateX(${w / 2}px) rotateY(90deg)` },
        sideClassName,
      )}
      {/* left (-x) */}
      {face(
        { width: t, height: d, transform: `translate(-50%, -50%) translateX(${-w / 2}px) rotateY(-90deg)` },
        sideClassName,
      )}
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* An upright structure standing on a slab surface                   */
/* ---------------------------------------------------------------- */

function Structure({
  x,
  y,
  base,
  w,
  d,
  h,
  tone = "light",
  children,
}: {
  x: number
  y: number
  base: number
  w: number
  d: number
  h: number
  tone?: "light" | "mid" | "dark"
  children?: ReactNode
}) {
  const top =
    tone === "dark"
      ? "bg-neutral-600 ring-1 ring-neutral-800/60"
      : tone === "mid"
        ? "bg-neutral-300 ring-1 ring-neutral-500/50"
        : "bg-white ring-1 ring-neutral-400/60"
  const side =
    tone === "dark"
      ? "bg-neutral-700/90 border border-neutral-900/40"
      : tone === "mid"
        ? "bg-neutral-400/90 border border-neutral-600/40"
        : "bg-neutral-200/90 border border-neutral-400/50"
  return (
    <Box w={w} d={d} t={h} x={x} y={y} z={base + h / 2} topClassName={`rounded-[2px] ${top}`} sideClassName={side}>
      {children}
    </Box>
  )
}

/* ---------------------------------------------------------------- */
/* Readable tag that counter-rotates to face the camera             */
/* ---------------------------------------------------------------- */

function Tag({ x, y, z, children }: { x: number; y: number; z: number; children: ReactNode }) {
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transformStyle: "preserve-3d",
        transform: `translate(-50%, -50%) translate3d(${x}px, ${y}px, ${z}px)`,
      }}
    >
      <div style={{ transform: "rotateZ(45deg) rotateX(-58deg)" }}>{children}</div>
    </div>
  )
}

/* Thin vertical connector with an animated data pulse traveling up */
function Connector({ x, y, from, to, delay = 0 }: { x: number; y: number; from: number; to: number; delay?: number }) {
  const height = to - from
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transformStyle: "preserve-3d",
        transform: `translate(-50%, -50%) translate3d(${x}px, ${y}px, ${from + height / 2}px) rotateX(90deg)`,
      }}
    >
      <div style={{ position: "absolute", width: 1.5, height, transform: "translate(-50%, -50%)" }}>
        <div className="absolute inset-0 bg-neutral-500/40" />
        <span
          className="absolute left-1/2 h-3 w-[3px] -translate-x-1/2 rounded-full bg-neutral-800"
          style={{ animation: `iso-pulse 1.6s linear ${delay}s infinite` }}
        />
      </div>
    </div>
  )
}

/* A floating isometric line-art chip (like the reference cards) */
function Chip({
  x,
  y,
  z,
  label,
  lines = 3,
  delay = 0,
  variant = "lines",
}: {
  x: number
  y: number
  z: number
  label: string
  lines?: number
  delay?: number
  variant?: "lines" | "chart" | "grid" | "node"
}) {
  return (
    <div
      style={
        {
          position: "absolute",
          left: "50%",
          top: "50%",
          transformStyle: "preserve-3d",
          "--cx": `${x}px`,
          "--cy": `${y}px`,
          "--cz": `${z}px`,
          animation: `iso-float 4s ease-in-out ${delay}s infinite`,
        } as CSSProperties
      }
    >
      <div className="flex h-[70px] w-[108px] flex-col gap-1.5 rounded-[3px] border border-neutral-500/60 bg-white/95 p-2.5 shadow-[0_18px_30px_-18px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-neutral-800" style={{ animation: `iso-blink 1.4s ${delay}s infinite` }} />
          <span className="h-[3px] flex-1 rounded-full bg-neutral-400/50" />
        </div>

        {variant === "lines" &&
          Array.from({ length: lines }).map((_, i) => (
            <span key={i} className="h-[3px] rounded-full bg-neutral-400/50" style={{ width: `${90 - i * 16}%` }} />
          ))}

        {variant === "chart" && (
          <div className="flex flex-1 items-end gap-[3px] pb-0.5">
            {[40, 70, 30, 90, 55, 75].map((h, i) => (
              <span key={i} className="flex-1 rounded-sm bg-neutral-400/60" style={{ height: `${h}%` }} />
            ))}
          </div>
        )}

        {variant === "grid" && (
          <div className="grid flex-1 grid-cols-4 grid-rows-2 gap-[3px] pb-0.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i} className={`rounded-[1px] ${i % 3 === 0 ? "bg-neutral-700" : "bg-neutral-300"}`} />
            ))}
          </div>
        )}

        {variant === "node" && (
          <div className="relative flex-1">
            <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-700" />
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <span
                key={deg}
                className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-neutral-400"
                style={{ transform: `translate(-50%, -50%) rotate(${deg}deg) translateX(14px)` }}
              />
            ))}
          </div>
        )}

        <span className="mt-auto font-mono text-[7px] uppercase tracking-[0.18em] text-neutral-600">{label}</span>
      </div>
    </div>
  )
}

/* A node marker on a slab surface */
function Node({ x, y, accent = false, blink = false }: { x: number; y: number; accent?: boolean; blink?: boolean }) {
  return (
    <div
      className={`absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-[2px] border ${
        accent ? "border-neutral-700 bg-neutral-300" : "border-neutral-500/60 bg-white"
      }`}
      style={{ left: `${x}%`, top: `${y}%`, animation: blink ? "iso-blink 1.2s infinite" : undefined }}
    />
  )
}

/* ---------------------------------------------------------------- */
/* The full layered scene                                            */
/* ---------------------------------------------------------------- */

export function IsometricPlatform() {
  const W = 340
  const D = 340
  const T = 22

  const zBastion = 210
  const zNapoleon = 96
  const zFoundation = 0

  const bastionTop = zBastion + T / 2
  const napoleonTop = zNapoleon + T / 2
  const foundationTop = zFoundation + T / 2

  return (
    <div className="iso-scene relative mx-auto h-[560px] w-full max-w-[760px] select-none sm:h-[660px]">
      <div className="iso-stage absolute left-1/2 top-[52%]">
        {/* -------- connectors + floating chips above BastionOS -------- */}
        <Connector x={-110} y={-60} from={bastionTop} to={bastionTop + 96} delay={0} />
        <Connector x={70} y={-95} from={bastionTop} to={bastionTop + 130} delay={0.4} />
        <Connector x={115} y={35} from={bastionTop} to={bastionTop + 82} delay={0.8} />
        <Connector x={-70} y={95} from={bastionTop} to={bastionTop + 112} delay={1.2} />
        <Connector x={25} y={125} from={bastionTop} to={bastionTop + 150} delay={0.6} />
        <Connector x={-140} y={30} from={bastionTop} to={bastionTop + 60} delay={1} />

        <Chip x={-110} y={-60} z={bastionTop + 96} label="Automation" variant="lines" lines={3} delay={0} />
        <Chip x={70} y={-95} z={bastionTop + 130} label="Agent" variant="node" delay={0.9} />
        <Chip x={115} y={35} z={bastionTop + 82} label="Telemetry" variant="chart" delay={0.5} />
        <Chip x={-70} y={95} z={bastionTop + 112} label="Workflow" variant="grid" delay={1.4} />
        <Chip x={25} y={125} z={bastionTop + 150} label="Model" variant="node" delay={0.7} />
        <Chip x={-140} y={30} z={bastionTop + 60} label="Signal" variant="lines" lines={2} delay={1.1} />

        {/* ============ BastionOS : application layer ============ */}
        <Box
          w={W}
          d={D}
          t={T}
          z={zBastion}
          topClassName="rounded-[2px] bg-white/95 bg-blueprint ring-1 ring-neutral-400/50"
          sideClassName="bg-neutral-200/80 border border-neutral-400/50"
        >
          <div className="relative h-full w-full">
            {/* surface circuit traces */}
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <g stroke="rgba(80,80,86,0.35)" strokeWidth="0.5" fill="none">
                <path d="M20 26 H50 V22" />
                <path d="M50 22 H72 V40" />
                <path d="M40 50 H62 V60" />
                <path d="M28 68 H48 V78" />
                <path d="M62 60 V70 H78" />
                <path d="M20 26 V50 H40" />
              </g>
            </svg>
            <Node x={20} y={26} accent blink />
            <Node x={50} y={22} />
            <Node x={72} y={40} accent />
            <Node x={40} y={50} />
            <Node x={62} y={60} accent blink />
            <Node x={28} y={68} />
            <Node x={78} y={70} />
            <Node x={48} y={78} accent />
          </div>
        </Box>

        {/* structures standing on BastionOS: an autonomous ops plant */}
        <Structure x={-78} y={-58} base={bastionTop} w={26} d={26} h={64} tone="light" />
        <Structure x={-48} y={-72} base={bastionTop} w={24} d={24} h={44} tone="mid" />
        <Structure x={62} y={-50} base={bastionTop} w={34} d={34} h={38} tone="light" />
        <Structure x={78} y={44} base={bastionTop} w={56} d={40} h={20} tone="mid" />
        <Structure x={-84} y={54} base={bastionTop} w={22} d={22} h={74} tone="light" />
        <Structure x={12} y={-18} base={bastionTop} w={30} d={30} h={28} tone="light" />
        <Structure x={-8} y={62} base={bastionTop} w={28} d={28} h={22} tone="mid" />
        <Structure x={46} y={80} base={bastionTop} w={40} d={30} h={12} tone="light" />
        <Structure x={40} y={4} base={bastionTop} w={20} d={20} h={50} tone="mid" />

        {/* ============ Napoleon : intelligence layer ============ */}
        <Box
          w={W}
          d={D}
          t={T}
          z={zNapoleon}
          topClassName="rounded-[2px] bg-neutral-300/90 iso-dots-soft"
          sideClassName="bg-neutral-400/80 border border-neutral-500/50"
        >
          <div className="relative h-full w-full">
            {/* neural mesh */}
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <g stroke="rgba(50,50,56,0.4)" strokeWidth="0.4" fill="none">
                <path d="M25 30 L50 50 L75 32 M50 50 L38 74 M50 50 L70 70 M25 30 L30 62 M75 32 L72 60" />
              </g>
              <g fill="rgba(40,40,46,0.85)">
                <circle cx="25" cy="30" r="1.6" />
                <circle cx="75" cy="32" r="1.6" />
                <circle cx="30" cy="62" r="1.6" />
                <circle cx="72" cy="60" r="1.6" />
                <circle cx="38" cy="74" r="1.6" />
                <circle cx="70" cy="70" r="1.6" />
              </g>
            </svg>
          </div>
        </Box>

        {/* glowing intelligence cores on Napoleon */}
        <IntelCore x={0} y={0} base={napoleonTop} delay={0} />
        <IntelCore x={-58} y={40} base={napoleonTop} delay={0.5} />
        <IntelCore x={54} y={-46} base={napoleonTop} delay={1.1} />

        {/* ============ Foundation : infrastructure layer ============ */}
        <Box
          w={W}
          d={D}
          t={T}
          z={zFoundation}
          topClassName="rounded-[2px] bg-neutral-500/90 iso-dots"
          sideClassName="bg-neutral-600/80 border border-neutral-700/50"
        />

        {/* data blocks on the Foundation grid */}
        {[
          [-70, -60, 10],
          [-70, -40, 16],
          [-52, -58, 8],
          [64, 58, 12],
          [46, 64, 8],
          [66, 40, 18],
          [-60, 60, 10],
          [8, -66, 14],
          [72, -10, 10],
        ].map(([bx, by, bh], i) => (
          <Structure key={i} x={bx} y={by} base={foundationTop} w={16} d={16} h={bh} tone="dark" />
        ))}

        {/* readable layer tags */}
        <Tag x={-230} y={-40} z={zBastion + 8}>
          <LayerTag name="BastionOS" role="Application layer" tone="light" />
        </Tag>
        <Tag x={-230} y={-40} z={zNapoleon + 8}>
          <LayerTag name="Napoleon" role="Intelligence layer" tone="mid" />
        </Tag>
        <Tag x={-230} y={-40} z={zFoundation + 8}>
          <LayerTag name="Foundation" role="Infrastructure layer" tone="dark" />
        </Tag>
      </div>
    </div>
  )
}

/* a small glowing core standing on the intelligence layer */
function IntelCore({ x, y, base, delay = 0 }: { x: number; y: number; base: number; delay?: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transformStyle: "preserve-3d",
        transform: `translate(-50%, -50%) translate3d(${x}px, ${y}px, ${base + 14}px)`,
      }}
    >
      <div className="relative">
        <span
          className="absolute left-1/2 top-1/2 h-9 w-9 rounded-full bg-neutral-200 blur-[6px]"
          style={{ animation: `iso-glow 1.8s ease-in-out ${delay}s infinite` }}
        />
        <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-800 ring-2 ring-white/70" />
      </div>
    </div>
  )
}

function LayerTag({ name, role, tone }: { name: string; role: string; tone: "light" | "mid" | "dark" }) {
  const dot =
    tone === "mid" ? "bg-neutral-400" : tone === "dark" ? "bg-neutral-600" : "bg-white border border-neutral-400"
  return (
    <div className="flex items-center gap-2 whitespace-nowrap rounded-full border border-neutral-300 bg-white/95 py-1.5 pl-2.5 pr-3.5 shadow-[0_10px_24px_-14px_rgba(0,0,0,0.5)] backdrop-blur">
      <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
      <span className="flex flex-col leading-none">
        <span className="text-[13px] font-semibold text-neutral-800">{name}</span>
        <span className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.16em] text-neutral-500">{role}</span>
      </span>
    </div>
  )
}
