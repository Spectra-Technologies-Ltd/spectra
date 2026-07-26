'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  AlertTriangle, Search, Plus, MoreVertical, Trash2, Edit, ClipboardList,
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
  site: { id: string; name: string };
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const deleteMutation = useMutation({
    mutationFn: (incidentId: string) => api.delete(`/incidents/${incidentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      setOpenMenu(null);
    },
  });

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
        <button
          onClick={() => router.push('/incidents/add')}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(139,92,246,0.3)]"
        >
          <Plus className="h-4 w-4" /> Report Incident
        </button>
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
                    <th className="px-6 py-4 font-medium tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data?.data?.map((incident: Incident) => (
                    <tr key={incident.id} className="hover:bg-secondary/30 transition-colors group">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => router.push(`/incidents/${incident.id}`)}
                          className="font-medium text-foreground hover:text-primary transition-colors text-left"
                        >
                          {incident.title}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-foreground capitalize">{incident.incidentType}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge colorClassName={getSeverityColor(incident.severity)}>{incident.severity}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/sites/${incident.site.id}`}
                          className="text-foreground hover:text-primary transition-colors"
                        >
                          {incident.site.name}
                        </Link>
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
                      <td className="px-6 py-4 text-right relative">
                        <button
                          onClick={() => setOpenMenu(openMenu === incident.id ? null : incident.id)}
                          className="text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-secondary transition-colors"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {openMenu === incident.id && (
                          <div
                            ref={menuRef}
                            className="absolute right-0 top-full mt-1 w-44 rounded-lg border border-border bg-card shadow-xl z-50 py-1"
                          >
                            <button
                              onClick={() => { router.push(`/incidents/${incident.id}`); setOpenMenu(null); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                            >
                              <Edit className="h-4 w-4 text-muted-foreground" /> View Details
                            </button>
                            <button
                              onClick={() => { if (confirm('Delete this incident?')) deleteMutation.mutate(incident.id); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" /> Delete
                            </button>
                          </div>
                        )}
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
                    <button
                      onClick={() => router.push(`/incidents/${incident.id}`)}
                      className="font-medium text-foreground hover:text-primary transition-colors text-left truncate"
                    >
                      {incident.title}
                    </button>
                    <Badge colorClassName={getSeverityColor(incident.severity)}>{incident.severity}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 capitalize">
                    {incident.incidentType.toLowerCase()} · <Link href={`/sites/${incident.site.id}`} className="hover:text-primary transition-colors">{incident.site.name}</Link>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Reported by {incident.reporter.firstName} {incident.reporter.lastName} on{' '}
                    {format(new Date(incident.reportedAt), 'MMM dd, yyyy')}
                  </p>
                  <p className="text-xs text-foreground mt-1 capitalize">Status: {incident.status.toLowerCase()}</p>
                  <div className="relative mt-2">
                    <button
                      onClick={() => setOpenMenu(openMenu === incident.id ? null : incident.id)}
                      className="text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-secondary transition-colors text-xs flex items-center gap-1"
                    >
                      <MoreVertical className="h-3.5 w-3.5" /> Actions
                    </button>
                    {openMenu === incident.id && (
                      <div
                        ref={menuRef}
                        className="absolute left-0 top-full mt-1 w-44 rounded-lg border border-border bg-card shadow-xl z-50 py-1"
                      >
                        <button
                          onClick={() => { router.push(`/incidents/${incident.id}`); setOpenMenu(null); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                        >
                          <Edit className="h-4 w-4 text-muted-foreground" /> View Details
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await api.patch(`/incidents/${incident.id}/status`, { status: 'RESOLVED', resolutionNotes: 'Resolved by admin' });
                              queryClient.invalidateQueries({ queryKey: ['incidents'] });
                            } catch {}
                            setOpenMenu(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                        >
                          <ClipboardList className="h-4 w-4" /> Mark Resolved
                        </button>
                        <button
                          onClick={() => { if (confirm('Delete this incident?')) deleteMutation.mutate(incident.id); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
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
