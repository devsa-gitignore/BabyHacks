'use client';

// Void's Playroom: a full-viewport 3D toy room. Tap toys to swat them off the table, tap them mid-air to juggle,
// chain combos, find the golden yarn ball, trigger Zoomies, or turn the lights out and cast real shadows with
// the flashlight. Tiny hand-rolled physics (gravity, bounces, friction); toys respawn forever.
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useAudio } from '@/audio';
import { Model, type Look } from '@/components/void/Void3DScene';
import { burst } from '../_kit/burst';
import css from './projects.module.css';

const TOP = 1.2; // table top height
const R = 0.22; // toy collision radius
const G = -14;
const KINDS = ['ball', 'mug', 'block', 'donut', 'cone', 'duck', 'star'] as const;
type Kind = (typeof KINDS)[number] | 'gold';
const COLORS = ['#ff8fab', '#8fd3ff', '#ffd166', '#9be564', '#c3a6ff', '#ffb38a', '#7ee0d0'];
const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];
const spawnX = () => -2.2 + Math.random() * 3.6; // keep clear of Void at x≈2
const spawnZ = () => -0.4 + Math.random() * 0.9;

let gradientMap: THREE.DataTexture | null = null;
function toonGradient() {
  if (!gradientMap) {
    const d = new Uint8Array([90, 90, 90, 255, 175, 175, 175, 255, 255, 255, 255, 255]);
    gradientMap = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat);
    gradientMap.minFilter = gradientMap.magFilter = THREE.NearestFilter;
    gradientMap.needsUpdate = true;
  }
  return gradientMap;
}
const Toon = ({ color, emissive }: { color: string; emissive?: string }) => (
  <meshToonMaterial color={color} gradientMap={toonGradient()} emissive={emissive ?? '#000000'} emissiveIntensity={emissive ? 0.6 : 0} />
);

let starGeo: THREE.ExtrudeGeometry | null = null;
function star() {
  if (!starGeo) {
    const s = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 1 : 0.5;
      const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
      if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    starGeo = new THREE.ExtrudeGeometry(s, { depth: 0.5, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.12, bevelSegments: 2 });
    starGeo.center();
  }
  return starGeo;
}

function ToyMesh({ kind, color }: { kind: Kind; color: string }) {
  switch (kind) {
    case 'ball':
      return (
        <>
          <mesh castShadow>
            <sphereGeometry args={[R, 20, 14]} />
            <Toon color={color} />
          </mesh>
          <mesh rotation={[0, 0, 0.4]}>
            <torusGeometry args={[R * 1.005, 0.03, 6, 24]} />
            <Toon color="#fff8ec" />
          </mesh>
        </>
      );
    case 'mug':
      return (
        <>
          <mesh castShadow>
            <cylinderGeometry args={[0.18, 0.16, 0.38, 18]} />
            <Toon color={color} />
          </mesh>
          <mesh position={[0, 0.17, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 0.05, 18]} />
            <Toon color="#7a4a2a" />
          </mesh>
          <mesh position={[0.2, 0, 0]} castShadow>
            <torusGeometry args={[0.09, 0.03, 8, 16]} />
            <Toon color={color} />
          </mesh>
        </>
      );
    case 'block':
      return (
        <mesh castShadow>
          <boxGeometry args={[0.38, 0.38, 0.38]} />
          <Toon color={color} />
        </mesh>
      );
    case 'donut':
      return (
        <group rotation={[Math.PI / 2, 0, 0]}>
          <mesh castShadow>
            <torusGeometry args={[0.15, 0.085, 12, 24]} />
            <Toon color="#e8a66a" />
          </mesh>
          <mesh position={[0, 0, -0.03]} scale={[1, 1, 0.6]}>
            <torusGeometry args={[0.15, 0.075, 10, 24]} />
            <Toon color={color} />
          </mesh>
        </group>
      );
    case 'cone':
      return (
        <>
          <mesh castShadow position={[0, -0.02, 0]}>
            <coneGeometry args={[0.21, 0.42, 14]} />
            <Toon color="#7cc576" />
          </mesh>
          <mesh position={[0, 0.22, 0]}>
            <sphereGeometry args={[0.06, 10, 8]} />
            <Toon color={color} emissive={color} />
          </mesh>
        </>
      );
    case 'duck':
      return (
        <>
          <mesh castShadow scale={[1.2, 0.9, 1]}>
            <sphereGeometry args={[0.19, 16, 12]} />
            <Toon color="#ffd84d" />
          </mesh>
          <mesh castShadow position={[0.1, 0.18, 0]}>
            <sphereGeometry args={[0.12, 14, 10]} />
            <Toon color="#ffd84d" />
          </mesh>
          <mesh position={[0.24, 0.16, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.05, 0.1, 8]} />
            <Toon color="#ff8a3d" />
          </mesh>
        </>
      );
    case 'star':
      return (
        <mesh castShadow geometry={star()} scale={0.21}>
          <Toon color={color} />
        </mesh>
      );
    case 'gold':
      return (
        <>
          <mesh castShadow>
            <sphereGeometry args={[R, 20, 14]} />
            <Toon color="#ffd23a" emissive="#ffb000" />
          </mesh>
          {[0, 1, 2].map((k) => (
            <mesh key={k} rotation={[k * 1.05, k * 0.7, 0]}>
              <torusGeometry args={[R * 1.01, 0.018, 6, 28]} />
              <Toon color="#fff3b0" />
            </mesh>
          ))}
        </>
      );
  }
}

type Hit = { kind: Kind; air: boolean; x: number; y: number };

function Toy({ id, temp, onHit, onThud, onGone }: { id: number; temp: boolean; onHit: (h: Hit) => void; onThud: (v: number) => void; onGone: (id: number) => void }) {
  const ref = useRef<THREE.Group>(null);
  const [look, setLook] = useState<{ kind: Kind; color: string }>(() => ({ kind: pick(KINDS), color: pick(COLORS) }));
  const st = useRef({
    p: new THREE.Vector3(spawnX(), TOP + 0.6 + Math.random() * 1.6 + (temp ? 3 + Math.random() * 3 : 0), spawnZ()),
    v: new THREE.Vector3((Math.random() - 0.5) * (temp ? 3 : 0), 0, 0),
    w: new THREE.Vector3(),
    mode: 'fly' as 'fly' | 'rest' | 'floor' | 'gone',
    t: 0,
    s: 1,
  });

  const respawn = () => {
    const s = st.current;
    if (temp) {
      s.mode = 'gone';
      onGone(id);
      return;
    }
    s.p.set(spawnX(), TOP + 3.5, spawnZ());
    s.v.set(0, 0, 0);
    s.w.set(0, 0, 0);
    s.mode = 'fly';
    s.t = 0;
    s.s = 1;
    if (ref.current) ref.current.rotation.set(0, Math.random() * 6, 0);
    setLook({ kind: Math.random() < 0.07 ? 'gold' : pick(KINDS), color: pick(COLORS) });
  };

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30);
    const s = st.current;
    const g = ref.current;
    if (!g || s.mode === 'gone') return;
    if (s.mode === 'fly') {
      const prevY = s.p.y;
      s.v.y += G * dt;
      s.p.addScaledVector(s.v, dt);
      g.rotation.x += s.w.x * dt;
      g.rotation.y += s.w.y * dt;
      g.rotation.z += s.w.z * dt;
      const onTable = Math.abs(s.p.x) < 2.6 && Math.abs(s.p.z) < 0.85;
      if (onTable && s.v.y < 0 && s.p.y < TOP + R && prevY >= TOP + R - 0.12) {
        s.p.y = TOP + R;
        if (Math.abs(s.v.y) > 2) onThud(Math.abs(s.v.y) * 0.6);
        s.v.y *= -0.35;
        s.v.x *= 0.6;
        s.v.z *= 0.6;
        s.w.multiplyScalar(0.5);
        if (Math.abs(s.v.y) < 0.7) {
          s.mode = 'rest';
          s.v.set(0, 0, 0);
          // settle upright-ish so it looks placed, not glitched
          g.rotation.set(0, g.rotation.y, 0);
        }
      }
      if (s.p.y < R) {
        s.p.y = R;
        if (Math.abs(s.v.y) > 1.5) onThud(Math.abs(s.v.y));
        s.v.y *= -0.45;
        s.v.x *= 0.82;
        s.v.z *= 0.82;
        s.w.multiplyScalar(0.75);
        if (Math.abs(s.v.y) < 0.6 && s.v.length() < 0.8) {
          s.mode = 'floor';
          s.t = 0;
        }
      }
      // room walls
      if (s.p.z < -3.2) (s.p.z = -3.2), (s.v.z *= -0.5);
      if (Math.abs(s.p.x) > 7) (s.p.x = Math.sign(s.p.x) * 7), (s.v.x *= -0.5);
      if (s.p.z > 4.5) (s.p.z = 4.5), (s.v.z *= -0.5);
    } else if (s.mode === 'floor') {
      // roll to a stop, then shrink away and drop back onto the table
      s.p.x += s.v.x * dt;
      s.p.z += s.v.z * dt;
      s.v.multiplyScalar(Math.pow(0.15, dt));
      g.rotation.z -= s.v.x * dt * 3;
      s.t += dt;
      if (s.t > 2.6) s.s = Math.max(0, s.s - dt * 3);
      if (s.s <= 0) respawn();
    }
    g.position.copy(s.p);
    g.scale.setScalar(s.s);
  });

  const swat = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const s = st.current;
    if (s.mode === 'gone' || s.mode === 'floor') return;
    const air = s.mode === 'fly' && s.p.y > TOP + R + 0.15;
    if (air) {
      // juggle: pop it back up
      s.v.set((Math.random() - 0.5) * 2, 6 + Math.random() * 1.5, (Math.random() - 0.5) * 1.2);
    } else {
      const side = s.p.x > 0 ? -1 : 1;
      s.v.set(side * (0.5 + Math.random() * 2) * (Math.random() < 0.5 ? -1 : 1), 4 + Math.random() * 2.2, 2.6 + Math.random() * 2.4);
    }
    s.w.set((Math.random() - 0.5) * 18, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 18);
    s.mode = 'fly';
    onHit({ kind: look.kind, air, x: e.nativeEvent.clientX, y: e.nativeEvent.clientY });
  };

  return (
    <group ref={ref} onPointerDown={swat} onPointerOver={() => (document.body.style.cursor = 'pointer')} onPointerOut={() => (document.body.style.cursor = '')}>
      <ToyMesh kind={look.kind} color={look.color} />
      {/* generous invisible hit target so small toys are easy to tap */}
      <mesh visible={false}>
        <sphereGeometry args={[R * 1.7, 8, 6]} />
      </mesh>
    </group>
  );
}

function Room({ dark }: { dark: boolean }) {
  return (
    <>
      {/* floor + rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 20]} />
        <Toon color={dark ? '#6b4a5a' : '#e9b88c'} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 1.4]} receiveShadow>
        <circleGeometry args={[2.6, 40]} />
        <Toon color="#a8ecf0" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 1.4]} receiveShadow>
        <ringGeometry args={[1.6, 1.9, 40]} />
        <Toon color="#ffb3c9" />
      </mesh>
      {/* back wall + baseboard */}
      <mesh position={[0, 5, -3.5]} receiveShadow>
        <planeGeometry args={[30, 10]} />
        <Toon color={dark ? '#5a4a7a' : '#ffd9b8'} />
      </mesh>
      <mesh position={[0, 0.2, -3.45]} receiveShadow>
        <boxGeometry args={[30, 0.4, 0.1]} />
        <Toon color="#e9a874" />
      </mesh>
      {/* a window with the moon */}
      <group position={[-4.6, 3.4, -3.44]}>
        <mesh>
          <boxGeometry args={[1.9, 1.6, 0.06]} />
          <Toon color="#c98d52" />
        </mesh>
        <mesh position={[0, 0, 0.04]}>
          <planeGeometry args={[1.6, 1.3]} />
          <meshBasicMaterial color="#2a3f73" />
        </mesh>
        <mesh position={[0.35, 0.25, 0.06]}>
          <circleGeometry args={[0.2, 20]} />
          <meshBasicMaterial color="#ffe27a" />
        </mesh>
      </group>
      {/* table */}
      <group>
        <mesh position={[0, TOP - 0.08, 0]} castShadow receiveShadow>
          <boxGeometry args={[5.4, 0.16, 1.9]} />
          <Toon color="#c98d52" />
        </mesh>
        {[
          [-2.4, -0.7],
          [2.4, -0.7],
          [-2.4, 0.7],
          [2.4, 0.7],
        ].map(([x, z]) => (
          <mesh key={`${x}${z}`} position={[x, (TOP - 0.16) / 2, z]} castShadow>
            <cylinderGeometry args={[0.09, 0.07, TOP - 0.16, 10]} />
            <Toon color="#a9733f" />
          </mesh>
        ))}
      </group>
    </>
  );
}

function Rig({ dark }: { dark: boolean }) {
  const { camera, pointer, size } = useThree();
  const spot = useRef<THREE.SpotLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const narrow = size.width < 700;
  useFrame((_, dt) => {
    const k = 1 - Math.pow(0.02, dt);
    camera.position.x += (pointer.x * 0.7 - camera.position.x) * k;
    camera.position.y += ((narrow ? 3.4 : 3) + pointer.y * 0.35 - camera.position.y) * k;
    camera.lookAt(0, 1.3, 0);
    target.position.set(pointer.x * 5, 2 + pointer.y * 2.2, -3.5);
    target.updateMatrixWorld();
  });
  return (
    <>
      <hemisphereLight args={['#fff4e0', '#c98d8a', dark ? 0.12 : 1.1]} />
      <directionalLight position={[4, 7, 5]} intensity={dark ? 0 : 1.8} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-4} shadow-bias={-0.0005} />
      <primitive object={target} />
      <spotLight ref={spot} position={[0, 2.2, 4.2]} target={target} angle={0.5} penumbra={0.55} intensity={dark ? 60 : 0} distance={20} decay={1.4} color="#fff2b0" castShadow shadow-mapSize={[1024, 1024]} />
    </>
  );
}

function TableVoid({ squish, look }: { squish: MutableRefObject<number>; look: MutableRefObject<Look> }) {
  const { pointer } = useThree();
  useFrame(() => {
    look.current.x = pointer.x * 0.9 - 0.4;
    look.current.y = pointer.y * 0.8;
  });
  return (
    <group position={[2.05, TOP + 0.52, 0.15]} rotation={[0, -0.45, 0]} scale={0.3}>
      <Model state="awake" look={look} squishRef={squish} night={false} />
    </group>
  );
}

const ACH: Array<{ at: (s: { swats: number; combo: number; juggle: number; gold: number }) => boolean; text: string }> = [
  { at: (s) => s.swats >= 1, text: 'First crime ✦ gravity confirmed' },
  { at: (s) => s.combo >= 5, text: 'Menace ✦ 5x combo' },
  { at: (s) => s.juggle >= 3, text: 'Circus cat ✦ 3 air hits in a row' },
  { at: (s) => s.gold >= 1, text: 'Shiny! ✦ golden yarn knocked' },
  { at: (s) => s.swats >= 50, text: 'Professional chaos ✦ 50 swats' },
  { at: (s) => s.combo >= 12, text: 'Unstoppable ✦ 12x combo' },
  { at: (s) => s.juggle >= 8, text: 'Gravity is optional ✦ 8 air hits' },
  { at: (s) => s.swats >= 200, text: 'The table fears you ✦ 200 swats' },
];

type Pop = { id: number; x: number; y: number; text: string; gold: boolean };

export default function Playroom() {
  const { play } = useAudio();
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [combo, setCombo] = useState(1);
  const [dark, setDark] = useState(false);
  const [pops, setPops] = useState<Pop[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [extras, setExtras] = useState<number[]>([]);
  const [zoomCool, setZoomCool] = useState(0);
  const squish = useRef(0);
  const look = useRef<Look>({ x: 0, y: 0 });
  const stats = useRef({ swats: 0, combo: 1, juggle: 0, gold: 0, last: 0, got: new Set<number>(), lastThud: 0 });
  const nextId = useRef(100);

  useEffect(() => {
    try {
      setBest(Number(localStorage.getItem('wk.playroom.best') || 0));
    } catch {}
  }, []);
  useEffect(() => {
    if (score > best) {
      setBest(score);
      try {
        localStorage.setItem('wk.playroom.best', String(score));
      } catch {}
    }
  }, [score, best]);
  useEffect(() => {
    if (!zoomCool) return;
    const id = window.setTimeout(() => setZoomCool((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [zoomCool]);
  // combo decays
  useEffect(() => {
    const id = window.setInterval(() => {
      if (performance.now() - stats.current.last > 1600 && stats.current.combo > 1) {
        stats.current.combo = 1;
        setCombo(1);
      }
    }, 300);
    return () => window.clearInterval(id);
  }, []);

  const onHit = (h: Hit) => {
    const s = stats.current;
    const now = performance.now();
    s.combo = now - s.last < 1600 ? s.combo + 1 : 1;
    s.last = now;
    s.swats++;
    s.juggle = h.air ? s.juggle + 1 : 0;
    if (h.kind === 'gold') s.gold++;
    const pts = (h.kind === 'gold' ? 10 : 1) * s.combo * (h.air ? 2 : 1);
    setScore((v) => v + pts);
    setCombo(s.combo);
    squish.current = 1;
    if (h.kind === 'gold') {
      play('wish');
      burst(h.x, h.y, ['#ffd23a', '#fff3b0', '#ff8fab'], 24);
    } else play(h.air ? 'boing' : 'swat');
    const id = nextId.current++;
    const label = `+${pts}${h.air ? ' AIR!' : ''}${s.combo > 2 ? `  x${s.combo}` : ''}`;
    setPops((p) => [...p.slice(-8), { id, x: h.x, y: h.y, text: h.kind === 'gold' ? `GOLDEN ${label}` : label, gold: h.kind === 'gold' }]);
    window.setTimeout(() => setPops((p) => p.filter((q) => q.id !== id)), 950);
    ACH.forEach((a, k) => {
      if (!s.got.has(k) && a.at(s)) {
        s.got.add(k);
        setToast(a.text);
        play('chime');
        window.setTimeout(() => setToast((t) => (t === a.text ? null : t)), 2600);
      }
    });
  };
  const onThud = (v: number) => {
    const now = performance.now();
    if (now - stats.current.lastThud < 90) return;
    stats.current.lastThud = now;
    play(v > 4 ? 'thud' : 'pop');
  };
  const zoomies = () => {
    if (zoomCool) return;
    play('whoosh');
    setZoomCool(15);
    const ids = Array.from({ length: 12 }, () => nextId.current++);
    setExtras((e) => [...e, ...ids]);
  };
  const lights = () => {
    play('click');
    setDark((d) => !d);
  };
  const gone = (id: number) => setExtras((e) => e.filter((x) => x !== id));
  const BASE = useMemo(() => Array.from({ length: 7 }, (_, k) => k), []);

  return (
    <section className={css.playroom} data-dark={dark ? '1' : undefined} aria-label="Void's Playroom: a 3D game. Tap toys to knock them off the table.">
      <Canvas shadows camera={{ position: [0, 3, 7.6], fov: 42 }} dpr={[1, 1.75]} gl={{ antialias: true }} className={css.canvas}>
        <color attach="background" args={[dark ? '#2a2140' : '#ffd9b8']} />
        <fog attach="fog" args={[dark ? '#2a2140' : '#ffd9b8', 12, 26]} />
        <Rig dark={dark} />
        <Room dark={dark} />
        <TableVoid squish={squish} look={look} />
        {BASE.map((k) => (
          <Toy key={k} id={k} temp={false} onHit={onHit} onThud={onThud} onGone={gone} />
        ))}
        {extras.map((k) => (
          <Toy key={k} id={k} temp onHit={onHit} onThud={onThud} onGone={gone} />
        ))}
      </Canvas>

      <div className={css.hud}>
        <div className={css.scoreCard}>
          <p className={css.scoreLabel}>chaos score</p>
          <p className={css.score} key={score}>{score}</p>
          <p className={css.best}>best {best}</p>
          <div className={css.comboBar} style={{ '--c': Math.min(1, combo / 12) } as React.CSSProperties}>
            <span />
            <b>x{combo}</b>
          </div>
        </div>
        <div className={css.hudBtns}>
          <button type="button" className={`px-btn ${dark ? 'butter' : 'paper'} sm`} onClick={lights} aria-pressed={dark}>
            <span>{dark ? '💡 lights on' : '🔦 lights out'}</span>
          </button>
          <button type="button" className="px-btn berry sm" onClick={zoomies} disabled={zoomCool > 0}>
            <span>{zoomCool ? `zoomies in ${zoomCool}` : '⚡ zoomies'}</span>
          </button>
        </div>
      </div>
      <p className={css.playHint}>{dark ? 'move the flashlight · watch the shadows on the wall' : 'tap toys to swat them · tap them mid-air to juggle · hunt the golden yarn'}</p>
      {toast && (
        <p className={css.toast} role="status">
          {toast}
        </p>
      )}
      {pops.map((p) => (
        <span key={p.id} className={css.pop} data-gold={p.gold ? '1' : undefined} style={{ left: p.x, top: p.y }} aria-hidden="true">
          {p.text}
        </span>
      ))}
      <p className="sr-only" aria-live="polite">
        Score {score}.
      </p>
    </section>
  );
}
