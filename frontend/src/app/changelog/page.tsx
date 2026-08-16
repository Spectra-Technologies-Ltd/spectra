import DashboardLayout from '@/components/layout/DashboardLayout';
import { Sparkles } from 'lucide-react';

const releases = [
  {
    version: '2.1.0',
    date: 'August 2026',
    title: 'Command Center Redesign',
    items: [
      'New charcoal-navy command-center theme with signal-amber accents',
      'Light & dark theme toggle with saved preference',
      'Live tactical map with real site deployments and risk scoring',
      '⌘K command palette with global search across guards, clients, sites and incidents',
      'Guard performance scores computed from attendance and patrol data',
      'Security Center: full audit trail of every platform action',
      'Payroll-ready attendance CSV export',
      'Client data export and executive summary PDFs',
      'Incident evidence photo uploads',
      'SOS panic alert from the field app',
    ],
  },
  {
    version: '2.0.0',
    date: 'July 2026',
    title: 'Operations Intelligence Platform',
    items: [
      'Unified dashboard with live incident feed and activity timeline',
      'Personnel readiness donut from live guard statuses',
      'iOS PWA fixes and mobile login reliability',
      'Request-a-demo flow with lead capture',
    ],
  },
  {
    version: '1.0.0',
    date: 'June 2026',
    title: 'Initial Release',
    items: [
      'Guard, client, site, attendance, patrol and incident management',
      'Daily/weekly PDF report generation',
      'GPS-verified check-in/check-out',
      'Role-based access control',
    ],
  },
];

export default function ChangelogPage() {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
          Product Updates
        </p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-foreground">
          <Sparkles className="h-6 w-6 text-primary" /> What&apos;s New
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Every release, documented. BastionOS ships continuously.
        </p>
      </div>

      <div className="max-w-3xl">
        {releases.map((release) => (
          <div key={release.version} className="relative border-l border-border pb-10 pl-6 last:pb-0">
            <span className="absolute -left-[5px] top-1 size-2.5 rounded-full bg-primary ring-4 ring-card" />
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="font-mono text-sm font-bold text-foreground">
                v{release.version}
              </h2>
              <span className="font-mono text-xs text-muted-foreground">{release.date}</span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-primary">
                {release.title}
              </span>
            </div>
            <ul className="mt-3 space-y-1.5">
              {release.items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground/60" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
