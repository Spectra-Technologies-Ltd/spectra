'use client'

import { Fragment, useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react'

export type PrintLine = { text: string; style?: 'em' | 'brand' }

export function PrintText({
  tag: Tag = 'span',
  lines,
  className,
  typewriter = false,
  speed = 40,
}: {
  tag?: ElementType
  lines: PrintLine[] | string
  className?: string
  typewriter?: boolean
  speed?: number
}) {
  const fullText = typeof lines === 'string' ? lines : lines.map(l => l.text).join(' ')

  // ─── Typewriter mode ────────────────────────────────────────────
  const [typedText, setTypedText] = useState('')
  const [charIndex, setCharIndex] = useState(0)

  useEffect(() => {
    if (!typewriter) return
    if (charIndex < fullText.length) {
      const t = setTimeout(() => {
        setTypedText(prev => prev + fullText[charIndex])
        setCharIndex(prev => prev + 1)
      }, speed)
      return () => clearTimeout(t)
    }
  }, [charIndex, typewriter, fullText, speed])

  if (typewriter) {
    return <Tag className={className}>{typedText}</Tag>
  }

  // ─── Scroll-reveal mode (original) ────────────────────────────
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
  const isHeading = typeof Tag === 'string' && /^h[1-6]$/.test(Tag)

  const totalChars = list.reduce((n, l) => {
    const words = l.text.trim().split(/\s+/).filter(Boolean)
    const chars = words.reduce((m, w) => m + w.length, 0) + Math.max(0, words.length - 1)
    return n + chars
  }, 0)

  let revealIndex = 0
  const runs: ReactNode[] = list.map((line, li) => {
    const words = line.text.trim().split(/\s+/).filter(Boolean)
    const run = (
      <PrintRun key={li} words={words} style={line.style} startIndex={revealIndex} total={totalChars} />
    )
    revealIndex += words.join(' ').length
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
      style={{ '--total': totalChars } as CSSProperties}
      aria-label={fullText}
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
      {words.join(' ').split('').map((ch, i) => (
        <span
          key={i}
          className="print-word"
          style={{ '--i': startIndex + i } as CSSProperties}
        >
          {ch}
        </span>
      ))}
    </Wrapper>
  )
}