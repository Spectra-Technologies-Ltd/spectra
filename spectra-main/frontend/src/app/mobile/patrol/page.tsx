"use client";

import React, { useState, useEffect } from "react";
import { Map, ScanLine, CheckCircle2, Play, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

interface PatrolRoute {
  id: string;
  name: string;
  site: { name: string };
  checkpoints: { id: string; name: string; sequenceOrder: number }[];
  scheduledStart: string;
  scheduledEnd: string;
}

interface PatrolRecord {
  id: string;
  status: string;
  scannedCheckpoints: string;
  missedCheckpoints: string;
  completionPercentage: number;
}

export default function MobilePatrolPage() {
  const [routes, setRoutes] = useState<PatrolRoute[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [activeRecord, setActiveRecord] = useState<PatrolRecord | null>(null);
  const [activeRoute, setActiveRoute] = useState<PatrolRoute | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        // First get user's assigned site, then routes for that site
        const meRes = await api.get("/auth/me");
        const siteId = meRes.data?.guardProfile?.assignedSiteId;
        if (siteId) {
          const routesRes = await api.get(`/patrols/routes/${siteId}`);
          setRoutes(routesRes.data || []);
        }
      } catch {
        setError("Unable to load patrol routes.");
      } finally {
        setLoadingRoutes(false);
      }
    };
    fetchRoutes();
  }, []);

  const startPatrol = async (routeId: string, route: PatrolRoute) => {
    setError(null);
    try {
      const res = await api.post("/patrols/start", { routeId });
      setActiveRecord(res.data);
      setActiveRoute(route);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to start patrol.");
    }
  };

  const handleScan = async () => {
    if (!activeRecord) return;
    setIsScanning(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          // In a real app, scanning would involve QR code reading.
          // For now, simulate scanning the next pending checkpoint.
          const scannedIds: string[] = JSON.parse(
            activeRecord.scannedCheckpoints || "[]",
          );
          const routeCheckpoints = activeRoute?.checkpoints || [];
          const nextCheckpoint = routeCheckpoints.find(
            (cp) => !scannedIds.includes(cp.id),
          );

          if (!nextCheckpoint) {
            setError("All checkpoints already scanned.");
            setIsScanning(false);
            return;
          }

          const newScans = [
            ...scannedIds.map((id: string) => ({
              checkpointId: id,
              latitude,
              longitude,
              scanTime: new Date().toISOString(),
            })),
            {
              checkpointId: nextCheckpoint.id,
              latitude,
              longitude,
              scanTime: new Date().toISOString(),
            },
          ];

          const res = await api.post("/patrols/submit", {
            patrolRecordId: activeRecord.id,
            scans: newScans,
          });

          setActiveRecord(res.data);

          if (res.data.status === "COMPLETED") {
            setActiveRecord(null);
            setActiveRoute(null);
          }
        } catch (e: any) {
          setError(e?.response?.data?.message || "Failed to submit scan.");
        } finally {
          setIsScanning(false);
        }
      },
      () => {
        setError("GPS location is required for scanning.");
        setIsScanning(false);
      },
    );
  };

  const scannedIds: string[] = activeRecord
    ? JSON.parse(activeRecord.scannedCheckpoints || "[]")
    : [];
  const missedIds: string[] = activeRecord
    ? JSON.parse(activeRecord.missedCheckpoints || "[]")
    : [];

  if (!activeRoute) {
    return (
      <div className="p-4 flex flex-col h-full">
        <div className="mb-6 mt-4">
          <h1 className="text-2xl font-bold text-foreground">Patrol Routes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Select a route to begin your patrol.
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-3 text-sm mb-4 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {loadingRoutes ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : routes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Map className="h-12 w-12 mb-3 opacity-20" />
            <p>No patrol routes available for your assigned site.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {routes.map((route) => (
              <div
                key={route.id}
                className="bg-card rounded-xl border border-border p-4 hover:border-primary/50 transition-colors shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <Map className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {route.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {route.checkpoints.length} Checkpoints &bull;{" "}
                        {route.site.name}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => startPatrol(route.id, route)}
                  className="w-full mt-2 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Play className="h-4 w-4 fill-current" /> Start Patrol
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const checkpoints = activeRoute.checkpoints.sort(
    (a, b) => a.sequenceOrder - b.sequenceOrder,
  );

  return (
    <div className="p-4 flex flex-col h-[calc(100vh-120px)]">
      <div className="flex items-center justify-between mb-4 mt-2">
        <div>
          <h1 className="text-lg font-bold text-foreground">
            {activeRoute.name}
          </h1>
          <p className="text-xs text-emerald-500 font-medium flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Patrol{" "}
            {activeRecord?.status === "COMPLETED" ? "completed" : "in progress"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground">
            {scannedIds.length}
            <span className="text-sm text-muted-foreground font-normal">
              /{checkpoints.length}
            </span>
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Scanned
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{
            width: `${checkpoints.length > 0 ? (scannedIds.length / checkpoints.length) * 100 : 0}%`,
          }}
        />
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-3 text-sm mb-4 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Checkpoints List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {checkpoints.map((cp, idx) => {
          const isScanned = scannedIds.includes(cp.id);
          const isMissed = missedIds.includes(cp.id);
          const isNext = !isScanned && !isMissed && idx === scannedIds.length;

          return (
            <div
              key={cp.id}
              className={cn(
                "p-4 rounded-xl border flex items-center justify-between transition-colors",
                isScanned && "bg-emerald-500/10 border-emerald-500/20",
                isMissed && "bg-rose-500/10 border-rose-500/20",
                isNext &&
                  "border-primary shadow-[0_0_10px_rgba(139,92,246,0.1)]",
                !isScanned && !isMissed && !isNext && "bg-card border-border",
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border",
                    isScanned && "bg-emerald-500 border-emerald-500 text-white",
                    isMissed && "bg-rose-500 border-rose-500 text-white",
                    !isScanned &&
                      !isMissed &&
                      "border-muted-foreground text-muted-foreground",
                  )}
                >
                  {isScanned || isMissed ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    idx + 1
                  )}
                </div>
                <div>
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      isScanned && "text-emerald-500",
                      isMissed && "text-rose-500",
                      !isScanned && !isMissed && "text-foreground",
                    )}
                  >
                    {cp.name}
                  </p>
                  {isNext && (
                    <p className="text-xs text-primary font-medium mt-0.5">
                      Next Checkpoint
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scanner Button Fixed at Bottom */}
      {activeRecord?.status !== "COMPLETED" && (
        <div className="pt-4 border-t border-border mt-auto">
          <button
            onClick={handleScan}
            disabled={isScanning}
            className="w-full bg-primary text-primary-foreground h-14 rounded-xl font-bold flex items-center justify-center gap-2 text-lg shadow-lg"
          >
            {isScanning ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>
                <ScanLine className="h-6 w-6" /> Scan Next Checkpoint
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
