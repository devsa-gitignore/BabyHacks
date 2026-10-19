'use client';

// The 3D Void. Built from primitives with flat toon shading (3 light bands) so the look survives the
// Pixelation post effect. Transparent canvas: the page background shows through.
import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Pixelation } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { VoidState } from './VoidHero';

export type Void3DHandle = { squish: () => void };
export type Look = { x: number; y: number };

const LIME = new THREE.Color('#b8f23a');
const SLEEPY = new THREE.Color('#7e74ad');

export function Model({ state, look, squishRef, night }: { state: VoidState; look: React.MutableRefObject<Look>; squishRef: React.MutableRefObject<number>; night: boolean }) {
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const body = useRef<THREE.Mesh>(null);
  const eyes = useRef<THREE.Group[]>([]);
  const pupils = useRef<THREE.Group[]>([]);
  const eyeMats = useRef<THREE.MeshBasicMaterial[]>([]);
  const charmMat = useRef<THREE.MeshToonMaterial>(null);
  const st = useRef({ close: 0, blink: 0, nextBlink: 2.5, px: 0, py: 0, yaw: 0, t: 0 });

  const gradient = useMemo(() => {
    const d = new Uint8Array([70, 70, 70, 255, 160, 160, 160, 255, 255, 255, 255, 255]);
    const t = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat);
    t.minFilter = t.magFilter = THREE.NearestFilter;
    t.needsUpdate = true;
    return t;
  }, []);
  const tailGeo = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([new THREE.Vector3(0.7, -1.05, -0.35), new THREE.Vector3(1.35, -0.85, -0.55), new THREE.Vector3(1.65, -0.2, -0.5), new THREE.Vector3(1.4, 0.35, -0.3)]),
        18,
        0.13,
        6,
        false,
      ),
    [],
  );
  const starGeo = useMemo(() => {
    const s = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 1 : 0.45;
      const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    }
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.35, bevelEnabled: false });
  }, []);

  const INK = '#2f2754';

  useFrame((_, dt) => {
    const s = st.current;
    s.t += dt;
    const t = s.t;
    const L = look.current;
    // head + pupils follow the pointer
    const ease = 1 - Math.pow(0.0008, dt);
    s.px += (L.x - s.px) * ease;
    s.py += (L.y - s.py) * ease;
    if (head.current) {
      head.current.rotation.y = s.px * 0.38 + s.yaw;
      head.current.rotation.x = -s.py * 0.22;
    }
    pupils.current.forEach((p) => {
      if (!p) return;
      p.position.x += (s.px * 0.11 - p.position.x) * ease;
      p.position.y += (s.py * 0.14 - p.position.y) * ease;
    });
    // eyes: sleep / purr / blink
    const target = state === 'asleep' ? 1 : state === 'purr' ? 0.62 : 0;
    s.close += (target - s.close) * (1 - Math.pow(0.0005, dt));
    s.nextBlink -= dt;
    if (s.nextBlink < 0 && state === 'awake') {
      s.blink = 0.14;
      s.nextBlink = 2.5 + Math.random() * 3.5;
    }
    let c = s.close;
    if (s.blink > 0) {
      s.blink -= dt;
      c = Math.max(c, Math.sin((1 - Math.max(0, s.blink) / 0.14) * Math.PI));
    }
    eyes.current.forEach((e, i) => {
      if (!e) return;
      e.scale.y = Math.max(0.07, 1 - c * 0.93);
      eyeMats.current[i]?.color.copy(LIME).lerp(SLEEPY, Math.min(1, c * 1.4));
    });
    // idle motion
    if (body.current) body.current.scale.y = 0.85 * (1 + 0.018 * Math.sin((t * Math.PI * 2) / 3.2));
    if (tail.current) tail.current.rotation.z = Math.sin(t * 2.4) * 0.22;
    if (root.current) {
      const sq = squishRef.current;
      squishRef.current = Math.max(0, sq - dt * 2.6);
      const w = Math.sin((1 - squishRef.current) * Math.PI * 3) * squishRef.current;
      root.current.scale.set(1 + 0.07 * w, 1 - 0.1 * w, 1 + 0.07 * w);
      root.current.position.x = state === 'purr' ? Math.sin(t * 70) * 0.012 : 0;
      root.current.position.y = -0.1 + (state === 'asleep' ? Math.sin(t * 1.6) * 0.01 : 0);
    }
    if (charmMat.current) charmMat.current.emissiveIntensity = night ? 0.7 + 0.3 * Math.sin(t * 2.2) : 0.05;
  });

  const toon = (color: string) => <meshToonMaterial color={color} gradientMap={gradient} />;

  return (
    <group ref={root} position={[0, -0.1, 0]}>
      <group ref={tail}>
        <mesh geometry={tailGeo}>{toon(INK)}</mesh>
      </group>
      <mesh ref={body} position={[0, -0.75, 0]} scale={[0.95, 0.85, 0.85]}>
        <sphereGeometry args={[1, 14, 10]} />
        {toon(INK)}
      </mesh>
      {[-0.45, 0.45].map((x) => (
        <mesh key={x} position={[x, -1.35, 0.75]} scale={[0.4, 0.28, 0.46]}>
          <sphereGeometry args={[1, 10, 8]} />
          {toon(INK)}
        </mesh>
      ))}
      {/* collar + star charm */}
      <mesh position={[0, -0.2, 0.15]} rotation={[Math.PI / 2 - 0.12, 0, 0]} scale={[1, 1.05, 1]}>
        <torusGeometry args={[0.82, 0.09, 6, 18]} />
        <meshToonMaterial color="#5b3fd0" gradientMap={gradient} />
      </mesh>
      <mesh geometry={starGeo} position={[0, -0.55, 0.8]} scale={[0.2, 0.2, 0.2]}>
        <meshToonMaterial ref={charmMat} color="#ffe27a" gradientMap={gradient} emissive="#ffcf3a" emissiveIntensity={0.05} />
      </mesh>

      <group ref={head} position={[0, 0.5, 0.05]}>
        <mesh scale={[1.22, 1, 1.05]}>
          <sphereGeometry args={[1, 16, 12]} />
          {toon(INK)}
        </mesh>
        {[-1, 1].map((sx) => (
          <group key={sx} position={[sx * 0.78, 1.0, -0.05]} rotation={[0, 0, -sx * 0.32]}>
            <mesh scale={[1, 1, 0.6]}>
              <coneGeometry args={[0.46, 0.95, 4]} />
              {toon(INK)}
            </mesh>
            <mesh position={[0, -0.04, 0.12]} scale={[0.6, 0.7, 0.4]}>
              <coneGeometry args={[0.46, 0.95, 4]} />
              <meshBasicMaterial color="#ffa9c6" />
            </mesh>
          </group>
        ))}
        {[-1, 1].map((sx, i) => (
          <group key={sx} ref={(g) => void (eyes.current[i] = g as THREE.Group)} position={[sx * 0.5, 0.08, 0.93]}>
            <mesh scale={[0.9, 1.15, 0.45]}>
              <sphereGeometry args={[0.3, 14, 10]} />
              <meshBasicMaterial ref={(m) => void (eyeMats.current[i] = m as THREE.MeshBasicMaterial)} color="#b8f23a" />
            </mesh>
            <group ref={(g) => void (pupils.current[i] = g as THREE.Group)} position={[0, 0, 0.1]}>
              <mesh scale={[0.3, 1.55, 0.5]}>
                <sphereGeometry args={[0.1, 8, 8]} />
                <meshBasicMaterial color="#0d0b1a" />
              </mesh>
            </group>
            <mesh position={[-0.1, 0.12, 0.17]}>
              <sphereGeometry args={[0.045, 6, 6]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>
        ))}
        <mesh position={[0, -0.26, 1.04]} rotation={[Math.PI, 0, 0]} scale={[1, 0.8, 0.7]}>
          <coneGeometry args={[0.12, 0.14, 3]} />
          <meshBasicMaterial color="#ff7aa8" />
        </mesh>
        {[-1, 1].map((sx) =>
          [0, 1, 2].map((i) => (
            <mesh key={`${sx}${i}`} position={[sx * 1.02, -0.18 - i * 0.1, 0.78]} rotation={[0, 0, sx * (Math.PI / 2 + (i - 1) * 0.16)]}>
              <cylinderGeometry args={[0.012, 0.012, 0.62, 4]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          )),
        )}
      </group>
    </group>
  );
}

export default function Void3DScene({
  state,
  granularity,
  night,
  lookRef,
  squishRef,
}: {
  state: VoidState;
  granularity: number;
  night: boolean;
  lookRef: React.MutableRefObject<Look>;
  squishRef: React.MutableRefObject<number>;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      lookRef.current.x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width * 0.7)));
      lookRef.current.y = Math.max(-1, Math.min(1, -(e.clientY - (r.top + r.height * 0.35)) / (r.height * 0.7)));
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [lookRef]);
  return (
    <div ref={wrap} className="h-full w-full">
      <Canvas
        camera={{ position: [0, 0.35, 7.2], fov: 28 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 4, 5]} intensity={2.2} />
        <directionalLight position={[-4, 1, -2]} intensity={night ? 1.2 : 0.4} color={night ? '#7fe8ff' : '#ffffff'} />
        <Model state={state} look={lookRef} squishRef={squishRef} night={night} />
        <EffectComposer multisampling={0}>
          <Pixelation granularity={granularity} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
