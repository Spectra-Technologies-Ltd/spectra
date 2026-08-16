'use client'

import Link from 'next/link'
import { ChevronRight, ShieldAlert } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

const typeLabels: Record<string, string> = {
  THEFT: 'Theft',
  TRESPASS: 'Unauthorized Access',
  ASSAULT: 'Assault',
  FIRE: 'Fire',
  MEDICAL: 'Medical',
  ASSET_DAMAGE: 'Equipment Damage',
  OTHER: 'Other',
}

const typeTone: Record<string, string> = {
  THEFT: 'bg-destructive',
  TRESPASS: 'bg-warning',
  ASSAULT: 'bg-destructive',
  FIRE: 'bg-warning',
  MEDICAL: 'bg-info',
  ASSET_DAMAGE: 'bg-info',
  OTHER: 'bg-muted-foreground',
}

export function IncidentsByType() {
  const { data } = useQuery({
    queryKey: ['incidents-by-type'],
    queryFn: async () => {
      const res = await api.get('/dashboard/incidents-by-type')
      return res.data
    },
    placeholderData: [],
    staleTime: 60000,
  })

  const items: { type: string; count: number }[] = data?.length > 0 ? data.slice(0, 4) : []
  const max = Math.max(...items.map((i) => i.count), 1)

  return (
    <section className="flex flex-col rounded-lg border border-border bg-card">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            By type
          </p>
          <h2 className="mt-0.5 text-sm font-semibold">Incidents</h2>
        </div>
        <Link
          href="/incidents"
          className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary"
        >
          View all <ChevronRight className="size-3" />
        </Link>
      </header>
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center text-muted-foreground">
          <ShieldAlert className="size-8 opacity-30" />
          <p className="text-sm">No incidents reported</p>
        </div>
      ) : (
        <ul className="space-y-3 p-4">
          {items.map((item, i) => (
            <li key={item.type} style={{ '--i': i } as React.CSSProperties} className="stagger-item">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-muted-foreground">
                  {typeLabels[item.type] ?? item.type}
                </span>
                <span className="font-mono tabular-nums">{item.count}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn('h-full rounded-full', typeTone[item.type] ?? 'bg-muted-foreground')}
                  style={{ width: `${Math.max((item.count / max) * 100, 8)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
