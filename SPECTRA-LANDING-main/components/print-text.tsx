'use client'

import { Fragment, useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from 'react'

export type PrintLine = { text: string; style?: 'em' | 'brand' }

/**
 * Scroll-linked word reveal: words appear one at a time as the element scrolls
 * into view and un-print as it leaves. A `--progress` value (0→1) is written to
 * the element on scroll; each word computes its own opacity from it in CSS, so
 * the reveal is driven directly by scroll position — slower and calmer than a
 * timed typewriter. Reduced-motion users get all words at once via CSS.
 */
export function PrintText({
  tag: Tag = 'span',
  lines,
  className,
}: {
  tag?: ElementType
  lines: PrintLine[] | string
  className?: string
}) {
  const ref = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const update = () => {
      raf = 0
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight
      const c = rect.top + rect.height / 2
      const inStart = vh * 0.98
      const inEnd = vh * 0.42
      const outEnd = -vh * 0.4
      let p = 0
      if (c <= inStart) p = Math.min(1, (inStart - c) / (inStart - inEnd))
      if (c < inEnd) p = Math.min(p, Math.max(0, (c - outEnd) / (inEnd - outEnd)))
      el.style.setProperty('--progress', p.toFixed(4))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  const list: PrintLine[] = typeof lines === 'string' ? [{ text: lines }] : lines
  const full = list.map((l) => l.text).join(' ')
  const isHeading = typeof Tag === 'string' && /^h[1-6]$/.test(Tag)

  const totalWords = list.reduce((n, l) => n + l.text.trim().split(/\s+/).filter(Boolean).length, 0)

  let wordIndex = 0
  const runs: ReactNode[] = list.map((line, li) => {
    const words = line.text.trim().split(/\s+/).filter(Boolean)
    const run = (
      <PrintRun key={li} words={words} style={line.style} startIndex={wordIndex} total={totalWords} />
    )
    wordIndex += words.length
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
      style={{ '--total': totalWords } as CSSProperties}
      aria-label={full}
      role={isHeading ? undefined : 'text'}
    >
      {runs}
    </Tag>
  )
}

function PrintRun({
  words,
  style,
  startIndex,
  total,
}: {
  words: string[]
  style?: 'em' | 'brand'
  startIndex: number
  total: number
}) {
  const Wrapper: ElementType = style === 'em' ? 'em' : 'span'
  const cls = style === 'brand' ? 'brand-name' : undefined
  return (
    <Wrapper className={cls} aria-hidden="true">
      {words.map((w, i) => (
        <span
          key={i}
          className="print-word"
          style={{ '--i': startIndex + i } as CSSProperties}
        >
          {w}
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </Wrapper>
  )
}
