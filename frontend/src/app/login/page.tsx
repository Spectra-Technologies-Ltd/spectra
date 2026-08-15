"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Shield,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Mail,
  LockKeyhole,
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import api from "@/lib/api";
import BrandPanel from "@/components/auth/BrandPanel";
import AuthModeSwitch from "@/components/auth/AuthModeSwitch";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await api.post("/auth/login", data);
      const { user } = response.data;
      login(user);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Unable to connect to security servers. Please verify credentials.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const labelClass = "font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500";

  return (
    <div className="flex min-h-screen min-h-dvh bg-[#f9fafb]">
      <BrandPanel />

      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-[400px]">
          {/* Mobile brand */}
          <div className="animate-rise mb-10 flex flex-col items-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-black text-white shadow-lg">
              <Shield className="h-6 w-6" />
            </div>
            <p className="font-mono text-sm font-bold tracking-[0.3em] text-zinc-900">
              BASTIONOS
            </p>
          </div>

          <p className="animate-rise font-mono text-[11px] font-bold tracking-[0.28em] text-zinc-400">
            SECURE SIGN-IN
          </p>
          <h2 className="animate-rise mt-3 text-3xl font-black tracking-tight text-zinc-950" style={{ animationDelay: "60ms" }}>
            Welcome back
          </h2>
          <p className="animate-rise mt-2 text-sm text-zinc-500" style={{ animationDelay: "120ms" }}>
            Sign in to the BastionOS Operations Command Center.
          </p>

          <AuthModeSwitch mode="signin" />

          {registered === "1" && (
            <div className="mt-6 flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-bold">Account created</p>
                <p className="mt-0.5 text-emerald-600">
                  Your security account is ready. Sign in to continue.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-bold">Authentication error</p>
                <p className="mt-0.5 text-red-600">{error}</p>
              </div>
            </div>
          )}

          <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
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
                  autoFocus
                  placeholder="operator@bastionos.com"
                  {...register("email")}
                  className={`w-full rounded-md border bg-white py-2.5 pl-9 pr-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 sm:text-sm ${
                    errors.email
                      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border-zinc-200 focus:border-black focus:ring-black/10"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className={labelClass}>
                Password
              </label>
              <div className="relative mt-1.5">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register("password")}
                  className={`w-full rounded-md border bg-white py-2.5 pl-9 pr-10 text-base text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 sm:text-sm ${
                    errors.password
                      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border-zinc-200 focus:border-black focus:ring-black/10"
                  }`}
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
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group flex w-full items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-zinc-950/10 transition-all hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Authenticating...
                </>
              ) : (
                <>
                  Enter Command Center
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

          <p className="mt-10 text-center font-mono text-[10px] tracking-[0.14em] text-zinc-400">
            PROTECTED BY BASTIONOS CRYPTOGRAPHIC PROTOCOL
          </p>
        </div>
      </div>
    </div>
  );
}
