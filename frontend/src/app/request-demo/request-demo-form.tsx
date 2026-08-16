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

const requestDemoSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().min(1, { message: "Phone number is required" }),
  jobTitle: z.string().min(1, { message: "Job title is required" }),
  organizationName: z.string().min(1, { message: "Organization / company name is required" }),
  country: z.string().min(1, { message: "Please select a country" }),
  context: z.string().optional(),
  message: z.string().min(10, { message: "Tell us a little about what you're working on" }),
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

export default function RequestDemoForm() {
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
        : "border-zinc-200 focus:border-blue-500 focus:ring-blue-100"
    }`;

  const onSubmit = async (data: RequestDemoFormData) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await api.post("/leads", {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        jobTitle: data.jobTitle,
        organizationName: data.organizationName,
        country: data.country,
        sites: data.context,
        message: data.message,
      });
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
      <div className="flex min-h-dvh items-center justify-center bg-white px-4 py-12">
        <div className="w-full max-w-[460px] text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
          </div>
          <h1 className="mt-6 text-2xl font-black tracking-tight text-zinc-950">
            Thanks — we&apos;ll be in touch shortly.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-500">
            A member of the Spectra team will follow up with you shortly to discuss what
            you&apos;re working on and how we can help.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-2 rounded-md bg-gradient-to-br from-cyan-500 to-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:brightness-110"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      {/* Simple top bar */}
      <header className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 sm:px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-blue-600/25">
            <Shield className="h-4 w-4" />
          </div>
          <span className="font-mono text-sm font-bold tracking-[0.25em] text-zinc-900">
            SPECTRA
          </span>
        </div>
        <Link
          href="/"
          className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 transition-colors hover:text-blue-600"
        >
          Home
        </Link>
      </header>

      <main className="flex flex-1 justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-[560px]">
          {/* Trusted-by logo strip */}
          <div className="mb-8">
            <p className="text-center font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-400">
              Trusted by security operations teams
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 opacity-70">
              {["APEX SECURE", "NOVA GUARD", "TITAN PROTECT", "IRONCLAD OPS", "SENTINEL GROUP"].map((name) => (
                <span key={name} className="font-mono text-xs font-bold tracking-[0.18em] text-zinc-400">
                  {name}
                </span>
              ))}
            </div>
          </div>

          <p className="font-mono text-[11px] font-bold tracking-[0.28em] text-blue-600">
            CONTACT · DEMO REQUEST · PARTNERSHIP INQUIRIES
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950">
            Interested in solving a problem with Spectra?
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">
            Tell us what you&apos;re trying to build, operate or solve — we&apos;ll show you what
            Spectra&apos;s intelligent systems can do for you.
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
                  placeholder="Director of Operations"
                  {...register("jobTitle")}
                  className={`mt-1.5 ${inputClass(!!errors.jobTitle)}`}
                />
                {errors.jobTitle && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{errors.jobTitle.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="organizationName" className={labelClass}>Organization / Company</label>
                <input
                  id="organizationName"
                  type="text"
                  autoComplete="organization"
                  placeholder="Acme Industries"
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
                <label htmlFor="context" className={labelClass}>
                  Additional Context <span className="text-zinc-400">(optional)</span>
                </label>
                <input
                  id="context"
                  type="text"
                  placeholder="e.g. scale, timeline, related projects"
                  {...register("context")}
                  className={`mt-1.5 ${inputClass(!!errors.context)}`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="message" className={labelClass}>Tell us what you&apos;re working on</label>
              <textarea
                id="message"
                rows={4}
                placeholder="Describe the problem you're trying to solve — what you're building, operating or improving."
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
              className="group flex w-full items-center justify-center gap-2 rounded-md bg-blue-700 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/25 transition-all hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                </>
              ) : (
                "Submit"
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
