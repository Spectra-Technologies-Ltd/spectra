'use client'

import {
  Banknote, Binary, Bot, Boxes, Building2, Cog, Cylinder, Database, Factory,
  FileStack, GitBranch, Grid3x3, Network, Package, ScatterChart, Share2, Sheet,
  Spline, Store, Table2, Truck, User, Waves, Workflow, type LucideIcon,
} from 'lucide-react'

import { CaptionCycler } from './caption-cycler'
import {
  DATA_TILES, EDGES, FLOWS, isoPlane, MODEL_TILES, NODES, onPlane, PLANES,
  toPct, VB, edgeGeom, type OntNode,
} from './scene-data'

const ICONS: Record<string, LucideIcon> = {
  Banknote, Binary, Bot, Boxes, Building2, Cog, Cylinder, Database, Factory,
  FileStack, GitBranch, Grid3x3, Network, Package, ScatterChart, Share2, Sheet,
  Spline, Store, Table2, Truck, User, Waves, Workflow,
}

const planeFace = { fill: 'var(--card)', stroke: 'var(--foreground)', strokeWidth: 1 }
const planeSide = { fill: 'url(#hatch)', stroke: 'var(--foreground)', strokeWidth: 1 }

export function IntelligenceDiagram() {
  return (
    <div className="intelligence-diagram relative mx-auto w-full max-w-[1500px]">
      {/* Scene: the animation itself, at the diagram's aspect ratio */}
      <div className="relative" style={{ aspectRatio: `${VB.w} / ${VB.h}` }}>
      {/* ---- SVG scene: planes, flows, edges ---- */}
      <svg
        viewBox={`0 0 ${VB.w} ${VB.h}`}
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <pattern id="hatch" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <rect width="7" height="7" fill="var(--secondary)" />
            <line x1="0" y1="0" x2="0" y2="7" stroke="var(--hairline)" strokeWidth="0.8" />
          </pattern>
        </defs>

        {/* Flow bundles (drawn first, behind planes' overlays) */}
        <FlowBundle paths={FLOWS.dataUp} />
        <FlowBundle paths={FLOWS.modelsUp} />
        <FlowBundle paths={FLOWS.toAnalytics} />
        <FlowBundle paths={FLOWS.toWorkflows} />
        <FlowBundle paths={FLOWS.toIntegrations} />

        {/* Planes */}
        {Object.entries(PLANES).map(([key, p]) => {
          const g = isoPlane(p.cx, p.cy, p.halfW, p.halfH, p.t)
          return (
            <g key={key}>
              <path d={g.leftSide} style={planeSide} />
              <path d={g.rightSide} style={planeSide} />
              <path d={g.face} style={planeFace} />
            </g>
          )
        })}

        {/* Ontology relation edges on the Napoleon plane */}
        {EDGES.map((e, i) => {
          const { d, a, b } = edgeGeom(e)
          return (
            <g key={i}>
              <path d={d} fill="none" stroke="var(--hairline)" strokeWidth="1" strokeDasharray="2 5" strokeLinecap="round" />
              <circle cx={a.x} cy={a.y} r="2.5" fill="var(--foreground)" />
              <circle cx={b.x} cy={b.y} r="2.5" fill="var(--foreground)" />
            </g>
          )
        })}
      </svg>

      {/* ---- HTML overlays ---- */}
      {/* Plane titles */}
      <PlaneLabel plane="analytics" dy={-78} />
      <PlaneLabel plane="workflows" dy={-78} />
      <PlaneLabel plane="integrations" dy={-78} />
      <PlaneLabel plane="napoleon" dy={150} align="left" nudgeX={-140} />
      <PlaneLabel plane="data" dy={92} />
      <PlaneLabel plane="models" dy={92} />

      {/* Source-tier tiles */}
      <TileGrid plane="data" tiles={DATA_TILES} hot={[1, 4]} />
      <TileGrid plane="models" tiles={MODEL_TILES} hot={[2, 6]} />

      {/* Top-tier surfaces */}
      <TopSurfaces />

      {/* Ontology object tokens + relation pills */}
      {NODES.map((n) => (
        <NodeToken key={n.id} node={n} index={NODES.indexOf(n)} />
      ))}
      {EDGES.map((e, i) => {
        const { mid } = edgeGeom(e)
        return <RelPill key={i} x={mid.x} y={mid.y} label={e.label} hot={e.hot} index={i} />
      })}

      {/* Cycling caption — BELOW the scene so it never overlaps the animation */}
      </div>
      <div className="caption-cycler relative mt-6">
        <CaptionCycler />
      </div>
    </div>
  )
}

function FlowBundle({ paths }: { paths: string[] }) {
  return (
    <g fill="none" strokeLinecap="round">
      {paths.map((d, i) => (
        <g key={i}>
          <path d={d} stroke="var(--border)" strokeWidth="1" />
          <path
            d={d}
            stroke="var(--foreground)"
            strokeWidth="1.4"
            strokeDasharray="1 11"
            className="flow-line"
            style={{ animationDelay: `${(i % 5) * -0.4}s` }}
          />
        </g>
      ))}
    </g>
  )
}

function PlaneLabel({
  plane, dy, align = 'center', nudgeX = 0,
}: {
  plane: keyof typeof PLANES
  dy: number
  align?: 'center' | 'left'
  nudgeX?: number
}) {
  const p = PLANES[plane]
  const pos = toPct({ x: p.cx + nudgeX, y: p.cy + dy })
  return (
    <span
      className="absolute font-mono text-[clamp(11px,1.5cqw,22px)] font-medium uppercase tracking-[0.15em] text-foreground"
      style={{
        left: pos.left,
        top: pos.top,
        transform: align === 'center' ? 'translate(-50%,-50%)' : 'translateY(-50%)',
      }}
    >
      {p.label}
    </span>
  )
}

function NodeToken({ node, index }: { node: OntNode; index: number }) {
  const Icon = ICONS[node.icon]
  const pos = toPct(node)
  return (
    <div
      className="absolute flex flex-col items-center"
      style={{ left: pos.left, top: pos.top, transform: 'translate(-50%,-62%)' }}
    >
      <div
        className="grid place-items-center rounded-[6px] border shadow-sm"
        style={{
          width: 'clamp(30px,3.4cqw,50px)',
          height: 'clamp(30px,3.4cqw,50px)',
          borderColor: 'var(--foreground)',
          background: node.hot ? 'var(--mint)' : 'var(--card)',
          animation: `token-float 4s ease-in-out ${index * 0.3}s infinite`,
        }}
      >
        <Icon
          className="size-[55%]"
          style={{ color: node.hot ? 'var(--mint-ink)' : 'var(--foreground)' }}
          strokeWidth={1.6}
        />
      </div>
    </div>
  )
}

function RelPill({
  x, y, label, hot, index,
}: {
  x: number
  y: number
  label: string
  hot?: boolean
  index: number
}) {
  const pos = toPct({ x, y })
  return (
    <span
      className="absolute whitespace-nowrap rounded-full px-2 py-[3px] font-mono text-[clamp(7px,0.72cqw,11px)] leading-none"
      style={{
        left: pos.left,
        top: pos.top,
        transform: 'translate(-50%,-50%)',
        background: hot ? 'var(--mint-strong)' : 'var(--mint)',
        color: 'var(--mint-ink)',
        animation: `pill-pop 0.4s ease-out ${index * 0.12}s both`,
      }}
    >
      {label}
    </span>
  )
}

function TileGrid({
  plane, tiles, hot,
}: {
  plane: keyof typeof PLANES
  tiles: string[]
  hot: number[]
}) {
  const p = PLANES[plane]
  // 2 rows x 4 cols laid on the plane's top face via normalized coords.
  const cols = 4
  return (
    <>
      {tiles.map((name, i) => {
        const row = Math.floor(i / cols)
        const col = i % cols
        const s = -0.26 + col * 0.17 + row * 0.17
        const u = -0.26 + col * 0.17 - row * 0.17
        const pt = onPlane(p.cx, p.cy, p.halfW, p.halfH, s, u)
        const pos = toPct(pt)
        const Icon = ICONS[name]
        const isHot = hot.includes(i)
        return (
          <div
            key={i}
            className="absolute grid place-items-center rounded-[4px] border"
            style={{
              left: pos.left,
              top: pos.top,
              width: 'clamp(20px,2.3cqw,34px)',
              height: 'clamp(20px,2.3cqw,34px)',
              transform: 'translate(-50%,-70%)',
              borderColor: 'var(--foreground)',
              background: isHot ? 'var(--mint)' : 'var(--card)',
            }}
          >
            <Icon
              className="size-[58%]"
              style={{ color: isHot ? 'var(--mint-ink)' : 'var(--foreground)' }}
              strokeWidth={1.6}
            />
          </div>
        )
      })}
    </>
  )
}

function MiniScreen({ x, y, w = 96 }: { x: number; y: number; w?: number }) {
  const pos = toPct({ x, y })
  return (
    <div
      className="absolute overflow-hidden rounded-[4px] border bg-card"
      style={{
        left: pos.left,
        top: pos.top,
        width: `clamp(52px,${w / 15}cqw,${w}px)`,
        transform: 'translate(-50%,-64%)',
        borderColor: 'var(--foreground)',
      }}
    >
      <div className="flex items-center gap-1 border-b border-border px-1.5 py-1">
        <span className="size-1 rounded-full" style={{ background: 'var(--mint-strong)' }} />
        <span className="h-1 w-6 rounded-full bg-border" />
      </div>
      <div className="flex items-end gap-[3px] p-1.5" style={{ height: 'clamp(22px,3cqw,44px)' }}>
        {[40, 70, 30, 90, 55, 75].map((h, i) => (
          <span
            key={i}
            className="w-full rounded-[1px]"
            style={{ height: `${h}%`, background: i % 3 === 0 ? 'var(--mint-strong)' : 'var(--border)' }}
          />
        ))}
      </div>
    </div>
  )
}

function TopSurfaces() {
  const a = PLANES.analytics
  const w = PLANES.workflows
  const n = PLANES.integrations
  const sp = (p: (typeof PLANES)[keyof typeof PLANES], s: number, u: number) => onPlane(p.cx, p.cy, p.halfW, p.halfH, s, u)

  return (
    <>
      {/* Analytics screens */}
      <MiniScreen {...sp(a, -0.18, -0.12)} />
      <MiniScreen {...sp(a, 0.16, 0.08)} />

      {/* Workflows: screens + action chip */}
      <MiniScreen {...sp(w, -0.18, -0.12)} />
      <MiniScreen {...sp(w, 0.16, 0.08)} />
      <Chip {...sp(w, 0.0, 0.16)} label="ACTION" hot />

      {/* Integrations screens + API pills */}
      <MiniScreen {...sp(n, -0.16, -0.1)} />
      <MiniScreen {...sp(n, 0.16, 0.06)} />
      <div
        className="absolute flex gap-2"
        style={{ ...toPct(sp(n, 0.02, 0.26)), transform: 'translate(-50%,-50%)' }}
      >
        {['API', 'API', 'API', 'API'].map((t, i) => (
          <span
            key={i}
            className="rounded-full border px-2 py-[3px] font-mono text-[clamp(6px,0.7cqw,10px)]"
            style={{ borderColor: 'var(--foreground)', background: 'var(--card)', color: 'var(--foreground)' }}
          >
            {t}
          </span>
        ))}
      </div>
    </>
  )
}

function Chip({ x, y, label, hot }: { x: number; y: number; label: string; hot?: boolean }) {
  const pos = toPct({ x, y })
  return (
    <span
      className="absolute rounded-[3px] border px-2 py-[2px] font-mono text-[clamp(6px,0.7cqw,10px)] tracking-wide"
      style={{
        ...pos,
        transform: 'translate(-50%,-50%)',
        borderColor: 'var(--foreground)',
        background: hot ? 'var(--mint-strong)' : 'var(--card)',
        color: hot ? 'var(--mint-ink)' : 'var(--foreground)',
      }}
    >
      {label}
    </span>
  )
}


