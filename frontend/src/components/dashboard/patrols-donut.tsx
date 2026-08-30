'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

const fallback = { total: 0, completed: 0, rate: 0 }

export function PatrolsDonut() {
  const { data } = useQuery({
    queryKey: ['patrol-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/patrol-stats')
      return res.data
    },
    placeholderData: fallback,
    staleTime: 60000,
  })

  const stats = data ?? fallback
  const total = Math.max(stats.total ?? 0, 0)
  const completed = Math.min(stats.completed ?? 0, total)
  const remaining = Math.max(total - completed, 0)
  const rate = stats.rate ?? (total > 0 ? Math.round((completed / total) * 100) : 0)

  const segments = [
    { label: 'Completed', value: completed, color: 'var(--success)', dot: 'bg-success' },
    { label: 'In Progress', value: remaining, color: 'var(--info)', dot: 'bg-info' },
  ].filter((seg) => seg.value > 0)

  let acc = 0
  const stops = segments
    .map((seg) => {
      const start = (acc / Math.max(total, 1)) * 100
      acc += seg.value
      const end = (acc / Math.max(total, 1)) * 100
      return `${seg.color} ${start}% ${end}%`
    })
    .join(', ')

  return (
    <section className="flex flex-col rounded-lg border border-border bg-card">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Last 7 days
          </p>
          <h2 className="mt-0.5 text-sm font-semibold">Patrols Overview</h2>
        </div>
      </header>
      <div className="flex items-center gap-5 p-4">
        <div className="relative shrink-0" style={{ width: 128, height: 128 }}>
          <div
            className="donut-ring size-full rounded-full"
            style={{ background: stops ? `conic-gradient(${stops})` : undefined }}
          />
          <div className="absolute inset-[14px] flex flex-col items-center justify-center rounded-full bg-card">
            <span className="font-mono text-2xl font-semibold tabular-nums">{total}</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Total</span>
          </div>
        </div>
        <ul className="flex-1 space-y-2.5">
          {segments.map((seg) => (
            <li key={seg.label} className="flex items-center gap-2 text-sm">
              <span className={cn('size-2.5 rounded-sm', seg.dot)} />
              <span className="text-muted-foreground">{seg.label}</span>
              <span className="ml-auto font-mono tabular-nums">{seg.value}</span>
            </li>
          ))}
          <li className="flex items-center gap-2 text-sm">
            <span className="size-2.5 rounded-sm bg-primary" />
            <span className="text-muted-foreground">Completion</span>
            <span className="ml-auto font-mono tabular-nums text-primary">{rate}%</span>
          </li>
        </ul>
      </div>
    </section>
  )
}
