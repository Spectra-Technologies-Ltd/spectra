'use client'

import { useEffect, useState } from 'react'
import { CAPTIONS } from './scene-data'

type Phase = 'typing-title' | 'typing-body' | 'holding' | 'clearing'

export function CaptionCycler() {
  const [index, setIndex] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [phase, setPhase] = useState<Phase>('typing-title')

  const current = CAPTIONS[index]

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    if (phase === 'typing-title') {
      if (title.length < current.title.length) {
        timer = setTimeout(() => setTitle(current.title.slice(0, title.length + 1)), 55)
      } else {
        timer = setTimeout(() => setPhase('typing-body'), 250)
      }
    } else if (phase === 'typing-body') {
      if (body.length < current.body.length) {
        timer = setTimeout(() => setBody(current.body.slice(0, body.length + 1)), 18)
      } else {
        timer = setTimeout(() => setPhase('holding'), 2600)
      }
    } else if (phase === 'holding') {
      timer = setTimeout(() => setPhase('clearing'), 200)
    } else if (phase === 'clearing') {
      if (body.length > 0) {
        timer = setTimeout(() => setBody(body.slice(0, -2)), 8)
      } else if (title.length > 0) {
        timer = setTimeout(() => setTitle(title.slice(0, -1)), 25)
      } else {
        setIndex((i) => (i + 1) % CAPTIONS.length)
        setPhase('typing-title')
      }
    }

    return () => clearTimeout(timer)
  }, [phase, title, body, current])

  return (
    <div
      className="relative w-[min(24rem,42cqw)] bg-background px-6 pb-6 pt-5 shadow-xl backdrop-blur-sm"
      style={{
        clipPath: 'polygon(0 0, calc(100% - 28px) 0, 100% 28px, 100% 100%, 0 100%)',
        boxShadow: '0 -1px 0 var(--hairline), 1px 0 0 var(--hairline), 0 12px 30px rgba(0,0,0,.35)',
      }}
    >
      <h2 className="font-sans text-2xl font-medium leading-tight tracking-tight text-foreground md:text-3xl">
        {title || '\u00A0'}
        {phase === 'typing-title' && (
          <span
            className="ml-0.5 inline-block h-[1.1em] w-[3px] translate-y-[2px] bg-mint-strong align-middle"
            style={{ animation: 'caret-blink 1s steps(1) infinite' }}
          />
        )}
      </h2>
      <p className="mt-2 max-w-[34ch] font-mono text-[13px] leading-relaxed text-muted-foreground">
        {body}
        {phase === 'typing-body' && (
          <span
            className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] bg-mint-strong align-middle"
            style={{ animation: 'caret-blink 1s steps(1) infinite' }}
          />
        )}
      </p>
    </div>
  )
}
