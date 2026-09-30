'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Nfc,
  Plus,
  Trash2,
  ShieldOff,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { EmptyState, LoadingState } from '@/components/ui/EmptyState';

type NfcStatus = 'UNASSIGNED' | 'ACTIVE' | 'REVOKED';

interface NfcCard {
  id: string;
  token: string;
  label: string | null;
  guardId: string | null;
  guardName: string | null;
  status: NfcStatus;
  assignedAt: string | null;
  createdAt: string;
}

interface GuardOption {
  id: string;
  fullName: string;
}

// Web NFC is not in TypeScript's DOM lib. It cannot read a card's raw UID, so
// the badge carries an NDEF text record whose payload is the card token.
interface NdefReadingEvent {
  message: {
    records: { recordType: string; encoding?: string; data?: BufferSource }[];
  };
}
interface NdefReader {
  scan: () => Promise<void>;
  write: (message: { records: { recordType: string; data: string }[] }) => Promise<void>;
  onreading: ((event: NdefReadingEvent) => void) | null;
}
function createNdefReader(): NdefReader | null {
  if (typeof window === 'undefined') return null;
  const ctor = (window as unknown as { NDEFReader?: new () => NdefReader }).NDEFReader;
  return ctor ? new ctor() : null;
}

const statusTone: Record<NfcStatus, string> = {
  UNASSIGNED: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  ACTIVE: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  REVOKED: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
};

const formatDate = (value: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export default function NfcBadgesPage() {
  const queryClient = useQueryClient();
  const [guardId, setGuardId] = useState('');
  const [label, setLabel] = useState('');
  const [issued, setIssued] = useState<NfcCard | null>(null);
  const [writeState, setWriteState] = useState<'idle' | 'writing' | 'written' | 'error'>(
    'idle',
  );
  const [writeError, setWriteError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [nfcSupported, setNfcSupported] = useState(false);

  useEffect(() => {
    setNfcSupported(typeof window !== 'undefined' && 'NDEFReader' in window);
  }, []);

  const { data: cards, isLoading } = useQuery<NfcCard[]>({
    queryKey: ['nfc-cards'],
    queryFn: async () => (await api.get('/nfc-cards')).data,
  });

  const { data: guardsData } = useQuery({
    queryKey: ['nfc-guards'],
    queryFn: async () => (await api.get('/guards', { params: { limit: 100 } })).data,
    staleTime: 60000,
  });

  const guards: GuardOption[] = guardsData?.data ?? [];

  const writeToCard = async (card: NfcCard) => {
    const reader = createNdefReader();
    if (!reader) {
      setWriteState('error');
      setWriteError(
        'Web NFC is not available on this device. Open this page in Chrome or Edge on an Android phone over HTTPS (or localhost).',
      );
      return;
    }
    setWriteState('writing');
    setWriteError(null);
    try {
      await reader.write({ records: [{ recordType: 'text', data: card.token }] });
      setWriteState('written');
    } catch (e: unknown) {
      setWriteState('error');
      setWriteError(e instanceof Error ? e.message : 'The card could not be written.');
    }
  };

  const issue = useMutation({
    mutationFn: async () => {
      const body: { guardId?: string; label?: string } = {};
      if (guardId) body.guardId = guardId;
      if (label.trim()) body.label = label.trim();
      return (await api.post('/nfc-cards/issue', body)).data as NfcCard;
    },
    onSuccess: (card) => {
      setIssued(card);
      setNotice(null);
      setLabel('');
      queryClient.invalidateQueries({ queryKey: ['nfc-cards'] });
      // The click is the user gesture Web NFC requires; the write then waits
      // for the operator to hold a blank card to the phone.
      void writeToCard(card);
    },
    onError: (e: any) =>
      setNotice(e?.response?.data?.message ?? 'Could not issue a badge. Please try again.'),
  });

  const revoke = useMutation({
    mutationFn: (id: string) => api.post(`/nfc-cards/${id}/revoke`),
    onSuccess: () => {
      setNotice('Badge revoked.');
      queryClient.invalidateQueries({ queryKey: ['nfc-cards'] });
    },
    onError: (e: any) =>
      setNotice(e?.response?.data?.message ?? 'Could not revoke this badge.'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/nfc-cards/${id}`),
    onSuccess: () => {
      setIssued(null);
      setWriteState('idle');
      setWriteError(null);
      setNotice('Registration deleted.');
      queryClient.invalidateQueries({ queryKey: ['nfc-cards'] });
    },
    onError: (e: any) =>
      setNotice(e?.response?.data?.message ?? 'Could not delete this registration.'),
  });

  return (
    <DashboardLayout>
      <div className="mb-6">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
          Access Control
        </p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-foreground">
          <Nfc className="h-6 w-6 text-primary" /> NFC Badges
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Issue physical badges to guards, write them to a blank card, and manage their status.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Issue & write panel */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Plus className="h-4 w-4 text-primary" /> Issue a badge
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Choose a guard (optional), then hold a blank NTAG card to the back of your phone to
              write the token.
            </p>

            {!nfcSupported && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-500">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  NFC writing needs Chrome or Edge on an Android phone over HTTPS (or localhost).
                  You can still issue and manage badges from this device.
                </span>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                Guard (optional)
                <select
                  value={guardId}
                  onChange={(e) => setGuardId(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                >
                  <option value="">Unassigned</option>
                  {guards.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.fullName}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                Label (optional)
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Gate 3 spare badge"
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                />
              </label>

              <button
                onClick={() => issue.mutate()}
                disabled={issue.isPending || writeState === 'writing'}
                className="btn-accent flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
              >
                {issue.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Nfc className="h-4 w-4" />
                )}
                {issue.isPending ? 'Issuing…' : 'Issue & write to card'}
              </button>
            </div>

            {notice && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-secondary/20 px-3 py-2">
                <span className="text-xs text-muted-foreground">{notice}</span>
                <button
                  onClick={() => setNotice(null)}
                  aria-label="Dismiss"
                  className="ml-auto text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {issued && (
              <div className="mt-4 rounded-lg border border-border bg-secondary/10 p-4">
                <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Issued badge
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {issued.label ?? 'Untitled badge'}
                  </span>
                  <Badge colorClassName={statusTone[issued.status]}>{issued.status}</Badge>
                </div>
                <p className="mt-2 break-all font-mono text-[11px] text-muted-foreground">
                  Token: {issued.token}
                </p>

                {writeState === 'writing' && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 p-3 text-xs text-primary">
                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" /> Hold a blank card to
                    the back of the phone…
                  </div>
                )}

                {writeState === 'written' && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-500">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Card written — it&apos;s ready
                    to use at check-in.
                  </div>
                )}

                {writeState === 'error' && (
                  <div className="mt-3 flex flex-col gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                    <span className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {writeError}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => writeToCard(issued)}
                        className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 font-medium text-foreground transition-colors hover:bg-secondary/40"
                      >
                        <RefreshCw className="h-3.5 w-3.5" /> Try write again
                      </button>
                      <button
                        onClick={() => remove.mutate(issued.id)}
                        disabled={remove.isPending}
                        className="flex items-center gap-1 rounded-md border border-destructive/40 px-2.5 py-1 font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                      >
                        {remove.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Delete card
                      </button>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      If the write kept failing, delete this registration so it doesn&apos;t linger
                      as unassigned.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Registered badges */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border bg-secondary/20 px-5 py-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Nfc className="h-4 w-4 text-primary" /> Registered badges
              </h2>
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                {cards?.length ?? 0} total
              </span>
            </div>

            {isLoading ? (
              <LoadingState label="Loading badges…" />
            ) : !cards || cards.length === 0 ? (
              <EmptyState icon={Nfc} title="No NFC badges registered yet." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-medium tracking-wider">Label</th>
                      <th className="px-5 py-3 font-medium tracking-wider">Token</th>
                      <th className="px-5 py-3 font-medium tracking-wider">Guard</th>
                      <th className="px-5 py-3 font-medium tracking-wider">Status</th>
                      <th className="px-5 py-3 font-medium tracking-wider">Issued</th>
                      <th className="px-5 py-3 text-right font-medium tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border table-zebra">
                    {cards.map((card) => (
                      <tr key={card.id} className="table-row-hover">
                        <td className="px-5 py-4 text-foreground">{card.label ?? '—'}</td>
                        <td className="px-5 py-4">
                          <span className="break-all font-mono text-[11px] text-muted-foreground">
                            {card.token}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-foreground">
                          {card.guardName ?? 'Unassigned'}
                        </td>
                        <td className="px-5 py-4">
                          <Badge colorClassName={statusTone[card.status]}>{card.status}</Badge>
                        </td>
                        <td className="px-5 py-4 text-xs text-muted-foreground">
                          {formatDate(card.createdAt)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {card.status !== 'REVOKED' && (
                            <button
                              onClick={() => revoke.mutate(card.id)}
                              disabled={revoke.isPending}
                              className="inline-flex items-center gap-1 rounded-md border border-rose-500/40 px-2.5 py-1 text-xs font-medium text-rose-500 transition-colors hover:bg-rose-500/10 disabled:opacity-50"
                            >
                              <ShieldOff className="h-3.5 w-3.5" /> Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
