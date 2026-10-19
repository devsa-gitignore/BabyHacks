'use client';

// The hidden egg (plan P7). Type h, u, s, h anywhere (not in a field) and the site dims to a starry night.
// Void curls up, purrs, and sparkles drift up. "still here" closes it early.
import { useEffect, useRef, useState } from 'react';
import { useAudio } from '@/audio';
import { IconSlot } from '@/components/IconSlot';
import { useReducedMotion } from '@/hooks/useDevice';
import { Kitten } from '../_kit/Kitten';

const SECRET = 'hush';
const RESET_MS = 2000;
const SHOW_MS = 12000;

export default function EasterEgg() {
  const { purr } = useAudio();
  const reduce = useReducedMotion();
  const [on, setOn] = useState(false);
  const buf = useRef('');
  const last = useRef(0);

  // a quiet buffer of recent letters; resets after a pause
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return;
      const now = performance.now();
      if (now - last.current > RESET_MS) buf.current = '';
      last.current = now;
      buf.current = (buf.current + e.key.toLowerCase()).slice(-SECRET.length);
      if (buf.current === SECRET) {
        buf.current = '';
        setOn(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // open: purr and let the night settle. Closes itself after SHOW_MS.
  useEffect(() => {
    if (!on) return;
    purr(true);
    const t = window.setTimeout(() => setOn(false), SHOW_MS);
    return () => {
      window.clearTimeout(t);
      purr(false);
    };
  }, [on, purr]);

  if (!on) return null;

  return (
    <div className="hush" role="dialog" aria-label="Goodnight" aria-modal="false">
      <div className="hush-stars" aria-hidden="true">
        {Array.from({ length: 22 }, (_, k) => (
          <span key={k} style={{ left: `${(k * 41) % 96 + 2}%`, top: `${(k * 29) % 90 + 4}%`, animationDelay: `${(k % 6) * 0.7}s` }} />
        ))}
      </div>

      {!reduce &&
        Array.from({ length: 8 }, (_, k) => (
          <span key={k} className="hush-spark" style={{ left: `${12 + k * 10}%`, animationDelay: `${k * 0.45}s`, ['--dx' as string]: `${(k % 2 ? 1 : -1) * (10 + k * 3)}px` }} aria-hidden="true">
            <IconSlot name="icon-sparkle" size={44} />
          </span>
        ))}

      <div className="hush-card">
        <svg viewBox="-20 -10 240 280" className="hush-kitten" aria-hidden="true">
          <Kitten eyes="closed" look={{ x: 0, y: 0.8 }} />
        </svg>
        <p className="font-note hush-line">Goodnight. You did well today.</p>
        <button type="button" className="btn-quiet" data-sfx="off" onClick={() => setOn(false)}>
          still here
        </button>
      </div>
    </div>
  );
}
