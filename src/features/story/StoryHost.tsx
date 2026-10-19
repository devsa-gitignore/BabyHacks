'use client';

// The 3D Void sitting on top of the TV. Reuses the home-page model; lit from below by the screen's glow.
// He watches the screen, glances at the pointer when it moves, squishes on channel changes, purrs when held.
import { useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Pixelation } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Model, type Look } from '@/components/void/Void3DScene';
import type { VoidState } from '@/components/void/VoidHero';

/** Eases the TV-glow light colour instead of snapping it on channel change. */
function GlowLight({ color, power }: { color: string; power: number }) {
  const ref = useRef<THREE.DirectionalLight>(null);
  const target = useRef(new THREE.Color(color));
  target.current.set(color);
  useFrame((_, dt) => {
    const l = ref.current;
    if (!l) return;
    const k = 1 - Math.pow(0.02, dt);
    l.color.lerp(target.current, k);
    l.intensity += (power - l.intensity) * k;
  });
  return <directionalLight ref={ref} position={[0.6, -3, 3]} intensity={power} />;
}

export default function StoryHost({
  state,
  glow,
  tvOn,
  lookRef,
  squishRef,
  granularity,
}: {
  state: VoidState;
  glow: string;
  tvOn: boolean;
  lookRef: React.MutableRefObject<Look>;
  squishRef: React.MutableRefObject<number>;
  granularity: number;
}) {
  return (
    <Canvas camera={{ position: [0, 0.2, 8.4], fov: 28 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }} style={{ background: 'transparent' }}>
      <ambientLight intensity={tvOn ? 0.7 : 0.45} />
      <directionalLight position={[3, 4, 5]} intensity={tvOn ? 1.5 : 0.8} color="#d9d0ff" />
      <GlowLight color={glow} power={tvOn ? 2.4 : 0} />
      <Model state={state} look={lookRef} squishRef={squishRef} night />
      <EffectComposer multisampling={0}>
        <Pixelation granularity={granularity} />
      </EffectComposer>
    </Canvas>
  );
}

/** Where Void looks: at the screen (below + to his right), or at the pointer for a moment after it moves. */
export function useHostLook(lookRef: React.MutableRefObject<Look>, wrapRef: React.RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    const screen = { x: 0.45, y: -0.75 };
    lookRef.current = { ...screen };
    if (!enabled) return;
    let last = 0;
    const onMove = (e: PointerEvent) => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      last = performance.now();
      lookRef.current.x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width * 1.6)));
      lookRef.current.y = Math.max(-1, Math.min(1, -(e.clientY - (r.top + r.height * 0.4)) / (r.height * 1.6)));
    };
    const id = window.setInterval(() => {
      if (performance.now() - last > 2200) lookRef.current = { ...screen };
    }, 300);
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.clearInterval(id);
      window.removeEventListener('pointermove', onMove);
    };
  }, [lookRef, wrapRef, enabled]);
}
