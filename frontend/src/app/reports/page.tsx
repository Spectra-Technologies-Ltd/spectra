'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { FileText, Download, MapPin, Building2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Site {
  id: string;
  name: string;
  address: string;
  riskLevel: string;
  client: { companyName: string };
}

const getRiskLevelColor = (level: string) => {
  switch (level) {
    case 'LOW': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    case 'MEDIUM': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    case 'HIGH': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    case 'CRITICAL': return 'bg-red-500/10 text-red-500 border-red-500/20';
    default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
  }
};

export default function ReportsPage() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['reports-sites'],
    queryFn: async () => {
      const res = await api.get('/sites', { params: { limit: 100 } });
      return res.data;
    },
  });

  const downloadPdf = async (siteId: string, siteName: string) => {
    setDownloading(siteId);
    try {
      const res = await api.get(`/reports/site/${siteId}/daily/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Spectra_Report_${siteName}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download report. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const sites: Site[] = data?.data ?? [];
  const isDownloading = (id: string) => downloading === id;

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" /> Reports Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Download daily PDF reports for deployed sites.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-3" />
          <p>Loading sites...</p>
        </div>
      ) : sites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <MapPin className="h-12 w-12 mb-3 opacity-20" />
          <p>No sites available for reports.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map((site) => (
            <div
              key={site.id}
              className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {site.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{site.client?.companyName}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-1.5 text-xs text-muted-foreground mb-4">
                <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{site.address}</span>
              </div>

              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider',
                    getRiskLevelColor(site.riskLevel),
                  )}
                >
                  {site.riskLevel}
                </span>

                <button
                  onClick={() => downloadPdf(site.id, site.name)}
                  disabled={isDownloading(site.id)}
                  className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(139,92,246,0.3)] disabled:opacity-50"
                >
                  {isDownloading(site.id) ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  Download Daily PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
