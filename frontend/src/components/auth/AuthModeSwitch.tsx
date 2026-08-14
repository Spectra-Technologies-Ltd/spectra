"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export default function AuthModeSwitch({
  mode,
}: {
  mode: "signin" | "register";
}) {
  return (
    <div className="mt-7 grid grid-cols-2 gap-1 rounded-md border border-zinc-200 bg-zinc-100 p-1">
      <Link
        href="/login"
        aria-current={mode === "signin" ? "page" : undefined}
        className={cn(
          "rounded-[3px] py-2 text-center font-mono text-[11px] font-bold uppercase tracking-[0.16em] transition-all",
          mode === "signin"
            ? "bg-white text-zinc-950 shadow-sm"
            : "text-zinc-500 hover:text-zinc-900",
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
            ? "bg-white text-zinc-950 shadow-sm"
            : "text-zinc-500 hover:text-zinc-900",
        )}
      >
        Create Account
      </Link>
    </div>
  );
}
