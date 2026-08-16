'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Map,
  Users,
  AlertTriangle,
  Search,
  ClipboardCheck,
  Route,
  Building2,
  MapPin,
  BarChart3,
  FileText,
  Bell,
  Settings,
  Loader2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

const items = [
  { label: 'Ops Overview', href: '/', icon: LayoutDashboard, hint: 'Go to' },
  { label: 'Live Map', href: '/map', icon: Map, hint: 'Go to' },
  { label: 'Personnel', href: '/guards', icon: Users, hint: 'Go to' },
  { label: 'Incidents', href: '/incidents', icon: AlertTriangle, hint: 'Go to' },
  { label: 'Attendance', href: '/attendance', icon: ClipboardCheck, hint: 'Go to' },
  { label: 'Patrols', href: '/patrols', icon: Route, hint: 'Go to' },
  { label: 'Sites', href: '/sites', icon: MapPin, hint: 'Go to' },
  { label: 'Clients', href: '/clients', icon: Building2, hint: 'Go to' },
  { label: 'Analytics', href: '/analytics', icon: BarChart3, hint: 'Go to' },
  { label: 'Reports', href: '/reports', icon: FileText, hint: 'Go to' },
  { label: 'Notifications', href: '/notifications', icon: Bell, hint: 'Go to' },
  { label: 'Security Center', href: '/security', icon: ShieldCheck, hint: 'Go to' },
  { label: 'Settings', href: '/account', icon: Settings, hint: 'Go to' },
  { label: "What's New", href: '/changelog', icon: Sparkles, hint: 'Go to' },
]

interface SearchHit {
  id: string
  label: string
  subtitle: string
  type: 'guard' | 'client' | 'site' | 'incident'
  url: string
}

const HIT_ICON: Record<SearchHit['type'], typeof Users> = {
  guard: Users,
  client: Building2,
  site: MapPin,
  incident: AlertTriangle,
}

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const searchable = query.trim().length >= 2

  const { data: hits, isFetching } = useQuery({
    queryKey: ['palette-search', query],
    queryFn: async () => {
      const [guards, clients, sites, incidents] = await Promise.all([
        api.get('/guards', { params: { search: query, limit: 5 } }),
        api.get('/clients', { params: { search: query, limit: 5 } }),
        api.get('/sites', { params: { search: query, limit: 5 } }),
        api.get('/incidents', { params: { search: query, limit: 5 } }),
      ])
      const results: SearchHit[] = []
      guards.data?.data?.forEach((g: { id: string; fullName: string; status?: string }) =>
        results.push({
          id: g.id,
          label: g.fullName,
          subtitle: `Guard · ${g.status?.replace('_', ' ') ?? '—'}`,
          type: 'guard',
          url: `/guards/${g.id}`,
        }),
      )
      clients.data?.data?.forEach((c: { id: string; companyName: string; estateName?: string }) =>
        results.push({
          id: c.id,
          label: c.companyName,
          subtitle: `Client · ${c.estateName ?? '—'}`,
          type: 'client',
          url: `/clients/${c.id}`,
        }),
      )
      sites.data?.data?.forEach((s: { id: string; name: string; address?: string }) =>
        results.push({
          id: s.id,
          label: s.name,
          subtitle: `Site · ${s.address ?? '—'}`,
          type: 'site',
          url: `/sites/${s.id}`,
        }),
      )
      incidents.data?.data?.forEach((i: { id: string; title: string; status?: string }) =>
        results.push({
          id: i.id,
          label: i.title,
          subtitle: `Incident · ${i.status?.replace('_', ' ') ?? '—'}`,
          type: 'incident',
          url: `/incidents/${i.id}`,
        }),
      )
      return results.slice(0, 8)
    },
    enabled: searchable,
    staleTime: 15000,
  })

  const navFiltered = items.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
  const rows: { label?: string; items: { key: string; label: string; href: string; icon: typeof Users; hint?: string }[] }[] = []

  if (navFiltered.length > 0) {
    rows.push({ label: 'Views', items: navFiltered.map((n) => ({ key: n.href, label: n.label, href: n.href, icon: n.icon, hint: n.hint })) })
  }
  if (searchable && hits && hits.length > 0) {
    rows.push({
      label: 'Search results',
      items: hits.map((h) => ({ key: h.id + h.type, label: h.label, href: h.url, icon: HIT_ICON[h.type], hint: h.subtitle })),
    })
  }
  const flat = rows.flatMap((r) => r.items)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        onOpenChange(!open)
      }
      if (e.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => setActive(0), [query, hits])

  function select(href: string) {
    router.push(href)
    onOpenChange(false)
  }

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, Math.max(flat.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter' && flat[active]) {
      select(flat[active].href)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-background/70 pt-[15vh] backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="palette-panel w-full max-w-lg overflow-hidden rounded-lg border border-border bg-popover shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Jump to a view, or search guards, clients, sites, incidents…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {isFetching ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <kbd className="key">Esc</kbd>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto p-1.5">
          {rows.length === 0 && (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              {searchable ? 'No matches' : 'Type to search…'}
            </div>
          )}
          {rows.map((group) => (
            <div key={group.label}>
              {group.label && (
                <p className="px-3 pb-1 pt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => {
                const globalIndex = flat.indexOf(item)
                const Icon = item.icon
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => select(item.href)}
                    onMouseEnter={() => setActive(globalIndex)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
                      active === globalIndex ? 'bg-accent text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    <Icon className={cn('size-4 shrink-0', active === globalIndex ? 'text-primary' : 'text-muted-foreground')} />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    <span className="ml-auto shrink-0 truncate pl-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {item.hint}
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
