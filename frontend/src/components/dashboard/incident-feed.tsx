'use client'

import { ChevronRight, MapPin, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface IncidentRow {
  id: string
  title: string
  severity: string
  status: string
  reportedAt: string
  site?: { name: string }
  assignee?: { firstName: string; lastName: string }
}

const severityMeta: Record<string, { label: string; className: string; dot: string }> = {
  CRITICAL: { label: 'Critical', className: 'bg-destructive/15 text-destructive border-destructive/30', dot: 'bg-destructive' },
  HIGH: { label: 'High', className: 'bg-warning/15 text-warning border-warning/30', dot: 'bg-warning' },
  MEDIUM: { label: 'Medium', className: 'bg-info/15 text-info border-info/30', dot: 'bg-info' },
  LOW: { label: 'Low', className: 'bg-muted text-muted-foreground border-border', dot: 'bg-muted-foreground' },
}

const statusMeta: Record<string, { label: string; className: string }> = {
  OPEN: { label: 'Open', className: 'bg-destructive/15 text-destructive border-destructive/30' },
  INVESTIGATING: { label: 'Investigating', className: 'bg-warning/15 text-warning border-warning/30' },
  CONTAINED: { label: 'Contained', className: 'bg-info/15 text-info border-info/30' },
  RESOLVED: { label: 'Resolved', className: 'bg-success/15 text-success border-success/30' },
  CLOSED: { label: 'Closed', className: 'bg-success/15 text-success border-success/30' },
}

function timeAgo(iso: string): string {
  const diffMins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const hrs = Math.floor(diffMins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function IncidentFeed() {
  const { data } = useQuery({
    queryKey: ['incident-feed'],
    queryFn: async () => {
      const res = await api.get('/incidents', { params: { limit: 5 } })
      return res.data
    },
    staleTime: 30000,
  })

  const incidents: IncidentRow[] = data?.data ?? []

  return (
    <section className="flex flex-col rounded-lg border border-border bg-card">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-destructive" />
          </span>
          <h2 className="text-sm font-semibold">Live Incident Feed</h2>
        </div>
        <Link
          href="/incidents"
          className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary"
        >
          View all <ChevronRight className="size-3" />
        </Link>
      </header>
      {incidents.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center text-muted-foreground">
          <ShieldAlert className="size-8 opacity-30" />
          <p className="text-sm">No incidents reported</p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {incidents.map((inc, i) => {
            const sev = severityMeta[inc.severity] ?? severityMeta.LOW
            const status = statusMeta[inc.status] ?? statusMeta.OPEN
            const assignee = inc.assignee
              ? `${inc.assignee.firstName?.[0] ?? ''}${inc.assignee.lastName?.[0] ?? ''}`
              : '—'
            return (
              <li
                key={inc.id}
                style={{ '--i': i } as React.CSSProperties}
                className="stagger-item flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent/40"
              >
                <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', sev.dot)} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {inc.id.slice(0, 8).toUpperCase()}
                    </span>
                    <Badge colorClassName={status.className}>{status.label}</Badge>
                  </div>
                  <p className="mt-0.5 truncate text-sm font-medium">{inc.title}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3" />
                      {inc.site?.name ?? '—'}
                    </span>
                    <span>·</span>
                    <span>{assignee}</span>
                  </div>
                </div>
                <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                  {timeAgo(inc.reportedAt)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
