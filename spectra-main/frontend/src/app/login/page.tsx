"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Shield, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import api from "@/lib/api";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-card border border-border p-8 rounded-xl shadow-2xl backdrop-blur-md">
        {/* Header */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 mb-3">
            <Shield className="h-6 w-6 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            SPECTRA OPERATIONS
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Secure client sign-in to Operations Command Center
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="flex items-start gap-3 rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-semibold">Authentication Error</h5>
              <p className="mt-0.5 opacity-90">{error}</p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              Security Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="operator@spectra.com"
              {...register("email")}
              className={`w-full rounded-lg bg-secondary/50 border ${
                errors.email ? "border-destructive" : "border-border"
              } px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all`}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              Secure PIN / Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                {...register("password")}
                className={`w-full rounded-lg bg-secondary/50 border ${
                  errors.password ? "border-destructive" : "border-border"
                } px-3.5 py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 flex justify-center items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Authenticating
                Security ID...
              </>
            ) : (
              "Enter Security Dashboard"
            )}
          </button>
        </form>

        <div className="border-t border-border pt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Protected by Spectra Cryptographic Protocol. All attempts logged.
          </p>
        </div>
      </div>
    </div>
  );
}
