'use client';

// Project 3. Four blueprint cards. Tap/Enter flips (a fade + tiny scale, no 3D). Lines draw once when the card scrolls in.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useAudio } from '@/audio';
import { Stage } from './Stage';
import css from './projects.module.css';

type Fort = { id: string; name: string; stab: number; stabNote?: string; snacks: string; cuddle: string; materials: string[]; note: string; draw: ReactNode };

// Hand-drawn line art, 200x120. Every path gets pathLength=1 so one CSS rule can "draw" all of them.
const P = (d: string, k: string | number) => <path key={k} d={d} pathLength={1} />;
const FORTS: Fort[] = [
  {
    id: 'couch',
    name: 'The Classic Couch Fort',
    stab: 7,
    snacks: '3 snacks',
    cuddle: 'High',
    materials: ['6 couch cushions', '2 blankets', '1 very patient couch'],
    note: 'Cushions are load-bearing. Do not ask which ones.',
    draw: [
      P('M24 74h152a8 8 0 0 1 8 8v16H16V82a8 8 0 0 1 8-8Z', 1),
      P('M28 74V50a10 10 0 0 1 10-10h124a10 10 0 0 1 10 10v24', 2),
      P('M100 74v24M64 74v24M136 74v24', 3),
      P('M22 44Q100 -10 178 44', 4),
      P('M14 66Q100 14 186 66', 5),
      P('M30 98v8M170 98v8', 6),
    ],
  },
  {
    id: 'tent',
    name: 'The Table Tent',
    stab: 8,
    snacks: '5 snacks',
    cuddle: 'Very high',
    materials: ['1 table', '1 bedsheet', '1 string of fairy lights', '4 clothespins'],
    note: 'The fairy lights are for ambiance and also for supervising.',
    draw: [
      P('M40 56H160', 1),
      P('M46 56V104M154 56V104', 2),
      P('M30 52H170L194 104H6Z', 3),
      P('M30 52Q100 76 170 52', 4),
      P('M70 100a30 30 0 0 1 60 0', 5),
    ],
  },
  {
    id: 'pillow',
    name: 'The Pillow Fortress',
    stab: 4,
    stabNote: 'collapses when sneezed on',
    snacks: '1 snack',
    cuddle: 'Maximum',
    materials: ['12 pillows', '1 flag (a sock)', '0 structural plans'],
    note: 'Do not sneeze near the pillow fortress.',
    draw: [
      ...[22, 58, 94, 130, 166].map((x, i) => P(`M${x - 16} 100h32v16H${x - 16}Z`, `a${i}`)),
      ...[40, 76, 112, 148].map((x, i) => P(`M${x - 16} 82h32v16H${x - 16}Z`, `b${i}`)),
      ...[58, 94, 130].map((x, i) => P(`M${x - 16} 64h32v16H${x - 16}Z`, `c${i}`)),
      P('M100 62V22', 'pole'),
      P('M100 22l22 8-22 8', 'flag'),
    ],
  },
  {
    id: 'palace',
    name: 'The Grand Cardboard Palace',
    stab: 9,
    snacks: '8 snacks',
    cuddle: 'Legendary',
    materials: ['1 large box', '1 blanket roof', '1 nightlight', '1 door (cut with adult-approved scissors)'],
    note: 'Has a nightlight. Therefore has a Junior Darkness Designer.',
    draw: [
      P('M40 52h120v56H40Z', 1),
      P('M30 52Q100 -2 170 52', 2),
      P('M88 108V80a12 12 0 0 1 24 0v28', 3),
      P('M40 52V30h22v22M138 52V30h22v22', 4),
      P('M51 30V14l14 5-14 5', 5),
      P('M174 96a8 8 0 1 1 0 .1M174 82v-6M174 112v6M160 96h-6M188 96h6', 6),
    ],
  },
];

function Cat() {
  return (
    <svg viewBox="0 0 60 56" width="54" height="50" aria-hidden="true" focusable="false">
      <path d="M8 46C4 30 8 22 16 18L12 4L26 12H34L48 4L44 18C52 22 56 30 52 46Z" fill="#fff8ec" opacity="0.9" />
      <circle cx="22" cy="30" r="3" fill="#1d3f8f" />
      <circle cx="38" cy="30" r="3" fill="#1d3f8f" />
    </svg>
  );
}

function Card({ f, i }: { f: Fort; i: number }) {
  const { play } = useAudio();
  const [flipped, setFlipped] = useState(false);
  const [inview, setInview] = useState(false);
  const [drawKey, setDrawKey] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInview(true);
          window.setTimeout(() => play('stamp'), 900); // the APPROVED stamp lands
          io.disconnect();
        }
      },
      { threshold: 0.45 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [play]);

  const flip = () => setFlipped((v) => !v);
  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      aria-label={`${f.name}. ${flipped ? 'Showing the notes. Press to see the blueprint.' : 'Press to flip for materials and notes.'}`}
      className={css.fort}
      data-flipped={flipped ? '1' : undefined}
      data-inview={inview ? '1' : undefined}
      style={{ '--i': i } as React.CSSProperties}
      onClick={flip}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          flip();
        }
      }}
      onPointerEnter={(e) => e.pointerType === 'mouse' && inview && setDrawKey((n) => n + 1)}
    >
      <div className={css.face} data-side="front" aria-hidden={flipped}>
        <h3 className={css.fortName}>{f.name}</h3>
        <svg key={drawKey} viewBox="0 0 200 120" className={css.draw} aria-hidden="true" focusable="false">
          {f.draw}
        </svg>
        <dl className={css.stats}>
          <div>
            <dt>Stability</dt>
            <dd>
              <span className={css.meter}><i style={{ width: `${f.stab * 10}%` }} /></span>
              <b>{f.stab}/10</b>
            </dd>
            {f.stabNote && <dd className={css.stabNote}>({f.stabNote})</dd>}
          </div>
          <div><dt>Snack capacity</dt><dd><b>{f.snacks}</b></dd></div>
          <div><dt>Cuddle rating</dt><dd><b>{f.cuddle}</b></dd></div>
        </dl>
        <span className={css.stamp} aria-hidden="true">approved</span>
        <span className={css.flipHint} aria-hidden="true">tap to flip</span>
      </div>
      <div className={css.face} data-side="back" aria-hidden={!flipped}>
        <h3 className={css.fortName}>{f.name}</h3>
        <h4 className={css.backHead}>Materials</h4>
        <ul className={css.mats}>{f.materials.map((m) => <li key={m}>{m}</li>)}</ul>
        <h4 className={css.backHead}>Void&apos;s Notes</h4>
        <p className={css.voidNote}>{f.note}</p>
        <div className={css.backCat}><Cat /></div>
      </div>
    </div>
  );
}

export default function BlanketFortBlueprints() {
  return (
    <Stage id="forts-title" title="Blanket Fort Architecture" subtitle="Structural engineering for the very small.">
      <div className={css.fortGrid}>
        {FORTS.map((f, i) => <Card key={f.id} f={f} i={i} />)}
      </div>
    </Stage>
  );
}
