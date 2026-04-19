'use client'
import { useRef, useEffect, Suspense, useMemo } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js'
import * as THREE from 'three'

const SHOWCASE_URL = 'https://pub-87cdc52ee5f6468fa264d104e891c756.r2.dev/showcase_rgb.ply'

function PointCloud() {
  const geometry = useLoader(PLYLoader, SHOWCASE_URL)
  const meshRef = useRef(null)

  const hasVertexColors = geometry.hasAttribute('color')

  const texture = useMemo(() => {
    if (typeof document === 'undefined') return null
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.8)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 64, 64)
    const tex = new THREE.CanvasTexture(canvas)
    tex.needsUpdate = true
    return tex
  }, [])

  useEffect(() => {
    if (!geometry) return
    geometry.computeBoundingBox()
    const box = geometry.boundingBox
    if (!box) return
    const center = new THREE.Vector3()
    box.getCenter(center)
    geometry.translate(-center.x, -center.y, -center.z)
  }, [geometry])

  useEffect(() => {
    return () => {
      texture?.dispose?.()
    }
  }, [texture])

  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.z += 0.0005
  })

  return (
    <points ref={meshRef} geometry={geometry}>
      <pointsMaterial
        size={0.15}
        map={texture ?? undefined}
        vertexColors={hasVertexColors}
        color={hasVertexColors ? '#ffffff' : '#7dcea0'}
        sizeAttenuation
        transparent
        opacity={1}
        alphaTest={texture ? 0.05 : undefined}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

function Loader() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
      <div className="w-12 h-12 border-2 border-green-400 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-green-400 text-sm tracking-widest">LOADING GARDEN SCAN...</p>
    </div>
  )
}

export default function PointCloudShowcase() {
  return (
    <div className="relative w-full h-[600px] bg-black rounded-2xl overflow-hidden">
      <Suspense fallback={<Loader />}>
        <Canvas camera={{ position: [0, 80, 160], fov: 45 }}>
          <PointCloud />
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            autoRotate={false}
            enableZoom
            minDistance={40}
            maxDistance={400}
          />
        </Canvas>
      </Suspense>
      <div className="absolute bottom-4 left-4 text-green-400/50 text-xs tracking-widest">
        DRAG TO ROTATE · SCROLL TO ZOOM
      </div>
    </div>
  )
}
