'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

// three.js + postprocessing is a heavy client chunk, so it is code-split. It
// runs on phones too (at reduced quality — see CeaserScene), and only steps
// aside for visitors who prefer reduced motion or are on a metered connection.
const CeaserScene = dynamic(() => import('./CeaserScene'), { ssr: false })

const QUERY = '(prefers-reduced-motion: no-preference)'

type NetworkInformation = { saveData?: boolean }

export function HeroScene() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(QUERY)
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection
    const saveData = connection?.saveData === true

    const update = () => setEnabled(mq.matches && !saveData)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // The CSS backdrop underneath stays in place either way, so there is always
  // something designed on screen — including while this chunk loads.
  if (!enabled) return null
  return <CeaserScene />
}
