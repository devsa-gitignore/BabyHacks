'use client';

// Project 1. Move the light (pointer / finger / arrow keys), tap the wall to make the puppet act.
import { useEffect, useRef, useState } from 'react';
import { useAudio } from '@/audio';
import { Puppet, PUPPETS, type PuppetId } from '../_kit/Puppets';
import { burstFrom } from '../_kit/burst';
import { Stage } from './Stage';
import css from './projects.module.css';

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const SOUND = { butterfly: 'flap', bunny: 'boing', bird: 'chirp', dragon: 'puff' } as const;

export default function ShadowPuppetTheater() {
  const { play } = useAudio();
  const [sel, setSel] = useState<PuppetId>('butterfly');
  const [acting, setActing] = useState(false);
  const [bounce, setBounce] = useState(0);
  const wall = useRef<HTMLDivElement>(null);
  const puppet = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 50, y: 50 });
  const down = useRef<{ t: number; x: number; y: number } | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  // The light + puppet position live in CSS variables (no React re-render per pointer move).
  const place = (x: number, y: number, smooth = false) => {
    const el = wall.current;
    if (!el) return;
    pos.current = { x: clamp(x, 8, 92), y: clamp(y, 14, 88) };
    el.dataset.smooth = smooth ? '1' : '';
    el.style.setProperty('--lx', `${pos.current.x}%`);
    el.style.setProperty('--ly', `${pos.current.y}%`);
  };
  const follow = (e: React.PointerEvent) => {
    const r = wall.current!.getBoundingClientRect();
    place(((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100);
  };

  const act = () => {
    if (acting) return;
    play(SOUND[sel]);
    setActing(true);
    if (sel === 'dragon') burstFrom(puppet.current, ['#ffe27a', '#fff8ec', '#ffb3c9'], 12);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setActing(false), 950);
  };

  const says = PUPPETS.find((p) => p.id === sel)!.says;

  return (
    <Stage id="puppets-title" title="The Shadow Puppet Theater" subtitle="Move the light. Make a friend.">
      <div className={css.theater}>
      <div
        ref={wall}
        className={css.wall}
        tabIndex={0}
        role="group"
        aria-label={`Shadow wall showing a ${sel}. Drag to move the light, press Enter to make it act, use the arrow keys to nudge the light.`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          down.current = { t: performance.now(), x: e.clientX, y: e.clientY };
          if (e.pointerType !== 'mouse') follow(e);
        }}
        onPointerMove={(e) => {
          if (e.pointerType === 'mouse' || down.current) follow(e);
        }}
        onPointerUp={(e) => {
          const d = down.current;
          down.current = null;
          if (d && performance.now() - d.t < 350 && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 8) act();
        }}
        onPointerCancel={() => (down.current = null)}
        onKeyDown={(e) => {
          const step = 5;
          const k = e.key;
          if (k === 'Enter' || k === ' ') {
            e.preventDefault();
            act();
          } else if (k.startsWith('Arrow')) {
            e.preventDefault();
            place(pos.current.x + (k === 'ArrowRight' ? step : k === 'ArrowLeft' ? -step : 0), pos.current.y + (k === 'ArrowDown' ? step : k === 'ArrowUp' ? -step : 0), true);
          }
        }}
      >
        <svg className={css.lampIcon} viewBox="0 0 48 56" aria-hidden="true" focusable="false">
          <path d="M8 22L16 6H32L40 22Z" fill="#ffe27a" stroke="#0d0b1a" strokeWidth="3" strokeLinejoin="round" />
          <rect x="22" y="22" width="4" height="22" fill="#0d0b1a" />
          <ellipse cx="24" cy="46" rx="11" ry="4" fill="#0d0b1a" />
        </svg>
        <div ref={puppet} key={`${sel}-${bounce}`} className={css.puppetBox} data-bounce="1">
          <Puppet id={sel} act={acting} />
        </div>
      </div>

      <div className={css.controls}>
        <p className={css.says} aria-live="polite">
          <span>Void says:</span> <b key={sel}>{says}</b>
        </p>
        <div role="radiogroup" aria-label="Choose a puppet" className={css.puppetBtns}>
          {PUPPETS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={sel === p.id}
              className={css.puppetBtn}
              onClick={() => {
                setSel(p.id);
                setBounce((n) => n + 1);
                play('pop');
              }}
            >
              <Puppet id={p.id} className={css.puppetIcon} />
              <span>{p.label}</span>
            </button>
          ))}
        </div>
        <button type="button" className="px-btn sm paper" onClick={() => place(50, 50, true)}>
          <span>Reset light</span>
        </button>
        <p className={css.hintNote}>move the light, tap the wall to make them act</p>
      </div>
      </div>
    </Stage>
  );
}
