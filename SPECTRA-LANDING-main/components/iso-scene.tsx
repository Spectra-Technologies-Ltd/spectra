'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef } from 'react'

// The isometric scene is pure CSS 3D but it is a large subtree, so it is
// code-split out of the initial bundle.
const IsometricPlatform = dynamic(
  () => import('./isometric-platform').then((m) => m.IsometricPlatform),
  { ssr: false },
)

/** Width of the scene's design coordinate system. */
const DESIGN_WIDTH = 680

export function IsoScene() {
  const measureRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = measureRef.current
    if (!el) return
    const target = el.parentElement ?? el
    let frame = 0

    const apply = () => {
      frame = 0
      // Fall back to the frame's own width — after a client-side navigation the
      // inner element can still report 0 on the first tick, which used to leave
      // the scene stuck at the CSS fallback scale until a refresh.
      const width = el.clientWidth || target.clientWidth
      if (!width) return
      const scale = Math.min(1.3, width / DESIGN_WIDTH)
      target.style.setProperty('--iso-scale', scale.toFixed(4))
    }

    // Always measure after layout rather than inside the effect body, and keep
    // re-measuring until the element actually has a width.
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(apply)
    }

    schedule()
    const observer = new ResizeObserver(schedule)
    observer.observe(el)
    observer.observe(target)
    window.addEventListener('load', schedule)
    return () => {
      observer.disconnect()
      window.removeEventListener('load', schedule)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div ref={measureRef} className="iso-measure">
      <IsometricPlatform />
    </div>
  )
}
