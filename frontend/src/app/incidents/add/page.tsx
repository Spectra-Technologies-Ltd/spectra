'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { ArrowLeft, Save, Loader2, AlertTriangle } from 'lucide-react';

const INCIDENT_TYPES = ['THEFT', 'TRESPASS', 'ASSAULT', 'FIRE', 'MEDICAL', 'ASSET_DAMAGE', 'OTHER'];
const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function AddIncidentPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    type: 'THEFT',
    severity: 'MEDIUM',
    siteId: '',
    description: '',
    latitude: 0,
    longitude: 0,
  });

  const { data: sites } = useQuery({
    queryKey: ['add-incident-sites'],
    queryFn: async () => {
      const res = await api.get('/sites', { params: { limit: 100 } });
      return res.data;
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post('/incidents', form);
    },
    onSuccess: () => router.push('/incidents'),
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to create incident';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    mutation.mutate();
  };

  return (
    <DashboardLayout>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <AlertTriangle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Report an Incident</h1>
            <p className="text-sm text-muted-foreground">Log a new security incident</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Incident Details</h2>

            <div>
              <label htmlFor="title" className="block text-xs font-medium text-muted-foreground mb-1">
                Title <span className="text-destructive">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                placeholder="Brief description of the incident"
                value={form.title}
                onChange={handleChange}
                className="w-full rounded-lg bg-secondary/50 border border-border px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="type" className="block text-xs font-medium text-muted-foreground mb-1">
                  Incident Type <span className="text-destructive">*</span>
                </label>
                <select
                  id="type"
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full rounded-lg bg-secondary/50 border border-border px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
                >
                  {INCIDENT_TYPES.map((t) => (
                    <option key={t} value={t}>{t.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="severity" className="block text-xs font-medium text-muted-foreground mb-1">
                  Severity <span className="text-destructive">*</span>
                </label>
                <select
                  id="severity"
                  name="severity"
                  value={form.severity}
                  onChange={handleChange}
                  className="w-full rounded-lg bg-secondary/50 border border-border px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
                >
                  {SEVERITIES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="siteId" className="block text-xs font-medium text-muted-foreground mb-1">
                Site <span className="text-destructive">*</span>
              </label>
              <select
                id="siteId"
                name="siteId"
                required
                value={form.siteId}
                onChange={handleChange}
                className="w-full rounded-lg bg-secondary/50 border border-border px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
              >
                <option value="">Select a site...</option>
                {sites?.data?.map((site: any) => (
                  <option key={site.id} value={site.id}>{site.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-xs font-medium text-muted-foreground mb-1">
                Description <span className="text-destructive">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                placeholder="Provide a detailed account of what happened"
                value={form.description}
                onChange={handleChange}
                className="w-full rounded-lg bg-secondary/50 border border-border px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all resize-y"
              />
            </div>

            <input type="hidden" name="latitude" value={form.latitude} />
            <input type="hidden" name="longitude" value={form.longitude} />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              {mutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Reporting Incident...</>
              ) : (
                <><Save className="h-4 w-4" /> Report Incident</>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push('/incidents')}
              className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
