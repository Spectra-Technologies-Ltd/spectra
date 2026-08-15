"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Shield,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Globe,
} from "lucide-react";
import api from "@/lib/api";
import BrandPanel from "@/components/auth/BrandPanel";

const requestDemoSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().min(1, { message: "Phone number is required" }),
  jobTitle: z.string().min(1, { message: "Job title is required" }),
  organizationName: z.string().min(1, { message: "Organization / client name is required" }),
  country: z.string().min(1, { message: "Please select a country" }),
  sites: z.string().optional(),
  message: z.string().min(10, { message: "Tell us a little about your operations" }),
});

type RequestDemoFormData = z.infer<typeof requestDemoSchema>;

const COUNTRIES = [
  "United States", "United Kingdom", "Nigeria", "Canada", "Australia", "South Africa",
  "Germany", "France", "Netherlands", "United Arab Emirates", "Ghana", "Kenya",
  "India", "Singapore", "Japan", "Brazil", "Mexico", "Spain", "Italy", "Saudi Arabia",
  "Egypt", "Morocco", "Qatar", "Kuwait", "Norway", "Sweden", "Switzerland", "Poland",
  "Ireland", "New Zealand", "Portugal", "Belgium", "Denmark", "Finland", "Austria",
  "Israel", "Turkey", "China", "South Korea", "Other",
];

export default function RequestDemoPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestDemoFormData>({
    resolver: zodResolver(requestDemoSchema),
    mode: "onBlur",
  });

  const labelClass =
    "font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500";
  const inputClass = (hasError: boolean) =>
    `w-full rounded-md border bg-white py-2.5 px-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 sm:text-sm ${
      hasError
        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
        : "border-zinc-200 focus:border-black focus:ring-black/10"
    }`;

  const onSubmit = async (data: RequestDemoFormData) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await api.post("/leads", data);
      setSubmitted(true);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Something went wrong submitting your request. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Success state — swapped in place, no page navigation ── */
  if (submitted) {
    return (
      <div className="flex min-h-screen min-h-dvh bg-[#f9fafb]">
        <BrandPanel />
        <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
          <div className="w-full max-w-[460px] text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <h1 className="mt-6 text-2xl font-black tracking-tight text-zinc-950">
              Thanks — we&apos;ll be in touch shortly.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500">
              A member of the BastionOS team will follow up with you shortly to schedule your
              demo and answer any questions.
            </p>
            <Link
              href="/"
              className="mt-8 inline-flex items-center gap-2 rounded-md bg-zinc-950 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-zinc-950/10 transition-all hover:bg-zinc-800"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen min-h-dvh bg-[#f9fafb]">
      <BrandPanel />

      <div className="flex flex-1 justify-center overflow-y-auto px-4 py-10 sm:px-8">
        <div className="w-full max-w-[560px]">
          {/* Mobile brand */}
          <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-black text-white shadow-lg">
              <Shield className="h-6 w-6" />
            </div>
            <p className="font-mono text-sm font-bold tracking-[0.3em] text-zinc-900">BastionOS</p>
          </div>

          <p className="font-mono text-[11px] font-bold tracking-[0.28em] text-zinc-400">
            REQUEST A DEMO
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950">
            See BastionOS in action.
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">
            Tell us about your security operations — we&apos;ll show you what&apos;s possible across
            patrols, incident tracking, attendance and multi-site visibility.
          </p>

          {error && (
            <div className="mt-6 flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-bold">Submission failed</p>
                <p className="mt-0.5 text-red-600">{error}</p>
              </div>
            </div>
          )}

          <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className={labelClass}>First Name</label>
                <input
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  autoFocus
                  placeholder="Alex"
                  {...register("firstName")}
                  className={`mt-1.5 ${inputClass(!!errors.firstName)}`}
                />
                {errors.firstName && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="lastName" className={labelClass}>Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  autoComplete="family-name"
                  placeholder="Mercer"
                  {...register("lastName")}
                  className={`mt-1.5 ${inputClass(!!errors.lastName)}`}
                />
                {errors.lastName && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="email" className={labelClass}>Work Email</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  {...register("email")}
                  className={`mt-1.5 ${inputClass(!!errors.email)}`}
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{errors.email.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="phone" className={labelClass}>Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+1 (555) 000-0000"
                  {...register("phone")}
                  className={`mt-1.5 ${inputClass(!!errors.phone)}`}
                />
                {errors.phone && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="jobTitle" className={labelClass}>Job Title</label>
                <input
                  id="jobTitle"
                  type="text"
                  autoComplete="organization-title"
                  placeholder="Security Director"
                  {...register("jobTitle")}
                  className={`mt-1.5 ${inputClass(!!errors.jobTitle)}`}
                />
                {errors.jobTitle && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{errors.jobTitle.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="organizationName" className={labelClass}>Organization / Client Name</label>
                <input
                  id="organizationName"
                  type="text"
                  autoComplete="organization"
                  placeholder="Meridian Security"
                  {...register("organizationName")}
                  className={`mt-1.5 ${inputClass(!!errors.organizationName)}`}
                />
                {errors.organizationName && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{errors.organizationName.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="country" className={labelClass}>Country</label>
                <div className="relative mt-1.5">
                  <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <select
                    id="country"
                    defaultValue=""
                    {...register("country")}
                    className={`${inputClass(!!errors.country)} appearance-none pl-9 pr-8`}
                  >
                    <option value="" disabled>Select a country</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                {errors.country && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{errors.country.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="sites" className={labelClass}>
                  Number of Sites / Guards <span className="text-zinc-400">(optional)</span>
                </label>
                <input
                  id="sites"
                  type="text"
                  placeholder="e.g. 12 sites, 240 guards"
                  {...register("sites")}
                  className={`mt-1.5 ${inputClass(!!errors.sites)}`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="message" className={labelClass}>Tell us about your security operations</label>
              <textarea
                id="message"
                rows={4}
                placeholder="Mention patrols, incident tracking, attendance, multi-site visibility, and anything else your operation relies on."
                {...register("message")}
                className={`mt-1.5 ${inputClass(!!errors.message)} resize-none`}
              />
              {errors.message && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{errors.message.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group flex w-full items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-zinc-950/10 transition-all hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                </>
              ) : (
                "Request Demo"
              )}
            </button>
          </form>

          <p className="mt-10 text-center font-mono text-[10px] tracking-[0.14em] text-zinc-400">
            PROTECTED BY BASTIONOS CRYPTOGRAPHIC PROTOCOL
          </p>
        </div>
      </div>
    </div>
  );
}
