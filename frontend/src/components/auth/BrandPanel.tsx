import { Shield, Radio } from "lucide-react";

export default function BrandPanel() {
  return (
    <aside className="relative hidden w-[46%] shrink-0 overflow-hidden bg-sidebar lg:flex lg:flex-col lg:justify-between lg:p-12">
      {/* Backdrop image + overlays */}
      <img
        src="/spectra-auth.png"
        alt="Spectra operations command center"
        className="absolute inset-0 h-full w-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-sidebar via-sidebar/80 to-sidebar/40" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] [background-size:26px_26px]" />
      <div className="absolute -right-32 -top-32 h-[26rem] w-[26rem] rounded-full bg-primary/15 blur-3xl" />

      {/* Brand */}
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

      {/* Messaging */}
      <div className="relative max-w-md">
        <p className="font-mono text-[11px] font-bold tracking-[0.28em] text-primary">
          MISSION CONTROL
        </p>
        <h1 className="mt-5 text-[2.6rem] font-black leading-[1.04] tracking-tight text-sidebar-foreground">
          See every signal.
          <br />
          Protect every site.
        </h1>
        <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
          One operations center for guards, patrols, incidents and clients — from first
          alert to final report.
        </p>

        {/* Status chip */}
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

        <div className="mt-10 grid max-w-sm grid-cols-3 gap-4 border-t border-border pt-8">
          {[
            ["24/7", "Live coverage"],
            ["99.9%", "Platform uptime"],
            ["< 1s", "Alert latency"],
          ].map(([stat, label]) => (
            <div key={label}>
              <p className="font-mono text-xl font-semibold tracking-tight text-sidebar-foreground">
                {stat}
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <p className="relative font-mono text-[10px] tracking-[0.2em] text-muted-foreground">
        © 2026 BASTIONOS SYSTEMS, INC.
      </p>
    </aside>
  );
}
