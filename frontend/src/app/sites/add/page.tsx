'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { ArrowLeft, Save, Loader2, MapPin } from 'lucide-react';

const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function AddSitePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    clientId: '',
    riskLevel: 'MEDIUM',
    targetGuards: '',
  });

  const { data: clients } = useQuery({
    queryKey: ['add-site-clients'],
    queryFn: async () => {
      const res = await api.get('/clients', { params: { limit: 100 } });
      return res.data;
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post('/sites', {
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        targetGuards: parseInt(form.targetGuards) || 0,
      });
    },
    onSuccess: () => router.push('/sites'),
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to create site';
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
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Add New Site</h1>
            <p className="text-sm text-muted-foreground">Register a new deployment location</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Site Details</h2>
            {[
              { name: 'name', label: 'Site Name', required: true, placeholder: 'Chevron Main Gate' },
              { name: 'address', label: 'Address', required: true, placeholder: 'Lekki-Epe Expressway, Lagos' },
            ].map((f) => (
              <div key={f.name}>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  {f.label} {f.required && <span className="text-destructive">*</span>}
                </label>
                <input name={f.name} type="text" required={f.required} placeholder={f.placeholder}
                  value={(form as any)[f.name]} onChange={handleChange}
                  className="w-full rounded-lg bg-secondary/50 border border-border px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
              </div>
            ))}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Latitude *</label>
                <input name="latitude" type="number" step="any" required value={form.latitude} onChange={handleChange} placeholder="6.4385"
                  className="w-full rounded-lg bg-secondary/50 border border-border px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Longitude *</label>
                <input name="longitude" type="number" step="any" required value={form.longitude} onChange={handleChange} placeholder="3.5352"
                  className="w-full rounded-lg bg-secondary/50 border border-border px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Client *</label>
              <select name="clientId" required value={form.clientId} onChange={handleChange}
                className="w-full rounded-lg bg-secondary/50 border border-border px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all">
                <option value="">Select a client...</option>
                {clients?.data?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.companyName}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Risk Level *</label>
                <select name="riskLevel" value={form.riskLevel} onChange={handleChange}
                  className="w-full rounded-lg bg-secondary/50 border border-border px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all">
                  {RISK_LEVELS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Target Guards</label>
                <input name="targetGuards" type="number" value={form.targetGuards} onChange={handleChange} placeholder="15"
                  className="w-full rounded-lg bg-secondary/50 border border-border px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={mutation.isPending}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-all">
            {mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating Site...</> : <><Save className="h-4 w-4" /> Save Site</>}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
