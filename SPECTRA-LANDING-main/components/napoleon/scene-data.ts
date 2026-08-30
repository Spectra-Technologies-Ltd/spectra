// Shared coordinate space for the isometric intelligence-layer scene.
// Everything (SVG paths + HTML overlays) is authored in this viewBox space so
// they line up perfectly when the container keeps the same aspect ratio.

export const VB = { w: 1600, h: 980 }

export type Pt = { x: number; y: number }

/** Convert a viewBox point to a percentage position for absolutely placed HTML overlays. */
export function toPct(p: Pt) {
  return { left: `${(p.x / VB.w) * 100}%`, top: `${(p.y / VB.h) * 100}%` }
}

/** A flattened isometric "slab": a rhombus top face plus its two visible side faces. */
export function isoPlane(cx: number, cy: number, halfW: number, halfH: number, t: number) {
  const top: Pt = { x: cx, y: cy - halfH }
  const right: Pt = { x: cx + halfW, y: cy }
  const bottom: Pt = { x: cx, y: cy + halfH }
  const left: Pt = { x: cx - halfW, y: cy }

  const face = `M${top.x},${top.y} L${right.x},${right.y} L${bottom.x},${bottom.y} L${left.x},${left.y} Z`
  // Left side face (front-left) and right side face (front-right), extruded down by t.
  const leftSide = `M${left.x},${left.y} L${bottom.x},${bottom.y} L${bottom.x},${bottom.y + t} L${left.x},${left.y + t} Z`
  const rightSide = `M${bottom.x},${bottom.y} L${right.x},${right.y} L${right.x},${right.y + t} L${bottom.x},${bottom.y + t} Z`

  return { face, leftSide, rightSide, corners: { top, right, bottom, left } }
}

/**
 * Point on a plane's top face from normalized axis fractions.
 * s runs along the "east" diagonal, u along the "south" diagonal (both -0.5..0.5).
 */
export function onPlane(
  cx: number,
  cy: number,
  halfW: number,
  halfH: number,
  s: number,
  u: number,
): Pt {
  return {
    x: cx + (s - u) * halfW,
    y: cy + (s + u) * halfH,
  }
}

/** A fanned bundle of S-curve flow paths between two tiers. */
export function bundle(opts: {
  cxBottom: number
  yBottom: number
  spreadBottom: number
  cxTop: number
  yTop: number
  spreadTop: number
  count: number
  bow?: number
}) {
  const { cxBottom, yBottom, spreadBottom, cxTop, yTop, spreadTop, count, bow = 0 } = opts
  const paths: string[] = []
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : i / (count - 1) - 0.5
    const xb = cxBottom + t * spreadBottom
    const xt = cxTop + t * spreadTop
    const midY = (yBottom + yTop) / 2
    const c1x = xb + t * bow
    const c2x = xt + t * bow
    paths.push(`M${xb},${yBottom} C${c1x},${midY} ${c2x},${midY} ${xt},${yTop}`)
  }
  return paths
}

// ---- Plane layout ---------------------------------------------------------

export const PLANES = {
  analytics: { cx: 430, cy: 235, halfW: 162, halfH: 47, t: 9, label: 'ANALYTICS' },
  workflows: { cx: 800, cy: 222, halfW: 162, halfH: 47, t: 9, label: 'WORKFLOWS' },
  integrations: { cx: 1170, cy: 235, halfW: 162, halfH: 47, t: 9, label: 'INTEGRATIONS' },
  napoleon: { cx: 800, cy: 470, halfW: 385, halfH: 128, t: 14, label: 'NAPOLEON' },
  data: { cx: 800, cy: 770, halfW: 185, halfH: 58, t: 12, label: 'DATA' },
  models: { cx: 1090, cy: 770, halfW: 185, halfH: 58, t: 12, label: 'MODELS' },
} as const

// ---- Ontology graph (objects + relations on the Napoleon plane) -----------

export type OntNode = {
  id: string
  x: number
  y: number
  icon: string
  label: string
  hot?: boolean
}

const P = PLANES.napoleon
const np = (s: number, u: number) => onPlane(P.cx, P.cy, P.halfW, P.halfH, s, u)

export const NODES: OntNode[] = [
  { id: 'plant', ...np(-0.34, -0.12), icon: 'Building2', label: 'Facility', hot: true },
  { id: 'person', ...np(-0.06, -0.24), icon: 'User', label: 'Operator' },
  { id: 'refinery', ...np(0.16, -0.34), icon: 'Factory', label: 'Refinery', hot: true },
  { id: 'ledger', ...np(0.38, -0.22), icon: 'Banknote', label: 'Ledger' },
  { id: 'robot', ...np(-0.34, 0.18), icon: 'Bot', label: 'Robotics' },
  { id: 'crate', ...np(0.02, 0.22), icon: 'Package', label: 'Shipment' },
  { id: 'store', ...np(0.24, 0.06), icon: 'Store', label: 'Depot' },
  { id: 'truck', ...np(0.42, 0.16), icon: 'Truck', label: 'Fleet', hot: true },
]

const byId = Object.fromEntries(NODES.map((n) => [n.id, n]))

export type Edge = { a: string; b: string; label: string; hot?: boolean }

export const EDGES: Edge[] = [
  { a: 'plant', b: 'person', label: 'Records' },
  { a: 'person', b: 'refinery', label: 'Generates', hot: true },
  { a: 'refinery', b: 'ledger', label: 'Transacts' },
  { a: 'ledger', b: 'store', label: 'Purchases' },
  { a: 'plant', b: 'robot', label: 'Operates' },
  { a: 'robot', b: 'crate', label: 'Delivers' },
  { a: 'crate', b: 'store', label: 'Carries' },
  { a: 'crate', b: 'refinery', label: 'Produces' },
  { a: 'store', b: 'truck', label: 'Transports', hot: true },
  { a: 'truck', b: 'crate', label: 'Ships' },
]

export function edgeGeom(e: Edge) {
  const a = byId[e.a]
  const b = byId[e.b]
  return {
    a,
    b,
    mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    d: `M${a.x},${a.y} L${b.x},${b.y}`,
  }
}

// ---- Flow bundles between tiers ------------------------------------------

export const FLOWS = {
  dataUp: bundle({
    cxBottom: 560, yBottom: 742, spreadBottom: 210,
    cxTop: 660, yTop: 566, spreadTop: 250, count: 9, bow: 60,
  }),
  modelsUp: bundle({
    cxBottom: 1040, yBottom: 742, spreadBottom: 210,
    cxTop: 950, yTop: 566, spreadTop: 250, count: 9, bow: -60,
  }),
  toAnalytics: bundle({
    cxBottom: 610, yBottom: 372, spreadBottom: 150,
    cxTop: 430, yTop: 214, spreadTop: 250, count: 8, bow: -50,
  }),
  toWorkflows: bundle({
    cxBottom: 800, yBottom: 356, spreadBottom: 150,
    cxTop: 800, yTop: 196, spreadTop: 250, count: 8,
  }),
  toIntegrations: bundle({
    cxBottom: 990, yBottom: 372, spreadBottom: 150,
    cxTop: 1170, yTop: 214, spreadTop: 250, count: 8, bow: 50,
  }),
}

// ---- Source-tier tiles + top-tier surfaces --------------------------------

export const DATA_TILES = ['Waves', 'Database', 'Table2', 'Cylinder', 'Grid3x3', 'Boxes', 'Sheet', 'FileStack']
export const MODEL_TILES = ['Spline', 'ScatterChart', 'Network', 'Cog', 'GitBranch', 'Workflow', 'Share2', 'Binary']

export const CAPTIONS = [
  {
    title: 'Hydrate Napoleon',
    body: 'Integrate with purpose — combine your data, models, and processes into a single dynamic foundation.',
  },
  {
    title: 'Activate Napoleon',
    body: 'Transform myriad data and models into dynamic, real-world objects, relations, and actions.',
  },
  {
    title: 'Operate on Napoleon',
    body: 'Drive analytics, workflows, and integrations from one governed source of decision-grade truth.',
  },
]
