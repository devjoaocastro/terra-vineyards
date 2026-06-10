import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Float, Html, Sparkles, useCursor, useScroll } from '@react-three/drei'
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing'
import { easing } from '../lib/easing'
import { PAGES, glassTip, setScrollEl } from '../scrollBus'

/** World depth: the camera glides from z=10 down the valley to -DEPTH+10 */
const SEG = 16
const DEPTH = (PAGES - 1) * SEG // 96

/** x position of the river at depth z — the whole valley follows it */
const riverX = (z: number) => Math.sin(z * 0.07) * 2.2
const riverDX = (z: number) => Math.cos(z * 0.07) * 0.07 * 2.2

/* palette */
const C_DUSK = new THREE.Color('#2b1219') // warm golden-hour plum
const C_NIGHT = new THREE.Color('#120a10') // deep dusk plum
const C_SCHIST = new THREE.Color('#241419') // unlit terrace stone
const C_LIT = new THREE.Color('#c08148') // terrace catching the low sun
const C_SUN_HIGH = new THREE.Color('#ffc97a')
const C_SUN_LOW = new THREE.Color('#cf4f2a')

/* ------------------------------------------------------------------ */
/* Terraces — ~900 instanced stone walls stacked into rolling hills    */
/* on both banks of the river. Each row LIGHTS UP as the camera        */
/* approaches it with the scroll, like evening sun raking the slope.   */
/* ------------------------------------------------------------------ */

type Terrace = { x: number; y: number; z: number; ry: number; t: number; sx: number }

function Terraces() {
  const mesh = useRef<THREE.InstancedMesh>(null!)
  const scroll = useScroll()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const tint = useMemo(() => new THREE.Color(), [])

  const terraces = useMemo<Terrace[]>(() => {
    const rng = (a: number, b: number) => a + Math.random() * (b - a)
    const arr: Terrace[] = []
    for (const side of [-1, 1]) {
      for (let row = 0; row < 7; row++) {
        for (let z = 16; z > -(DEPTH + 30); z -= 2.2) {
          const x = riverX(z) + side * (4.6 + row * 1.55 + Math.sin(z * 0.21 + row) * 0.35)
          const y = 0.32 + row * 0.62 + (Math.sin(z * 0.05 + side) + 1) * 0.22
          const ry = Math.atan(riverDX(z))
          // light trigger: the row glows shortly before the camera reaches it,
          // staggered per row so the hillside ignites terrace by terrace
          const t = Math.max(
            0,
            THREE.MathUtils.clamp((-z - 2) / (DEPTH + 26), 0, 0.93) + row * 0.007 + rng(-0.03, 0.015),
          )
          arr.push({ x, y, z, ry, t, sx: rng(0.85, 1.15) })
        }
      }
    }
    return arr
  }, [])

  useEffect(() => {
    terraces.forEach((b, i) => {
      dummy.position.set(b.x, b.y, b.z)
      dummy.rotation.set(0, b.ry, 0)
      dummy.scale.set(2.15 * b.sx, 0.55, 2.5)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  }, [terraces, dummy])

  useFrame(() => {
    const o = scroll.offset
    terraces.forEach((b, i) => {
      const s = THREE.MathUtils.smoothstep(o, b.t, b.t + 0.07)
      tint.lerpColors(C_SCHIST, C_LIT, s * 0.9)
      mesh.current.setColorAt(i, tint)
    })
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, terraces.length]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#ffffff" roughness={0.9} metalness={0.08} />
    </instancedMesh>
  )
}

/* ------------------------------------------------------------------ */
/* Vines — instanced posts + cross arms + leaf crowns lining the       */
/* valley floor in rows that follow the river's curve.                 */
/* ------------------------------------------------------------------ */

type Vine = { x: number; z: number; h: number; shade: number }

function Vines() {
  const posts = useRef<THREE.InstancedMesh>(null!)
  const arms = useRef<THREE.InstancedMesh>(null!)
  const crowns = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const vines = useMemo<Vine[]>(() => {
    const rng = (a: number, b: number) => a + Math.random() * (b - a)
    const arr: Vine[] = []
    for (const offset of [-2.7, -1.8, 1.8, 2.7]) {
      for (let z = 14; z > -(DEPTH + 20); z -= 1.35) {
        // keep the cellar clearing free of vines (barrel stack lives there)
        if (offset < 0 && z < -43 && z > -53) continue
        // keep the harvest clearing free too (grape cluster lives there)
        if (offset > 0 && z < -60 && z > -68) continue
        arr.push({
          x: riverX(z) + offset + rng(-0.12, 0.12),
          z: z + rng(-0.2, 0.2),
          h: rng(0.62, 0.82),
          shade: rng(-0.08, 0.08),
        })
      }
    }
    return arr
  }, [])

  useEffect(() => {
    const green = new THREE.Color()
    vines.forEach((v, i) => {
      // post
      dummy.position.set(v.x, v.h / 2, v.z)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(1, v.h, 1)
      dummy.updateMatrix()
      posts.current.setMatrixAt(i, dummy.matrix)
      // cross arm
      dummy.position.set(v.x, v.h * 0.78, v.z)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      arms.current.setMatrixAt(i, dummy.matrix)
      // leaf crown
      dummy.position.set(v.x, v.h + 0.16, v.z)
      dummy.scale.set(1.5, 1, 1.1)
      dummy.updateMatrix()
      crowns.current.setMatrixAt(i, dummy.matrix)
      green.set('#3f5d31').offsetHSL(0, v.shade * 0.5, v.shade)
      crowns.current.setColorAt(i, green)
    })
    posts.current.instanceMatrix.needsUpdate = true
    arms.current.instanceMatrix.needsUpdate = true
    crowns.current.instanceMatrix.needsUpdate = true
    if (crowns.current.instanceColor) crowns.current.instanceColor.needsUpdate = true
  }, [vines, dummy])

  return (
    <group>
      <instancedMesh ref={posts} args={[undefined, undefined, vines.length]}>
        <boxGeometry args={[0.05, 1, 0.05]} />
        <meshStandardMaterial color="#3a2a20" roughness={0.85} />
      </instancedMesh>
      <instancedMesh ref={arms} args={[undefined, undefined, vines.length]}>
        <boxGeometry args={[0.46, 0.04, 0.04]} />
        <meshStandardMaterial color="#3a2a20" roughness={0.85} />
      </instancedMesh>
      <instancedMesh ref={crowns} args={[undefined, undefined, vines.length]}>
        <sphereGeometry args={[0.16, 10, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.8} />
      </instancedMesh>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* River — a flat reflective ribbon snaking down the valley floor.     */
/* ------------------------------------------------------------------ */

function River() {
  const geo = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let z = 24; z > -(DEPTH + 44); z -= 3) {
      pts.push(new THREE.Vector3(riverX(z), 0.6, z))
    }
    const curve = new THREE.CatmullRomCurve3(pts)
    return new THREE.TubeGeometry(curve, 220, 0.85, 8, false)
  }, [])
  useEffect(() => () => geo.dispose(), [geo])

  return (
    <mesh geometry={geo} scale={[1, 0.05, 1]}>
      <meshPhysicalMaterial
        color="#16242e"
        metalness={0.75}
        roughness={0.12}
        clearcoat={1}
        clearcoatRoughness={0.18}
        emissive="#3a2417"
        emissiveIntensity={0.35}
      />
    </mesh>
  )
}

/* ------------------------------------------------------------------ */
/* Ground — dark schist-earth plane under everything.                  */
/* ------------------------------------------------------------------ */

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -DEPTH / 2]}>
      <planeGeometry args={[140, DEPTH + 160]} />
      <meshStandardMaterial color="#1d1015" roughness={0.96} metalness={0} />
    </mesh>
  )
}

/* ------------------------------------------------------------------ */
/* Sun — a low emissive disc on the far ridge that SETS as you scroll, */
/* cooling from gold to ember while the sky lerps into dusk.           */
/* ------------------------------------------------------------------ */

function Sun() {
  const disc = useRef<THREE.Mesh>(null!)
  const mat = useRef<THREE.MeshBasicMaterial>(null!)
  const glow = useRef<THREE.PointLight>(null!)
  const scroll = useScroll()

  useFrame((state) => {
    const o = scroll.offset
    disc.current.position.y = 3.6 - o * 8.5
    mat.current.color.lerpColors(C_SUN_HIGH, C_SUN_LOW, Math.min(1, o * 1.4))
    glow.current.intensity = 150 * Math.max(0.18, 1 - o * 0.8)
    const breathe = 1 + Math.sin(state.clock.elapsedTime * 1.1) * 0.015
    disc.current.scale.setScalar(breathe)
  })

  return (
    <group position={[0, 0, -DEPTH - 34]}>
      <mesh ref={disc} position={[0, 3.6, 0]}>
        <sphereGeometry args={[6, 48, 48]} />
        <meshBasicMaterial ref={mat} color="#ffc97a" toneMapped={false} />
      </mesh>
      <pointLight ref={glow} position={[0, 5, 8]} intensity={150} distance={90} color="#ff9d52" />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* PlotPin — survey stake on a terrace with an Html label that fades   */
/* with the scroll (labels ignore fog, so we drive opacity manually    */
/* and only show them while the Terroir section is on screen).         */
/* ------------------------------------------------------------------ */

function PlotPin({
  position,
  name,
  detail,
}: {
  position: [number, number, number]
  name: string
  detail: string
}) {
  const ring = useRef<THREE.Mesh>(null!)
  const group = useRef<THREE.Group>(null!)
  const label = useRef<HTMLDivElement>(null)
  const scroll = useScroll()
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    const pulse = 1 + Math.sin(t * 2.2) * 0.22
    ring.current.scale.setScalar(pulse)
    ;(ring.current.material as THREE.MeshBasicMaterial).opacity = 0.5 - Math.sin(t * 2.2) * 0.2
    easing.damp3(group.current.scale, hovered ? 1.3 : 1, 0.18, delta)

    // HTML labels ignore fog/depth — only show them while the Terroir
    // section (page 1) is on screen, fading in/out with the scroll.
    if (label.current) {
      const sec = scroll.offset * (PAGES - 1)
      const visibility = Math.max(0, 1 - Math.abs(sec - 1) * 1.6)
      label.current.style.opacity = visibility.toFixed(3)
      label.current.style.display = visibility < 0.04 ? 'none' : ''
    }
  })

  return (
    <group
      ref={group}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* stake */}
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1.4, 8]} />
        <meshStandardMaterial color="#e3a857" metalness={0.75} roughness={0.3} />
      </mesh>
      {/* glowing head */}
      <mesh position={[0, 1.48, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color={hovered ? '#ffd9a0' : '#e3a857'} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 1.48, 0]} intensity={hovered ? 9 : 3.5} distance={6} color="#e3a857" />
      {/* pulsing ground ring */}
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[0.5, 0.57, 48]} />
        <meshBasicMaterial color="#e3a857" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* label */}
      <Html center position={[0, 2.1, 0]} className="pin-html" zIndexRange={[20, 0]}>
        <div ref={label} className={`pin-label ${hovered ? 'pin-label--hot' : ''}`} style={{ opacity: 0, display: 'none' }}>
          <strong>{name}</strong>
          <span>{detail}</span>
        </div>
      </Html>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* WineGlass — stem + lathe-hinted bowl that FILLS with burgundy as    */
/* you scroll through the tasting section. Hovering the DOM wine       */
/* cards (or the glass itself) tips it gently via the glassTip bus.    */
/* ------------------------------------------------------------------ */

function WineGlass() {
  const group = useRef<THREE.Group>(null!)
  const liquid = useRef<THREE.Mesh>(null!)
  const surface = useRef<THREE.Mesh>(null!)
  const scroll = useScroll()
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)

  useFrame((_, delta) => {
    // fill rises across the wines section (page 2)
    const fill = scroll.range(1.55 / (PAGES - 1), 0.9 / (PAGES - 1))
    const h = Math.max(0.001, fill * 0.46)
    liquid.current.scale.set(1, h, 1)
    liquid.current.position.y = 0.76 + h / 2
    surface.current.position.y = 0.76 + h + 0.002
    surface.current.scale.setScalar(fill < 0.02 ? 0.001 : 1)

    const tip = glassTip.target + (hovered ? 0.14 : 0)
    easing.damp(group.current.rotation, 'z', tip, 0.22, delta)
  })

  return (
    <group position={[1.7, 1.5, -SEG * 2]}>
      <Float speed={1.3} rotationIntensity={0.12} floatIntensity={0.45}>
        <group
          ref={group}
          onPointerOver={(e) => {
            e.stopPropagation()
            setHovered(true)
          }}
          onPointerOut={() => setHovered(false)}
        >
          {/* base */}
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.34, 0.36, 0.045, 32]} />
            <meshPhysicalMaterial color="#cdbfae" transparent opacity={0.4} roughness={0.06} metalness={0.1} clearcoat={1} />
          </mesh>
          {/* stem */}
          <mesh position={[0, 0.42, 0]}>
            <cylinderGeometry args={[0.04, 0.05, 0.78, 16]} />
            <meshPhysicalMaterial color="#cdbfae" transparent opacity={0.4} roughness={0.06} metalness={0.1} clearcoat={1} />
          </mesh>
          {/* bowl — open-topped sphere band, lathe hint */}
          <mesh position={[0, 1.16, 0]}>
            <sphereGeometry args={[0.5, 32, 24, 0, Math.PI * 2, Math.PI * 0.3, Math.PI * 0.7]} />
            <meshPhysicalMaterial
              color="#e8ddcc"
              transparent
              opacity={0.22}
              roughness={0.05}
              metalness={0.05}
              clearcoat={1}
              clearcoatRoughness={0.1}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* rising burgundy — a cylinder growing inside the bowl */}
          <mesh ref={liquid} position={[0, 0.76, 0]}>
            <cylinderGeometry args={[0.3, 0.16, 1, 24]} />
            <meshStandardMaterial color="#7b2c3f" emissive="#7b2c3f" emissiveIntensity={0.55} roughness={0.25} />
          </mesh>
          {/* liquid surface glint */}
          <mesh ref={surface} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.76, 0]}>
            <circleGeometry args={[0.3, 24]} />
            <meshStandardMaterial color="#9c3b50" emissive="#b14a60" emissiveIntensity={0.8} roughness={0.15} />
          </mesh>
        </group>
      </Float>
      <pointLight position={[0.6, 1.2, 1.6]} intensity={10} distance={7} color="#e3a857" />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Cellar — a pyramid of oak barrels; each barrel rolls slightly on    */
/* its axis when hovered.                                              */
/* ------------------------------------------------------------------ */

function Barrel({ position }: { position: [number, number, number] }) {
  const group = useRef<THREE.Group>(null!)
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)

  useFrame((_, delta) => {
    easing.damp(group.current.rotation, 'x', hovered ? 0.45 : 0, 0.25, delta)
  })

  return (
    <group
      ref={group}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* staves — axis along x so it lies on its side */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.46, 0.46, 1.35, 24]} />
        <meshStandardMaterial color="#4a2c1c" roughness={0.78} metalness={0.05} />
      </mesh>
      {/* belly hint */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.49, 0.49, 0.62, 24]} />
        <meshStandardMaterial color="#553323" roughness={0.72} metalness={0.05} />
      </mesh>
      {/* iron hoops */}
      {[-0.5, -0.2, 0.2, 0.5].map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.465, 0.022, 8, 32]} />
          <meshStandardMaterial color="#8a6a45" metalness={0.75} roughness={0.32} />
        </mesh>
      ))}
      {/* chalk-stamped end cap */}
      <mesh position={[0.69, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[0.42, 24]} />
        <meshStandardMaterial color="#5c3a26" roughness={0.85} />
      </mesh>
    </group>
  )
}

function BarrelStack() {
  return (
    <group position={[-2.1, 0, -SEG * 3]}>
      <Barrel position={[0, 0.46, -1.0]} />
      <Barrel position={[0, 0.46, 0]} />
      <Barrel position={[0, 0.46, 1.0]} />
      <Barrel position={[0, 1.27, -0.5]} />
      <Barrel position={[0, 1.27, 0.5]} />
      <Barrel position={[0, 2.08, 0]} />
      {/* one candle-warm cellar lamp */}
      <pointLight position={[1.6, 2.8, 1.8]} intensity={26} distance={12} color="#e3a857" />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* GrapeCluster — a hanging bunch; click a grape and it DROPS, lands   */
/* on the schist and stays there.                                      */
/* ------------------------------------------------------------------ */

const GRAPE_POSITIONS: [number, number, number][] = (() => {
  const arr: [number, number, number][] = []
  const rows = [5, 4, 3, 2, 1]
  rows.forEach((count, r) => {
    const y = 2.55 - r * 0.27
    for (let i = 0; i < count; i++) {
      const x = (i - (count - 1) / 2) * 0.3
      const z = ((i + r) % 2 === 0 ? 1 : -1) * 0.12 + Math.sin(i * 2.1 + r) * 0.04
      arr.push([x, y, z])
    }
  })
  return arr
})()

function Grape({ position }: { position: [number, number, number] }) {
  const mesh = useRef<THREE.Mesh>(null!)
  const sim = useRef({ mode: 'hanging' as 'hanging' | 'falling' | 'landed', y: position[1], vy: 0 })
  const [hovered, setHovered] = useState(false)
  useCursor(hovered && sim.current.mode === 'hanging')

  useFrame((_, delta) => {
    const s = sim.current
    if (s.mode === 'falling') {
      s.vy -= 9.8 * delta
      s.y += s.vy * delta
      if (s.y <= 0.15) {
        s.y = 0.15
        s.mode = 'landed'
      }
      mesh.current.position.y = s.y
    }
    const scale = hovered && s.mode === 'hanging' ? 1.3 : 1
    easing.damp3(mesh.current.scale, scale, 0.15, delta)
  })

  return (
    <mesh
      ref={mesh}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation()
        if (sim.current.mode === 'hanging') {
          sim.current.mode = 'falling'
          sim.current.vy = 0.4
        }
      }}
    >
      <sphereGeometry args={[0.155, 18, 14]} />
      <meshStandardMaterial
        color={hovered ? '#7b2c3f' : '#52203a'}
        emissive="#7b2c3f"
        emissiveIntensity={hovered ? 0.5 : 0.18}
        roughness={0.35}
        metalness={0.1}
      />
    </mesh>
  )
}

function GrapeCluster() {
  return (
    <group position={[1.8, 0, -SEG * 4]}>
      {/* stem */}
      <mesh position={[0, 2.86, 0]}>
        <cylinderGeometry args={[0.03, 0.045, 0.5, 8]} />
        <meshStandardMaterial color="#4a5a2c" roughness={0.8} />
      </mesh>
      {/* leaf */}
      <mesh position={[0.25, 3.0, 0.05]} rotation={[0.4, 0.3, -0.5]}>
        <circleGeometry args={[0.26, 6]} />
        <meshStandardMaterial color="#3f5d31" roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      {GRAPE_POSITIONS.map((p, i) => (
        <Grape key={i} position={p} />
      ))}
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Experience root — gliding camera, dusk sky lerp, valley, post FX.   */
/* ------------------------------------------------------------------ */

export default function Experience() {
  const scroll = useScroll()
  const scene = useThree((s) => s.scene)
  const sunLight = useRef<THREE.DirectionalLight>(null!)

  useEffect(() => {
    setScrollEl(scroll.el)
  }, [scroll.el])

  useFrame((state, delta) => {
    const o = scroll.offset
    const z = 10 - o * DEPTH

    // glide down the valley + gentle mouse parallax — slow, languid
    easing.damp3(
      state.camera.position,
      [state.pointer.x * 1.1, 2.55 - state.pointer.y * 0.4, z],
      0.34,
      delta,
    )
    state.camera.lookAt(state.pointer.x * 1.8, 1.5, z - 9)

    // subtle dolly settle on each section
    const cam = state.camera as THREE.PerspectiveCamera
    const sec = o * (PAGES - 1)
    const frac = Math.abs(sec - Math.round(sec))
    const targetFov = 45 - (1 - Math.min(1, frac * 2.5)) * 2.5
    cam.fov = THREE.MathUtils.damp(cam.fov, targetFov, 4, delta)
    cam.updateProjectionMatrix()

    // dusk: the sky cools from golden hour to deep plum as the sun sets
    if (scene.background instanceof THREE.Color) {
      scene.background.lerpColors(C_DUSK, C_NIGHT, Math.min(1, o * 1.15))
      if (scene.fog) scene.fog.color.copy(scene.background)
    }

    // the raking sun softens as it sets
    sunLight.current.intensity = 1.0 * Math.max(0.25, 1 - o * 0.7)

    document.documentElement.style.setProperty('--scroll', o.toFixed(4))
  })

  return (
    <>
      <ambientLight intensity={0.34} color="#9a7a6a" />
      <directionalLight ref={sunLight} position={[3, 7, -28]} intensity={1.0} color="#e3a857" />
      <directionalLight position={[-6, 4, 8]} intensity={0.14} color="#5a4a6a" />

      <Ground />
      <River />
      <Terraces />
      <Vines />
      <Sun />

      {/* 1 — Terroir: plot markers (page 1, z ≈ -16) */}
      <PlotPin position={[3.0, 0.62, -13]} name="Vinha Velha" detail="planted 1916" />
      <PlotPin position={[-7.6, 1.25, -14.5]} name="Schist Ridge" detail="41° slope" />
      <PlotPin position={[-6.6, 0.62, -19]} name="River Bend" detail="old Rabigato" />

      {/* 2 — The Wines: the glass that fills (page 2, z ≈ -32) */}
      <WineGlass />

      {/* 3 — The Cellar: barrel pyramid (page 3, z ≈ -48) */}
      <BarrelStack />

      {/* 4 — Harvest: clickable grape bunch (page 4, z ≈ -64) */}
      <GrapeCluster />

      {/* fireflies waking up at dusk, around the cellar and beyond */}
      <Sparkles
        count={70}
        scale={[12, 3.5, 22]}
        position={[0, 1.6, -SEG * 3]}
        size={2.2}
        speed={0.2}
        color="#e8b46a"
        opacity={0.7}
      />
      <Sparkles
        count={110}
        scale={[14, 4, 30]}
        position={[0, 1.8, -DEPTH + 8]}
        size={2.8}
        speed={0.24}
        color="#e3a857"
        opacity={0.85}
      />

      <EffectComposer>
        <Bloom intensity={0.5} luminanceThreshold={0.32} luminanceSmoothing={0.75} mipmapBlur />
        <Noise opacity={0.05} />
        <Vignette offset={0.16} darkness={0.86} />
      </EffectComposer>
    </>
  )
}
