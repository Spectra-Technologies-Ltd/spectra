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
    color: "bg-info/15 text-info",
    type: "PATROL",
    desc: "Perimeter patrol completed",
    status: "SUCCESS",
    chip: "bg-success/15 text-success",
    time: "08:45 AM",
    loc: "Site A",
  },
  {
    icon: ShieldAlert,
    color: "bg-destructive/15 text-destructive",
    type: "INCIDENT",
    desc: "Theft report filed",
    status: "OPEN",
    chip: "bg-destructive/15 text-destructive",
    time: "08:30 AM",
    loc: "Warehouse",
  },
  {
    icon: ClipboardCheck,
    color: "bg-primary/15 text-primary",
    type: "ATTENDANCE",
    desc: "12 guards on shift",
    status: "LIVE",
    chip: "bg-primary/15 text-primary",
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
    { label: "Too short", color: "bg-destructive", text: "text-destructive" },
    { label: "Weak", color: "bg-destructive", text: "text-destructive" },
    { label: "Fair", color: "bg-warning", text: "text-warning" },
    { label: "Good", color: "bg-primary", text: "text-primary" },
    { label: "Strong", color: "bg-success", text: "text-success" },
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

  const labelClass = "font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground";
  const inputClass = (hasError: boolean) =>
    `w-full rounded-md border bg-card py-2.5 pl-9 pr-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 sm:text-sm ${
      hasError
        ? "border-destructive/40 focus:border-destructive focus:ring-destructive/15"
        : "border-border focus:border-ring focus:ring-ring/15"
    }`;
  const iconClass = "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground";
  const eyeBtnClass = "absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground transition hover:text-foreground";

  return (
    <div className="flex min-h-screen min-h-dvh items-center justify-center bg-background px-4 py-12 sm:px-8">
      <div className="animate-rise w-full max-w-[980px] overflow-hidden rounded-lg border border-border bg-card shadow-2xl shadow-black/40 lg:grid lg:grid-cols-[0.92fr_1.08fr]">
        {/* ── Left: brand + live activity (per design frame) ── */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 lg:flex">
          <img
            src="/spectra-operator.png"
            alt="BastionOS operators coordinating a mission"
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-sidebar/75 via-sidebar/85 to-sidebar" />

          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-lg shadow-black/30">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <p className="font-mono text-sm font-bold tracking-[0.3em] text-sidebar-foreground">
                BASTION<span className="text-primary">OS</span>
              </p>
              <p className="font-mono text-[10px] tracking-[0.24em] text-muted-foreground">
                SPECTRA TECHNOLOGY
              </p>
            </div>
          </div>

          <div className="relative">
            <p className="font-mono text-[11px] font-bold tracking-[0.28em] text-primary">
              LIVE OPERATIONS
            </p>
            <h2 className="mt-4 text-2xl font-black leading-tight tracking-tight text-sidebar-foreground">
              Take command of your security network.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Create the first account for your organization and start running
              patrols, tracking incidents and protecting every site.
            </p>

            <div className="mt-8 space-y-3">
              {activityFeed.map((item) => (
                <div
                  key={item.type}
                  className="flex items-center gap-3 rounded-md border border-border bg-card/50 p-3 backdrop-blur-sm"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${item.color}`}
                  >
                    <item.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      {item.type}
                    </p>
                    <p className="truncate text-sm font-semibold text-sidebar-foreground">
                      {item.desc}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
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

            <div className="mt-8 inline-flex items-center gap-2.5 rounded-md border border-border bg-card/60 px-3.5 py-2 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              <Radio className="h-3.5 w-3.5 text-success" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-sidebar-foreground">
                All systems operational
              </span>
            </div>
          </div>

          <p className="relative font-mono text-[10px] tracking-[0.2em] text-muted-foreground">
            © 2026 BASTIONOS SYSTEMS, INC.
          </p>
        </div>

        {/* ── Right: form ── */}
        <div className="p-8 sm:p-10">
          {/* Mobile brand */}
          <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-lg">
              <Shield className="h-6 w-6" />
            </div>
            <p className="font-mono text-sm font-bold tracking-[0.3em] text-foreground">
              BASTION<span className="text-primary">OS</span>
            </p>
          </div>

          <AuthModeSwitch mode="register" />

          <p className="mt-8 font-mono text-[11px] font-bold tracking-[0.28em] text-primary">
            CREATE ACCOUNT
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-foreground">
            Join the operations
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Register your organization and take command of your security network.
          </p>

          {error && (
            <div className="mt-6 flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-bold">Registration error</p>
                <p className="mt-0.5">{error}</p>
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
                  <User className={iconClass} />
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
                  <p className="mt-1.5 text-xs font-medium text-destructive">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="lastName" className={labelClass}>
                  Last Name
                </label>
                <div className="relative mt-1.5">
                  <User className={iconClass} />
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
                  <p className="mt-1.5 text-xs font-medium text-destructive">
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
                <Mail className={iconClass} />
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
                <p className="mt-1.5 text-xs font-medium text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className={labelClass}>
                Phone Number
              </label>
              <div className="relative mt-1.5">
                <Phone className={iconClass} />
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
                <p className="mt-1.5 text-xs font-medium text-destructive">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="organizationName" className={labelClass}>
                Organization <span className="font-normal normal-case">(optional)</span>
              </label>
              <div className="relative mt-1.5">
                <Building2 className={iconClass} />
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
                <p className="mt-1.5 text-xs font-medium text-destructive">
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
                  <LockKeyhole className={iconClass} />
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
                    className={eyeBtnClass}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs font-medium text-destructive">
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
                            i < strength ? strengthMeta.color : "bg-border"
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
                  <LockKeyhole className={iconClass} />
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
                    className={eyeBtnClass}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1.5 text-xs font-medium text-destructive">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-accent group flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
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
            <span className="h-px flex-1 bg-border" />
            <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-muted-foreground">
              SECURE ACCESS
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Protected by BastionOS Cryptographic Protocol. All attempts logged.
          </p>
        </div>
      </div>
    </div>
  );
}
