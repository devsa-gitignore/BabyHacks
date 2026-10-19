'use client';

// Project 2. Tap an object: the paw swats it, it tumbles off the front edge, a quip pops up.
import { useEffect, useRef, useState } from 'react';
import { useAudio } from '@/audio';
import { useReducedMotion } from '@/hooks/useDevice';
import { Hotspot } from '../_kit/Hotspot';
import { burst } from '../_kit/burst';
import { Stage } from './Stage';
import css from './projects.module.css';

const W = 420;
const H = 260;
const TOP = 170; // table top y
const REST = 18; // paw resting offset (px, svg units)

type Obj = { id: string; name: string; cx: number; quip: string; dx: number; rot: number };
const OBJECTS: Obj[] = [
  { id: 'mug', name: 'mug', cx: 62, quip: 'Gravity still works. Noted.', dx: -6, rot: 80 },
  { id: 'plant', name: 'potted plant', cx: 124, quip: 'Redecorating.', dx: 8, rot: -95 },
  { id: 'clock', name: 'clock', cx: 186, quip: 'Time is a flat circle. Now also on the floor.', dx: -4, rot: 40 },
  { id: 'book', name: 'book', cx: 248, quip: 'I read the first page. It was heavy.', dx: 10, rot: 110 },
  { id: 'globe', name: 'tiny globe', cx: 310, quip: 'The world is on the floor now.', dx: -8, rot: -70 },
  { id: 'vase', name: 'mystery vase', cx: 372, quip: 'That one was on purpose.', dx: 4, rot: 100 },
];

function Shape({ id }: { id: string }) {
  const s = { stroke: '#0d0b1a', strokeWidth: 3, strokeLinejoin: 'round' as const };
  switch (id) {
    case 'mug':
      return (
        <>
          <path d="M12 -22H19a7 7 0 0 1 0 14H12" fill="none" {...s} />
          <rect x="-16" y="-30" width="28" height="30" rx="4" fill="#a8ecf0" {...s} />
          <ellipse cx="-2" cy="-29" rx="12" ry="3" fill="#7a4a2a" />
        </>
      );
    case 'plant':
      return (
        <>
          <ellipse cx="-9" cy="-38" rx="6" ry="14" transform="rotate(-28 -9 -38)" fill="#7ddf7a" {...s} />
          <ellipse cx="9" cy="-38" rx="6" ry="14" transform="rotate(28 9 -38)" fill="#7ddf7a" {...s} />
          <ellipse cx="0" cy="-42" rx="6" ry="16" fill="#5fcf6e" {...s} />
          <path d="M-17 -22H17L12 0H-12Z" fill="#ffc28a" {...s} />
        </>
      );
    case 'clock':
      return (
        <>
          <rect x="-14" y="-6" width="8" height="6" fill="#0d0b1a" />
          <rect x="6" y="-6" width="8" height="6" fill="#0d0b1a" />
          <circle cx="0" cy="-28" r="22" fill="#fff8ec" {...s} />
          <path d="M0 -28V-42M0 -28L10 -22" stroke="#0d0b1a" strokeWidth="3" strokeLinecap="round" />
          <circle cx="0" cy="-28" r="2.5" fill="#ff6f91" />
        </>
      );
    case 'book':
      return (
        <>
          <rect x="-26" y="-14" width="52" height="14" rx="2" fill="#ff6f91" {...s} />
          <rect x="-22" y="-28" width="44" height="14" rx="2" fill="#b3bfff" {...s} />
          <path d="M-22 -7H26M-18 -21H22" stroke="#fff8ec" strokeWidth="2" opacity="0.7" />
        </>
      );
    case 'globe':
      return (
        <>
          <ellipse cx="0" cy="-2" rx="15" ry="4" fill="#ffe27a" {...s} />
          <rect x="-3" y="-12" width="6" height="10" fill="#0d0b1a" />
          <circle cx="0" cy="-32" r="20" fill="#a8ecf0" {...s} />
          <path d="M-12 -38q6 -6 10 2q-4 6 -10 -2ZM4 -30q8 -4 8 6q-8 4 -8 -6Z" fill="#7ddf7a" />
        </>
      );
    default:
      return (
        <>
          <path d="M-10 0H10C16 -14 14 -30 6 -38V-46H-6V-38C-14 -30 -16 -14 -10 0Z" fill="#b3bfff" {...s} />
          <text x="0" y="-14" textAnchor="middle" fontSize="20" fill="#0d0b1a" style={{ fontFamily: 'var(--font-display)' }}>
            ?
          </text>
        </>
      );
  }
}

export default function KnockItOffTable() {
  const { play } = useAudio();
  const reduce = useReducedMotion();
  const [fallen, setFallen] = useState<boolean[]>(() => OBJECTS.map(() => false));
  const [landed, setLanded] = useState<boolean[]>(() => OBJECTS.map(() => false));
  const [reset, setReset] = useState(false);
  const [pawX, setPawX] = useState(REST);
  const [swat, setSwat] = useState(false);
  const [quip, setQuip] = useState<{ i: number; n: number } | null>(null);
  const [done, setDone] = useState(false);
  const busy = useRef(false);
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const count = fallen.filter(Boolean).length;

  const knock = (i: number, e: React.MouseEvent<HTMLButtonElement>) => {
    if (busy.current || fallen[i]) return;
    busy.current = true;
    const o = OBJECTS[i];
    const mark = (arr: boolean[]) => arr.map((v, k) => (k === i ? true : v));
    const finish = () => {
      setQuip({ i, n: Date.now() });
      later(() => setQuip((q) => (q && q.i === i ? null : q)), 2000);
      busy.current = false;
    };
    if (reduce) {
      play('thud');
      setFallen(mark);
      setLanded(mark);
      finish();
      if (count + 1 === OBJECTS.length) later(() => setDone(true), 200);
      return;
    }
    setPawX(o.cx - 52); // paw slides in (200ms)
    later(() => {
      play('swat');
      setSwat(true);
      setFallen(mark);
    }, 200);
    later(() => {
      play('thud');
      setLanded(mark);
      finish();
    }, 200 + 560);
    later(() => {
      setPawX(REST);
      setSwat(false);
    }, 520);
    if (count + 1 === OBJECTS.length) {
      const r = e.currentTarget.getBoundingClientRect();
      later(() => {
        setDone(true);
        play('chime');
        burst(r.left + r.width / 2, r.top, undefined, 22);
      }, 1000);
    }
  };

  const putBack = () => {
    play('whoosh');
    setDone(false);
    setQuip(null);
    setReset(true);
    setLanded(OBJECTS.map(() => false));
    later(() => {
      setFallen(OBJECTS.map(() => false));
      setReset(false);
    }, reduce ? 50 : 1100);
  };

  return (
    <Stage id="table-title" title="The Knock-It-Off Table" subtitle="Scientific research on gravity. Mostly.">
      <div className={css.tableWrap}>
        <p className={css.counter} aria-live="polite">Gravity checks: <b>{count} / {OBJECTS.length}</b></p>
        <div className={css.tableArt}>
          <svg viewBox={`0 0 ${W} ${H}`} className={css.tableSvg} role="img" aria-label="A wooden table with six objects on it and a black paw resting at the side.">
            <rect width={W} height={H} fill="#d9deff" />
            <rect y="236" width={W} height="24" fill="#b9c2f4" />
            <rect x="0" y="236" width={W} height="3" fill="#0d0b1a" />
            {/* table */}
            <rect x="36" y="196" width="14" height="42" fill="#a9733f" stroke="#0d0b1a" strokeWidth="3" />
            <rect x="370" y="196" width="14" height="42" fill="#a9733f" stroke="#0d0b1a" strokeWidth="3" />
            <rect x="30" y="184" width="360" height="12" fill="#b27a44" stroke="#0d0b1a" strokeWidth="3" />
            <rect x="20" y={TOP} width="380" height="16" rx="3" fill="#c98d52" stroke="#0d0b1a" strokeWidth="3" />
            {/* objects */}
            {OBJECTS.map((o, i) => (
              <g key={o.id} transform={`translate(${o.cx} ${TOP})`}>
                <g
                  className={css.obj}
                  data-state={reset ? 'back' : fallen[i] ? (reduce ? 'gone' : 'fall') : undefined}
                  style={{ '--dx': `${o.dx}px`, '--dy': '74px', '--rot': `${o.rot}deg`, '--stagger': `${i * 80}ms` } as React.CSSProperties}
                >
                  <Shape id={o.id} />
                </g>
                {landed[i] && !reduce && (
                  <g className={css.dust}>
                    {[-10, 0, 10].map((x) => (
                      <circle key={x} cx={x + o.dx} cy="76" r="5" fill="#fff8ec" stroke="#0d0b1a" strokeWidth="2" />
                    ))}
                  </g>
                )}
              </g>
            ))}
            {/* paw + arm, rests at the left side */}
            <g className={css.paw} style={{ transform: `translateX(${pawX}px)` }}>
              <g className={css.pawHit} data-swat={swat ? '1' : undefined}>
                <rect x="-60" y="136" width="60" height="20" rx="10" fill="#0d0b1a" />
                <ellipse cx="2" cy="146" rx="20" ry="15" fill="#0d0b1a" stroke="#2b2656" strokeWidth="2" />
                <circle cx="8" cy="146" r="5" fill="#ff7aa8" />
                <circle cx="14" cy="139" r="3" fill="#ff7aa8" />
                <circle cx="14" cy="153" r="3" fill="#ff7aa8" />
              </g>
            </g>
          </svg>
          {OBJECTS.map((o, i) => (
            <Hotspot key={o.id} vbW={W} vbH={H} cx={o.cx} cy={TOP - 26} w={54} h={64} label={`Knock the ${o.name} off the table`} disabled={fallen[i]} onPress={(e) => knock(i, e)} />
          ))}
          {quip && (
            <p key={quip.n} className={css.quip} style={{ left: `clamp(24%, ${(OBJECTS[quip.i].cx / W) * 100}%, 76%)` }} role="status">
              {OBJECTS[quip.i].quip}
            </p>
          )}
        </div>
        {done ? (
          <div className={css.done} role="status">
            <p>Experiment complete! Void is very proud.</p>
            <button type="button" className="px-btn butter" onClick={putBack}>
              <span>Put it all back</span>
            </button>
          </div>
        ) : (
          <p className={css.hintNote}>tap things. for science.</p>
        )}
      </div>
    </Stage>
  );
}
