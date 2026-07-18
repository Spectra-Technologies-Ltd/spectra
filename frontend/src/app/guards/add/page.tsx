'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { ArrowLeft, Save, Loader2, UserPlus } from 'lucide-react';

const SHIFTS = ['DAY', 'NIGHT', 'OFF'];
const STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ON_LEAVE'];

export default function AddGuardPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    emergencyContact: '',
    nin: '',
    bvn: '',
    guarantorDetails: '',
    employmentDate: '',
    status: 'ACTIVE',
    currentShift: 'DAY',
    photoUrl: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        ...form,
        employmentDate: new Date(form.employmentDate).toISOString(),
        photoUrl: form.photoUrl || undefined,
        bvn: form.bvn || undefined,
      };
      if (!payload.photoUrl) delete payload.photoUrl;
      if (!payload.bvn) delete payload.bvn;
      await api.post('/guards', payload);
    },
    onSuccess: () => router.push('/guards'),
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to create guard';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    mutation.mutate();
  };

  const fields: { name: string; label: string; type: string; required: boolean; placeholder: string }[] = [
    { name: 'fullName', label: 'Full Name', type: 'text', required: true, placeholder: 'John Doe' },
    { name: 'phone', label: 'Phone Number', type: 'tel', required: true, placeholder: '+2348000000000' },
    { name: 'address', label: 'Address', type: 'text', required: true, placeholder: 'Lagos, Nigeria' },
    { name: 'emergencyContact', label: 'Emergency Contact', type: 'text', required: true, placeholder: 'Name & phone of next of kin' },
    { name: 'nin', label: 'National ID (NIN)', type: 'text', required: true, placeholder: 'NIN12345678901' },
    { name: 'bvn', label: 'BVN (optional)', type: 'text', required: false, placeholder: 'Bank Verification Number' },
    { name: 'guarantorDetails', label: 'Guarantor Details', type: 'text', required: true, placeholder: 'Name & relationship of guarantor' },
    { name: 'employmentDate', label: 'Employment Date', type: 'date', required: true, placeholder: '' },
    { name: 'photoUrl', label: 'Photo URL (optional)', type: 'url', required: false, placeholder: 'https://example.com/photo.jpg' },
  ];

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
            <UserPlus className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Add New Guard</h1>
            <p className="text-sm text-muted-foreground">Register a new security personnel</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Personal Information</h2>
            {fields.map((f) => (
              <div key={f.name}>
                <label htmlFor={f.name} className="block text-xs font-medium text-muted-foreground mb-1">
                  {f.label} {f.required && <span className="text-destructive">*</span>}
                </label>
                <input
                  id={f.name}
                  name={f.name}
                  type={f.type}
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
                <label htmlFor="status" className="block text-xs font-medium text-muted-foreground mb-1">Status *</label>
                <select
                  id="status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full rounded-lg bg-secondary/50 border border-border px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="currentShift" className="block text-xs font-medium text-muted-foreground mb-1">Shift *</label>
                <select
                  id="currentShift"
                  name="currentShift"
                  value={form.currentShift}
                  onChange={handleChange}
                  className="w-full rounded-lg bg-secondary/50 border border-border px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                >
                  {SHIFTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {mutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Creating Guard...</>
            ) : (
              <><Save className="h-4 w-4" /> Save Guard</>
            )}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
