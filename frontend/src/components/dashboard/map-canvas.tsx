'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

interface SiteMarker {
  id: string
  name: string
  riskLevel: string
  x: number
  y: number
}

const riskDot: Record<string, string> = {
  LOW: 'bg-success',
  MEDIUM: 'bg-info',
  HIGH: 'bg-warning',
  CRITICAL: 'bg-destructive',
}

export function MapCanvas({
  compact = false,
  activeId,
  onSelect,
}: {
  compact?: boolean
  activeId?: string
  onSelect?: (id: string) => void
}) {
  const { data } = useQuery({
    queryKey: ['map-sites'],
    queryFn: async () => {
      const res = await api.get('/sites', { params: { limit: 100 } })
      return res.data
    },
    staleTime: 60000,
  })

  const sites: SiteMarker[] = (data?.data ?? []).map((site: { id: string; name: string; riskLevel: string }, i: number) => ({
    id: site.id,
    name: site.name,
    riskLevel: site.riskLevel ?? 'LOW',
    x: 14 + ((i * 7) % 72),
    y: 18 + ((i * 11) % 64),
  }))

  // If sites carry GPS coordinates, project them onto the map within bounds
  const withCoords = (data?.data ?? []).filter(
    (s: { latitude?: number; longitude?: number }) =>
      typeof s.latitude === 'number' && typeof s.longitude === 'number',
  )
  let projected: SiteMarker[] | null = null
  if (withCoords.length > 0) {
    const lats = withCoords.map((s: { latitude: number }) => s.latitude)
    const lngs = withCoords.map((s: { longitude: number }) => s.longitude)
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)
    const latSpan = Math.max(maxLat - minLat, 0.001)
    const lngSpan = Math.max(maxLng - minLng, 0.001)
    projected = withCoords.map((s: { id: string; name: string; riskLevel: string; latitude: number; longitude: number }) => ({
      id: s.id,
      name: s.name,
      riskLevel: s.riskLevel ?? 'LOW',
      x: 12 + ((s.longitude - minLng) / lngSpan) * 76,
      y: 12 + ((maxLat - s.latitude) / latSpan) * 76,
    }))
  }
  const markers = projected ?? sites

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-lg border border-border bg-card',
        compact ? 'h-64' : 'h-full min-h-[420px]',
      )}
    >
      {/* Map backdrop */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-60"
        style={{ backgroundImage: 'url(/tactical-map.png)' }}
        aria-hidden
      />
      <div className="absolute inset-0 grid-texture opacity-40" aria-hidden />
      <div className="absolute inset-0 scanline" aria-hidden />
      <div
        className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-background/30"
        aria-hidden
      />

      {/* Corner brackets */}
      <div className="pointer-events-none absolute left-3 top-3 size-5 border-l-2 border-t-2 border-primary/50" />
      <div className="pointer-events-none absolute right-3 top-3 size-5 border-r-2 border-t-2 border-primary/50" />
      <div className="pointer-events-none absolute bottom-3 left-3 size-5 border-b-2 border-l-2 border-primary/50" />
      <div className="pointer-events-none absolute bottom-3 right-3 size-5 border-b-2 border-r-2 border-primary/50" />

      {/* Site markers */}
      {markers.map((site) => {
        const active = activeId === site.id
        const dot = riskDot[site.riskLevel] ?? riskDot.LOW
        return (
          <button
            key={site.id}
            type="button"
            onClick={() => onSelect?.(site.id)}
            style={{ left: `${site.x}%`, top: `${site.y}%` }}
            className="group absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none"
            aria-label={site.name}
          >
            <span className={cn('absolute inset-0 -m-2 rounded-full', site.riskLevel === 'HIGH' && 'animate-pulse-ring')} />
            <span
              className={cn(
                'relative flex size-3.5 items-center justify-center rounded-full ring-2 ring-background transition-transform group-hover:scale-125',
                dot,
                active && 'scale-150',
              )}
            />
            {!compact && (
              <span
                className={cn(
                  'absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap rounded border border-border bg-popover px-1.5 py-0.5 font-mono text-[10px] font-medium text-popover-foreground transition-opacity',
                  active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                )}
              >
                {site.name}
              </span>
            )}
          </button>
        )
      })}

      {/* HUD label */}
      <div className="absolute left-4 top-4 flex items-center gap-2 rounded-md border border-border bg-background/70 px-2.5 py-1 backdrop-blur-sm">
        <span className="size-1.5 animate-pulse rounded-full bg-primary" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Live · {markers.length} sites tracked
        </span>
      </div>
    </div>
  )
}
