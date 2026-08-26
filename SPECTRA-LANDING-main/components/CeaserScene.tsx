'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

/**
 * CeaserOS — ambient geospatial intelligence scene used as the hero backdrop.
 * Ported from the Ceaser surveillance animation and stripped of its full-screen
 * HUD: only the 3D scene (laptop mission screen, holo globe, dust) renders, so
 * it can sit behind the hero image and blend with it.
 */
export default function CeaserScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let rafId = 0
    let renderer: THREE.WebGLRenderer | null = null
    let composer: EffectComposer | null = null
    let disposed = false

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    /* ---------- renderer ---------- */
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
    } catch {
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x05070a)
    scene.fog = new THREE.FogExp2(0x05070a, 0.14)

    const isMobile = window.innerWidth < 768
    const camera = new THREE.PerspectiveCamera(isMobile ? 52 : 34, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.set(0.1, isMobile ? 0.55 : 0.7, isMobile ? 5.2 : 3.7)
    const camTarget = new THREE.Vector3(0, 0.62, -0.1)

    /* ---------- lights ---------- */
    scene.add(new THREE.AmbientLight(0x0c1826, 0.7))
    const key = new THREE.SpotLight(0xfff0dd, 26, 12, 0.7, 0.6, 1.4)
    key.position.set(-2.6, 3.4, 2.6)
    key.target.position.set(0, 0.4, 0)
    scene.add(key, key.target)
    const rim = new THREE.SpotLight(0x2fa8ff, 42, 14, 0.6, 0.7, 1.2)
    rim.position.set(2.0, 1.6, -3.2)
    rim.target.position.set(0, 0.5, 0)
    scene.add(rim, rim.target)
    const rim2 = new THREE.PointLight(0x37e0d0, 10, 8, 2.0)
    rim2.position.set(-2.4, 1.2, -2.0)
    scene.add(rim2)
    const screenGlow = new THREE.PointLight(0x8fd0ff, 3.0, 3.2, 2.0)
    screenGlow.position.set(0, 0.9, 0.1)
    scene.add(screenGlow)

    /* ---------- floor ---------- */
    function makeConcrete() {
      const c = document.createElement('canvas')
      c.width = c.height = 512
      const x = c.getContext('2d')!
      x.fillStyle = '#0a0d12'
      x.fillRect(0, 0, 512, 512)
      for (let i = 0; i < 26000; i++) {
        const v = Math.random()
        const g = 8 + v * v * 44
        x.fillStyle = `rgba(${g},${g + 3},${g + 7},${0.05 + Math.random() * 0.12})`
        x.fillRect(Math.random() * 512, Math.random() * 512, 1, 1)
      }
      for (let i = 0; i < 40; i++) {
        x.strokeStyle = `rgba(0,0,0,${0.1 + Math.random() * 0.2})`
        x.lineWidth = Math.random() * 1.5
        x.beginPath()
        let px = Math.random() * 512
        let py = Math.random() * 512
        x.moveTo(px, py)
        for (let s = 0; s < 4; s++) {
          px += (Math.random() - 0.5) * 90
          py += (Math.random() - 0.5) * 90
          x.lineTo(px, py)
        }
        x.stroke()
      }
      const t = new THREE.CanvasTexture(c)
      t.wrapS = t.wrapT = THREE.RepeatWrapping
      t.repeat.set(6, 6)
      t.colorSpace = THREE.SRGBColorSpace
      return t
    }
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshStandardMaterial({ map: makeConcrete(), roughness: 0.86, metalness: 0.1, color: 0x2a3340 }),
    )
    floor.rotation.x = -Math.PI / 2
    scene.add(floor)

    /* ---------- laptop ---------- */
    const laptop = new THREE.Group()
    scene.add(laptop)
    const shellMat = new THREE.MeshStandardMaterial({ color: 0x20262d, roughness: 0.62, metalness: 0.5 })
    const rubberMat = new THREE.MeshStandardMaterial({ color: 0x0c0f13, roughness: 0.95, metalness: 0.05 })
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x333b44, roughness: 0.4, metalness: 0.7 })

    const BW = 1.72
    const BD = 1.16
    const BH = 0.1
    const base = new THREE.Mesh(new THREE.BoxGeometry(BW, BH, BD), shellMat)
    base.position.y = BH / 2
    laptop.add(base)
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(0.16, BH + 0.03, 0.16), rubberMat)
        b.position.set(sx * (BW / 2 - 0.02), (BH + 0.03) / 2, sz * (BD / 2 - 0.02))
        laptop.add(b)
      }

    function makeDeck() {
      const c = document.createElement('canvas')
      c.width = 1024
      c.height = 700
      const x = c.getContext('2d')!
      x.fillStyle = '#12171d'
      x.fillRect(0, 0, 1024, 700)
      x.fillStyle = '#0c1015'
      x.fillRect(40, 24, 944, 70)
      for (let i = 0; i < 120; i++) {
        x.fillStyle = `rgba(255,255,255,${0.02 + Math.random() * 0.03})`
        x.beginPath()
        x.arc(60 + i * 7.7, 59, 1.4, 0, 7)
        x.fill()
      }
      x.fillStyle = '#46e06a'
      x.shadowColor = '#46e06a'
      x.shadowBlur = 16
      x.beginPath()
      x.arc(950, 59, 4, 0, 7)
      x.fill()
      x.shadowBlur = 0
      const rows = 5
      const cols = 15
      const kx = 70
      const ky = 150
      const kw = 54
      const kh = 48
      const gx = 8
      const gy = 10
      for (let r = 0; r < rows; r++)
        for (let cc = 0; cc < cols; cc++) {
          const px = kx + cc * (kw + gx)
          const py = ky + r * (kh + gy)
          x.fillStyle = '#0a0d11'
          x.fillRect(px, py, kw, kh)
          x.fillStyle = '#1b2128'
          x.fillRect(px + 2, py + 2, kw - 4, kh - 6)
          x.fillStyle = 'rgba(140,200,255,0.05)'
          x.fillRect(px + 2, py + 2, kw - 4, 3)
        }
      x.strokeStyle = '#2a323b'
      x.lineWidth = 2
      x.strokeRect(410, 470, 200, 150)
      return new THREE.CanvasTexture(c)
    }
    const deck = new THREE.Mesh(
      new THREE.PlaneGeometry(BW * 0.94, BD * 0.9),
      new THREE.MeshStandardMaterial({ map: makeDeck(), roughness: 0.7, metalness: 0.3 }),
    )
    deck.rotation.x = -Math.PI / 2
    deck.position.set(0, BH + 0.002, 0.02)
    laptop.add(deck)

    const hinge = new THREE.Group()
    hinge.position.set(0, BH, -BD / 2 + 0.05)
    laptop.add(hinge)
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, BW * 0.86, 20), trimMat)
    bar.rotation.z = Math.PI / 2
    hinge.add(bar)
    const lid = new THREE.Group()
    hinge.add(lid)
    const LW = 1.68
    const LH = 1.05
    const LT = 0.05
    const lidShell = new THREE.Mesh(new THREE.BoxGeometry(LW, LH, LT), shellMat)
    lidShell.position.set(0, LH / 2, -LT / 2)
    lid.add(lidShell)
    for (const sx of [-1, 1])
      for (const sy of [0.06, 0.94]) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, LT + 0.03), rubberMat)
        b.position.set(sx * (LW / 2 - 0.02), LH * sy, -LT / 2)
        lid.add(b)
      }
    const logo = new THREE.Group()
    logo.position.set(0, LH * 0.5, -LT - 0.001)
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.1, 0.13, 32),
      new THREE.MeshBasicMaterial({ color: 0x37e0d0, side: THREE.DoubleSide }),
    )
    ring.rotation.y = Math.PI
    logo.add(ring)
    const core = new THREE.Mesh(new THREE.CircleGeometry(0.05, 24), new THREE.MeshBasicMaterial({ color: 0x9ff0e6 }))
    core.rotation.y = Math.PI
    logo.add(core)
    lid.add(logo)

    const scr = document.createElement('canvas')
    scr.width = 1024
    scr.height = 640
    const sx = scr.getContext('2d')!
    const scrTex = new THREE.CanvasTexture(scr)
    scrTex.colorSpace = THREE.SRGBColorSpace
    scrTex.anisotropy = renderer.capabilities.getMaxAnisotropy()
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(LW * 0.9, LH * 0.9),
      new THREE.MeshBasicMaterial({ map: scrTex }),
    )
    screen.position.set(0, LH * 0.5, 0.002)
    lid.add(screen)
    const bezel = new THREE.Mesh(
      new THREE.PlaneGeometry(LW * 0.96, LH * 0.96),
      new THREE.MeshStandardMaterial({ color: 0x05080b, roughness: 0.5 }),
    )
    bezel.position.set(0, LH * 0.5, 0.001)
    lid.add(bezel)

    const LID_CLOSED = 1.54
    const LID_OPEN = -0.2
    hinge.rotation.x = LID_CLOSED

    /* ---------- holo globe ---------- */
    const holo = new THREE.Group()
    holo.position.set(0, 1.75, -0.35)
    holo.scale.setScalar(0.001)
    scene.add(holo)
    const globeR = 0.5
    const wire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(globeR, 2),
      new THREE.MeshBasicMaterial({ color: 0x2aa9ff, wireframe: true, transparent: true, opacity: 0.35 }),
    )
    holo.add(wire)
    const globeGlow = new THREE.Mesh(
      new THREE.SphereGeometry(globeR * 0.98, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x0a2740, transparent: true, opacity: 0.55 }),
    )
    holo.add(globeGlow)
    const grid = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.SphereGeometry(globeR * 1.001, 18, 12)),
      new THREE.LineBasicMaterial({ color: 0x37e0d0, transparent: true, opacity: 0.18 }),
    )
    holo.add(grid)
    const sats: { mesh: THREE.Mesh; r: number; tilt: THREE.Euler; spd: number; off: number }[] = []
    for (let i = 0; i < 3; i++) {
      const rr = globeR * (1.35 + i * 0.22)
      const ring3 = new THREE.Mesh(
        new THREE.TorusGeometry(rr, 0.004, 8, 120),
        new THREE.MeshBasicMaterial({ color: 0x4aa8ff, transparent: true, opacity: 0.3 }),
      )
      ring3.rotation.x = Math.PI / 2 + (i - 1) * 0.5
      ring3.rotation.z = i * 0.6
      holo.add(ring3)
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), new THREE.MeshBasicMaterial({ color: 0x9ff0e6 }))
      holo.add(s)
      sats.push({ mesh: s, r: rr, tilt: ring3.rotation, spd: 0.5 + i * 0.35, off: i * 2 })
    }

    /* ---------- dust ---------- */
    const dustN = 280
    const dpos = new Float32Array(dustN * 3)
    for (let i = 0; i < dustN; i++) {
      dpos[i * 3] = (Math.random() - 0.5) * 10
      dpos[i * 3 + 1] = Math.random() * 4
      dpos[i * 3 + 2] = (Math.random() - 0.5) * 8
    }
    const dustGeo = new THREE.BufferGeometry()
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3))
    const dust = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({
        color: 0x9fc4e0,
        size: 0.012,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    )
    scene.add(dust)

    /* ---------- post ---------- */
    composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.62, 0.7, 0.14))

    /* ---------- screen UI drawing ---------- */
    const W = 1024
    const H = 640
    const COL = {
      bg: '#0a1119',
      panel: '#0d1722',
      panel2: '#101f2e',
      line: '#1c3245',
      teal: '#37e0d0',
      blue: '#4aa8ff',
      green: '#46e06a',
      amber: '#ffb020',
      red: '#ff5a5a',
      text: '#c7d4e2',
      dim: '#5a6b7d',
      class: '#39d353',
    }
    function rr(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
      g.beginPath()
      g.moveTo(x + r, y)
      g.arcTo(x + w, y, x + w, y + h, r)
      g.arcTo(x + w, y + h, x, y + h, r)
      g.arcTo(x, y + h, x, y, r)
      g.arcTo(x, y, x + w, y, r)
      g.closePath()
    }
    let toolSel = 0
    function chrome(g: CanvasRenderingContext2D, title: string) {
      g.fillStyle = COL.bg
      g.fillRect(0, 0, W, H)
      g.fillStyle = '#0a1a0d'
      g.fillRect(0, 0, W, 20)
      g.fillStyle = COL.class
      g.font = '700 11px ui-monospace,monospace'
      g.textAlign = 'center'
      g.fillText('UNCLASSIFIED // NOTIONAL DATA', W / 2, 14)
      g.fillStyle = COL.panel
      g.fillRect(0, 20, W, 30)
      g.fillStyle = COL.teal
      g.font = '700 13px ui-monospace,monospace'
      g.textAlign = 'left'
      g.fillText('CEASEROS', 58, 40)
      g.fillStyle = COL.dim
      g.font = '11px ui-monospace,monospace'
      g.fillText('/  ' + title, 150, 40)
      g.textAlign = 'right'
      g.fillText('OP RADIANT SPHERE', W - 16, 40)
      g.textAlign = 'left'
      g.fillStyle = COL.panel2
      g.fillRect(0, 50, 46, H - 50)
      const icons = ['◱', '◎', '✦', '▦', '⚠', '⧉']
      for (let i = 0; i < icons.length; i++) {
        const yy = 70 + i * 46
        g.fillStyle = i === toolSel ? COL.teal : '#182a3a'
        rr(g, 10, yy - 16, 26, 26, 5)
        g.fill()
        g.fillStyle = i === toolSel ? '#04121a' : COL.dim
        g.font = '15px ui-monospace,monospace'
        g.textAlign = 'center'
        g.fillText(icons[i], 23, yy + 1)
        g.textAlign = 'left'
      }
      g.fillStyle = COL.panel
      g.fillRect(0, H - 22, W, 22)
      g.fillStyle = COL.dim
      g.font = '10px ui-monospace,monospace'
      g.fillText('36.128°N  129.402°E', 58, H - 8)
      g.textAlign = 'center'
      g.fillStyle = COL.green
      g.fillText('● SECURE LINK', W / 2, H - 8)
      g.textAlign = 'left'
      g.fillStyle = COL.dim
      g.textAlign = 'right'
      g.fillText('SCALE 1:24k   ' + zulu(), W - 16, H - 8)
      g.textAlign = 'left'
    }
    function zulu() {
      const t = performance.now() / 1000
      const s = Math.floor(t) % 60
      const m = Math.floor(t / 60) % 60
      const h = (6 + Math.floor(t / 3600)) % 24
      const p = (n: number) => String(n).padStart(2, '0')
      return `${p(h)}:${p(m)}:${p(s)}Z`
    }
    function panel(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, label?: string) {
      g.fillStyle = COL.panel
      rr(g, x, y, w, h, 6)
      g.fill()
      g.strokeStyle = COL.line
      g.lineWidth = 1
      rr(g, x, y, w, h, 6)
      g.stroke()
      if (label) {
        g.fillStyle = COL.dim
        g.font = '700 9px ui-monospace,monospace'
        g.fillText(label.toUpperCase(), x + 12, y + 16)
        g.strokeStyle = COL.line
        g.beginPath()
        g.moveTo(x + 12, y + 22)
        g.lineTo(x + w - 12, y + 22)
        g.stroke()
      }
    }

    function drawMap(g: CanvasRenderingContext2D, t: number) {
      toolSel = 0
      chrome(g, 'MISSION PLANNER')
      const ox = 46
      const oy = 50
      const ow = W - 46
      const oh = H - 72
      g.save()
      g.beginPath()
      g.rect(ox, oy, ow, oh)
      g.clip()
      g.fillStyle = '#0e1a16'
      g.fillRect(ox, oy, ow, oh)
      g.strokeStyle = 'rgba(80,120,110,.18)'
      g.lineWidth = 1
      for (let x = ox; x < ox + ow; x += 64) {
        g.beginPath()
        g.moveTo(x, oy)
        g.lineTo(x, oy + oh)
        g.stroke()
      }
      for (let y = oy; y < oy + oh; y += 64) {
        g.beginPath()
        g.moveTo(ox, y)
        g.lineTo(ox + ow, y)
        g.stroke()
      }
      const cx = ox + ow * 0.62
      const cy = oy + oh * 0.5
      g.strokeStyle = 'rgba(90,150,120,.32)'
      for (let r = 30; r < 360; r += 26) {
        g.beginPath()
        for (let a = 0; a <= 6.3; a += 0.2) {
          const rad = r + Math.sin(a * 3 + r * 0.05) * 10 + Math.cos(a * 2) * 8
          const px = cx + Math.cos(a) * rad * 1.15
          const py = cy + Math.sin(a) * rad * 0.8
          a === 0 ? g.moveTo(px, py) : g.lineTo(px, py)
        }
        g.closePath()
        g.stroke()
      }
      g.strokeStyle = 'rgba(74,168,255,.55)'
      g.lineWidth = 4
      g.beginPath()
      g.moveTo(ox + 40, oy + 30)
      for (let i = 0; i <= 10; i++) {
        const px = ox + 40 + (i * (ow - 80)) / 10
        const py = oy + 120 + Math.sin(i * 0.9) * 70 + i * 14
        g.lineTo(px, py)
      }
      g.stroke()
      g.strokeStyle = 'rgba(200,210,220,.28)'
      g.lineWidth = 1.5
      for (let i = 0; i < 5; i++) {
        g.beginPath()
        g.moveTo(ox + 80 + i * 40, oy + oh)
        g.lineTo(ox + 200 + i * 120, oy + 40)
        g.stroke()
      }
      g.setLineDash([8, 6])
      g.strokeStyle = COL.teal
      g.lineWidth = 2
      g.beginPath()
      g.arc(ox + ow * 0.4, oy + oh * 0.42, 120, 0, 7)
      g.stroke()
      g.setLineDash([])
      g.fillStyle = COL.teal
      g.font = '700 11px ui-monospace,monospace'
      g.fillText('AOI // HORNET', ox + ow * 0.4 - 52, oy + oh * 0.42 - 128)
      const sweep = (t * 0.5) % 1
      const sxp = ox + sweep * ow
      const grd = g.createLinearGradient(sxp - 60, 0, sxp, 0)
      grd.addColorStop(0, 'rgba(55,224,208,0)')
      grd.addColorStop(1, 'rgba(55,224,208,.18)')
      g.fillStyle = grd
      g.fillRect(sxp - 60, oy, 60, oh)
      g.strokeStyle = 'rgba(55,224,208,.6)'
      g.beginPath()
      g.moveTo(sxp, oy)
      g.lineTo(sxp, oy + oh)
      g.stroke()
      const pins = [
        [0.4, 0.42, 'TGT-01', 'ACTIVE', COL.red],
        [0.72, 0.3, 'TGT-02', 'TASKED', COL.amber],
        [0.55, 0.7, 'OBS-14', 'WATCH', COL.blue],
        [0.3, 0.62, 'NODE-7', 'FRIEND', COL.green],
      ] as const
      pins.forEach((p, i) => {
        const px = ox + ow * p[0]
        const py = oy + oh * p[1]
        const pulse = 1 + Math.sin(t * 3 + i) * 0.18
        g.strokeStyle = p[4]
        g.lineWidth = 1.5
        g.beginPath()
        g.arc(px, py, 14 * pulse, 0, 7)
        g.stroke()
        g.fillStyle = p[4]
        g.beginPath()
        g.arc(px, py, 4, 0, 7)
        g.fill()
        g.beginPath()
        g.moveTo(px, py - 16)
        g.lineTo(px + 22, py - 30)
        g.stroke()
        g.fillStyle = 'rgba(6,12,18,.85)'
        rr(g, px + 22, py - 42, 96, 24, 4)
        g.fill()
        g.fillStyle = p[4]
        g.font = '700 10px ui-monospace,monospace'
        g.fillText(p[2], px + 28, py - 30)
        g.fillStyle = COL.dim
        g.font = '8px ui-monospace,monospace'
        g.fillText(p[3], px + 28, py - 21)
      })
      g.restore()
      panel(g, W - 190, H - 170, 172, 138, 'SECTOR')
      g.strokeStyle = COL.line
      g.strokeRect(W - 178, H - 140, 148, 96)
      g.strokeStyle = COL.amber
      g.strokeRect(W - 140, H - 118, 44, 34)
    }

    function drawOrbit(g: CanvasRenderingContext2D, t: number) {
      toolSel = 2
      chrome(g, 'ORBITAL COVERAGE')
      const ox = 46
      const oy = 50
      const ow = W - 46
      const oh = H - 72
      g.fillStyle = '#060c14'
      g.fillRect(ox, oy, ow, oh)
      for (let i = 0; i < 120; i++) {
        g.fillStyle = `rgba(200,220,255,${Math.random() * 0.5})`
        g.fillRect(ox + ((i * 97) % ow), oy + ((i * 57) % oh), 1.4, 1.4)
      }
      const ex = ox + ow * 0.6
      const ey = oy + oh * 0.5
      const er = 175
      const grd = g.createRadialGradient(ex - 60, ey - 50, 20, ex, ey, er)
      grd.addColorStop(0, '#1c4a6e')
      grd.addColorStop(0.6, '#0c2338')
      grd.addColorStop(1, '#040a12')
      g.fillStyle = grd
      g.beginPath()
      g.arc(ex, ey, er, 0, 7)
      g.fill()
      g.strokeStyle = 'rgba(74,168,255,.5)'
      g.lineWidth = 2
      g.beginPath()
      g.arc(ex, ey, er, 0, 7)
      g.stroke()
      g.strokeStyle = 'rgba(74,168,255,.22)'
      g.lineWidth = 8
      g.beginPath()
      g.arc(ex, ey, er + 6, 0, 7)
      g.stroke()
      for (let k = 0; k < 3; k++) {
        g.strokeStyle = `rgba(55,224,208,${0.5 - k * 0.12})`
        g.lineWidth = 1.5
        g.setLineDash([5, 5])
        g.beginPath()
        g.ellipse(ex, ey, er + 40 + k * 28, (er + 40 + k * 28) * 0.42, k * 0.5, 0, 7)
        g.stroke()
        g.setLineDash([])
        const a = t * (0.6 - k * 0.12) + k * 2
        const spx = ex + Math.cos(a) * (er + 40 + k * 28)
        const spy = ey + Math.sin(a) * ((er + 40 + k * 28) * 0.42)
        const ca = Math.cos(k * 0.5)
        const sa = Math.sin(k * 0.5)
        const rx = ex + (spx - ex) * ca - (spy - ey) * sa
        const ry = ey + (spx - ex) * sa + (spy - ey) * ca
        g.fillStyle = COL.teal
        g.shadowColor = COL.teal
        g.shadowBlur = 12
        g.beginPath()
        g.arc(rx, ry, 4, 0, 7)
        g.fill()
        g.shadowBlur = 0
      }
      panel(g, 60, 66, 250, H - 110, 'Simulation Results')
      g.fillStyle = COL.text
      g.font = '10px ui-monospace,monospace'
      const rows = ['PASS 04  06:12Z  ELV 78°', 'PASS 05  06:48Z  ELV 61°', 'PASS 06  07:29Z  ELV 44°', 'PASS 07  08:03Z  ELV 22°']
      rows.forEach((r, i) => {
        const yy = 110 + i * 40
        const on = Math.floor(t * 0.5) % rows.length === i
        g.fillStyle = on ? '#12303a' : COL.panel2
        rr(g, 72, yy, 226, 30, 4)
        g.fill()
        g.fillStyle = on ? COL.teal : COL.dim
        g.fillText(r, 84, yy + 19)
      })
      g.fillStyle = COL.dim
      g.font = '700 9px ui-monospace,monospace'
      g.fillText('14 PASSES / 24H WINDOW', 72, H - 70)
      panel(g, W - 236, 66, 220, 196, 'FLOCK 1C.3')
      const px = W - 126
      const py = 170
      const pr = 70
      g.strokeStyle = COL.line
      for (let r = pr; r > 0; r -= pr / 3) {
        g.beginPath()
        g.arc(px, py, r, 0, 7)
        g.stroke()
      }
      g.beginPath()
      g.moveTo(px - pr, py)
      g.lineTo(px + pr, py)
      g.moveTo(px, py - pr)
      g.lineTo(px, py + pr)
      g.stroke()
      const sa2 = t * 1.4
      g.strokeStyle = COL.green
      g.lineWidth = 2
      g.beginPath()
      g.moveTo(px, py)
      g.lineTo(px + Math.cos(sa2) * pr, py + Math.sin(sa2) * pr)
      g.stroke()
      for (let i = 0; i < 5; i++) {
        const a = i * 1.3 + t * 0.2
        const r = 20 + i * 10
        g.fillStyle = COL.blue
        g.beginPath()
        g.arc(px + Math.cos(a) * r, py + Math.sin(a) * r, 3, 0, 7)
        g.fill()
      }
      g.fillStyle = COL.dim
      g.font = '9px ui-monospace,monospace'
      g.fillText('AOI // PLANET LOCK', W - 224, 250)
    }

    function drawTargets(g: CanvasRenderingContext2D, t: number) {
      toolSel = 1
      chrome(g, 'TARGETING')
      const ox = 46
      const oy = 50
      const ow = W - 46
      const oh = H - 72
      g.fillStyle = '#0b1420'
      g.fillRect(ox, oy, ow, oh)
      g.strokeStyle = 'rgba(74,168,255,.08)'
      for (let x = ox; x < W; x += 40) {
        g.beginPath()
        g.moveTo(x, oy)
        g.lineTo(x, H - 22)
        g.stroke()
      }
      for (let y = oy; y < H - 22; y += 40) {
        g.beginPath()
        g.moveTo(ox, y)
        g.lineTo(W, y)
        g.stroke()
      }
      const rx = ox + ow * 0.66
      const ry = oy + oh * 0.52
      const lock = (t * 0.5) % 1
      const size = 90 - lock * 46
      g.strokeStyle = COL.red
      g.lineWidth = 2
      g.strokeRect(rx - size, ry - size, size * 2, size * 2)
      g.beginPath()
      g.moveTo(rx - size - 10, ry)
      g.lineTo(rx - size + 14, ry)
      g.moveTo(rx + size - 14, ry)
      g.lineTo(rx + size + 10, ry)
      g.moveTo(rx, ry - size - 10)
      g.lineTo(rx, ry - size + 14)
      g.moveTo(rx, ry + size - 14)
      g.lineTo(rx, ry + size + 10)
      g.stroke()
      g.fillStyle = COL.red
      g.font = '700 10px ui-monospace,monospace'
      g.fillText(lock > 0.9 ? 'LOCKED' : 'TRACKING…', rx - size, ry - size - 8)
      g.beginPath()
      g.arc(rx, ry, 3, 0, 7)
      g.fill()
      panel(g, 60, 66, 320, H - 110, 'Target Filters')
      g.fillStyle = COL.green
      g.font = '700 11px ui-monospace,monospace'
      g.fillText('52 TARGETS READY TO TASK', 76, 108)
      const list = [
        ['Bridging Facility', 'MULTI-AIMPOINT', COL.amber],
        ['Relay Station', 'SINGLE', COL.blue],
        ['Convoy Staging', 'MOVING', COL.red],
        ['Supply Depot', 'TASKED', COL.green],
        ['Comms Array', 'PROPOSED', COL.teal],
      ]
      list.forEach((it, i) => {
        const yy = 130 + i * 58
        const sel = Math.floor(t * 0.4) % list.length === i
        g.fillStyle = sel ? '#12303a' : COL.panel2
        rr(g, 72, yy, 296, 48, 5)
        g.fill()
        if (sel) {
          g.strokeStyle = COL.teal
          g.lineWidth = 1.5
          rr(g, 72, yy, 296, 48, 5)
          g.stroke()
        }
        g.fillStyle = it[2]
        g.beginPath()
        g.arc(90, yy + 24, 6, 0, 7)
        g.fill()
        g.fillStyle = COL.text
        g.font = '700 12px ui-monospace,monospace'
        g.fillText(it[0], 108, yy + 22)
        g.fillStyle = COL.dim
        g.font = '9px ui-monospace,monospace'
        g.fillText(it[1], 108, yy + 38)
        g.fillStyle = it[2]
        g.font = '700 9px ui-monospace,monospace'
        g.textAlign = 'right'
        g.fillText('▸', 356, yy + 28)
        g.textAlign = 'left'
      })
    }

    function drawImagery(g: CanvasRenderingContext2D, t: number) {
      toolSel = 3
      chrome(g, 'IMAGERY ANALYSIS')
      panel(g, 60, 66, 220, H - 110, 'Image Library')
      const sensors: [string, number, string][] = [
        ['EO', 12305, COL.blue],
        ['SAR', 6532, COL.teal],
        ['MSI', 4110, COL.green],
        ['IR', 2044, COL.amber],
      ]
      sensors.forEach((s, i) => {
        const yy = 110 + i * 54
        g.fillStyle = COL.text
        g.font = '700 11px ui-monospace,monospace'
        g.fillText(s[0], 76, yy + 10)
        g.fillStyle = COL.dim
        g.textAlign = 'right'
        g.fillText(String(s[1]), 264, yy + 10)
        g.textAlign = 'left'
        g.fillStyle = COL.panel2
        rr(g, 76, yy + 16, 188, 6, 3)
        g.fill()
        g.fillStyle = s[2]
        rr(g, 76, yy + 16, 188 * (0.3 + i * 0.18), 6, 3)
        g.fill()
      })
      const ix = 300
      const iy = 70
      const iw = W - 320
      const ih = H - 160
      g.save()
      rr(g, ix, iy, iw, ih, 6)
      g.clip()
      g.fillStyle = '#243021'
      g.fillRect(ix, iy, iw, ih)
      for (let i = 0; i < 40; i++) {
        g.fillStyle = `hsl(${90 + Math.random() * 30},30%,${18 + Math.random() * 14}%)`
        g.fillRect(ix + Math.random() * iw, iy + Math.random() * ih, 30 + Math.random() * 70, 24 + Math.random() * 50)
      }
      g.strokeStyle = 'rgba(220,220,210,.35)'
      g.lineWidth = 3
      g.beginPath()
      g.moveTo(ix, iy + ih * 0.4)
      g.lineTo(ix + iw, iy + ih * 0.55)
      g.stroke()
      g.beginPath()
      g.moveTo(ix + iw * 0.5, iy)
      g.lineTo(ix + iw * 0.42, iy + ih)
      g.stroke()
      for (let i = 0; i < 70; i++) {
        const bx = ix + iw * 0.3 + Math.random() * iw * 0.4
        const by = iy + ih * 0.35 + Math.random() * ih * 0.4
        g.fillStyle = ['#8a4b3a', '#9a5a44', '#6a6a72', '#7d5238'][i % 4]
        g.fillRect(bx, by, 8 + Math.random() * 10, 8 + Math.random() * 10)
      }
      g.strokeStyle = COL.amber
      g.lineWidth = 2
      g.setLineDash([6, 4])
      g.beginPath()
      const poly = [
        [0.42, 0.42],
        [0.55, 0.4],
        [0.58, 0.55],
        [0.46, 0.6],
        [0.4, 0.5],
      ]
      poly.forEach((p, i) => {
        const px = ix + iw * p[0]
        const py = iy + ih * p[1]
        i ? g.lineTo(px, py) : g.moveTo(px, py)
      })
      g.closePath()
      g.stroke()
      g.setLineDash([])
      const pulse = (t * 0.8) % 1
      g.strokeStyle = `rgba(255,90,90,${1 - pulse})`
      g.lineWidth = 2
      g.beginPath()
      g.arc(ix + iw * 0.49, iy + ih * 0.5, 6 + pulse * 40, 0, 7)
      g.stroke()
      g.restore()
      g.strokeStyle = COL.line
      rr(g, ix, iy, iw, ih, 6)
      g.stroke()
      g.fillStyle = 'rgba(6,12,18,.88)'
      rr(g, ix + 12, iy + ih - 56, 210, 44, 4)
      g.fill()
      g.fillStyle = COL.teal
      g.font = '700 11px ui-monospace,monospace'
      g.fillText('36.4271°N  129.0819°E', ix + 22, iy + ih - 34)
      g.fillStyle = COL.dim
      g.font = '9px ui-monospace,monospace'
      g.fillText('EO // GSD 0.35m // 14 JAN', ix + 22, iy + ih - 19)
      const sy = iy + ((t * 80) % ih)
      g.strokeStyle = 'rgba(55,224,208,.5)'
      g.beginPath()
      g.moveTo(ix, sy)
      g.lineTo(ix + iw, sy)
      g.stroke()
    }

    function glitch(g: CanvasRenderingContext2D, a: number) {
      if (a <= 0) return
      for (let i = 0; i < 14; i++) {
        const y = Math.random() * H
        const h = 2 + Math.random() * 18
        const dx = (Math.random() - 0.5) * 40 * a
        const img = g.getImageData(0, y, W, h)
        g.putImageData(img, dx, y)
      }
      g.fillStyle = `rgba(55,224,208,${0.06 * a})`
      g.fillRect(0, 0, W, H)
    }

    const modes = [drawMap, drawOrbit, drawTargets, drawImagery]
    const MODE_DUR = 6.0

    function updateScreen(t: number, powerOn: number) {
      const cycleT = Math.max(0, t - 3.4)
      const idx = Math.floor(cycleT / MODE_DUR) % modes.length
      const local = (cycleT % MODE_DUR) / MODE_DUR
      modes[idx](sx, t)
      if (local < 0.09) glitch(sx, (0.09 - local) / 0.09)
      if (powerOn < 1) {
        const fl = powerOn < 0.7 ? (Math.random() < 0.5 ? 0.4 : 0) : 0
        sx.fillStyle = `rgba(3,6,10,${1 - powerOn + fl})`
        sx.fillRect(0, 0, W, H)
      }
      sx.fillStyle = 'rgba(0,0,0,0.05)'
      for (let y = 20; y < H; y += 3) sx.fillRect(0, y, W, 1)
      scrTex.needsUpdate = true
    }

    /* ---------- loop ---------- */
    const clock = new THREE.Clock()
    function smooth(a: number, b: number, t: number) {
      t = Math.max(0, Math.min(1, (t - a) / (b - a)))
      return t * t * (3 - 2 * t)
    }

    function tick() {
      if (disposed) return
      const t = clock.getElapsedTime()

      const op = smooth(0.6, 3.2, t)
      hinge.rotation.x = LID_CLOSED + (LID_OPEN - LID_CLOSED) * op

      const powerOn = smooth(1.6, 2.6, t)
      updateScreen(t, powerOn)
      screenGlow.intensity = 3.0 * powerOn

      holo.rotation.y += 0.004
      wire.rotation.y -= 0.002
      sats.forEach((s, i) => {
        const a = t * s.spd + s.off
        const x = Math.cos(a) * s.r
        const z = Math.sin(a) * s.r
        const y = Math.sin(a * 1.3) * s.r * 0.3
        s.mesh.position.set(x, y, z).applyEuler(new THREE.Euler(s.tilt.x, 0, s.tilt.z))
      })

      const camOp = smooth(0.4, 5.0, t)
      const radius = 3.7 - camOp * 1.0
      const autoYaw = Math.sin(t * 0.05) * 0.28
      const pitch = 0.18 + Math.sin(t * 0.07) * 0.05
      camera.position.x = Math.sin(autoYaw) * radius
      camera.position.z = Math.cos(autoYaw) * radius
      camera.position.y = 0.55 + pitch
      camera.lookAt(camTarget)

      const dp = dustGeo.attributes.position.array as Float32Array
      for (let i = 0; i < dustN; i++) {
        dp[i * 3 + 1] -= 0.0015
        if (dp[i * 3 + 1] < 0) dp[i * 3 + 1] = 4
      }
      dustGeo.attributes.position.needsUpdate = true

      core.material.color.setHSL(0.47, 0.6, 0.6 + Math.sin(t * 2) * 0.1)

      composer?.render()
      rafId = requestAnimationFrame(tick)
    }

    /* ---------- resize ---------- */
    function onResize() {
      const m = window.innerWidth < 768
      camera.aspect = window.innerWidth / window.innerHeight
      camera.fov = m ? 52 : 34
      camera.position.set(0.1, m ? 0.55 : 0.7, m ? 5.2 : 3.7)
      camera.updateProjectionMatrix()
      renderer?.setSize(window.innerWidth, window.innerHeight)
      composer?.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    if (reducedMotion) {
      // Render a single frame and let the scene sit still.
      tick()
      cancelAnimationFrame(rafId)
      composer?.render()
    } else {
      tick()
    }

    return () => {
      disposed = true
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
      renderer?.dispose()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  )
}
