'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  AlertTriangle, Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState, LoadingState } from '@/components/ui/EmptyState';

interface Incident {
  id: string;
  title: string;
  incidentType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: string;
  reportedAt: string;
  site: { name: string };
  reporter: { firstName: string; lastName: string };
}

interface IncidentsResponse {
  data: Incident[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export default function IncidentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery<IncidentsResponse>({
    queryKey: ['incidents', page, search],
    queryFn: async () => {
      const res = await api.get('/incidents', { params: { page, limit: 20, search } });
      return res.data;
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'MEDIUM': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'HIGH': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'CRITICAL': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-primary" /> Incidents
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track and manage security incidents across all sites.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/20">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search incidents..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>

        {isLoading ? (
          <LoadingState label="Loading incidents..." />
        ) : data?.data?.length === 0 ? (
          <EmptyState icon={AlertTriangle} title="No incidents found." />
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-secondary/50 text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-medium tracking-wider">Title</th>
                    <th className="px-6 py-4 font-medium tracking-wider">Type</th>
                    <th className="px-6 py-4 font-medium tracking-wider">Severity</th>
                    <th className="px-6 py-4 font-medium tracking-wider">Site</th>
                    <th className="px-6 py-4 font-medium tracking-wider">Reporter</th>
                    <th className="px-6 py-4 font-medium tracking-wider">Status</th>
                    <th className="px-6 py-4 font-medium tracking-wider">Reported At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data?.data?.map((incident: Incident) => (
                    <tr key={incident.id} className="hover:bg-secondary/30 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="font-medium text-foreground group-hover:text-primary transition-colors cursor-pointer">
                          {incident.title}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-foreground capitalize">{incident.incidentType}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge colorClassName={getSeverityColor(incident.severity)}>{incident.severity}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-foreground">{incident.site.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-foreground">
                          {incident.reporter.firstName} {incident.reporter.lastName}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-foreground capitalize">{incident.status}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-foreground text-sm">
                          {format(new Date(incident.reportedAt), 'MMM dd, yyyy')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-border">
              {data?.data?.map((incident: Incident) => (
                <div key={incident.id} className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-foreground truncate">{incident.title}</span>
                    <Badge colorClassName={getSeverityColor(incident.severity)}>{incident.severity}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 capitalize">
                    {incident.incidentType.toLowerCase()} · {incident.site.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Reported by {incident.reporter.firstName} {incident.reporter.lastName} on{' '}
                    {format(new Date(incident.reportedAt), 'MMM dd, yyyy')}
                  </p>
                  <p className="text-xs text-foreground mt-1 capitalize">Status: {incident.status.toLowerCase()}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {data?.meta && (
          <Pagination
            page={page}
            totalPages={data.meta.pages}
            currentCount={data.data.length}
            totalCount={data.meta.total}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(data.meta.pages, p + 1))}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
