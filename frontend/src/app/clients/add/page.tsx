'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { ArrowLeft, Save, Loader2, Building2 } from 'lucide-react';

export default function AddClientPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    companyName: '',
    estateName: '',
    contactPerson: '',
    phone: '',
    email: '',
    contractStart: '',
    contractEnd: '',
    monthlyFee: '',
    numberOfGuardsAllocated: '',
    notes: '',
    billingStatus: 'PAID',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post('/clients', {
        ...form,
        monthlyFee: parseFloat(form.monthlyFee) || 0,
        numberOfGuardsAllocated: parseInt(form.numberOfGuardsAllocated) || 0,
        contractStart: new Date(form.contractStart).toISOString(),
        contractEnd: new Date(form.contractEnd).toISOString(),
      });
    },
    onSuccess: () => router.push('/clients'),
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to create client';
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
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Add New Client</h1>
            <p className="text-sm text-muted-foreground">Register a new corporate client</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Company Details</h2>
            {[
              { name: 'companyName', label: 'Company Name', required: true, placeholder: 'Chevron Nigeria' },
              { name: 'estateName', label: 'Estate/Location', required: true, placeholder: 'Chevron Estate, Lekki' },
              { name: 'contactPerson', label: 'Contact Person', required: true, placeholder: 'Mr. Olamide' },
              { name: 'phone', label: 'Phone', required: true, placeholder: '+2348012345678' },
              { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'contact@company.com' },
            ].map((f) => (
              <div key={f.name}>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  {f.label} {f.required && <span className="text-destructive">*</span>}
                </label>
                <input
                  name={f.name}
                  type={(f as any).type || 'text'}
                  required={f.required}
                  placeholder={f.placeholder}
                  value={(form as any)[f.name]}
                  onChange={handleChange}
                  className="w-full rounded-lg bg-secondary/50 border border-border px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            ))}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Contract Start *</label>
                <input
                  name="contractStart"
                  type="date"
                  required
                  value={form.contractStart}
                  onChange={handleChange}
                  className="w-full rounded-lg bg-secondary/50 border border-border px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Contract End *</label>
                <input
                  name="contractEnd"
                  type="date"
                  required
                  value={form.contractEnd}
                  onChange={handleChange}
                  className="w-full rounded-lg bg-secondary/50 border border-border px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Monthly Fee (₦)</label>
                <input name="monthlyFee" type="number" value={form.monthlyFee} onChange={handleChange} placeholder="5000000"
                  className="w-full rounded-lg bg-secondary/50 border border-border px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Guards Allocated</label>
                <input name="numberOfGuardsAllocated" type="number" value={form.numberOfGuardsAllocated} onChange={handleChange} placeholder="50"
                  className="w-full rounded-lg bg-secondary/50 border border-border px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Billing Status *</label>
              <select name="billingStatus" value={form.billingStatus} onChange={handleChange}
                className="w-full rounded-lg bg-secondary/50 border border-border px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all">
                <option value="PAID">PAID</option>
                <option value="UNPAID">UNPAID</option>
                <option value="OVERDUE">OVERDUE</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Notes (optional)</label>
              <input name="notes" type="text" value={form.notes} onChange={handleChange} placeholder="Any additional notes..."
                className="w-full rounded-lg bg-secondary/50 border border-border px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
            </div>
          </div>

          <button type="submit" disabled={mutation.isPending}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-all">
            {mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating Client...</> : <><Save className="h-4 w-4" /> Save Client</>}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
