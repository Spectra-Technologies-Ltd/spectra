'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/**
 * Wraps content in a scroll-reveal (fade + 22px rise, 550ms).
 * The reveal is only ARMED after hydration, so if JavaScript never runs the
 * content stays fully visible (base CSS has no opacity/transform applied).
 */
export function ScrollReveal({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (media.matches) return

    // Arm only now that JS is running.
    el.classList.add('is-armed')

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-shown')
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.2 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={['sp-reveal', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}
