'use client';

import React, { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  UploadCloud,
  Download,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Users,
  FileSpreadsheet,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = 'upload' | 'result';

interface ImportRow {
  [key: string]: string;
}

interface ImportResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  accountsCreated: number;
  createdAccounts: { email: string; password: string }[];
  errors: { row: number; reason: string }[];
  errorsTruncated?: boolean;
}

/** Minimal RFC-4180-ish CSV parser (quotes, escaped quotes, CRLF). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.some((f) => f.trim() !== '')) rows.push(row);
      row = [];
    } else field += ch;
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    if (row.some((f) => f.trim() !== '')) rows.push(row);
  }
  return rows;
}

const ALIASES: Record<string, string> = {
  'full name': 'fullName',
  name: 'fullName',
  'employee name': 'fullName',
  nin: 'nin',
  'national id': 'nin',
  phone: 'phone',
  'phone number': 'phone',
  mobile: 'phone',
  address: 'address',
  'emergency contact': 'emergencyContact',
  'next of kin': 'emergencyContact',
  bvn: 'bvn',
  'guarantor details': 'guarantorDetails',
  'employment date': 'employmentDate',
  'start date': 'employmentDate',
  status: 'status',
  shift: 'currentShift',
  'current shift': 'currentShift',
  site: 'siteName',
  'site name': 'siteName',
  'assigned site': 'siteName',
  email: 'email',
  password: 'password',
};

function csvToRows(text: string): { rows: ImportRow[]; headers: string[]; error: string | null } {
  const table = parseCsv(text);
  if (table.length < 2) {
    return { rows: [], headers: [], error: 'CSV must contain a header row and at least one data row.' };
  }
  const headers = table[0].map((h) => {
    const key = h.trim().toLowerCase().replace(/\s+/g, ' ');
    return ALIASES[key] ?? key.replace(/[^a-z0-9]/g, '');
  });
  if (!headers.includes('fullName') || !headers.includes('nin') || !headers.includes('phone')) {
    return {
      rows: [],
      headers,
      error: 'CSV must include "Full Name", "NIN" and "Phone" columns — download the template for the exact format.',
    };
  }
  const rows = table.slice(1).map((cells) => {
    const row: ImportRow = {};
    cells.forEach((v, idx) => {
      const key = headers[idx];
      if (key) row[key] = v.trim();
    });
    return row;
  });
  return { rows, headers, error: null };
}

const TEMPLATE_HEADER = [
  'Full Name',
  'NIN',
  'Phone',
  'Address',
  'Emergency Contact',
  'BVN',
  'Guarantor Details',
  'Employment Date',
  'Status',
  'Shift',
  'Site Name',
  'Email',
  'Password',
];

function downloadTemplate() {
  const example = [
    'John Okafor',
    '12345678901',
    '08031234567',
    '12 Marina Road, Lagos',
    'Mary Okafor - 08039876543',
    '22334455667',
    'Brother - 08030000001',
    '2026-01-15',
    'ACTIVE',
    'NIGHT',
    'Banana Island Alpha Zone',
    'john.okafor@example.com',
    'Bastion@0001',
  ];
  const escape = (v: string) => (/[,"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const csv = [TEMPLATE_HEADER.map(escape).join(','), example.map(escape).join(',')].join('\r\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'guards-import-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function downloadErrors(result: ImportResult) {
  const lines = ['Row,Reason', ...result.errors.map((e) => `${e.row},"${e.reason.replace(/"/g, '""')}"`)];
  const blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'import-errors.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function downloadAccounts(result: ImportResult) {
  const lines = [
    'Email,Password',
    ...result.createdAccounts.map((a) => `${a.email},${a.password}`),
  ];
  const blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'created-accounts.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function ImportGuardsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [createAccounts, setCreateAccounts] = useState(false);
  const [mode, setMode] = useState<'create' | 'upsert'>('create');
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  if (!open) return null;

  const handleFile = (file: File) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = csvToRows(String(reader.result ?? ''));
      setParseError(parsed.error);
      setRows(parsed.rows);
      setStep('upload');
    };
    reader.readAsText(file);
  };

  const reset = () => {
    setStep('upload');
    setFileName('');
    setRows([]);
    setParseError(null);
    setResult(null);
    setImporting(false);
  };

  const runImport = async () => {
    setImporting(true);
    try {
      const res = await api.post('/guards/import', {
        rows,
        createAccounts,
        mode,
      });
      setResult(res.data);
      setStep('result');
      queryClient.invalidateQueries({ queryKey: ['guards'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    } catch (e: any) {
      setParseError(e?.response?.data?.message ?? 'Import failed. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  const copyAccounts = async () => {
    if (!result) return;
    const text = result.createdAccounts
      .map((a) => `${a.email},${a.password}`)
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1500);
    } catch {
      // clipboard unavailable
    }
  };

  const preview = rows.slice(0, 8);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-popover shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              Personnel Onboarding
            </p>
            <h2 className="mt-0.5 text-lg font-bold text-foreground">Bulk Import Guards</h2>
          </div>
          <button
            onClick={() => {
              reset();
              onClose();
            }}
            aria-label="Close"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {step === 'upload' && (
            <div className="space-y-5">
              {/* Template + info */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <FileSpreadsheet className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">CSV template</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Required columns: <span className="font-mono">Full Name, NIN, Phone</span>. Optional: site,
                      shift, email (for login), and more.
                    </p>
                  </div>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-primary/40"
                >
                  <Download className="h-3.5 w-3.5" /> Template
                </button>
              </div>

              {/* Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  handleFile(e.dataTransfer.files?.[0]);
                }}
                onClick={() => fileRef.current?.click()}
                className={cn(
                  'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors',
                  dragging
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:border-primary/40',
                )}
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <UploadCloud className="size-6" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Drop your CSV here, or <span className="text-primary">browse</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Hundreds of guards in one file — duplicates by NIN/phone are skipped automatically.
                  </p>
                </div>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] as File)}
              />

              {parseError && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  {parseError}
                </div>
              )}

              {rows.length > 0 && !parseError && (
                <>
                  {/* Preview */}
                  <div className="overflow-hidden rounded-lg border border-border">
                    <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2.5">
                      <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        {fileName} — {rows.length} guard{rows.length === 1 ? '' : 's'} parsed
                      </p>
                    </div>
                    <div className="max-h-52 overflow-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 border-b border-border bg-secondary/60 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          <tr>
                            <th className="px-4 py-2 font-medium">#</th>
                            <th className="px-4 py-2 font-medium">Name</th>
                            <th className="px-4 py-2 font-medium">NIN</th>
                            <th className="px-4 py-2 font-medium">Phone</th>
                            <th className="px-4 py-2 font-medium">Site</th>
                            <th className="px-4 py-2 font-medium">Shift</th>
                            <th className="px-4 py-2 font-medium">Email</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {preview.map((r, i) => (
                            <tr key={i} className="bg-card">
                              <td className="px-4 py-2 font-mono text-muted-foreground">{i + 2}</td>
                              <td className="px-4 py-2 font-medium text-foreground">{r.fullName}</td>
                              <td className="px-4 py-2 font-mono text-muted-foreground">{r.nin}</td>
                              <td className="px-4 py-2 font-mono text-muted-foreground">{r.phone}</td>
                              <td className="px-4 py-2 text-muted-foreground">{r.siteName || '—'}</td>
                              <td className="px-4 py-2 text-muted-foreground">{r.currentShift || 'DAY'}</td>
                              <td className="px-4 py-2 text-muted-foreground">{r.email || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {rows.length > preview.length && (
                        <p className="bg-card px-4 py-2 text-center text-[11px] text-muted-foreground">
                          + {rows.length - preview.length} more row{rows.length - preview.length === 1 ? '' : 's'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Options */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/40">
                      <input
                        type="checkbox"
                        checked={createAccounts}
                        onChange={(e) => setCreateAccounts(e.target.checked)}
                        className="mt-0.5 size-4 accent-primary"
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">Create login accounts</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Requires an Email column. Guards can sign into the mobile app immediately.
                        </p>
                      </div>
                    </label>
                    <div className="rounded-lg border border-border bg-card p-3">
                      <p className="text-sm font-medium text-foreground">Duplicate handling</p>
                      <div className="mt-1.5 flex gap-2">
                        <button
                          onClick={() => setMode('create')}
                          className={cn(
                            'flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors',
                            mode === 'create'
                              ? 'border-primary/50 bg-primary/10 text-primary'
                              : 'border-border text-muted-foreground hover:text-foreground',
                          )}
                        >
                          Skip existing
                        </button>
                        <button
                          onClick={() => setMode('upsert')}
                          className={cn(
                            'flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors',
                            mode === 'upsert'
                              ? 'border-primary/50 bg-primary/10 text-primary'
                              : 'border-border text-muted-foreground hover:text-foreground',
                          )}
                        >
                          Update existing
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 'result' && result && (
            <div className="space-y-5">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Created', value: result.created, tone: 'text-success' },
                  { label: 'Updated', value: result.updated, tone: 'text-info' },
                  { label: 'Skipped', value: result.skipped, tone: 'text-warning' },
                  { label: 'Accounts', value: result.accountsCreated, tone: 'text-primary' },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg border border-border bg-card p-3 text-center">
                    <p className={cn('font-mono text-2xl font-bold tabular-nums', s.tone)}>{s.value}</p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Created accounts */}
              {result.createdAccounts.length > 0 && (
                <div className="overflow-hidden rounded-lg border border-border">
                  <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2.5">
                    <p className="text-sm font-semibold text-foreground">
                      Login credentials ({result.createdAccounts.length})
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={copyAccounts}
                        className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="h-3 w-3" /> {copiedAll ? 'Copied' : 'Copy all'}
                      </button>
                      <button
                        onClick={() => downloadAccounts(result)}
                        className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                      >
                        <Download className="h-3 w-3" /> CSV
                      </button>
                    </div>
                  </div>
                  <div className="max-h-44 overflow-auto bg-card">
                    <table className="w-full text-left text-xs">
                      <tbody className="divide-y divide-border">
                        {result.createdAccounts.map((a) => (
                          <tr key={a.email}>
                            <td className="px-4 py-2 font-medium text-foreground">{a.email}</td>
                            <td className="px-4 py-2 font-mono text-muted-foreground">{a.password}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="border-t border-border bg-warning/10 px-4 py-2 text-[11px] text-warning">
                    Share these once — guards should change their password after first sign-in.
                  </p>
                </div>
              )}

              {/* Errors */}
              {result.errors.length > 0 && (
                <div className="overflow-hidden rounded-lg border border-border">
                  <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2.5">
                    <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      {result.errors.length} row{result.errors.length === 1 ? '' : 's'} need attention
                    </p>
                    <button
                      onClick={() => downloadErrors(result)}
                      className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                    >
                      <Download className="h-3 w-3" /> Errors CSV
                    </button>
                  </div>
                  <div className="max-h-44 overflow-auto bg-card">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 border-b border-border bg-secondary/60 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="px-4 py-2 font-medium">Row</th>
                          <th className="px-4 py-2 font-medium">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {result.errors.map((e, i) => (
                          <tr key={i}>
                            <td className="px-4 py-2 font-mono text-muted-foreground">{e.row}</td>
                            <td className="px-4 py-2 text-muted-foreground">{e.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {result.errorsTruncated && (
                      <p className="px-4 py-2 text-[11px] text-muted-foreground">
                        Showing the first 200 errors — download the full list.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {result.errors.length === 0 && result.createdAccounts.length === 0 && (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-6 text-center text-success">
                  <CheckCircle2 className="h-8 w-8" />
                  <p className="text-sm font-semibold">Import complete — all rows processed successfully.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4">
          {step === 'upload' ? (
            <>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                {rows.length > 0 ? `${rows.length} guard${rows.length === 1 ? '' : 's'} ready` : 'No file loaded'}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    reset();
                    onClose();
                  }}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={runImport}
                  disabled={rows.length === 0 || importing}
                  className="btn-accent flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-bold disabled:opacity-50"
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Importing…
                    </>
                  ) : (
                    <>
                      Import {rows.length > 0 ? `${rows.length} guard${rows.length === 1 ? '' : 's'}` : ''}
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                {result?.created} created · {result?.updated} updated · {result?.skipped} skipped
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    reset();
                    setStep('upload');
                  }}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Import another file
                </button>
                <button
                  onClick={() => {
                    reset();
                    onClose();
                  }}
                  className="btn-accent rounded-lg px-5 py-2 text-sm font-bold"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
