'use client';

// The five scenes that play on the TV. Every scene draws into a 400x300 viewBox; Hotspots (real buttons)
// sit over it by the same coordinates. Each scene is split into depth <Layer>s that slide against each
// other with the pointer (or a slow drift on touch), and objects get a cel-shaded dark side + highlight
// + blob shadow so the cartoon reads as chunky 3D. Scenes also follow the narration through `beat`.
import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'motion/react';
import { useAudio } from '@/audio';
import { Kitten } from '../_kit/Kitten';
import { Hotspot } from '../_kit/Hotspot';
import { Puppet, type PuppetId } from '../_kit/Puppets';
import { burst, burstFrom } from '../_kit/burst';
import css from './story.module.css';

export type SceneSignal = 'interact' | 'thunder';
export type SceneProps = { reduce: boolean; beat: number; signal: (s: SceneSignal) => void };

const FONT: CSSProperties = { fontFamily: 'var(--font-display)' };
const NOTE: CSSProperties = { fontFamily: 'var(--font-note)' };
const INK = '#0d0b1a';
const SHADE = 'rgba(13,11,26,0.3)';
const SHINE = 'rgba(255,248,236,0.4)';

/* ------------------------------------------------------------------ depth */
type Depth = { x: MotionValue<number>; y: MotionValue<number> };
const DepthCtx = createContext<Depth | null>(null);
export const DepthProvider = DepthCtx.Provider;

/** -1..1 pointer position over `ref` (springy). Touch: a slow figure-eight drift instead. */
export function useDepthSource(ref: React.RefObject<HTMLElement | null>, enabled: boolean, touch: boolean): Depth {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const x = useSpring(rx, { stiffness: 60, damping: 16 });
  const y = useSpring(ry, { stiffness: 60, damping: 16 });
  useEffect(() => {
    rx.set(0);
    ry.set(0);
    if (!enabled) return;
    if (touch) {
      let raf = 0;
      const t0 = performance.now();
      const loop = (now: number) => {
        const t = (now - t0) / 1000;
        rx.set(Math.sin(t * 0.5) * 0.7);
        ry.set(Math.sin(t * 0.8) * 0.4);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(raf);
    }
    const onMove = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      rx.set(Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2)));
      ry.set(Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2)));
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [enabled, touch, ref, rx, ry]);
  return { x, y };
}

/** A depth plane. Bigger `d` = closer to the glass = moves further (in viewBox units). */
function Layer({ d, children }: { d: number; children: ReactNode }) {
  const ctx = useContext(DepthCtx);
  const zero = useMotionValue(0);
  const x = useTransform(ctx?.x ?? zero, (v) => -v * d);
  const y = useTransform(ctx?.y ?? zero, (v) => -v * d * 0.6);
  return <motion.g style={{ x, y }}>{children}</motion.g>;
}

/** Soft contact shadow under things so they sit on the ground. */
const Blob = ({ cx, cy, rx, ry = 6, o = 0.4 }: { cx: number; cy: number; rx: number; ry?: number; o?: number }) => <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={INK} opacity={o} />;

/** Bricks with a dark mortar line and a lit top edge on every course, so the wall has relief. */
function Bricks({ mortar, lit, h, x0 = -30, w = 460 }: { mortar: string; lit: string; h: number; x0?: number; w?: number }) {
  const rows = Math.ceil(h / 24);
  return (
    <g>
      {Array.from({ length: rows }, (_, r) => (
        <g key={r}>
          <line x1={x0} x2={x0 + w} y1={r * 24} y2={r * 24} stroke={mortar} strokeWidth="2.5" />
          <line x1={x0} x2={x0 + w} y1={r * 24 + 3} y2={r * 24 + 3} stroke={lit} strokeWidth="1.5" />
          {Array.from({ length: Math.ceil(w / 40) + 1 }, (_, c) => {
            const x = x0 + c * 40 + (r % 2 ? 20 : 0);
            return <line key={c} x1={x} x2={x} y1={r * 24} y2={r * 24 + 24} stroke={mortar} strokeWidth="2.5" />;
          })}
        </g>
      ))}
    </g>
  );
}

/* ------------------------------------------------------------------ 1. The Alley */
export function Alley({ beat, signal }: SceneProps) {
  const { play } = useAudio();
  const [blink, setBlink] = useState(false);
  const press = (e: React.MouseEvent<HTMLButtonElement>) => {
    play('mrrp');
    setBlink(true);
    burstFrom(e.currentTarget, ['#b8f23a', '#fff8ec'], 8);
    window.setTimeout(() => setBlink(false), 260);
    signal('interact');
  };
  return (
    <>
      <svg className={css.svg} viewBox="0 0 400 300" role="img" aria-label="A dim alley behind a bakery. A tiny black kitten with glowing eyes sits beside a bin.">
        <defs>
          <radialGradient id="al-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#ffcf70" stopOpacity="0.55" />
            <stop offset="1" stopColor="#ffcf70" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="al-cone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffe27a" stopOpacity="0.5" />
            <stop offset="1" stopColor="#ffe27a" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="al-puddle" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffd884" stopOpacity="0.55" />
            <stop offset="1" stopColor="#3a2f7a" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        <Layer d={3}>
          <rect x="-30" y="-20" width="460" height="270" fill="#251c4b" />
          <Bricks mortar="#1a1440" lit="#30276a" h={244} />
          {/* drainpipe */}
          <rect x="146" y="-20" width="12" height="258" fill="#1a1438" stroke={INK} strokeWidth="2" />
          <rect x="149" y="-20" width="3" height="258" fill="#3d3478" />
          {[40, 120, 200].map((y) => (
            <rect key={y} x="142" y={y} width="20" height="6" rx="2" fill="#2a2258" stroke={INK} strokeWidth="1.5" />
          ))}
          {/* chalk: appears when he chooses his name */}
          <g className={css.chalk} data-on={beat >= 2 ? '1' : undefined} transform="rotate(-7 110 180)">
            <text x="78" y="186" fontSize="30" fill="none" stroke="#fff8ec" strokeWidth="1.4" style={FONT}>
              VOID
            </text>
            <path d="M138 180Q160 176 172 190M164 182L173 191L161 194" fill="none" stroke="#fff8ec" strokeWidth="1.6" strokeLinecap="round" />
          </g>
        </Layer>
        <Layer d={7}>
          <circle cx="290" cy="112" r="140" fill="url(#al-glow)" />
          <text x="290" y="36" textAnchor="middle" fontSize="20" fill="#fff8ec" style={FONT}>
            bakery
          </text>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={205 + i * 28.4} y="44" width="28.4" height="24" fill={i % 2 ? '#fff8ec' : '#ff6f91'} stroke={INK} strokeWidth="2" />
          ))}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <g key={i}>
              <circle cx={219 + i * 28.4} cy="68" r="14.2" fill={i % 2 ? '#fff8ec' : '#ff6f91'} stroke={INK} strokeWidth="2" />
              <path d={`M${206 + i * 28.4} 72a14 14 0 0 0 26 0`} fill={SHADE} />
            </g>
          ))}
          <rect x="215" y="84" width="150" height="90" rx="4" fill="#ffd884" stroke={INK} strokeWidth="4" />
          <rect x="217" y="86" width="146" height="14" fill="#e0a24f" opacity="0.6" />
          <line x1="290" x2="290" y1="84" y2="174" stroke={INK} strokeWidth="3" />
          <line x1="215" x2="365" y1="150" y2="150" stroke={INK} strokeWidth="3" />
          <path d="M224 104L240 104M224 110L234 110" stroke="#fff8ec" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
          {[246, 292, 336].map((x) => (
            <g key={x}>
              <ellipse cx={x} cy="140" rx="18" ry="9" fill="#d98e4a" stroke={INK} strokeWidth="2.5" />
              <path d={`M${x - 14} 142q14 8 28 0`} fill="none" stroke="#a8622c" strokeWidth="3" />
              <path d={`M${x - 8} 136l4 -3M${x} 135l4 -3M${x + 8} 136l3 -3`} stroke="#ffe0a8" strokeWidth="2" strokeLinecap="round" />
            </g>
          ))}
          <rect x="205" y="174" width="170" height="10" fill="#171235" stroke="#2f2560" strokeWidth="2" />
          <rect x="205" y="174" width="170" height="3" fill="#3b3175" />
          {/* steam from the vent */}
          <g className={css.steam}>
            <path d="M372 30q-8 -10 0 -20q8 -10 0 -20" fill="none" stroke="#fff8ec" strokeWidth="3" strokeLinecap="round" opacity="0.25" />
          </g>
          {/* streetlight: its cone stops well short of the kitten */}
          <g className={css.flicker}>
            <polygon points="42,92 70,92 120,236 -10,236" fill="url(#al-cone)" />
            <ellipse cx="56" cy="90" rx="10" ry="6" fill="#ffe27a" />
          </g>
          <rect x="52" y="90" width="8" height="146" fill="#171235" stroke="#2f2560" strokeWidth="2" />
          <rect x="54" y="90" width="2" height="146" fill="#4a3f8a" />
          <path d="M36 76H76L68 90H44Z" fill="#171235" stroke="#2f2560" strokeWidth="2" />
          <path d="M40 78H72" stroke="#4a3f8a" strokeWidth="2" />
        </Layer>
        <Layer d={12}>
          <rect x="-30" y="236" width="460" height="80" fill="#150f33" />
          <line x1="-30" x2="430" y1="237" y2="237" stroke="#3b3175" strokeWidth="3" />
          <ellipse cx="290" cy="270" rx="62" ry="9" fill="url(#al-puddle)" />
          <ellipse cx="290" cy="270" rx="62" ry="9" fill="none" stroke="#3b3175" strokeWidth="1.5" />
          <path d="M262 268h18M298 272h22" stroke="#fff8ec" strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />
          <Blob cx={56} cy={238} rx={16} ry={4} o={0.5} />
          {/* bin: front, dark side, highlight */}
          <Blob cx={346} cy={240} rx={40} ry={6} />
          <rect x="316" y="182" width="54" height="56" fill="#3b4a5c" stroke={INK} strokeWidth="3" />
          <rect x="352" y="183.5" width="16.5" height="53" fill={SHADE} />
          <rect x="320" y="186" width="4" height="48" fill={SHINE} opacity="0.5" />
          <rect x="310" y="172" width="66" height="14" rx="4" fill="#4b5b70" stroke={INK} strokeWidth="3" />
          <rect x="314" y="174" width="40" height="3" rx="1.5" fill={SHINE} />
          <path d="M334 192V232M347 192V232" stroke="#2b3848" strokeWidth="3" />
          <Blob cx={238} cy={258} rx={46} ry={7} o={0.5} />
          <Kitten transform="translate(182 116) scale(.56)" eyes={blink ? 'closed' : 'normal'} look={beat === 1 ? { x: 0, y: 0.8 } : { x: 0.1, y: 0.1 }} blinkDelay={1} />
        </Layer>
        <Layer d={18}>
          {/* foreground crate, out of focus-ish */}
          <g opacity="0.95">
            <rect x="-24" y="252" width="86" height="66" fill="#0b0820" stroke="#2f2560" strokeWidth="3" />
            <path d="M-24 274H62M-24 296H62M-2 252V318M40 252V318" stroke="#1d1745" strokeWidth="3" />
            <rect x="-24" y="252" width="86" height="4" fill="#2f2560" />
          </g>
        </Layer>
      </svg>
      <Hotspot cx={236} cy={190} w={96} h={130} label="Pet the tiny kitten" onPress={press} />
    </>
  );
}

/* ------------------------------------------------------------------ 2. The Rain */
const drops = (n: number, seed: number) =>
  Array.from({ length: n }, (_, i) => ({
    x: ((i * 23 + seed) * 7) % 440 - 20,
    y: -((i * 37 + seed) % 120),
    d: (((i + seed) * 0.17) % 0.9).toFixed(2),
    s: (0.6 + ((i + seed) % 4) * 0.12).toFixed(2),
  }));
const DROPS_FAR = drops(22, 3);
const DROPS_NEAR = drops(9, 11);

export function Rain({ beat, reduce, signal }: SceneProps) {
  const { play } = useAudio();
  const [on, setOn] = useState(false);
  const [flash, setFlash] = useState(false);
  const autoDone = useRef(false);
  const toggle = () => {
    play('click');
    setOn((v) => {
      if (!v) play('beam');
      return !v;
    });
    autoDone.current = true;
    signal('interact');
  };
  // narration: "...and, click, a circle of gold"
  useEffect(() => {
    if (beat >= 1 && !autoDone.current) {
      autoDone.current = true;
      const id = window.setTimeout(() => {
        play('click');
        play('beam');
        setOn(true);
      }, 1500);
      return () => window.clearTimeout(id);
    }
  }, [beat, play]);
  // thunder every ~10s; the host Void flinches
  useEffect(() => {
    let id = 0;
    let off = 0;
    const next = (ms: number) => {
      id = window.setTimeout(() => {
        play('thunder');
        signal('thunder');
        if (!reduce) {
          setFlash(true);
          off = window.setTimeout(() => setFlash(false), 220);
        }
        next(9000 + Math.random() * 5000);
      }, ms);
    };
    next(3500);
    return () => {
      window.clearTimeout(id);
      window.clearTimeout(off);
    };
  }, [play, reduce, signal]);

  return (
    <>
      <svg className={css.svg} viewBox="0 0 400 300" role="img" aria-label="Rain falls on a cardboard box. A small flashlight lies inside it and a kitten peeks out.">
        <defs>
          <radialGradient id="rn-cone" cx="277" cy="187" r="170" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#fff2b0" stopOpacity="0.9" />
            <stop offset="0.55" stopColor="#ffe27a" stopOpacity="0.35" />
            <stop offset="1" stopColor="#ffe27a" stopOpacity="0.04" />
          </radialGradient>
          <filter id="rn-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <linearGradient id="rn-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0f1838" />
            <stop offset="1" stopColor="#22356a" />
          </linearGradient>
        </defs>
        <Layer d={3}>
          <rect x="-30" y="-20" width="460" height="260" fill="url(#rn-sky)" />
          <path d="M-30 150V92H20V70H70V100H120V58H160V96H220V76H262V104H320V64H360V90H430V150Z" fill="#16224a" stroke="#22306a" strokeWidth="2" />
          {[
            [36, 84],
            [90, 108],
            [134, 72],
            [140, 86],
            [236, 90],
            [334, 80],
            [376, 100],
          ].map(([x, y], i) => (
            <rect key={i} x={x} y={y} width="8" height="9" fill="#ffd884" opacity={i % 3 ? 0.55 : 0.85} />
          ))}
          {DROPS_FAR.map((d, i) => (
            <line key={i} className={css.drop} style={{ '--d': `${d.d}s`, '--s': `${(+d.s * 1.3).toFixed(2)}s` } as CSSProperties} x1={d.x} y1={d.y} x2={d.x - 2} y2={d.y + 10} stroke="#8fb3ff" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
          ))}
        </Layer>
        <Layer d={7}>
          {/* wooden fence */}
          <rect x="-30" y="140" width="460" height="94" fill="#1b2a58" />
          {Array.from({ length: 13 }, (_, i) => (
            <g key={i}>
              <path d={`M${-30 + i * 36} 234V146L${-12 + i * 36} 134L${6 + i * 36} 146V234`} fill="#1f3164" stroke={INK} strokeWidth="2" />
              <path d={`M${-26 + i * 36} 148V232`} stroke="#3450a0" strokeWidth="2" />
            </g>
          ))}
          <rect x="-30" y="176" width="460" height="8" fill="#172552" stroke={INK} strokeWidth="1.5" />
        </Layer>
        <Layer d={12}>
          <rect x="-30" y="232" width="460" height="80" fill="#16224a" />
          <line x1="-30" x2="430" y1="233" y2="233" stroke="#2d4a86" strokeWidth="2" />
          {[
            [90, 266, 46],
            [345, 262, 34],
          ].map(([cx, cy, rx], i) => (
            <g key={i}>
              <ellipse cx={cx} cy={cy} rx={rx} ry="8" fill="#2d4a86" />
              <ellipse className={css.ripple} style={{ '--d': `${i * 0.7}s` } as CSSProperties} cx={cx} cy={cy} rx={rx * 0.4} ry="3" fill="none" stroke="#8fb3ff" strokeWidth="1.5" />
            </g>
          ))}
          {/* ground glow when the flashlight is on */}
          <g className={css.glow} data-on={on ? '1' : undefined}>
            <ellipse cx="345" cy="262" rx="72" ry="20" fill="#ffe27a" opacity="0.7" />
            <ellipse cx="345" cy="262" rx="40" ry="11" fill="#fff6c8" opacity="0.8" />
          </g>
          {/* the box, on its side: top face, right face (shade), front with the dark opening */}
          <Blob cx={196} cy={244} rx={140} ry={9} o={0.5} />
          <path d="M70 120L94 84H286L310 120Z" fill="#dba66a" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M110 92H250M100 104H270" stroke={SHINE} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          <path d="M310 120L286 84V206L310 242Z" fill="#9a6535" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <rect x="70" y="118" width="240" height="124" fill="#c98d52" stroke={INK} strokeWidth="4" />
          <rect x="90" y="134" width="200" height="76" fill="#1a1230" stroke={INK} strokeWidth="3" />
          <rect x="92" y="136" width="196" height="12" fill="#0d0820" />
          <Kitten body={false} eyes={on ? 'wide' : 'normal'} look={{ x: on ? 0.7 : 0.2, y: beat === 0 ? 0.3 : 0 }} transform="translate(112 134) scale(.4)" blinkDelay={0.6} />
          {/* flashlight lying inside */}
          <g>
            <rect x="208" y="178" width="46" height="18" rx="5" fill="#aab4c6" stroke={INK} strokeWidth="3" />
            <rect x="211" y="181" width="40" height="4" rx="2" fill="#e4e9f2" />
            <rect x="254" y="173" width="20" height="28" rx="4" fill="#7e8aa3" stroke={INK} strokeWidth="3" />
            <ellipse cx="275" cy="187" rx="4" ry="11" fill={on ? '#ffe27a' : '#cfd6e6'} stroke={INK} strokeWidth="2" />
            <circle cx="226" cy="187" r="3.5" fill="#ff6f91" />
          </g>
          {/* hanging flap */}
          <path d="M90 134L84 156L150 152L156 134Z" fill="#b57a42" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
          <rect x="70" y="210" width="240" height="32" fill="#c98d52" stroke={INK} strokeWidth="4" />
          <rect x="72" y="212" width="236" height="5" fill={SHINE} opacity="0.35" />
          <rect x="160" y="210" width="44" height="32" fill="#e8c88e" opacity="0.8" />
          <text x="256" y="232" textAnchor="middle" fontSize="15" fill={INK} style={FONT}>
            this way up
          </text>
          {/* tilted down toward the puddle it lights, soft edges */}
          <path className={css.beam} data-on={on ? '1' : undefined} d="M277 180Q352 160 434 176L434 304L336 304Q298 246 277 195Z" fill="url(#rn-cone)" filter="url(#rn-soft)" />
        </Layer>
        <Layer d={22}>
          {DROPS_NEAR.map((d, i) => (
            <line key={i} className={css.drop} style={{ '--d': `${d.d}s`, '--s': `${(+d.s * 0.8).toFixed(2)}s` } as CSSProperties} x1={d.x} y1={d.y} x2={d.x - 5} y2={d.y + 24} stroke="#b9d0ff" strokeWidth="3.5" strokeLinecap="round" opacity="0.55" />
          ))}
          {/* dripping gutter */}
          <rect x="-30" y="-6" width="200" height="14" fill="#0f1838" stroke="#2d4a86" strokeWidth="2" />
          <circle className={css.drip} cx="150" cy="12" r="3" fill="#b9d0ff" />
        </Layer>
        <rect className={css.flash} data-on={flash ? '1' : undefined} x="0" y="0" width="400" height="300" fill="#eaf2ff" />
      </svg>
      <Hotspot cx={243} cy={187} w={78} h={52} label={on ? 'Turn the flashlight off' : 'Turn the flashlight on'} pressed={on} onPress={toggle} pulse={!on} />
    </>
  );
}

/* ------------------------------------------------------------------ 3. The Discovery */
const SHADOWS: PuppetId[] = ['butterfly', 'bunny', 'dragon'];
const SHADOW_SFX = { butterfly: 'flutter', bunny: 'boing', dragon: 'squeak', bird: 'chirp' } as const;

export function Discovery({ beat, reduce, signal }: SceneProps) {
  const { play } = useAudio();
  const [i, setI] = useState(0);
  const [act, setAct] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const x = useSpring(rx, { stiffness: 120, damping: 18 });
  const y = useSpring(ry, { stiffness: 120, damping: 18 });
  const actTimer = useRef(0);

  const show = (n: number) => {
    setI(n);
    play(SHADOW_SFX[SHADOWS[n]]);
    setAct(true);
    window.clearTimeout(actTimer.current);
    actTimer.current = window.setTimeout(() => setAct(false), 1100);
  };
  useEffect(() => () => window.clearTimeout(actTimer.current), []);

  // narration: butterfly, then "a bunny, then a dragon"
  useEffect(() => {
    if (beat !== 1) return;
    const a = window.setTimeout(() => show(1), 900);
    const b = window.setTimeout(() => show(2), 3000);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beat]);

  // the shadow follows the pointer (the paw moving in the beam)
  useEffect(() => {
    if (reduce) return;
    const onMove = (e: PointerEvent) => {
      const el = svgRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      rx.set(inside ? ((e.clientX - r.left) / r.width - 0.5) * 2 * 26 : 0);
      ry.set(inside ? ((e.clientY - r.top) / r.height - 0.5) * 2 * 18 : 0);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [reduce, rx, ry]);

  const id = SHADOWS[i];
  return (
    <>
      <svg ref={svgRef} className={css.svg} viewBox="0 0 400 300" role="img" aria-label={`A wall lit by a flashlight. A kitten's paw makes a shadow shaped like a ${id}.`}>
        <defs>
          <pattern id="dc-dots" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="11" cy="11" r="1.6" fill="#4d3866" />
          </pattern>
          <radialGradient id="dc-light" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#fff4c4" />
            <stop offset="0.55" stopColor="#ffd88a" />
            <stop offset="0.82" stopColor="#ffc86e" stopOpacity="0.45" />
            <stop offset="1" stopColor="#ffc86e" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="dc-beam" cx="158" cy="243" r="250" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#fff2b0" stopOpacity="0.75" />
            <stop offset="0.6" stopColor="#ffe27a" stopOpacity="0.25" />
            <stop offset="1" stopColor="#ffe27a" stopOpacity="0.05" />
          </radialGradient>
          <filter id="dc-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <filter id="dc-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
        </defs>
        <Layer d={3}>
          <rect x="-30" y="-20" width="460" height="290" fill="#2e1f44" />
          <rect x="-30" y="-20" width="460" height="290" fill="url(#dc-dots)" />
          <rect x="-30" y="214" width="460" height="50" fill="#26183a" />
          <rect x="-30" y="210" width="460" height="7" fill="#3d2a58" stroke={INK} strokeWidth="1.5" />
          {/* the beam hits the wall at an angle, so the pool of light is a tilted oval, not a circle */}
          <ellipse cx="240" cy="116" rx="118" ry="94" transform="rotate(-18 240 116)" fill="url(#dc-light)" filter="url(#dc-soft)" />
          <g className={css.drift}>
            <motion.g style={{ x, y }} filter="url(#dc-shadow)">
              <g transform="rotate(-6 238 118) skewX(-6)">
                <Puppet key={id} id={id} idle act={act} x={196} y={60} width={112} height={112} />
              </g>
            </motion.g>
          </g>
        </Layer>
        <Layer d={10}>
          <rect x="-30" y="262" width="460" height="50" fill="#1d1230" />
          <rect x="-30" y="262" width="460" height="3" fill="#4a3366" />
          <path d="M40 270H120M180 282H280M320 272H400" stroke="#140c22" strokeWidth="2.5" />
          {/* soft cone from the lens, bowed edges, swaying a little like a paw is holding it */}
          <g className={css.sway}>
            <path d="M154 240Q140 150 146 34Q250 -6 350 150Q262 196 163 247Z" fill="url(#dc-beam)" filter="url(#dc-soft)" />
            <path d="M156 241Q168 160 196 90Q246 100 290 150Q220 200 161 245Z" fill="#fff6c8" opacity="0.18" filter="url(#dc-soft)" />
          </g>
          {/* flashlight on the floor */}
          <Blob cx={140} cy={266} rx={34} ry={5} />
          <g transform="rotate(-35 132 262)">
            <rect x="108" y="254" width="40" height="14" rx="4" fill="#aab4c6" stroke={INK} strokeWidth="3" />
            <rect x="111" y="256" width="34" height="3" rx="1.5" fill="#e4e9f2" />
            <rect x="148" y="250" width="16" height="22" rx="3" fill="#7e8aa3" stroke={INK} strokeWidth="3" />
            <ellipse cx="165" cy="261" rx="3" ry="9" fill="#ffe27a" />
          </g>
          <Blob cx={72} cy={262} rx={50} ry={7} o={0.5} />
          <Kitten transform="translate(12 108) scale(.6)" eyes="wide" look={{ x: 0.7, y: -0.5 }} blinkDelay={2} />
        </Layer>
        <Layer d={18}>
          {/* a wobbly stack of picture books */}
          <rect x="336" y="262" width="90" height="20" fill="#ff6f91" stroke={INK} strokeWidth="3" />
          <rect x="342" y="246" width="80" height="18" fill="#a8ecf0" stroke={INK} strokeWidth="3" transform="rotate(-3 380 255)" />
          <rect x="332" y="282" width="96" height="22" fill="#ffe27a" stroke={INK} strokeWidth="3" />
          <path d="M340 268H420M348 252H414M338 290H424" stroke={SHADE} strokeWidth="3" />
        </Layer>
      </svg>
      <Hotspot
        cx={238}
        cy={118}
        w={190}
        h={190}
        label={`Change the shadow. Now showing: ${id}`}
        onPress={() => {
          show((i + 1) % SHADOWS.length);
          signal('interact');
        }}
      />
    </>
  );
}

/* ------------------------------------------------------------------ 4. The Window */
export function Window({ beat, signal }: SceneProps) {
  const { play } = useAudio();
  const [invited, setInvited] = useState(false);
  const [wag, setWag] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const wave = () => {
    setWag(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setWag(false), 1400);
  };
  const invite = () => {
    if (!invited) play('pop');
    setInvited(true);
  };
  const press = () => {
    play('chime');
    wave();
    window.setTimeout(invite, 450);
    signal('interact');
  };
  // narration: he waves back (beat 2), then the sign (beat 3)
  useEffect(() => {
    if (beat === 1) {
      const id = window.setTimeout(wave, 1600);
      return () => window.clearTimeout(id);
    }
    if (beat >= 2) {
      const id = window.setTimeout(invite, 1800);
      return () => window.clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beat]);

  return (
    <>
      <svg className={css.svg} viewBox="0 0 400 300" role="img" aria-label="A lit window above the alley. A child waves from it. The kitten below waves his tail back.">
        <defs>
          <linearGradient id="wn-glass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff0b8" />
            <stop offset="1" stopColor="#ffcf70" />
          </linearGradient>
          <radialGradient id="wn-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#ffcf70" stopOpacity="0.5" />
            <stop offset="1" stopColor="#ffcf70" stopOpacity="0" />
          </radialGradient>
        </defs>
        <Layer d={2}>
          <rect x="300" y="-20" width="130" height="300" fill="#121a40" />
          <circle cx="372" cy="40" r="16" fill="#fff4c4" />
          <circle cx="379" cy="35" r="14" fill="#121a40" />
          {[
            [318, 24],
            [350, 80],
            [400, 66],
            [330, 110],
          ].map(([cx, cy], i) => (
            <circle key={i} className={css.twinkle} style={{ '--d': `${i * 0.4}s` } as CSSProperties} cx={cx} cy={cy} r="2" fill="#fff8ec" />
          ))}
        </Layer>
        <Layer d={6}>
          <rect x="-30" y="-20" width="358" height="280" fill="#262f66" />
          <Bricks mortar="#1d2554" lit="#36428a" h={250} x0={-30} w={358} />
          {/* the building's corner, so the wall has a side */}
          <path d="M328 -20H344V250H328Z" fill="#1a2150" stroke={INK} strokeWidth="2" />
          <circle cx="216" cy="90" r="150" fill="url(#wn-glow)" />
          <rect x="126" y="12" width="180" height="154" fill="#171235" stroke={INK} strokeWidth="4" />
          <rect x="138" y="24" width="156" height="130" fill="url(#wn-glass)" />
          <line x1="216" x2="216" y1="24" y2="154" stroke="#171235" strokeWidth="4" />
          <line x1="138" x2="294" y1="89" y2="89" stroke="#171235" strokeWidth="3" />
          <g fill={INK} stroke={INK}>
            <circle cx="216" cy="86" r="21" />
            <circle cx="194" cy="68" r="9" />
            <circle cx="238" cy="68" r="9" />
            <path d="M184 154Q188 110 216 108Q244 110 248 154Z" />
            <g className={css.wave}>
              <line x1="240" y1="124" x2="270" y2="94" strokeWidth="11" strokeLinecap="round" />
              <circle cx="271" cy="92" r="7" />
            </g>
          </g>
          <g className={css.sign} data-on={invited ? '1' : undefined}>
            <g transform="rotate(-6 212 132)">
              <rect x="176" y="112" width="72" height="40" fill="#fff8ec" stroke={INK} strokeWidth="3" />
              <rect x="176" y="146" width="72" height="6" fill={SHADE} />
              <text x="212" y="139" textAnchor="middle" fontSize="19" fill={INK} style={FONT}>
                COME IN
              </text>
            </g>
          </g>
          <path d="M138 24Q166 80 150 154H138Z" fill="#ff6f91" stroke={INK} strokeWidth="3" />
          <path d="M143 40Q154 90 146 150" fill="none" stroke="#c94a6c" strokeWidth="3" />
          <path d="M294 24Q266 80 282 154H294Z" fill="#ff6f91" stroke={INK} strokeWidth="3" />
          <path d="M289 40Q278 90 286 150" fill="none" stroke="#c94a6c" strokeWidth="3" />
          {/* sill + flowerpot */}
          <rect x="116" y="164" width="200" height="12" fill="#3a3270" stroke={INK} strokeWidth="2.5" />
          <rect x="118" y="165" width="196" height="3" fill="#6a5fb0" />
          <path d="M270 150H296L292 164H274Z" fill="#d98e4a" stroke={INK} strokeWidth="2.5" />
          {[274, 283, 292].map((cx, i) => (
            <circle key={cx} cx={cx} cy={144 - (i % 2) * 6} r="5" fill={i === 1 ? '#ffe27a' : '#ffb3c9'} stroke={INK} strokeWidth="2" />
          ))}
        </Layer>
        <Layer d={12}>
          <rect x="-30" y="250" width="460" height="60" fill="#161236" />
          <line x1="-30" x2="430" y1="251" y2="251" stroke="#2f3b7a" strokeWidth="3" />
          {/* window light falling on the ground */}
          <polygon points="140,251 296,251 336,300 104,300" fill="#ffcf70" opacity="0.16" />
          <Blob cx={242} cy={273} rx={38} ry={6} o={0.55} />
          <Kitten transform="translate(200 166) scale(.42)" look={{ x: -0.3, y: -1 }} tail={wag ? 'fast' : 'sway'} blinkDelay={1.5} />
        </Layer>
        <Layer d={18}>
          {/* ivy from the top corner */}
          <path d="M-30 -10Q20 30 10 80Q4 110 30 130" fill="none" stroke="#0b1230" strokeWidth="5" />
          {[
            [6, 20, -20],
            [22, 50, 30],
            [6, 84, -30],
            [26, 116, 20],
          ].map(([x, y, r], i) => (
            <ellipse key={i} cx={x} cy={y} rx="13" ry="7" transform={`rotate(${r} ${x} ${y})`} fill="#132049" stroke="#0b1230" strokeWidth="2" />
          ))}
        </Layer>
      </svg>
      <Hotspot cx={242} cy={228} w={100} h={110} label="Wave back with your tail" onPress={press} pulse={!invited} />
    </>
  );
}

/* ------------------------------------------------------------------ 5. The Home */
const FAIRY = ['#ffe27a', '#a8ecf0', '#ffb3c9', '#b8f23a'];
const edge = (x1: number, y1: number, x2: number, y2: number, n: number) =>
  Array.from({ length: n }, (_, i) => ({ x: x1 + ((x2 - x1) * (i + 0.5)) / n, y: y1 + ((y2 - y1) * (i + 0.5)) / n }));
const LIGHTS = [...edge(120, 238, 215, 70, 7), ...edge(215, 70, 310, 238, 7)];

export function Home({ beat, signal }: SceneProps) {
  const { play, purr } = useAudio();
  const [taps, setTaps] = useState(0);
  const [wag, setWag] = useState(false);
  const [bubble, setBubble] = useState(false);
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      purr(false);
    },
    [purr],
  );
  const closing = beat >= 3;
  // the closing line: he dozes off with a purr
  useEffect(() => {
    if (!closing) return;
    purr(true);
    const id = window.setTimeout(() => purr(false), 2600);
    return () => {
      window.clearTimeout(id);
      purr(false);
    };
  }, [closing, purr]);

  const press = (e: React.MouseEvent<HTMLButtonElement>) => {
    signal('interact');
    setWag(true);
    later(() => setWag(false), 380);
    const n = taps + 1;
    if (n < 5) {
      play('pop');
      setTaps(n);
      return;
    }
    // 5th tap: the secret
    setTaps(0);
    const r = e.currentTarget.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, ['#ff6f91', '#b8f23a', '#fff8ec'], 22);
    play('chime');
    purr(true);
    later(() => purr(false), 1800);
    setBubble(true);
    later(() => setBubble(false), 4500);
  };

  return (
    <>
      <svg className={css.svg} viewBox="0 0 400 300" role="img" aria-label="A cozy room with a lamp, a blanket fort and the kitten resting on a pillow.">
        <defs>
          <radialGradient id="hm-lamp" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#fff2a8" stopOpacity="0.8" />
            <stop offset="1" stopColor="#fff2a8" stopOpacity="0" />
          </radialGradient>
          <pattern id="hm-stripe" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <rect width="11" height="22" fill="#fff8ec" opacity="0.4" />
          </pattern>
          <pattern id="hm-paper" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M20 14l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6-4.5-4 6-1z" fill="#ffbf86" opacity="0.7" />
          </pattern>
        </defs>
        <Layer d={3}>
          <rect x="-30" y="-20" width="460" height="262" fill="#ffcf9a" />
          <rect x="-30" y="-20" width="460" height="262" fill="url(#hm-paper)" />
          <rect x="-30" y="226" width="460" height="14" fill="#e9a874" stroke={INK} strokeWidth="2" />
          {/* moon window */}
          <rect x="318" y="34" width="64" height="78" fill="#2a3f73" stroke={INK} strokeWidth="4" />
          <circle cx="352" cy="62" r="11" fill="#ffe27a" />
          <circle cx="357" cy="59" r="9" fill="#2a3f73" />
          <line x1="350" x2="350" y1="34" y2="112" stroke={INK} strokeWidth="3" />
          <rect x="312" y="110" width="76" height="8" fill="#c98d52" stroke={INK} strokeWidth="2.5" />
          <path d="M318 34Q330 70 322 112H318Z" fill="#ff6f91" stroke={INK} strokeWidth="2" />
          <path d="M382 34Q370 70 378 112H382Z" fill="#ff6f91" stroke={INK} strokeWidth="2" />
        </Layer>
        <Layer d={7}>
          <circle className={css.lamp} cx="40" cy="112" r="92" fill="url(#hm-lamp)" />
          <Blob cx={40} cy={241} rx={22} ry={5} />
          <rect x="37" y="112" width="6" height="126" fill={INK} />
          <ellipse cx="40" cy="240" rx="18" ry="6" fill={INK} />
          <polygon points="14,114 66,114 54,76 26,76" fill="#ffe27a" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <polygon points="40,114 66,114 54,76 40,76" fill={SHADE} opacity="0.6" />
          {/* blanket fort: front face + shaded right side */}
          <Blob cx={215} cy={240} rx={110} ry={7} />
          <polygon points="120,238 215,70 310,238" fill="#ff6f91" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          <polygon points="120,238 215,70 310,238" fill="url(#hm-stripe)" />
          <polygon points="215,70 310,238 262,238" fill={SHADE} opacity="0.7" />
          <polygon points="190,238 215,150 240,238" fill="#7a2a45" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          {LIGHTS.map((p, i) => (
            <circle key={i} className={css.fairy} style={{ '--d': `${(i % 5) * 0.35}s` } as CSSProperties} cx={p.x} cy={p.y} r="4.5" fill={FAIRY[i % 4]} stroke={INK} strokeWidth="1.5" />
          ))}
        </Layer>
        <Layer d={12}>
          <rect x="-30" y="238" width="460" height="80" fill="#c98d52" />
          <g stroke="#a9733f" strokeWidth="2">
            <line x1="-30" x2="430" y1="262" y2="262" />
            <line x1="-30" x2="430" y1="284" y2="284" />
          </g>
          <ellipse cx="200" cy="262" rx="120" ry="18" fill="#ffe27a" opacity="0.55" />
          <Blob cx={200} cy={258} rx={70} ry={8} o={0.35} />
          <ellipse cx="200" cy="250" rx="72" ry="16" fill="#a8ecf0" stroke={INK} strokeWidth="3.5" />
          <path d="M140 254Q200 270 260 254" fill="none" stroke="#6fc1c8" strokeWidth="4" />
          <Kitten transform="translate(150 116) scale(.5)" eyes={closing ? 'closed' : 'normal'} tail={wag ? 'fast' : 'sway'} blinkDelay={3} />
          <text x="268" y="206" fontSize="10" fill={INK} opacity="0.35" style={NOTE}>
            psst
          </text>
        </Layer>
        <Layer d={18}>
          {/* toy blocks */}
          <g transform="rotate(-8 360 270)">
            <rect x="334" y="246" width="40" height="40" fill="#ffe27a" stroke={INK} strokeWidth="3" />
            <path d="M374 246l10 -8v40l-10 8z" fill="#d9b340" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
            <path d="M334 246l10 -8h40l-10 8z" fill="#fff0a8" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
            <text x="354" y="276" textAnchor="middle" fontSize="24" fill={INK} style={FONT}>
              V
            </text>
          </g>
          <g transform="rotate(10 -6 280)">
            <rect x="-24" y="258" width="40" height="40" fill="#b8f23a" stroke={INK} strokeWidth="3" />
            <path d="M16 258l10 -8v40l-10 8z" fill="#86b822" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
            <path d="M-24 258l10 -8h40l-10 8z" fill="#dcff8a" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          </g>
        </Layer>
      </svg>
      <Hotspot cx={248} cy={222} w={34} h={50} label="Kitten's tail" onPress={press} />
      {bubble && (
        <p className={css.bubble} role="status">
          you found my secret. i was never scary. just cozy.
        </p>
      )}
    </>
  );
}

export const ARTS = { alley: Alley, rain: Rain, discovery: Discovery, window: Window, home: Home } as const;
