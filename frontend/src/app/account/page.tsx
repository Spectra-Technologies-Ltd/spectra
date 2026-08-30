'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  User, Loader2, Save, CheckCircle2, AlertCircle, Mail, Phone, Shield, Camera,
  KeyRound, Copy, Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  photoUrl: string | null;
  role: string;
  createdAt: string;
}

export default function AccountSettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { data: user, isLoading } = useQuery<UserProfile>({
    queryKey: ['auth-me'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data;
    },
  });

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const photoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/uploads/user/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth-me'] });
      setPhotoUploading(false);
    },
    onError: () => setPhotoUploading(false),
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    photoMutation.mutate(file);
  };

  const updateMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; phone: string }) => {
      const res = await api.patch('/auth/me', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth-me'] });
      setSuccessMsg('Profile updated successfully.');
      setErrorMsg('');
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile.');
      setSuccessMsg('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    updateMutation.mutate({ firstName, lastName, phone });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-3" />
          <p>Loading account details...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <User className="h-6 w-6 text-primary" /> Account Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your personal information and account preferences.
          </p>
        </div>

        {/* Profile Card */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Gradient Header */}
          <div className="bg-gradient-to-b from-primary/20 to-card p-6 flex flex-col items-center">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {user?.photoUrl ? (
                <img src={user.photoUrl} alt="Profile" className="h-20 w-20 rounded-full object-cover border-4 border-card shadow-lg" />
              ) : (
                <div className="h-20 w-20 rounded-full bg-primary/20 border-4 border-card shadow-lg flex items-center justify-center">
                  <span className="text-3xl font-bold text-primary">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {photoUploading ? <Loader2 className="h-6 w-6 text-white animate-spin" /> : <Camera className="h-6 w-6 text-white" />}
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            <p className="text-xs text-muted-foreground mt-2">{photoUploading ? 'Uploading...' : 'Click to change photo'}</p>
            <h2 className="text-xl font-bold text-foreground mt-4">
              {user?.firstName} {user?.lastName}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider bg-primary/10 text-primary border-primary/20">
                <Shield className="h-3 w-3 inline mr-1" />
                {user?.role?.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Account Info */}
          <div className="px-6 py-4 border-t border-border bg-secondary/20">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{user?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{user?.phone || '—'}</span>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Success / Error Messages */}
            {successMsg && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-500">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm text-rose-500">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all placeholder:text-muted-foreground"
                  placeholder="Enter first name"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all placeholder:text-muted-foreground"
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2.5 text-sm text-muted-foreground cursor-not-allowed"
              />
              <p className="text-[10px] text-muted-foreground">
                Email cannot be changed. Contact an administrator.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all placeholder:text-muted-foreground"
                placeholder="Enter phone number"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="btn-accent flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Account Info Card */}
        <div className="rounded-xl border border-border bg-card p-5 mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4" /> Account Information
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Role</span>
              <span className="text-foreground font-medium capitalize">
                {user?.role?.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Member Since</span>
              <span className="text-foreground">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">User ID</span>
              <span className="text-foreground font-mono text-xs">
                {user?.id ? `${user.id.substring(0, 8)}...` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Two-Factor Authentication Card */}
        <TfaCard />
      </div>
    </DashboardLayout>
  );
}

function TfaCard() {
  const [status, setStatus] = useState<{ enabled: boolean } | null>(null);
  const [enroll, setEnroll] = useState<{ secret: string; otpauthUri: string } | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const loadStatus = () => {
    api
      .get('/auth/tfa/status')
      .then((r) => setStatus(r.data))
      .catch(() => {});
  };

  useEffect(loadStatus, []);

  const copySecret = async () => {
    if (!enroll) return;
    try {
      await navigator.clipboard.writeText(enroll.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable
    }
  };

  const startEnroll = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await api.post('/auth/tfa/enable');
      setEnroll(r.data);
    } catch (e: any) {
      setMsg({ kind: 'err', text: e?.response?.data?.message ?? 'Could not start enrollment' });
    } finally {
      setBusy(false);
    }
  };

  const confirmEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const r = await api.post('/auth/tfa/confirm', { code: code.trim() });
      setBackupCodes(r.data.backupCodes ?? []);
      setEnroll(null);
      setCode('');
      setStatus({ enabled: true });
    } catch (e: any) {
      setMsg({ kind: 'err', text: e?.response?.data?.message ?? 'Invalid code' });
    } finally {
      setBusy(false);
    }
  };

  const disable = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await api.post('/auth/tfa/disable', { code: code.trim() });
      setCode('');
      setStatus({ enabled: false });
      setMsg({ kind: 'ok', text: 'Two-factor authentication disabled.' });
    } catch (e: any) {
      setMsg({ kind: 'err', text: e?.response?.data?.message ?? 'Invalid code' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 mt-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
        <KeyRound className="h-4 w-4" /> Two-Factor Authentication
      </h3>

      {status && status.enabled && !enroll && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>
              Enabled — every sign-in requires a code from your authenticator app.
            </span>
          </div>
          <form onSubmit={disable} className="flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1">
              <label className="text-xs text-muted-foreground">
                Enter an authenticator code to disable
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="000000"
                className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 font-mono tracking-[0.3em] text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
            </div>
            <button
              type="submit"
              disabled={busy || code.length < 6}
              className="rounded-lg border border-destructive/40 px-4 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Disable 2FA'}
            </button>
          </form>
        </div>
      )}

      {status && !status.enabled && !enroll && !backupCodes && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Add an authenticator app (Google Authenticator, Authy, 1Password…) for
            an extra layer of account security.
          </p>
          <button
            onClick={startEnroll}
            disabled={busy}
            className="btn-accent inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
            Enable 2FA
          </button>
        </div>
      )}

      {enroll && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Scan this key with your authenticator app (or enter the secret
            manually), then enter the 6-digit code to confirm.
          </p>
          <div className="rounded-lg border border-border bg-background p-4 font-mono text-xs">
            <p className="text-muted-foreground">Secret key</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="break-all text-foreground">{enroll.secret}</span>
              <button
                onClick={copySecret}
                className="shrink-0 rounded-md border border-border px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground"
              >
                <Copy className="h-3 w-3" /> {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="mt-2 text-muted-foreground">
              Manual setup: <span className="break-all text-foreground">{enroll.otpauthUri}</span>
            </p>
          </div>
          <form onSubmit={confirmEnroll} className="flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1">
              <label className="text-xs text-muted-foreground">6-digit verification code</label>
              <input
                type="text"
                inputMode="numeric"
                autoFocus
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="000000"
                className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 font-mono tracking-[0.3em] text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
            </div>
            <button
              type="submit"
              disabled={busy || code.length < 6}
              className="btn-accent inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify & Enable'}
            </button>
          </form>
        </div>
      )}

      {backupCodes && (
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Save these backup codes</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Each code works once. If you lose your authenticator app, these are
                the only way back in.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {backupCodes.map((c) => (
              <code key={c} className="rounded-lg border border-border bg-background px-3 py-2 text-center font-mono text-xs text-foreground">
                {c}
              </code>
            ))}
          </div>
          <button
            onClick={() => setBackupCodes(null)}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            Done — I saved these
          </button>
        </div>
      )}

      {msg && (
        <p className={`mt-3 text-sm ${msg.kind === 'ok' ? 'text-success' : 'text-destructive'}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
