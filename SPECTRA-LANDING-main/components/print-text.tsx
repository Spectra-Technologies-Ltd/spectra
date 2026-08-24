'use client'

import { Fragment, useEffect, useRef, useState, type ElementType, type ReactNode } from 'react'

export type PrintLine = { text: string; style?: 'em' | 'brand' }

/**
 * Scroll-linked "print" text: characters type in as the element scrolls into
 * view and un-print as it leaves the viewport. Pass plain text or styled lines
 * for <em> (accent) or brand-name runs. Motion is opacity-only (GPU friendly)
 * and collapses to instant under prefers-reduced-motion via globals.css.
 */
export function PrintText({
  tag: Tag = 'span',
  lines,
  className,
  speed = 24,
  delay = 0,
}: {
  tag?: ElementType
  lines: PrintLine[] | string
  className?: string
  speed?: number
  delay?: number
}) {
  const ref = useRef<HTMLElement | null>(null)
  const [on, setOn] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => setOn(entry.isIntersecting && entry.intersectionRatio > 0.25),
      { threshold: [0, 0.25, 0.75, 1] },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const list: PrintLine[] = typeof lines === 'string' ? [{ text: lines }] : lines
  const full = list.map((l) => l.text).join(' ')
  const isHeading = typeof Tag === 'string' && /^h[1-6]$/.test(Tag)

  let offset = 0
  const runs: ReactNode[] = list.map((line, li) => {
    const run = (
      <PrintRun key={li} text={line.text} style={line.style} speed={speed} delay={delay + offset * speed} />
    )
    offset += line.text.length
    return li === 0 ? run : (
      <Fragment key={li}>
        <br />
        {run}
      </Fragment>
    )
  })

  return (
    <Tag
      ref={ref as never}
      className={className}
      data-print={on ? 'true' : 'false'}
      aria-label={full}
      role={isHeading ? undefined : 'text'}
    >
      {runs}
    </Tag>
  )
}

function PrintRun({
  text,
  style,
  speed,
  delay,
}: {
  text: string
  style?: 'em' | 'brand'
  speed: number
  delay: number
}) {
  const Wrapper: ElementType = style === 'em' ? 'em' : 'span'
  const cls = style === 'brand' ? 'brand-name' : undefined
  return (
    <Wrapper className={cls} aria-hidden="true">
      {Array.from(text).map((ch, i) => (
        <span key={i} className="print-char" style={{ transitionDelay: `${delay + i * speed}ms` }}>
          {ch}
        </span>
      ))}
    </Wrapper>
  )
}
