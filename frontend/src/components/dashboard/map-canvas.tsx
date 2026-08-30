'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import { useRealtimeEvent } from '@/lib/realtime'
import {
  TILE_SIZE,
  MIN_ZOOM,
  MAX_ZOOM,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  latLngToWorldPixel,
  pixelDeltaToLatLng,
  clampZoom,
  zoomForBounds,
  centerOfBounds,
  tileUrl,
} from '@/lib/geo'
import {
  MapPin,
  Users,
  AlertTriangle,
  ShieldCheck,
  LocateFixed,
  Plus,
  Minus,
  Navigation,
} from 'lucide-react'

interface SiteMarker {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  riskLevel: string
  clientName: string | null
  guardsOnDuty: number
  openIncidents: number
}

interface GuardMarker {
  id: string
  fullName: string
  shift: string
  onDuty: boolean
  status: string | null
  lastSeen: string | null
  latitude: number | null
  longitude: number | null
  siteId: string | null
  siteName: string | null
}

interface IncidentMarker {
  id: string
  title: string
  severity: string
  status: string
  reportedAt: string
  siteName: string | null
  latitude: number | null
  longitude: number | null
}

interface MapData {
  bounds: { north: number; south: number; east: number; west: number } | null
  sites: SiteMarker[]
  guards: GuardMarker[]
  incidents: IncidentMarker[]
}

const riskDot: Record<string, string> = {
  LOW: 'bg-success',
  MEDIUM: 'bg-info',
  HIGH: 'bg-warning',
  CRITICAL: 'bg-destructive',
}

const severityTone: Record<string, string> = {
  CRITICAL: 'bg-destructive border-destructive',
  HIGH: 'bg-warning border-warning',
  MEDIUM: 'bg-info border-info',
  LOW: 'bg-success border-success',
}

const riskLabel: Record<string, string> = {
  LOW: 'Low risk',
  MEDIUM: 'Medium risk',
  HIGH: 'High risk',
  CRITICAL: 'Critical risk',
}

function timeAgo(iso: string | null): string {
  if (!iso) return '—'
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const DRAG_THRESHOLD = 5

export function MapCanvas({
  compact = false,
  activeId,
  onSelect,
}: {
  compact?: boolean
  activeId?: string
  onSelect?: (id: string) => void
}) {
  const queryClient = useQueryClient()
  const containerRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<{ x: number; y: number; moved: boolean } | null>(null)

  const [center, setCenter] = useState(DEFAULT_CENTER)
  const [zoom, setZoom] = useState(DEFAULT_ZOOM)
  const [popup, setPopup] = useState<{ kind: 'site' | 'incident' | 'guard'; id: string } | null>(null)
  const [showSites, setShowSites] = useState(true)
  const [showGuards, setShowGuards] = useState(true)
  const [showIncidents, setShowIncidents] = useState(true)
  const [fitted, setFitted] = useState(false)

  const { data } = useQuery<MapData>({
    queryKey: ['map-data'],
    queryFn: async () => (await api.get('/dashboard/map-data')).data,
    refetchInterval: 60000,
  })

  // Live updates: new incidents / check-ins appear on the map instantly
  useRealtimeEvent('incident:created', () => {
    queryClient.invalidateQueries({ queryKey: ['map-data'] })
  })
  useRealtimeEvent('attendance:checkin', () => {
    queryClient.invalidateQueries({ queryKey: ['map-data'] })
  })

  // Fit the view to the data bounds once data arrives
  const sizeRef = useRef({ width: 800, height: 500 })
  useEffect(() => {
    if (!data?.bounds || fitted) return
    const el = containerRef.current
    if (el) {
      sizeRef.current = { width: el.clientWidth || 800, height: el.clientHeight || 500 }
    }
    setZoom(zoomForBounds(data.bounds, sizeRef.current.width, sizeRef.current.height))
    setCenter(centerOfBounds(data.bounds))
    setFitted(true)
  }, [data, fitted])

  // Keep size ref current on resize
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      sizeRef.current = { width: el.clientWidth, height: el.clientHeight }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const scale = Math.pow(2, zoom)
  const world = latLngToWorldPixel(center.lat, center.lng, zoom)
  const vw = sizeRef.current.width
  const vh = sizeRef.current.height
  // Offset of the container's top-left corner in world px
  const offsetX = world.x - vw / 2
  const offsetY = world.y - vh / 2

  const tileRange = useMemo(() => {
    const x0 = Math.floor(offsetX / TILE_SIZE)
    const y0 = Math.floor(offsetY / TILE_SIZE)
    const x1 = Math.ceil((offsetX + vw) / TILE_SIZE)
    const y1 = Math.ceil((offsetY + vh) / TILE_SIZE)
    const tiles: { x: number; y: number }[] = []
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        tiles.push({ x: tx, y: ty })
      }
    }
    return tiles
  }, [offsetX, offsetY, vw, vh, zoom])

  const toScreen = useCallback(
    (lat: number, lng: number) => {
      const p = latLngToWorldPixel(lat, lng, zoom)
      return { x: p.x - offsetX, y: p.y - offsetY }
    },
    [zoom, offsetX, offsetY],
  )

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const next = clampZoom(zoom + (e.deltaY < 0 ? 1 : -1))
    if (next !== zoom) setZoom(next)
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    dragState.current = { x: e.clientX, y: e.clientY, moved: false }
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    const d = dragState.current
    if (!d) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) d.moved = true
    if (!d.moved) return
    setCenter((c) => pixelDeltaToLatLng(dx, dy, zoom, c))
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    const d = dragState.current
    dragState.current = null
    // Click (no drag) on the empty map closes the popup
    if (d && !d.moved && e.target === containerRef.current) {
      setPopup(null)
      onSelect?.('')
    }
  }

  const recenter = () => {
    if (data?.bounds) {
      setZoom(zoomForBounds(data.bounds, sizeRef.current.width, sizeRef.current.height))
      setCenter(centerOfBounds(data.bounds))
    } else {
      setZoom(DEFAULT_ZOOM)
      setCenter(DEFAULT_CENTER)
    }
  }

  const sites = (data?.sites ?? []).filter((s) => typeof s.latitude === 'number')
  const guards = (data?.guards ?? []).filter((g) => typeof g.latitude === 'number')
  const incidents = (data?.incidents ?? []).filter((i) => typeof i.latitude === 'number')

  const activeSite = popup?.kind === 'site' ? sites.find((s) => s.id === popup.id) : undefined
  const activeIncident =
    popup?.kind === 'incident' ? incidents.find((i) => i.id === popup.id) : undefined
  const activeGuard = popup?.kind === 'guard' ? guards.find((g) => g.id === popup.id) : undefined

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full touch-none select-none overflow-hidden rounded-lg border border-border bg-[#14161c]',
        compact ? 'h-64' : 'h-full min-h-[460px]',
      )}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => (dragState.current = null)}
      style={{ cursor: dragState.current?.moved ? 'grabbing' : 'grab' }}
    >
      {/* ── OSM tiles (dark-filtered) ── */}
      {tileRange.map(({ x, y }) => (
        <img
          key={`${zoom}-${x}-${y}`}
          src={tileUrl(zoom, x, y)}
          alt=""
          draggable={false}
          className="absolute will-change-transform dark-map-tile"
          style={{
            left: x * TILE_SIZE - offsetX,
            top: y * TILE_SIZE - offsetY,
            width: TILE_SIZE,
            height: TILE_SIZE,
          }}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ))}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/25 via-transparent to-background/10" />

      {/* ── Site markers ── */}
      {showSites &&
        sites.map((site) => {
          const { x, y } = toScreen(site.latitude, site.longitude)
          const active = activeId === site.id || popup?.id === site.id
          return (
            <button
              key={site.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setPopup({ kind: 'site', id: site.id })
                onSelect?.(site.id)
              }}
              style={{ left: x, top: y }}
              className="group absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none"
              aria-label={site.name}
            >
              <span
                className={cn(
                  'absolute inset-0 -m-2.5 rounded-full',
                  site.riskLevel === 'CRITICAL' && 'animate-ping opacity-60',
                )}
                style={{ background: 'var(--color-destructive)' }}
              />
              <span
                className={cn(
                  'relative flex size-4 items-center justify-center rounded-full ring-2 ring-background transition-transform group-hover:scale-125',
                  riskDot[site.riskLevel] ?? riskDot.LOW,
                  active && 'scale-150',
                )}
              />
              <span
                className={cn(
                  'absolute left-1/2 top-5 -translate-x-1/2 whitespace-nowrap rounded border border-border bg-popover px-1.5 py-0.5 font-mono text-[10px] font-medium text-popover-foreground transition-opacity',
                  active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                )}
              >
                {site.name}
              </span>
            </button>
          )
        })}

      {/* ── Guard markers ── */}
      {showGuards &&
        guards.map((guard) => {
          if (!guard.onDuty) return null
          const { x, y } = toScreen(guard.latitude!, guard.longitude!)
          return (
            <button
              key={guard.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setPopup({ kind: 'guard', id: guard.id })
              }}
              style={{ left: x, top: y }}
              className="group absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none"
              aria-label={guard.fullName}
            >
              <span className="absolute inset-0 -m-2 animate-ping rounded-full bg-primary/40" style={{ animationDuration: '2.5s' }} />
              <span className="relative flex size-2.5 items-center justify-center rounded-full bg-primary ring-2 ring-background transition-transform group-hover:scale-125" />
            </button>
          )
        })}

      {/* ── Incident markers ── */}
      {showIncidents &&
        incidents.map((inc) => {
          const { x, y } = toScreen(inc.latitude!, inc.longitude!)
          return (
            <button
              key={inc.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setPopup({ kind: 'incident', id: inc.id })
              }}
              style={{ left: x, top: y }}
              className="group absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none"
              aria-label={inc.title}
            >
              <span
                className={cn(
                  'relative flex size-4 items-center justify-center rounded-sm border-2 ring-2 ring-background transition-transform group-hover:scale-125',
                  severityTone[inc.severity] ?? severityTone.LOW,
                )}
                style={{ transform: 'rotate(45deg)' }}
              >
                <span className="size-1.5 rounded-full bg-background" />
              </span>
            </button>
          )
        })}

      {/* ── Popup ── */}
      {(activeSite || activeIncident || activeGuard) && (
        <div className="absolute bottom-3 left-3 z-20 w-64 rounded-lg border border-border bg-popover p-3 shadow-2xl">
          {activeSite && (
            <>
              <div className="flex items-center justify-between">
                <span className={cn('flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest', `text-${activeSite.riskLevel === 'CRITICAL' ? 'destructive' : activeSite.riskLevel === 'HIGH' ? 'warning' : activeSite.riskLevel === 'MEDIUM' ? 'info' : 'success'}`)}>
                  <span className={cn('size-2 rounded-full', riskDot[activeSite.riskLevel])} />
                  {riskLabel[activeSite.riskLevel]}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {activeSite.guardsOnDuty} on duty
                </span>
              </div>
              <p className="mt-1.5 text-sm font-semibold text-foreground">{activeSite.name}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {activeSite.address}
              </p>
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="size-3" /> {activeSite.guardsOnDuty} guards
                </span>
                <span className="flex items-center gap-1">
                  <AlertTriangle className="size-3" /> {activeSite.openIncidents} open
                </span>
              </div>
              <Link
                href={`/sites/${activeSite.id}`}
                className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-md bg-primary/15 px-2 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/25"
              >
                <ShieldCheck className="size-3.5" /> View site
              </Link>
            </>
          )}
          {activeIncident && (
            <>
              <div className="flex items-center justify-between">
                <span className={cn('flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-foreground')}>
                  <span className={cn('size-2 rounded-sm', severityTone[activeIncident.severity].split(' ')[0])} />
                  {activeIncident.severity} incident
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {timeAgo(activeIncident.reportedAt)}
                </span>
              </div>
              <p className="mt-1.5 line-clamp-2 text-sm font-semibold text-foreground">
                {activeIncident.title}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {activeIncident.siteName} · {activeIncident.status}
              </p>
              <Link
                href={`/incidents/${activeIncident.id}`}
                className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-md bg-destructive/15 px-2 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/25"
              >
                <AlertTriangle className="size-3.5" /> View incident
              </Link>
            </>
          )}
          {activeGuard && (
            <>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                  <span className="size-2 animate-pulse rounded-full bg-primary" />
                  On duty
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  last seen {timeAgo(activeGuard.lastSeen)}
                </span>
              </div>
              <p className="mt-1.5 text-sm font-semibold text-foreground">{activeGuard.fullName}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {activeGuard.siteName ?? 'Unassigned'} · {activeGuard.shift} shift
              </p>
              <Link
                href={`/guards/${activeGuard.id}`}
                className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-md bg-primary/15 px-2 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/25"
              >
                <Navigation className="size-3.5" /> View guard
              </Link>
            </>
          )}
        </div>
      )}

      {/* ── Top-left HUD ── */}
      <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-md border border-border bg-background/80 px-2.5 py-1 backdrop-blur-sm">
        <span className="size-1.5 animate-pulse rounded-full bg-primary" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Live · {sites.length} sites · {guards.filter((g) => g.onDuty).length} on duty ·{' '}
          {incidents.length} incidents
        </span>
      </div>

      {/* ── Zoom controls ── */}
      <div className="absolute right-3 top-3 z-10 flex flex-col overflow-hidden rounded-md border border-border bg-background/80 backdrop-blur-sm">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setZoom((z) => clampZoom(z + 1))
          }}
          aria-label="Zoom in"
          className="flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Plus className="size-4" />
        </button>
        <div className="h-px bg-border" />
        <button
          onClick={(e) => {
            e.stopPropagation()
            setZoom((z) => clampZoom(z - 1))
          }}
          aria-label="Zoom out"
          className="flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Minus className="size-4" />
        </button>
      </div>

      {/* ── Recenter ── */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          recenter()
        }}
        aria-label="Recenter map"
        className="absolute right-3 top-20 z-10 flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background/80 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-accent hover:text-foreground"
      >
        <LocateFixed className="size-4" />
      </button>

      {/* ── Legend + layers ── */}
      <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1.5 rounded-md border border-border bg-background/85 p-2.5 backdrop-blur-sm">
        <button
          onClick={() => setShowSites((v) => !v)}
          className={cn('flex items-center gap-2 text-[11px] transition-colors', showSites ? 'text-foreground' : 'text-muted-foreground line-through')}
        >
          <MapPin className="size-3 text-primary" /> Sites by risk
        </button>
        <button
          onClick={() => setShowGuards((v) => !v)}
          className={cn('flex items-center gap-2 text-[11px] transition-colors', showGuards ? 'text-foreground' : 'text-muted-foreground line-through')}
        >
          <span className="size-2 rounded-full bg-primary ring-2 ring-background" /> On-duty guards
        </button>
        <button
          onClick={() => setShowIncidents((v) => !v)}
          className={cn('flex items-center gap-2 text-[11px] transition-colors', showIncidents ? 'text-foreground' : 'text-muted-foreground line-through')}
        >
          <span className="size-2 rotate-45 rounded-[2px] bg-destructive ring-1 ring-background" /> Incidents
        </button>
        <div className="mt-1 flex items-center gap-1.5 border-t border-border pt-1.5">
          {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((level) => (
            <span
              key={level}
              title={riskLabel[level]}
              className={cn('size-2 rounded-full', riskDot[level])}
            />
          ))}
          <span className="ml-0.5 font-mono text-[9px] text-muted-foreground">risk scale</span>
        </div>
      </div>

      {/* ── Attribution ── */}
      <a
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-0.5 left-1 z-10 font-mono text-[8px] text-muted-foreground/60 hover:text-muted-foreground"
      >
        © OpenStreetMap
      </a>

      {/* Empty state */}
      {sites.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <MapPin className="size-8 opacity-30" />
          <p className="text-sm">No sites with coordinates yet</p>
        </div>
      )}
    </div>
  )
}
