'use client'

import { useEffect, useRef, useState } from 'react'

/** Counts a numeric string (e.g. "128", "3.4m", "89%") up from zero on change. */
export function AnimatedNumber({ value, duration = 900 }: { value: string; duration?: number }) {
  const match = value.match(/^(\D*)([\d,]*\.?\d+)(\D*)$/)
  const [display, setDisplay] = useState(match ? match[1] + '0' + match[3] : value)
  const frame = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!match) {
      setDisplay(value)
      return
    }
    const [, prefix, numStr, suffix] = match
    const target = parseFloat(numStr.replace(/,/g, ''))
    const decimals = numStr.includes('.') ? numStr.split('.')[1].length : 0
    const start = performance.now()

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = target * eased
      const formatted = decimals > 0 ? current.toFixed(decimals) : Math.round(current).toLocaleString('en-US')
      setDisplay(`${prefix}${formatted}${suffix}`)
      if (progress < 1) {
        frame.current = requestAnimationFrame(tick)
      } else {
        setDisplay(value)
      }
    }
    frame.current = requestAnimationFrame(tick)
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <span className="tabular-nums">{display}</span>
}
