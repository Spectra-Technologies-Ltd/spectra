'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  MapPin, Search, Plus, Filter, MoreVertical, ChevronLeft, ChevronRight, AlertTriangle, Users,
  X, Edit, Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Site {
  id: string;
  name: string;
  address: string;
  riskLevel: string;
  targetGuards: number;
  client: { id: string; companyName: string };
  _count: { guards: number; incidents: number };
}

const RISK_LEVELS = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function SitesDirectoryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [showFilter, setShowFilter] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['sites', page, search, riskFilter],
    queryFn: async () => {
      const params: any = { page, limit: 10, search };
      if (riskFilter !== 'ALL') params.risk = riskFilter;
      const res = await api.get('/sites', { params });
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (siteId: string) => api.delete(`/sites/${siteId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      setOpenMenu(null);
    },
  });

  const getRiskLevelColor = (level: string) => {
    switch (level) {
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
            <MapPin className="h-6 w-6 text-primary" /> Deployed Sites
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitor and manage active security deployment locations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
              showFilter ? "bg-primary/10 text-primary border-primary/30" : "bg-secondary text-foreground border-border hover:bg-secondary/80"
            )}
          >
            <Filter className="h-4 w-4" /> Filter
            {riskFilter !== 'ALL' && (
              <span className="h-4 min-w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center px-1">1</span>
            )}
          </button>
          <button
            onClick={() => router.push('/sites/add')}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(139,92,246,0.3)]"
          >
            <Plus className="h-4 w-4" /> Add Site
          </button>
        </div>
      </div>

      {showFilter && (
        <div className="mb-4 p-4 rounded-xl border border-border bg-card flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Risk Level:</span>
          {RISK_LEVELS.map((r) => (
            <button
              key={r}
              onClick={() => { setRiskFilter(r); setPage(1); }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                riskFilter === r ? "bg-primary/10 text-primary border-primary/30" : "bg-secondary text-muted-foreground border-border hover:text-foreground"
              )}
            >
              {r === 'ALL' ? 'All' : r}
            </button>
          ))}
          {riskFilter !== 'ALL' && (
            <button onClick={() => setRiskFilter('ALL')} className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/20">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search locations or addresses..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium tracking-wider">Site Location</th>
                <th className="px-6 py-4 font-medium tracking-wider">Associated Client</th>
                <th className="px-6 py-4 font-medium tracking-wider">Risk Level</th>
                <th className="px-6 py-4 font-medium tracking-wider">Manning Level</th>
                <th className="px-6 py-4 font-medium tracking-wider">Recent Incidents</th>
                <th className="px-6 py-4 font-medium tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Loading sites...
                    </div>
                  </td>
                </tr>
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No sites found matching your criteria.</p>
                  </td>
                </tr>
              ) : (
                data?.data?.map((site: Site) => (
                  <tr key={site.id} className="hover:bg-secondary/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground group-hover:text-primary transition-colors cursor-pointer">{site.name}</span>
                        <span className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">{site.address}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{site.client?.companyName}</td>
                    <td className="px-6 py-4">
                      <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider', getRiskLevelColor(site.riskLevel))}>
                        {site.riskLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-secondary px-2 py-1 rounded">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className={cn("text-xs font-medium", site._count.guards < site.targetGuards ? "text-amber-400" : "text-emerald-400")}>
                            {site._count.guards} / {site.targetGuards}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <AlertTriangle className={cn("h-4 w-4", site._count.incidents > 0 ? "text-rose-400" : "text-muted-foreground/30")} />
                        <span className={site._count.incidents > 0 ? "text-rose-400 font-medium" : "text-muted-foreground"}>{site._count.incidents}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === site.id ? null : site.id)}
                        className="text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-secondary transition-colors"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {openMenu === site.id && (
                        <div ref={menuRef} className="absolute right-0 top-full mt-1 w-36 rounded-lg border border-border bg-card shadow-xl z-50 py-1">
                          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary/50 transition-colors">
                            <Edit className="h-4 w-4 text-muted-foreground" /> Edit
                          </button>
                          <button
                            onClick={() => { if (confirm('Delete this site?')) deleteMutation.mutate(site.id); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data?.meta && (
          <div className="border-t border-border p-4 flex items-center justify-between bg-secondary/10">
            <span className="text-xs text-muted-foreground">
              Showing <span className="font-medium text-foreground">{data.data.length}</span> of <span className="font-medium text-foreground">{data.meta.total}</span> entries
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-medium px-2 text-foreground">Page {page} of {data.meta.pages}</span>
              <button onClick={() => setPage((p) => Math.min(data.meta.pages, p + 1))} disabled={page === data.meta.pages || data.meta.pages === 0} className="p-1.5 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
