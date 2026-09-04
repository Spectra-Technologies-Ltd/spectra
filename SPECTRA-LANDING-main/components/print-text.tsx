'use client'

import { Fragment, useEffect, useRef, useState, type ElementType } from 'react'

export type PrintLine = { text: string; style?: 'em' | 'brand' }

/**
 * Types text out character by character on a fixed timer once it scrolls into
 * view. The typed text grows in place (classic typewriter), so it always reads
 * as typing and always runs to completion.
 */
export function PrintText({
  tag: Tag = 'span',
  lines,
  className,
  speed = 1200,
}: {
  tag?: ElementType
  lines: PrintLine[] | string
  className?: string
  speed?: number // total typing duration in ms
}) {
  const list: PrintLine[] = typeof lines === 'string' ? [{ text: lines }] : lines

  // Normalize each line to single spaces so the typewriter advances smoothly.
  const segments = list.map((l) => ({
    text: l.text.trim().split(/\s+/).join(' '),
    style: l.style,
  }))
  const totalChars = segments.reduce((n, s) => n + s.text.length, 0)

  const ref = useRef<HTMLElement | null>(null)
  const [started, setStarted] = useState(false)
  const [chars, setChars] = useState(0)

  // Start typing when the text scrolls into view.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Respect users who prefer reduced motion: show everything immediately.
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setChars(totalChars)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setStarted(true)
          io.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [totalChars])

  // Advance one character per tick until the whole text is typed.
  useEffect(() => {
    if (!started || chars >= totalChars) return
    const t = setTimeout(() => setChars((c) => c + 1), Math.max(14, speed / totalChars))
    return () => clearTimeout(t)
  }, [started, chars, totalChars, speed])

  // Slice each line to the currently typed character count.
  let remaining = chars
  const body = segments.map((seg, li) => {
    const take = Math.min(remaining, seg.text.length)
    remaining -= take
    const Wrapper: ElementType = seg.style === 'em' ? 'em' : 'span'
    const cls = seg.style === 'brand' ? 'brand-name' : undefined
    return (
      <Fragment key={li}>
        {li > 0 && <br />}
        <Wrapper className={cls}>{seg.text.slice(0, take)}</Wrapper>
      </Fragment>
    )
  })

  return (
    <Tag ref={ref as never} className={className}>
      {body}
    </Tag>
  )
}
