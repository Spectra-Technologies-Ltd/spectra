'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

interface ActivityItem {
  type: string
  text: string
  time: string
}

const kindColor: Record<string, string> = {
  ok: 'bg-success',
  alert: 'bg-destructive',
  warn: 'bg-warning',
  info: 'bg-info',
}

function kindFor(type: string): string {
  const t = (type || '').toLowerCase()
  if (t === 'incident') return 'alert'
  if (t === 'patrol') return 'ok'
  if (t === 'report') return 'warn'
  return 'info'
}

function timeLabel(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

const fallback: ActivityItem[] = [
  { type: 'patrol', text: 'Patrol completed — Site A', time: new Date().toISOString() },
  { type: 'attendance', text: 'Guard checked in — Main Gate', time: new Date().toISOString() },
]

export function ActivityTimeline() {
  const { data } = useQuery({
    queryKey: ['activity-timeline'],
    queryFn: async () => {
      const res = await api.get('/dashboard/recent-activities')
      return res.data
    },
    staleTime: 30000,
  })

  const activities: ActivityItem[] = data?.length > 0 ? data.slice(0, 6) : fallback

  return (
    <section className="flex flex-col rounded-lg border border-border bg-card">
      <header className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">Activity Log</h2>
      </header>
      <ol className="relative px-4 py-4">
        <span className="absolute bottom-4 left-[1.15rem] top-4 w-px bg-border" aria-hidden />
        {activities.map((item, i) => (
          <li
            key={`${item.text}-${i}`}
            style={{ '--i': i } as React.CSSProperties}
            className="stagger-item relative flex gap-3 pb-4 last:pb-0"
          >
            <span
              className={cn(
                'z-10 mt-1 size-2.5 shrink-0 rounded-full ring-4 ring-card',
                kindColor[kindFor(item.type)] ?? kindColor.info,
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug text-foreground">{item.text}</p>
              <span className="font-mono text-[11px] text-muted-foreground">
                {timeLabel(item.time)}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
