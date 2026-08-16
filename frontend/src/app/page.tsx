import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { KpiCards } from '@/components/dashboard/kpi-cards'
import { IncidentFeed } from '@/components/dashboard/incident-feed'
import { ActivityTimeline } from '@/components/dashboard/activity-timeline'
import { PersonnelStatus } from '@/components/dashboard/personnel-status'
import { MapCanvas } from '@/components/dashboard/map-canvas'

export default function OverviewPage() {
  return (
    <main className="flex-1 space-y-4">
      <KpiCards />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <section className="flex flex-col rounded-lg border border-border bg-card">
            <header className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">Regional Deployment</h2>
              <Link
                href="/map"
                className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary"
              >
                Open map <ChevronRight className="size-3" />
              </Link>
            </header>
            <div className="p-3">
              <MapCanvas compact />
            </div>
          </section>
          <IncidentFeed />
        </div>

        <div className="flex flex-col gap-4">
          <PersonnelStatus />
          <ActivityTimeline />
        </div>
      </div>
    </main>
  )
}
