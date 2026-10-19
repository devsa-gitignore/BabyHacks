'use client';

import { useEffect, useRef, useState } from 'react';
import { PixelButterfly, PixelStar } from '@/components/void/Pixel';
import { useAudio } from '@/audio';
import { useReducedMotion } from '@/hooks/useDevice';

export function HomeButterfly({ onPounce }: { onPounce?: (x: number, y: number) => void }) {
  const { play } = useAudio();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLButtonElement>(null);
  const [active, setActive] = useState(false);
  const [sparkle, setSparkle] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (reduce) return;
    let timer: number;
    const scheduleNext = () => {
      timer = window.setTimeout(() => {
        setActive(true);
      }, 10000 + Math.random() * 8000);
    };
    scheduleNext();
    return () => window.clearTimeout(timer);
  }, [reduce]);

  useEffect(() => {
    if (!active || reduce) return;
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let t0 = 0;
    const dur = 7500;
    const vw = window.innerWidth;
    const startY = window.innerHeight * (0.22 + Math.random() * 0.15);

    const tick = (now: number) => {
      if (!t0) t0 = now;
      const p = (now - t0) / dur;
      const x = -60 + p * (vw + 120);
      const y = startY + Math.sin(p * 10) * 32 + Math.sin(p * 24) * 8;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;

      if (p >= 1) {
        setActive(false);
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, reduce]);

  const onShoo = (e: React.MouseEvent) => {
    e.stopPropagation();
    play('whoosh');
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      setSparkle({ x: rect.left + rect.width / 2, y: rect.top });
      setTimeout(() => setSparkle(null), 800);
      onPounce?.(rect.left + rect.width / 2, rect.top);
    }
    setActive(false);
  };

  if (!active) return null;

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-label="Fluttering pixel butterfly. Tap to shoo."
        onClick={onShoo}
        className="fixed left-0 top-0 z-[6] cursor-pointer border-0 bg-transparent p-2 transition-transform hover:scale-125 focus:outline-none"
        style={{ transform: 'translate3d(-100px, 0, 0)' }}
      >
        <PixelButterfly px={5} />
      </button>

      {sparkle && (
        <span
          className="pointer-events-none fixed z-[8] animate-ping"
          style={{ left: sparkle.x, top: sparkle.y }}
        >
          <PixelStar px={4} />
        </span>
      )}
    </>
  );
}
