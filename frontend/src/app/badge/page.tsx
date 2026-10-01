"use client";

import React, { useEffect, useState } from "react";
import {
  Shield,
  Nfc,
  IdCard,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Building2,
  CalendarClock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Guards have no accounts and never sign in — their NFC badge is the credential.
// Nothing is persisted on the device: every action re-reads the badge and sends
// the token straight to the public badge endpoints using plain fetch (the shared
// axios client would run its 401 interceptor and bounce us to /login).

type AttendanceStatus = "ON_TIME" | "LATE" | "FLAGGED";

interface CheckInResult {
  id: string;
  checkInTime: string;
  status: AttendanceStatus;
  isLate: boolean;
  checkInMethod: string;
}

interface BadgeProfile {
  guard: {
    id: string;
    fullName: string;
    shift: string;
    site: string;
    performanceScore: number;
  };
  checkedIn: boolean;
  activeCheckIn: { time: string; status: AttendanceStatus } | null;
  recent: {
    id: string;
    checkInTime: string;
    checkOutTime: string | null;
    status: AttendanceStatus;
    isLate: boolean;
  }[];
}

type Action = "check-in" | "me";
type Stage = "idle" | "scanning" | "locating" | "submitting";

const NFC_FALLBACK =
  "NFC scanning needs Chrome or Edge on an Android phone over HTTPS (or localhost). Open this page on an Android phone to tap your badge.";

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  ON_TIME: "On time",
  LATE: "Late",
  FLAGGED: "Flagged",
};

const STATUS_TONE: Record<AttendanceStatus, string> = {
  ON_TIME: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  LATE: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  FLAGGED: "border-rose-500/30 bg-rose-500/10 text-rose-400",
};

function statusOf(value: string | null | undefined): AttendanceStatus {
  return value === "LATE" || value === "FLAGGED" ? value : "ON_TIME";
}

function formatTime(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function formatDayTime(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Web NFC is absent from TypeScript's DOM lib. It cannot read a card's raw UID,
// so the badge carries an NDEF text record whose payload is the card token.
interface NdefReadingEvent {
  message: {
    records: { recordType: string; encoding?: string; data?: BufferSource }[];
  };
}
interface NdefReader {
  scan: () => Promise<void>;
  onreading: ((event: NdefReadingEvent) => void) | null;
  onreadingerror: ((event: unknown) => void) | null;
}

// One scan = one fresh tap. Resolves with the decoded text token the first time
// a text record is read; never cached anywhere.
function scanToken(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const ctor = (window as unknown as { NDEFReader?: new () => NdefReader })
      .NDEFReader;
    if (!ctor) {
      reject(new Error(NFC_FALLBACK));
      return;
    }

    const reader = new ctor();
    let settled = false;

    reader.onreading = (event) => {
      if (settled) return;
      for (const rec of event.message.records) {
        if (rec.recordType === "text") {
          const text = new TextDecoder(rec.encoding || "utf-8")
            .decode(rec.data)
            .trim();
          if (text) {
            settled = true;
            resolve(text);
            return;
          }
        }
      }
      // No usable text record yet — keep listening for another tap.
    };

    reader.onreadingerror = () => {
      if (settled) return;
      settled = true;
      reject(new Error("Could not read this badge. Please tap it again."));
    };

    // scan() must run inside the tap gesture; this executor runs synchronously.
    reader.scan().catch((e: unknown) => {
      if (settled) return;
      settled = true;
      reject(
        new Error(e instanceof Error ? e.message : "Could not start the NFC scan."),
      );
    });
  });
}

function getPosition(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      reject(new Error("GPS is not available on this device."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      () =>
        reject(
          new Error(
            "GPS location is required for check-in. Please enable location services.",
          ),
        ),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}

async function postBadge(path: string, body: unknown) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // Public, unauthenticated endpoint — no session cookies required.
    credentials: "omit",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (data?.message) throw new Error(data.message);
    if (res.status === 429) {
      throw new Error("Too many attempts. Please wait a moment and tap again.");
    }
    throw new Error("Something went wrong. Please tap again.");
  }
  return data;
}

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="rounded-lg border border-border bg-secondary/10 p-3">
      <dt className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-foreground">
        {value || "—"}
      </dd>
    </div>
  );
}

export default function BadgePage() {
  const [nfcSupported, setNfcSupported] = useState<boolean | null>(null);
  const [action, setAction] = useState<Action | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState<CheckInResult | null>(null);
  const [profile, setProfile] = useState<BadgeProfile | null>(null);

  const [diag, setDiag] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasNdef = "NDEFReader" in window;
    setNfcSupported(hasNdef);
    // Surface exactly why Web NFC is missing, on the device itself, so the
    // cause is visible without a desktop devtools connection.
    setDiag(
      `secure context: ${window.isSecureContext ? "yes" : "no"} · ` +
        `NDEFReader: ${hasNdef ? "yes" : "no"} · ` +
        `origin: ${window.location.origin} · ` +
        String(navigator.userAgent).slice(0, 80),
    );
  }, []);

  const run = async (next: Action) => {
    if (action) return;
    setError(null);
    setCheckIn(null);
    setProfile(null);
    setAction(next);
    setStage("scanning");

    try {
      if (typeof window === "undefined" || !("NDEFReader" in window)) {
        throw new Error(NFC_FALLBACK);
      }

      const token = await scanToken();

      if (next === "check-in") {
        setStage("locating");
        const coords = await getPosition();
        setStage("submitting");
        const data = await postBadge("/api/v1/badge/check-in", {
          token,
          ...coords,
        });
        setCheckIn(data as CheckInResult);
      } else {
        setStage("submitting");
        const data = await postBadge("/api/v1/badge/me", { token });
        setProfile(data as BadgeProfile);
      }

      setStage("idle");
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "Something went wrong. Please tap again.",
      );
      setStage("idle");
    } finally {
      setAction(null);
    }
  };

  const busyText =
    action && stage === "scanning"
      ? "Hold your badge to the back of the phone…"
      : stage === "locating"
        ? "Getting your location…"
        : stage === "submitting"
          ? "Sending…"
          : null;

  const resultStatus = checkIn ? statusOf(checkIn.status) : "ON_TIME";

  return (
    <main className="flex min-h-dvh flex-col bg-background px-4 py-8">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-lg">
            <Shield className="h-6 w-6" />
          </div>
          <p className="font-mono text-sm font-bold tracking-[0.3em] text-foreground">
            BASTION<span className="text-primary">OS</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Badge check-in — no login needed
          </p>
        </div>

        {nfcSupported === false && (
          <div className="mb-5 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-500">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              {NFC_FALLBACK}
              <br />
              <span className="break-all opacity-80">{diag}</span>
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => run("check-in")}
            disabled={action !== null}
            className="btn-accent flex w-full items-center justify-center gap-2 rounded-xl px-4 py-4 text-base font-bold disabled:opacity-60"
          >
            {action === "check-in" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Nfc className="h-5 w-5" />
            )}
            Tap to check in
          </button>

          <button
            type="button"
            onClick={() => run("me")}
            disabled={action !== null}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-4 text-base font-bold text-foreground transition-colors hover:bg-secondary/40 disabled:opacity-60"
          >
            {action === "me" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <IdCard className="h-5 w-5 text-primary" />
            )}
            Tap to view my record
          </button>
        </div>

        {/* In-progress */}
        {busyText && (
          <div className="mt-5 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm text-primary">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            <span>{busyText}</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="animate-rise mt-5 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Check-in result */}
        {checkIn && (
          <div
            className={cn(
              "animate-rise mt-5 rounded-xl border p-5",
              STATUS_TONE[resultStatus],
            )}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em]">
                Checked in
              </span>
            </div>
            <p className="mt-2 text-3xl font-black">
              {STATUS_LABEL[resultStatus]}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm">
              <Clock className="h-4 w-4" /> {formatTime(checkIn.checkInTime)}
            </p>
            <p className="mt-1 text-xs opacity-80">
              Method: {(checkIn.checkInMethod || "—").replace(/_/g, " ")}
            </p>
            {checkIn.isLate && resultStatus !== "LATE" && (
              <p className="mt-2 text-xs font-medium">Recorded as late.</p>
            )}
          </div>
        )}

        {/* Profile result */}
        {profile && (
          <div className="animate-rise mt-5 space-y-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                    Guard record
                  </p>
                  <h1 className="mt-1 text-xl font-bold text-foreground">
                    {profile.guard.fullName}
                  </h1>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                    profile.checkedIn
                      ? STATUS_TONE.ON_TIME
                      : "border-border bg-secondary/40 text-muted-foreground",
                  )}
                >
                  {profile.checkedIn ? "Checked in" : "Not checked in"}
                </span>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3">
                <Field
                  icon={Building2}
                  label="Site"
                  value={profile.guard.site}
                />
                <Field icon={User} label="Shift" value={profile.guard.shift} />
              </dl>

              {profile.activeCheckIn && (
                <div
                  className={cn(
                    "mt-4 flex items-center justify-between rounded-lg border p-3",
                    STATUS_TONE[statusOf(profile.activeCheckIn.status)],
                  )}
                >
                  <span className="flex items-center gap-2 text-xs font-medium">
                    <Clock className="h-3.5 w-3.5" /> Since{" "}
                    {formatTime(profile.activeCheckIn.time)}
                  </span>
                  <span className="text-xs font-bold uppercase">
                    {STATUS_LABEL[statusOf(profile.activeCheckIn.status)]}
                  </span>
                </div>
              )}

              {typeof profile.guard.performanceScore === "number" && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Performance score:{" "}
                  <span className="font-semibold text-foreground">
                    {profile.guard.performanceScore}
                  </span>
                </p>
              )}
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border bg-secondary/20 px-4 py-3">
                <CalendarClock className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">
                  Recent attendance
                </h2>
              </div>
              {profile.recent.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No attendance records yet.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {profile.recent.map((r) => {
                    const s = statusOf(r.status);
                    return (
                      <li
                        key={r.id}
                        className="flex items-center justify-between gap-3 px-4 py-3"
                      >
                        <div>
                          <p className="text-sm text-foreground">
                            {formatDayTime(r.checkInTime)}
                          </p>
                          {r.checkOutTime && (
                            <p className="text-xs text-muted-foreground">
                              Out: {formatTime(r.checkOutTime)}
                            </p>
                          )}
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                            STATUS_TONE[s],
                          )}
                        >
                          {STATUS_LABEL[s]}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}

        <p className="mt-auto pt-8 text-center font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
          TAP YOUR BADGE · NOTHING IS STORED ON THIS DEVICE
        </p>
      </div>
    </main>
  );
}
