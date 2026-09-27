"use client"

import {
  Activity,
  ArrowLeftRight,
  AudioLines,
  Bell,
  Cpu,
  FileText,
  Radar,
  ScanEye,
  Send,
  ShieldCheck,
  Thermometer,
  Users,
  Video,
  Waypoints,
  type LucideIcon,
} from "lucide-react"
import { useEffect, useState, useSyncExternalStore } from "react"

type NodeState = "idle" | "lit" | "active"
type HeldKind = "input" | "outcome"
type Held = { kind: HeldKind; id: string } | null

type InputDef = { id: string; label: string; Icon: LucideIcon; caption: string }
type CapabilityDef = { id: string; label: string; Icon: LucideIcon; caption: string }
type OutcomeDef = { id: string; label: string; Icon: LucideIcon; caption: string }

const INPUTS: InputDef[] = [
  { id: "video", label: "Video", Icon: Video, caption: "Holding the video feed through the core." },
  { id: "radar", label: "Radar", Icon: Radar, caption: "Holding the radar track through the core." },
  { id: "acoustic", label: "Acoustic", Icon: AudioLines, caption: "Holding the acoustic signature through the core." },
  { id: "environmental", label: "Environmental", Icon: Thermometer, caption: "Holding environmental data through the core." },
  { id: "transactions", label: "Transactions", Icon: ArrowLeftRight, caption: "Holding transaction records through the core." },
  { id: "personnel", label: "Personnel events", Icon: Users, caption: "Holding personnel events through the core." },
]

const CAPABILITIES: CapabilityDef[] = [
  { id: "learn", label: "Learn", Icon: ScanEye, caption: "Resolving entities and relationships…" },
  { id: "predict", label: "Predict", Icon: Activity, caption: "Detecting patterns and anomalies…" },
  { id: "recommend", label: "Recommend", Icon: Waypoints, caption: "Projecting what happens next…" },
  { id: "coordinate", label: "Coordinate", Icon: Cpu, caption: "Choosing the action to take." },
]

const OUTCOMES: OutcomeDef[] = [
  { id: "alert", label: "Alert", Icon: Bell, caption: "Holding the alert branch through the core." },
  { id: "dispatch", label: "Dispatch", Icon: Send, caption: "Holding the dispatch branch through the core." },
  { id: "report", label: "Report", Icon: FileText, caption: "Holding the report branch through the core." },
  { id: "audit", label: "Audit trail", Icon: ShieldCheck, caption: "Holding the audit trail through the core." },
]

const ACTS = ["Signal", "Unify", "Inference", "Decide"] as const

// Hydration guard: false on the server, so the server HTML always contains the
// fully-labelled static frame; true on the client, where the loop runs.
const SUBSCRIBE_NOOP = () => () => {}
const getMountedClient = () => true
const getMountedServer = () => false

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"
function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION_QUERY)
  mq.addEventListener("change", onChange)
  return () => mq.removeEventListener("change", onChange)
}
const getReducedMotion = () => window.matchMedia(REDUCED_MOTION_QUERY).matches
const getReducedMotionServer = () => false

type Beat = { act: number; cap: number; out: number; caption: string; dur: number }

// Flat choreography timeline. One pass ≈ 20s, then loops.
const BEATS: Beat[] = [
  { act: 0, cap: -1, out: -1, caption: "Ingesting six live signal sources.", dur: 4500 },
  { act: 1, cap: -1, out: -1, caption: "Fusing signals into one operational picture.", dur: 4500 },
  { act: 2, cap: 0, out: -1, caption: "Resolving entities and relationships…", dur: 1450 },
  { act: 2, cap: 1, out: -1, caption: "Detecting patterns and anomalies…", dur: 1450 },
  { act: 2, cap: 2, out: -1, caption: "Projecting what happens next…", dur: 1450 },
  { act: 2, cap: 3, out: -1, caption: "Choosing the action to take.", dur: 1450 },
  { act: 3, cap: -1, out: 0, caption: "Issuing a priority alert.", dur: 1100 },
  { act: 3, cap: -1, out: 1, caption: "Dispatching the response.", dur: 1100 },
  { act: 3, cap: -1, out: 2, caption: "Compiling the report.", dur: 1100 },
  { act: 3, cap: -1, out: 3, caption: "Writing the audit trail.", dur: 1100 },
  { act: 4, cap: -1, out: -1, caption: "Sequence complete. Standing by.", dur: 1500 },
]

// Fixed percentage anchors so the SVG connector layer and the HTML overlay
// stay aligned across every breakpoint (both map 0–100 over the same box).
const INPUT_Y = [16, 28, 40, 52, 64, 76]
const OUTCOME_Y = [22, 38, 54, 70]
const CONVERGE = { x: 45, y: 65 }
const CORE = { x: 52, y: 40 }

export function InferenceSequence() {
  // Both values are read as external stores rather than set from an effect, so
  // nothing cascades a render and the server output stays deterministic.
  const mounted = useSyncExternalStore(SUBSCRIBE_NOOP, getMountedClient, getMountedServer)
  const reduced = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, getReducedMotionServer)
  const [beat, setBeat] = useState(0)
  const [pinned, setPinned] = useState<Held>(null)
  const [hovered, setHovered] = useState<Held>(null)

  const animated = mounted && !reduced
  const held: Held = pinned ?? hovered

  const b = BEATS[beat]

  // Pause the timeline while a node is held (hovered, focused or pinned).
  useEffect(() => {
    if (!animated || held) return
    const t = window.setTimeout(() => {
      setBeat((x) => (x + 1) % BEATS.length)
    }, b.dur)
    return () => window.clearTimeout(t)
  }, [animated, held, beat, b.dur])

  const isStatic = !animated
  const act = isStatic ? -1 : b.act

  const heldCaption = held
    ? held.kind === "input"
      ? INPUTS.find((i) => i.id === held.id)?.caption
      : OUTCOMES.find((o) => o.id === held.id)?.caption
    : undefined

  const caption = isStatic
    ? "From first signal to final decision."
    : heldCaption ?? b.caption

  const inputsDim = !isStatic && act >= 2
  const planeOn = isStatic || act >= 1
  const unifyOn = isStatic || act >= 1
  const coreOn = isStatic || act >= 2
  const decideOn = isStatic || act >= 3

  function capState(i: number): NodeState {
    if (isStatic) return "lit"
    if (act < 2) return "idle"
    if (act === 2) return i < b.cap ? "lit" : i === b.cap ? "active" : "idle"
    return "lit"
  }

  function outState(i: number): NodeState {
    if (isStatic) return "lit"
    if (act < 3) return "idle"
    if (act === 3) return i < b.out ? "lit" : i === b.out ? "active" : "idle"
    return "idle"
  }

  const heldInput = held?.kind === "input" ? held.id : null
  const heldOutcome = held?.kind === "outcome" ? held.id : null

  function togglePin(kind: HeldKind, id: string) {
    setPinned((p) => (p && p.kind === kind && p.id === id ? null : { kind, id }))
  }

  const activeAct = act >= 0 && act <= 3 ? act : -1

  return (
    <div className="inf" data-animated={animated} data-act={act}>
      {/* ============ DESKTOP / TABLET SPATIAL STAGE ============ */}
      <div className="inf-stage">
        <div className="inf-grid" aria-hidden="true" />
        <div className="inf-glow" aria-hidden="true" />

        <svg
          className="inf-lines"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {INPUTS.map((input, i) => (
            <line
              key={input.id}
              className={`inf-line inf-line-unify${unifyOn ? " is-on" : ""}${
                heldInput === input.id ? " is-held" : ""
              }`}
              x1={17}
              y1={INPUT_Y[i]}
              x2={CONVERGE.x}
              y2={CONVERGE.y}
              pathLength={1}
              vectorEffect="non-scaling-stroke"
              style={{ animationDelay: `${i * 90}ms` }}
            />
          ))}
          <line
            className={`inf-line inf-line-core${planeOn ? " is-on" : ""}`}
            x1={CORE.x}
            y1={62}
            x2={CORE.x}
            y2={46}
            vectorEffect="non-scaling-stroke"
          />
          {OUTCOMES.map((outcome, i) => (
            <line
              key={outcome.id}
              className={`inf-line inf-line-decide${decideOn ? " is-on" : ""}${
                heldOutcome === outcome.id ? " is-held" : ""
              }`}
              x1={60}
              y1={CORE.y}
              x2={83}
              y2={OUTCOME_Y[i]}
              pathLength={1}
              vectorEffect="non-scaling-stroke"
              style={{ animationDelay: `${i * 90}ms` }}
            />
          ))}
        </svg>

        {/* Input nodes */}
        {INPUTS.map((input, i) => {
          const isHeld = heldInput === input.id
          return (
            <button
              key={input.id}
              type="button"
              className={`inf-node inf-input${inputsDim && !isHeld ? " is-dim" : ""}${
                isHeld ? " is-held" : ""
              }`}
              style={{ top: `${INPUT_Y[i]}%` }}
              aria-pressed={pinned?.kind === "input" && pinned.id === input.id}
              onClick={() => togglePin("input", input.id)}
              onPointerEnter={() => setHovered({ kind: "input", id: input.id })}
              onPointerLeave={() => setHovered(null)}
              onFocus={() => setHovered({ kind: "input", id: input.id })}
              onBlur={() => setHovered(null)}
            >
              <span className="inf-node-icon" aria-hidden="true">
                <input.Icon strokeWidth={1.5} />
              </span>
              <span className="inf-node-label">{input.label}</span>
            </button>
          )
        })}

        {/* Unified operational data plane */}
        <div className={`inf-plane${planeOn ? " is-on" : ""}`} aria-hidden="true">
          <span className="inf-plane-label">Unified Operational Data</span>
        </div>

        {/* Napoleon core */}
        <div className={`inf-core${coreOn ? " is-on" : ""}`}>
          <div className="inf-rings" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="inf-core-card">
            <span className="inf-core-mark" aria-hidden="true">
              N
            </span>
            <span className="inf-core-name">Napoleon</span>
            <span className="inf-core-sub">Inference Core</span>
          </div>
          <ul className="inf-caps">
            {CAPABILITIES.map((cap, i) => (
              <li key={cap.id} className={`inf-cap is-${capState(i)}`}>
                <span className="inf-cap-icon" aria-hidden="true">
                  <cap.Icon strokeWidth={1.5} />
                </span>
                <span className="inf-cap-label">{cap.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Outcome branches */}
        {OUTCOMES.map((outcome, i) => {
          const state = outState(i)
          const isHeld = heldOutcome === outcome.id
          return (
            <button
              key={outcome.id}
              type="button"
              className={`inf-node inf-outcome is-${state}${isHeld ? " is-held" : ""}`}
              style={{ top: `${OUTCOME_Y[i]}%` }}
              aria-pressed={pinned?.kind === "outcome" && pinned.id === outcome.id}
              onClick={() => togglePin("outcome", outcome.id)}
              onPointerEnter={() => setHovered({ kind: "outcome", id: outcome.id })}
              onPointerLeave={() => setHovered(null)}
              onFocus={() => setHovered({ kind: "outcome", id: outcome.id })}
              onBlur={() => setHovered(null)}
            >
              <span className="inf-node-icon" aria-hidden="true">
                <outcome.Icon strokeWidth={1.5} />
              </span>
              <span className="inf-node-label">{outcome.label}</span>
            </button>
          )
        })}

        {/* Recommended action card (Act 04) */}
        <div className={`inf-action${decideOn ? " is-on" : ""}`} aria-hidden="true">
          <span className="inf-action-title">Recommended Action</span>
          <span className="inf-action-sub">Reasoning attached</span>
        </div>
      </div>

      {/* ============ MOBILE VERTICAL SEQUENCE ============ */}
      <div className="inf-mobile">
        <ol className="inf-mrail" aria-hidden="true">
          {ACTS.map((name, i) => (
            <li key={name} className={`inf-mrail-item${activeAct === i ? " is-active" : ""}`}>
              <span className="inf-mrail-num">{String(i + 1).padStart(2, "0")}</span>
              <span className="inf-mrail-name">{name}</span>
            </li>
          ))}
        </ol>

        <div className="inf-mpanels">
          {(isStatic || act === 0) && (
            <section className="inf-mpanel">
              <h3 className="inf-mpanel-head">Signal</h3>
              <ul className="inf-mlist">
                {INPUTS.map((input) => (
                  <li key={input.id}>
                    <button
                      type="button"
                      className={`inf-mchip${heldInput === input.id ? " is-held" : ""}`}
                      aria-pressed={pinned?.kind === "input" && pinned.id === input.id}
                      onClick={() => togglePin("input", input.id)}
                      onPointerEnter={() => setHovered({ kind: "input", id: input.id })}
                      onPointerLeave={() => setHovered(null)}
                      onFocus={() => setHovered({ kind: "input", id: input.id })}
                      onBlur={() => setHovered(null)}
                    >
                      <input.Icon strokeWidth={1.5} aria-hidden="true" />
                      {input.label}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(isStatic || act === 1) && (
            <section className="inf-mpanel">
              <h3 className="inf-mpanel-head">Unify</h3>
              <div className="inf-mplane">Unified Operational Data</div>
            </section>
          )}

          {(isStatic || act === 2 || act === 3 || act === 4) && (
            <section className="inf-mpanel">
              <h3 className="inf-mpanel-head">Inference</h3>
              <div className="inf-mcore">
                <span className="inf-core-mark" aria-hidden="true">
                  N
                </span>
                <span>Napoleon</span>
              </div>
              <ul className="inf-mlist">
                {CAPABILITIES.map((cap, i) => (
                  <li key={cap.id} className={`inf-mcap is-${capState(i)}`}>
                    <cap.Icon strokeWidth={1.5} aria-hidden="true" />
                    {cap.label}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(isStatic || act === 3 || act === 4) && (
            <section className="inf-mpanel">
              <h3 className="inf-mpanel-head">Decide</h3>
              <ul className="inf-mlist">
                {OUTCOMES.map((outcome, i) => (
                  <li key={outcome.id} className={`is-${outState(i)}`}>
                    <button
                      type="button"
                      className={`inf-mchip${heldOutcome === outcome.id ? " is-held" : ""}`}
                      aria-pressed={pinned?.kind === "outcome" && pinned.id === outcome.id}
                      onClick={() => togglePin("outcome", outcome.id)}
                      onPointerEnter={() => setHovered({ kind: "outcome", id: outcome.id })}
                      onPointerLeave={() => setHovered(null)}
                      onFocus={() => setHovered({ kind: "outcome", id: outcome.id })}
                      onBlur={() => setHovered(null)}
                    >
                      <outcome.Icon strokeWidth={1.5} aria-hidden="true" />
                      {outcome.label}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="inf-maction">
                <span className="inf-action-title">Recommended Action</span>
                <span className="inf-action-sub">Reasoning attached</span>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* ============ SHARED TIMELINE RAIL (desktop/tablet) ============ */}
      <div className="inf-rail">
        <ol className="inf-rail-acts">
          {ACTS.map((name, i) => (
            <li key={name} className={`inf-rail-act${activeAct === i ? " is-active" : ""}`}>
              <span className="inf-rail-num">{String(i + 1).padStart(2, "0")}</span>
              <span className="inf-rail-name">{name}</span>
              <span className="inf-rail-bar" aria-hidden="true" />
            </li>
          ))}
        </ol>
      </div>

      {/* ============ SHARED LIVE CAPTION ============ */}
      <p className="inf-caption" role="status" aria-live="polite">
        {caption}
      </p>
    </div>
  )
}
