"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/providers/AuthProvider";
import {
  MapPin,
  Clock,
  Camera,
  CheckCircle2,
  AlertTriangle,
  X,
  Siren,
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

export default function MobileDashboard() {
  const { user } = useAuth();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [time, setTime] = useState(new Date());
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [assignedSite, setAssignedSite] = useState<string>("Loading...");
  const [error, setError] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sosState, setSosState] = useState<"idle" | "sending" | "sent">("idle");

  const handleSos = () => {
    if (!window.confirm("Trigger a PANIC ALERT to your command center?")) return;
    setSosState("sending");
    setError(null);
    const report = (latitude: number, longitude: number) => {
      api
        .get("/auth/me")
        .then(async (me) => {
          const guardProfile = me.data?.guardProfile;
          let siteId = guardProfile?.assignedSite?.id;
          if (!siteId) {
            const sites = await api.get("/sites", { params: { limit: 1 } });
            siteId = sites.data?.data?.[0]?.id;
          }
          if (!siteId) throw new Error("No site available for panic alert");
          return api.post("/incidents", {
            title: "PANIC ALERT — Officer in distress",
            description: `SOS triggered from the field at ${new Date().toLocaleTimeString()}. Location: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
            type: "OTHER",
            severity: "CRITICAL",
            siteId,
            latitude,
            longitude,
          });
        })
        .then(() => {
          setSosState("sent");
          setTimeout(() => setSosState("idle"), 6000);
        })
        .catch((e: any) => {
          setError(e?.response?.data?.message ?? "SOS failed. Please try again.");
          setSosState("idle");
        });
    };
    navigator.geolocation.getCurrentPosition(
      (pos) => report(pos.coords.latitude, pos.coords.longitude),
      () => report(0, 0),
      { timeout: 8000 },
    );
  };

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchGuardInfo = async () => {
      try {
        const res = await api.get("/auth/me");
        if (res.data?.guardProfile?.assignedSite?.name) {
          setAssignedSite(res.data.guardProfile.assignedSite.name);
        } else if (res.data?.guardProfile) {
          setAssignedSite("No site assigned");
        } else {
          setAssignedSite("No guard profile");
        }
      } catch {
        setAssignedSite("Unable to load");
      }
    };
    fetchGuardInfo();
  }, []);

  const handleFileCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setCapturedPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCheckIn = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setLocation({ lat: latitude, lng: longitude });

          try {
            const res = await api.post("/attendance/check-in", {
              latitude,
              longitude,
            });

            // If photo was captured, upload it
            if (photoFile && res.data?.id) {
              const formData = new FormData();
              formData.append("file", photoFile);
              try {
                await api.post(
                  `/uploads/attendance/${res.data.id}/photo`,
                  formData,
                  {
                    headers: { "Content-Type": "multipart/form-data" },
                  },
                );
              } catch {
                // Photo upload failure shouldn't block check-in success
              }
            }

            setIsCheckedIn(true);
            setCapturedPhoto(null);
            setPhotoFile(null);
          } catch (e: any) {
            const msg =
              e?.response?.data?.message ||
              "Check-in failed. Please try again.";
            setError(msg);
          }
        },
        () => {
          setError(
            "GPS location is required for check-in. Please enable location services.",
          );
          setIsProcessing(false);
        },
      );
    } catch {
      setError(
        "Unable to access GPS. Please ensure location services are enabled.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckOut = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          try {
            await api.post("/attendance/check-out", { latitude, longitude });
            setIsCheckedIn(false);
          } catch (e: any) {
            const msg =
              e?.response?.data?.message ||
              "Check-out failed. Please try again.";
            setError(msg);
          }
        },
        () => {
          setError("GPS location is required for check-out.");
          setIsProcessing(false);
        },
      );
    } catch {
      setError("Check-out failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Welcome Card */}
      <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
        <h2 className="text-xl font-bold text-foreground">
          Good{" "}
          {time.getHours() < 12
            ? "Morning"
            : time.getHours() < 18
              ? "Afternoon"
              : "Evening"}
          ,
        </h2>
        <p className="text-primary font-medium">
          {user?.firstName} {user?.lastName}
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>
            Assigned:{" "}
            <strong className="text-foreground">{assignedSite}</strong>
          </span>
        </div>
      </div>

      {/* SOS button */}
      <button
        onClick={handleSos}
        disabled={sosState !== "idle"}
        className={`flex w-full items-center justify-center gap-2.5 rounded-2xl border p-4 text-base font-bold transition-all ${
          sosState === "sent"
            ? "border-success/40 bg-success/15 text-success"
            : "border-destructive/40 bg-destructive/15 text-destructive active:scale-[0.98]"
        }`}
      >
        {sosState === "sending" ? (
          <>
            <Clock className="h-5 w-5 animate-spin" /> Sending panic alert…
          </>
        ) : sosState === "sent" ? (
          <>
            <CheckCircle2 className="h-5 w-5" /> Alert sent — command center notified
          </>
        ) : (
          <>
            <Siren className="h-5 w-5" /> SOS — Panic Alert
          </>
        )}
      </button>

      {/* Error banner */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-3 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Captured photo preview */}
      {capturedPhoto && (
        <div className="relative inline-block">
          <img
            src={capturedPhoto}
            alt="Verification selfie"
            className="w-24 h-24 rounded-xl object-cover border-2 border-primary/30"
          />
          <button
            onClick={() => {
              setCapturedPhoto(null);
              setPhotoFile(null);
            }}
            className="absolute -top-2 -right-2 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
          >
            <X className="h-3 w-3" />
          </button>
          <p className="text-xs text-muted-foreground mt-1 text-center">
            Verification photo
          </p>
        </div>
      )}

      {/* Action Button */}
      <div className="flex flex-col items-center justify-center py-8">
        <div className="relative">
          {isCheckedIn && (
            <>
              <div
                className="absolute inset-0 rounded-full border border-emerald-500/50 animate-ping opacity-75"
                style={{ animationDuration: "3s" }}
              />
              <div
                className="absolute inset-2 rounded-full border border-emerald-500/30 animate-ping opacity-50"
                style={{ animationDuration: "2s" }}
              />
            </>
          )}

          <button
            onClick={isCheckedIn ? handleCheckOut : handleCheckIn}
            disabled={isProcessing}
            className={cn(
              "relative flex flex-col items-center justify-center h-48 w-48 rounded-full shadow-2xl transition-all duration-300",
              isCheckedIn
                ? "bg-gradient-to-b from-emerald-500 to-emerald-700 shadow-emerald-500/30"
                : "bg-gradient-to-b from-primary to-zinc-800 shadow-primary/30",
              isProcessing
                ? "opacity-70 scale-95"
                : "hover:scale-105 active:scale-95",
            )}
          >
            {isProcessing ? (
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />
            ) : (
              <>
                <Clock className="h-10 w-10 text-white mb-2" />
                <span className="text-2xl font-bold text-white tracking-wider">
                  {time.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="text-white/80 text-sm font-medium uppercase tracking-widest mt-1">
                  {isCheckedIn ? "Check Out" : "Check In"}
                </span>
              </>
            )}
          </button>
        </div>

        {isCheckedIn && (
          <div className="mt-6 flex items-center gap-2 bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-full text-sm font-medium border border-emerald-500/20">
            <CheckCircle2 className="h-4 w-4" /> Actively on duty
          </div>
        )}
      </div>

      {/* Hidden file input for camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileCapture}
      />

      {/* Quick Actions */}
      <h3 className="font-semibold text-foreground mt-2 px-1">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-card border border-border p-4 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors"
        >
          <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-foreground">
            <Camera className="h-5 w-5" />
          </div>
          <span className="text-xs font-medium text-foreground">Log Photo</span>
        </button>
        <a
          href="/mobile/incidents"
          className="bg-card border border-border p-4 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors"
        >
          <div className="h-10 w-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <span className="text-xs font-medium text-foreground">
            Report Incident
          </span>
        </a>
      </div>
    </div>
  );
}
