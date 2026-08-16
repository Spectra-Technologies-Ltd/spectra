'use client'

import Link from 'next/link'
import { UserCheck, Route, AlertTriangle, Building2, FileText, ArrowUpRight } from 'lucide-react'

const actions = [
  { label: 'Add Guard', href: '/guards/add', icon: UserCheck, tone: 'bg-info/15 text-info' },
  { label: 'Create Patrol', href: '/patrols', icon: Route, tone: 'bg-primary/15 text-primary' },
  { label: 'Report Incident', href: '/incidents/add', icon: AlertTriangle, tone: 'bg-destructive/15 text-destructive' },
  { label: 'Add Client', href: '/clients/add', icon: Building2, tone: 'bg-success/15 text-success' },
  { label: 'Open Reports', href: '/reports', icon: FileText, tone: 'bg-warning/15 text-warning' },
]

export function QuickActions() {
  return (
    <section className="flex flex-col rounded-lg border border-border bg-card">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Shortcuts
          </p>
          <h2 className="mt-0.5 text-sm font-semibold">Quick Actions</h2>
        </div>
      </header>
      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-5">
        {actions.map((action, i) => {
          const Icon = action.icon
          return (
            <Link
              key={action.label}
              href={action.href}
              style={{ '--i': i } as React.CSSProperties}
              className="stagger-item card-lift group flex min-h-[92px] flex-col items-center justify-center gap-2.5 rounded-lg border border-border bg-secondary/30 p-3 text-center hover:border-primary/40"
            >
              <span className={`flex size-9 items-center justify-center rounded-md ${action.tone} transition-transform group-hover:scale-110`}>
                <Icon className="size-4" />
              </span>
              <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground group-hover:text-foreground">
                {action.label}
              </span>
              <ArrowUpRight className="absolute right-2.5 top-2.5 size-3.5 opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground" />
            </Link>
          )
        })}
      </div>
    </section>
  )
}
