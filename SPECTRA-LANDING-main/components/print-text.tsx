'use client'

import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ElementType } from 'react'

export type PrintLine = { text: string; style?: 'em' | 'brand' }

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

/**
 * Types text out character by character on a fixed timer once it scrolls into
 * view.
 *
 * The full text is rendered on the server (and for anyone without JavaScript),
 * so headings are never empty to crawlers or assistive tech. On the client we
 * reset to zero *before the first paint* and animate from there.
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
  // Start complete: this is what the server renders and what a no-JS visitor sees.
  const [chars, setChars] = useState(totalChars)

  useIsomorphicLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    // Respect users who prefer reduced motion: leave the text fully rendered.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setChars(totalChars)
      return
    }

    // Reset before paint so there is no flash of the finished text.
    setChars(0)
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setStarted(true)
          io.disconnect()
        }
      },
      { threshold: 0.15 },
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

  // Slice each line to the currently typed character count. Line offsets are
  // computed up-front so nothing is reassigned during render.
  const lineOffsets = segments.map((_, li) =>
    segments.slice(0, li).reduce((total, seg) => total + seg.text.length, 0),
  )
  const body = segments.map((seg, li) => {
    const take = Math.min(Math.max(chars - lineOffsets[li], 0), seg.text.length)
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
