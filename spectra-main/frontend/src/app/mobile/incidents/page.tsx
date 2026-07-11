"use client";

import React, { useState, useRef } from "react";
import {
  Camera,
  AlertTriangle,
  Send,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

export default function MobileIncidentsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: "",
    type: "OTHER",
    severity: "MEDIUM",
    description: "",
    siteId: "",
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadedFiles((prev) => [...prev, ...files]);

    for (const file of files) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (incId: string) => {
    const uploadEndpoint = `/uploads/incident/${incId}/photo`;
    for (const file of uploadedFiles) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        await api.post(uploadEndpoint, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } catch {
        // Don't block submission if individual upload fails
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      navigator.geolocation.getCurrentPosition(
        async () => {
          try {
            const res = await api.post("/incidents", {
              title: formData.title,
              type: formData.type,
              severity: formData.severity,
              description: formData.description,
              siteId: formData.siteId || undefined,
            });

            const newIncidentId = res.data.id;
            setIncidentId(newIncidentId);

            // Upload any attached files
            if (uploadedFiles.length > 0) {
              await uploadFiles(newIncidentId);
            }

            setSuccess(true);
          } catch (e: any) {
            const msg =
              e?.response?.data?.message || "Failed to submit incident report.";
            setError(msg);
          } finally {
            setIsSubmitting(false);
          }
        },
        () => {
          setError("Location access is required to report an incident.");
          setIsSubmitting(false);
        },
      );
    } catch {
      setError("Unable to submit report. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="h-20 w-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Incident Reported
        </h2>
        <p className="text-muted-foreground mb-8">
          The control room has been notified. Please secure the area and await
          further instructions.
        </p>
        <button
          onClick={() => {
            setSuccess(false);
            setError(null);
            setUploadedFiles([]);
            setPreviews([]);
            setIncidentId(null);
            setFormData({
              title: "",
              type: "OTHER",
              severity: "MEDIUM",
              description: "",
              siteId: "",
            });
          }}
          className="w-full bg-secondary text-foreground py-3 rounded-xl font-semibold"
        >
          Submit Another Report
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-6 mt-2">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-rose-500" />
          Report Incident
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Submit a formal report to the operations center immediately.
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-3 text-sm mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 pb-10">
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
            Incident Title
          </label>
          <input
            required
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            type="text"
            placeholder="e.g. Suspected trespasser at North Gate"
            className="w-full bg-card border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              className="w-full bg-card border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary appearance-none"
            >
              <option value="THEFT">Theft</option>
              <option value="ASSAULT">Assault</option>
              <option value="TRESPASS">Trespass</option>
              <option value="FIRE">Fire</option>
              <option value="MEDICAL">Medical</option>
              <option value="ASSET_DAMAGE">Asset Damage</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
              Severity
            </label>
            <select
              value={formData.severity}
              onChange={(e) =>
                setFormData({ ...formData, severity: e.target.value })
              }
              className={cn(
                "w-full border rounded-lg px-4 py-3 text-sm font-medium appearance-none focus:outline-none",
                formData.severity === "LOW" &&
                  "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
                formData.severity === "MEDIUM" &&
                  "bg-amber-500/10 text-amber-500 border-amber-500/30",
                formData.severity === "HIGH" &&
                  "bg-rose-500/10 text-rose-500 border-rose-500/30",
                formData.severity === "CRITICAL" &&
                  "bg-red-500/10 text-red-500 border-red-500/30 font-bold",
              )}
            >
              <option value="LOW" className="text-foreground bg-card">
                Low
              </option>
              <option value="MEDIUM" className="text-foreground bg-card">
                Medium
              </option>
              <option value="HIGH" className="text-foreground bg-card">
                High
              </option>
              <option value="CRITICAL" className="text-foreground bg-card">
                Critical
              </option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
            Site ID (optional)
          </label>
          <input
            value={formData.siteId}
            onChange={(e) =>
              setFormData({ ...formData, siteId: e.target.value })
            }
            type="text"
            placeholder="Leave blank to use assigned site"
            className="w-full bg-card border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
            Detailed Description
          </label>
          <textarea
            required
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Describe what happened in detail..."
            rows={5}
            className="w-full bg-card border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors resize-none"
          />
        </div>

        {/* File Previews */}
        {previews.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {previews.map((src, i) => (
              <div key={i} className="relative shrink-0">
                <img
                  src={src}
                  alt={`Preview ${i + 1}`}
                  className="h-24 w-24 rounded-xl object-cover border border-border"
                />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Capture / Upload Buttons */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider">
            Evidence (Photos/Video)
          </label>
          <div className="flex gap-3 overflow-x-auto pb-2">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="shrink-0 h-24 w-24 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
            >
              <Camera className="h-6 w-6" />
              <span className="text-[10px] font-medium">Capture</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 h-24 w-24 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
            >
              <ImageIcon className="h-6 w-6" />
              <span className="text-[10px] font-medium">Upload</span>
            </button>
          </div>
          {/* Hidden file inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelect}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-rose-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 mt-4 hover:bg-rose-700 transition-colors shadow-[0_0_15px_rgba(225,29,72,0.3)] disabled:opacity-70"
        >
          {isSubmitting ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <>
              <Send className="h-5 w-5" /> Submit Report
            </>
          )}
        </button>
      </form>
    </div>
  );
}
