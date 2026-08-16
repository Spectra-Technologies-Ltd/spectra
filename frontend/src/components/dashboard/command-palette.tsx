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
} from 'lucide-react'
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
  { label: 'Settings', href: '/account', icon: Settings, hint: 'Go to' },
]

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

  const filtered = items.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))

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

  useEffect(() => setActive(0), [query])

  function select(href: string) {
    router.push(href)
    onOpenChange(false)
  }

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter' && filtered[active]) {
      select(filtered[active].href)
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
            placeholder="Jump to a view…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="key">Esc</kbd>
        </div>
        <ul className="max-h-72 overflow-y-auto p-1.5">
          {filtered.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">No matches</li>
          )}
          {filtered.map((item, i) => {
            const Icon = item.icon
            return (
              <li key={item.href}>
                <button
                  type="button"
                  onClick={() => select(item.href)}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
                    active === i ? 'bg-accent text-foreground' : 'text-muted-foreground',
                  )}
                >
                  <Icon className={cn('size-4', active === i ? 'text-primary' : 'text-muted-foreground')} />
                  {item.label}
                  <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {item.hint}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
