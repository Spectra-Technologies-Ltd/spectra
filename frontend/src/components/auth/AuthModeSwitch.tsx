"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export default function AuthModeSwitch({
  mode,
}: {
  mode: "signin" | "register";
}) {
  return (
    <div className="mt-7 grid grid-cols-2 gap-1 rounded-md border border-border bg-secondary p-1">
      <Link
        href="/login"
        aria-current={mode === "signin" ? "page" : undefined}
        className={cn(
          "rounded-[3px] py-2 text-center font-mono text-[11px] font-bold uppercase tracking-[0.16em] transition-all",
          mode === "signin"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        Sign In
      </Link>
      <Link
        href="/register"
        aria-current={mode === "register" ? "page" : undefined}
        className={cn(
          "rounded-[3px] py-2 text-center font-mono text-[11px] font-bold uppercase tracking-[0.16em] transition-all",
          mode === "register"
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        Create Account
      </Link>
    </div>
  );
}
