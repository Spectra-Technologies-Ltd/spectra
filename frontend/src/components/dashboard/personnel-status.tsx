'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

const fallbackStats = {
  totalGuards: 128,
  activeGuards: 6,
  onLeaveGuards: 0,
  suspendedGuards: 0,
}

export function PersonnelStatus() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats')
      return res.data
    },
    placeholderData: fallbackStats,
    staleTime: 30000,
  })

  const s = stats ?? fallbackStats
  const total = Math.max(s.totalGuards, 1)
  const offDuty = Math.max(total - s.activeGuards - s.onLeaveGuards - s.suspendedGuards, 0)

  const segments = [
    { label: 'On Duty', value: s.activeGuards, color: 'var(--success)', dot: 'bg-success' },
    { label: 'On Leave', value: s.onLeaveGuards, color: 'var(--info)', dot: 'bg-info' },
    { label: 'Suspended', value: s.suspendedGuards, color: 'var(--destructive)', dot: 'bg-destructive' },
    { label: 'Off Duty', value: offDuty, color: 'var(--muted-foreground)', dot: 'bg-muted-foreground' },
  ].filter((seg) => seg.value > 0)

  let acc = 0
  const stops = segments
    .map((seg) => {
      const start = (acc / total) * 100
      acc += seg.value
      const end = (acc / total) * 100
      return `${seg.color} ${start}% ${end}%`
    })
    .join(', ')

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-sm font-semibold">Personnel Readiness</h2>
      <div className="mt-4 flex items-center gap-5">
        <div className="relative shrink-0" style={{ width: 116, height: 116 }}>
          <div
            className="donut-ring size-full rounded-full"
            style={{ background: stops ? `conic-gradient(${stops})` : undefined }}
          />
          <div className="absolute inset-[14px] flex flex-col items-center justify-center rounded-full bg-card">
            <span className="font-mono text-2xl font-semibold tabular-nums">{s.activeGuards}</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Deployed</span>
          </div>
        </div>
        <ul className="flex-1 space-y-2">
          {segments.map((seg) => (
            <li key={seg.label} className="flex items-center gap-2 text-sm">
              <span className={cn('size-2.5 rounded-sm', seg.dot)} />
              <span className="text-muted-foreground">{seg.label}</span>
              <span className="ml-auto font-mono tabular-nums">{seg.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
