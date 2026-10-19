'use client';

// Landing, "Lights out": the room starts dark. Your cursor is a soft flashlight, two green eyes watch it,
// and pulling the light cord fades the room's lights in. Sits on top of the existing landing scene.
import Link from 'next/link';
import { motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudio } from '@/audio';
import { Odometer } from '@/components/Odometer';
import { useReducedMotion } from '@/hooks/useDevice';
import css from './landing.module.css';

const BULBS = ['#ffe27a', '#a8ecf0', '#ffb3c9', '#b8f23a'];

export function DarkRoom() {
  const { play } = useAudio();
  const reduce = useReducedMotion();
  const dark = useRef<HTMLDivElement>(null);
  const eyes = useRef<HTMLDivElement>(null);
  const [lit, setLit] = useState(false);
  const [gone, setGone] = useState(false);
  const [open, setOpen] = useState(false);
  const [found, setFound] = useState(false);
  const [squint, setSquint] = useState(false);
  const touched = useRef(false);
  const litRef = useRef(false);

  const lightsOn = useCallback(() => {
    if (litRef.current) return;
    litRef.current = true;
    play('cord');
    setLit(true);
    window.setTimeout(() => setGone(true), 1100);
  }, [play]);

  useEffect(() => {
    if (reduce) {
      litRef.current = true;
      setLit(true);
      setGone(true);
    }
  }, [reduce]);

  // the flashlight follows the pointer; the eyes watch it; shining on them = found
  useEffect(() => {
    if (gone) return;
    const t = window.setTimeout(() => setOpen(true), 800);
    const aim = (x: number, y: number) => {
      dark.current?.style.setProperty('--x', `${x}px`);
      dark.current?.style.setProperty('--y', `${y}px`);
      const e = eyes.current;
      if (!e) return;
      const r = e.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = x - cx;
      const dy = y - cy;
      const d = Math.hypot(dx, dy) || 1;
      const m = Math.min(1, d / 300) * 9;
      e.style.setProperty('--px', `${(dx / d) * m}px`);
      e.style.setProperty('--py', `${(dy / d) * m}px`);
      if (d < 110 && !litRef.current) {
        setFound((f) => {
          if (!f) {
            setSquint(true);
            window.setTimeout(() => play('sneeze'), 350);
            window.setTimeout(() => setSquint(false), 1300);
          }
          return true;
        });
      }
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') touched.current = true;
      aim(e.clientX, e.clientY);
    };
    // touch: the light sweeps on its own until the first touch
    let raf = 0;
    const t0 = performance.now();
    const sweep = (now: number) => {
      if (!touched.current && window.matchMedia('(hover: none)').matches) {
        const s = (now - t0) / 1000;
        aim(window.innerWidth * (0.5 + Math.sin(s * 0.6) * 0.32), window.innerHeight * (0.5 + Math.sin(s * 0.9) * 0.18));
      }
      raf = requestAnimationFrame(sweep);
    };
    raf = requestAnimationFrame(sweep);
    aim(window.innerWidth / 2, window.innerHeight * 0.75);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') lightsOn();
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onMove, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onMove);
      window.removeEventListener('keydown', onKey);
    };
  }, [gone, lightsOn, play]);

  return (
    <>
      {/* fairy lights along the top: they come on one by one when the lights do */}
      <div className={css.bulbs} data-lit={lit ? '1' : undefined} aria-hidden="true">
        {Array.from({ length: 16 }, (_, i) => (
          <span key={i} style={{ ['--c' as string]: BULBS[i % 4], ['--d' as string]: `${120 + i * 70}ms`, top: `${Math.round(20 + Math.sin((i / 15) * Math.PI * 3) * 10)}px` }} />
        ))}
      </div>

      {!gone && (
        <div ref={dark} className={css.dark} data-lit={lit ? '1' : undefined}>
          <div className={css.shade} aria-hidden="true" />
          <div ref={eyes} className={css.eyes} data-open={open ? '1' : undefined} data-squint={squint ? '1' : undefined} aria-hidden="true">
            <span />
            <span />
          </div>
          <p className={css.hint} role="status">
            {found ? 'found you. now pull the cord ↗' : "it's dark in here. move your light around."}
          </p>
          <motion.button
            type="button"
            data-sfx="off"
            className={css.cord}
            drag="y"
            dragConstraints={{ top: 0, bottom: 140 }}
            dragElastic={0.2}
            dragSnapToOrigin
            onDragEnd={(_, info) => info.offset.y > 60 && lightsOn()}
            onClick={lightsOn}
            aria-label="Pull the light cord to turn the lights on"
          >
            <span className={css.cordString} />
            <span className={css.cordBead} />
          </motion.button>
          <button type="button" data-sfx="off" className={css.skip} onClick={lightsOn}>
            lights on
          </button>
        </div>
      )}
    </>
  );
}

/** Retro bits on the landing: a hit counter (this browser's visits), a guestbook sticker, a cozy sign. */
export function RetroBits() {
  const [visits, setVisits] = useState<number | null>(null);
  useEffect(() => {
    try {
      let n = Number(localStorage.getItem('wk.visits') || 0);
      if (!sessionStorage.getItem('wk.counted')) {
        n += 1;
        localStorage.setItem('wk.visits', String(n));
        sessionStorage.setItem('wk.counted', '1');
      }
      setVisits(n);
    } catch {
      setVisits(1);
    }
  }, []);
  return (
    <div className={css.retro}>
      <p className={css.counter} aria-label={`This browser has visited ${visits ?? 1} times`}>
        <span className={css.counterNum}>{visits === null ? '…' : <Odometer value={visits} />}</span>
        <span>visits from this browser</span>
      </p>
      <Link href="/wishes" className={css.guestbook}>
        ✎ sign the guestbook
      </Link>
      <p className={css.cozy} aria-hidden="true">
        cozy zone · whisper only
      </p>
    </div>
  );
}
