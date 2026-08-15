"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Shield,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowRight,
  Mail,
  LockKeyhole,
  Phone,
  Building2,
  User,
  Route,
  ShieldAlert,
  ClipboardCheck,
  Radio,
} from "lucide-react";
import api from "@/lib/api";
import AuthModeSwitch from "@/components/auth/AuthModeSwitch";

const registerSchema = z
  .object({
    firstName: z.string().min(1, { message: "First name is required" }),
    lastName: z.string().min(1, { message: "Last name is required" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    phone: z.string().min(1, { message: "Phone number is required" }),
    organizationName: z.string().optional(),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const activityFeed = [
  {
    icon: Route,
    color: "bg-cyan-400/10 text-cyan-300",
    type: "PATROL",
    desc: "Perimeter patrol completed",
    status: "SUCCESS",
    chip: "bg-emerald-400/10 text-emerald-300",
    time: "08:45 AM",
    loc: "Site A",
  },
  {
    icon: ShieldAlert,
    color: "bg-red-400/10 text-red-300",
    type: "INCIDENT",
    desc: "Theft report filed",
    status: "OPEN",
    chip: "bg-red-400/10 text-red-300",
    time: "08:30 AM",
    loc: "Warehouse",
  },
  {
    icon: ClipboardCheck,
    color: "bg-blue-400/10 text-blue-300",
    type: "ATTENDANCE",
    desc: "12 guards on shift",
    status: "LIVE",
    chip: "bg-cyan-400/10 text-cyan-300",
    time: "08:00 AM",
    loc: "Main Gate",
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const passwordValue = useWatch({ control, name: "password" }) ?? "";
  let strength = 0;
  if (passwordValue.length >= 8) strength++;
  if (/[A-Z]/.test(passwordValue)) strength++;
  if (/[0-9]/.test(passwordValue)) strength++;
  if (/[^A-Za-z0-9]/.test(passwordValue)) strength++;

  const strengthMeta = [
    { label: "Too short", color: "bg-red-500", text: "text-red-600" },
    { label: "Weak", color: "bg-red-500", text: "text-red-600" },
    { label: "Fair", color: "bg-amber-500", text: "text-amber-600" },
    { label: "Good", color: "bg-cyan-500", text: "text-cyan-600" },
    { label: "Strong", color: "bg-emerald-500", text: "text-emerald-600" },
  ][strength];

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await api.post("/auth/register", {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        organizationName: data.organizationName || "BastionOS Operations",
        password: data.password,
      });
      router.push("/login?registered=1");
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Unable to connect to security servers. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const labelClass =
    "font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500";
  const inputClass = (hasError: boolean) =>
    `w-full rounded-md border bg-white py-2.5 pl-9 pr-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 sm:text-sm ${
      hasError
        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
        : "border-zinc-200 focus:border-black focus:ring-black/10"
    }`;

  return (
    <div className="flex min-h-screen min-h-dvh items-center justify-center bg-[#f9fafb] px-4 py-12 sm:px-8">
      <div className="animate-rise w-full max-w-[980px] overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-2xl shadow-zinc-950/10 lg:grid lg:grid-cols-[0.92fr_1.08fr]">
        {/* ── Left: brand + live activity (per design frame) ── */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-[#09090b] p-10 lg:flex">
          <img
            src="/spectra-operator.png"
            alt="BastionOS operators coordinating a mission"
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#09090b]/75 via-[#09090b]/85 to-[#09090b]" />

          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-white text-black shadow-lg shadow-black/30">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <p className="font-mono text-sm font-bold tracking-[0.3em] text-white">
                BastionOS
              </p>
              <p className="font-mono text-[10px] tracking-[0.24em] text-zinc-400">
                SECURITY PLATFORM
              </p>
            </div>
          </div>

          <div className="relative">
            <p className="font-mono text-[11px] font-bold tracking-[0.28em] text-cyan-400">
              LIVE OPERATIONS
            </p>
            <h2 className="mt-4 text-2xl font-black leading-tight tracking-tight text-white">
              Take command of your security network.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Create the first account for your organization and start running
              patrols, tracking incidents and protecting every site.
            </p>

            <div className="mt-8 space-y-3">
              {activityFeed.map((item) => (
                <div
                  key={item.type}
                  className="flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.04] p-3 backdrop-blur-sm"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${item.color}`}
                  >
                    <item.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                      {item.type}
                    </p>
                    <p className="truncate text-sm font-semibold text-white">
                      {item.desc}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] text-zinc-500">
                      {item.time} · {item.loc}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-md px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.12em] ${item.chip}`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-8 inline-flex items-center gap-2.5 rounded-md border border-white/15 bg-white/10 px-3.5 py-2 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
              </span>
              <Radio className="h-3.5 w-3.5 text-cyan-300" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                All systems operational
              </span>
            </div>
          </div>

          <p className="relative font-mono text-[10px] tracking-[0.2em] text-zinc-500">
            © 2026 BastionOS SYSTEMS, INC.
          </p>
        </div>

        {/* ── Right: form ── */}
        <div className="p-8 sm:p-10">
          {/* Mobile brand */}
          <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-black text-white shadow-lg">
              <Shield className="h-6 w-6" />
            </div>
            <p className="font-mono text-sm font-bold tracking-[0.3em] text-zinc-900">
              BastionOS
            </p>
          </div>

          <AuthModeSwitch mode="register" />

          <p className="mt-8 font-mono text-[11px] font-bold tracking-[0.28em] text-zinc-400">
            CREATE ACCOUNT
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-zinc-950">
            Join the operations
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Register your organization and take command of your security network.
          </p>

          {error && (
            <div className="mt-6 flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-bold">Registration error</p>
                <p className="mt-0.5 text-red-600">{error}</p>
              </div>
            </div>
          )}

          <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className={labelClass}>
                  First Name
                </label>
                <div className="relative mt-1.5">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    id="firstName"
                    type="text"
                    autoComplete="given-name"
                    autoFocus
                    placeholder="Alex"
                    {...register("firstName")}
                    className={inputClass(!!errors.firstName)}
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="lastName" className={labelClass}>
                  Last Name
                </label>
                <div className="relative mt-1.5">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    id="lastName"
                    type="text"
                    autoComplete="family-name"
                    placeholder="Mercer"
                    {...register("lastName")}
                    className={inputClass(!!errors.lastName)}
                  />
                </div>
                {errors.lastName && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className={labelClass}>
                Security Email
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="operator@bastionos.com"
                  {...register("email")}
                  className={inputClass(!!errors.email)}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className={labelClass}>
                Phone Number
              </label>
              <div className="relative mt-1.5">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+1 (555) 000-0000"
                  {...register("phone")}
                  className={inputClass(!!errors.phone)}
                />
              </div>
              {errors.phone && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="organizationName" className={labelClass}>
                Organization <span className="font-normal normal-case">(optional)</span>
              </label>
              <div className="relative mt-1.5">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  id="organizationName"
                  type="text"
                  autoComplete="organization"
                  placeholder="BastionOS Operations"
                  {...register("organizationName")}
                  className={inputClass(!!errors.organizationName)}
                />
              </div>
              {errors.organizationName && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {errors.organizationName.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="password" className={labelClass}>
                  Password
                </label>
                <div className="relative mt-1.5">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    {...register("password")}
                    className={`${inputClass(!!errors.password)} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 transition hover:text-zinc-900"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">
                    {errors.password.message}
                  </p>
                )}
                {passwordValue.length > 0 && !errors.password && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <span
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                            i < strength ? strengthMeta.color : "bg-zinc-200"
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`mt-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] ${strengthMeta.text}`}>
                      {strengthMeta.label} password
                    </p>
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="confirmPassword" className={labelClass}>
                  Confirm
                </label>
                <div className="relative mt-1.5">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    {...register("confirmPassword")}
                    className={`${inputClass(!!errors.confirmPassword)} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 transition hover:text-zinc-900"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group flex w-full items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-zinc-950/10 transition-all hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Creating account...
                </>
              ) : (
                <>
                  Create Security Account
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-7 flex items-center gap-3">
            <span className="h-px flex-1 bg-zinc-200" />
            <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-zinc-400">
              SECURE ACCESS
            </span>
            <span className="h-px flex-1 bg-zinc-200" />
          </div>

          <p className="mt-5 text-center text-sm text-zinc-500">
            Protected by BastionOS Cryptographic Protocol. All attempts logged.
          </p>
        </div>
      </div>
    </div>
  );
}
