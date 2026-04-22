"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { BufferGeometry } from "three";

type Props = {
  geometry: BufferGeometry | null;
};

export function LasScanCanvas({ geometry }: Props) {
  if (!geometry) {
    return (
      <div className="flex h-[min(70vh,720px)] min-h-[420px] w-full items-center justify-center rounded-2xl border border-garden-800/60 bg-garden-950/80 text-sm text-garden-400">
        —
      </div>
    );
  }

  const hasColors = geometry.hasAttribute("color");

  return (
    <div className="h-[min(70vh,720px)] min-h-[420px] w-full overflow-hidden rounded-2xl border border-garden-700/40 bg-black ring-1 ring-garden-800/50">
      <Canvas camera={{ position: [0, 80, 160], fov: 45 }}>
        <color attach="background" args={["#0a120e"]} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[40, 80, 40]} intensity={0.45} color="#c8e6c9" />
        <points key={geometry.uuid} geometry={geometry}>
          <pointsMaterial
            size={0.003}
            sizeAttenuation
            vertexColors={hasColors}
            color={hasColors ? "#ffffff" : "#7dcea0"}
            transparent
            opacity={0.95}
            depthWrite={false}
          />
        </points>
        <OrbitControls
          enableDamping
          dampingFactor={0.06}
          minDistance={20}
          maxDistance={800}
        />
      </Canvas>
    </div>
  );
}
