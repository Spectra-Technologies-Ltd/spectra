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

  const labelClass = "font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground";
  const inputClass = (hasError: boolean) =>
    `w-full rounded-md border bg-card py-2.5 pl-9 pr-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 sm:text-sm ${
      hasError
        ? "border-destructive/40 focus:border-destructive focus:ring-destructive/15"
        : "border-border focus:border-ring focus:ring-ring/15"
    }`;

  return (
    <div className="flex min-h-screen min-h-dvh bg-background">
      <BrandPanel />

      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-[400px]">
          {/* Mobile brand */}
          <div className="animate-rise mb-10 flex flex-col items-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-lg">
              <Shield className="h-6 w-6" />
            </div>
            <p className="font-mono text-sm font-bold tracking-[0.3em] text-foreground">
              BASTION<span className="text-primary">OS</span>
            </p>
          </div>

          <p className="animate-rise font-mono text-[11px] font-bold tracking-[0.28em] text-primary">
            SECURE SIGN-IN
          </p>
          <h2 className="animate-rise mt-3 text-3xl font-black tracking-tight text-foreground" style={{ animationDelay: "60ms" }}>
            Welcome back
          </h2>
          <p className="animate-rise mt-2 text-sm text-muted-foreground" style={{ animationDelay: "120ms" }}>
            Sign in to the BastionOS Operations Command Center.
          </p>

          <AuthModeSwitch mode="signin" />

          {registered === "1" && (
            <div className="mt-6 flex items-start gap-3 rounded-md border border-success/30 bg-success/10 p-4 text-sm text-success">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-bold">Account created</p>
                <p className="mt-0.5">
                  Your security account is ready. Sign in to continue.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-bold">Authentication error</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <label htmlFor="email" className={labelClass}>
                Security Email
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
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
              <label htmlFor="password" className={labelClass}>
                Password
              </label>
              <div className="relative mt-1.5">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register("password")}
                  className={`${inputClass(!!errors.password)} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground transition hover:text-foreground"
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
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-accent group flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
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
            <span className="h-px flex-1 bg-border" />
            <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-muted-foreground">
              SECURE ACCESS
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <p className="mt-10 text-center font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
            PROTECTED BY BASTIONOS CRYPTOGRAPHIC PROTOCOL
          </p>
        </div>
      </div>
    </div>
  );
}
