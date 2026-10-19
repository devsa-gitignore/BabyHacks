'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudio } from '@/audio';
import { Footer } from '@/components/Footer';
import { Odometer } from '@/components/Odometer';
import { SnowBg } from '@/components/fx/SnowBg';
import { CribObjects } from '@/views/CribObjects';
import { Void3D } from '@/components/void/Void3D';
import type { VoidState } from '@/components/void/VoidHero';
import { PixelHeart } from '@/components/void/Pixel';
import { useIris } from '@/iris/IrisProvider';
import { countWishes } from '@/lib/supabase';
import { getPending } from '@/lib/wishes';

const HINTS = ['psst, tap the jar', 'hold her. she purrs.', 'drag her around, gently'];

export function HomeView() {
  const { play, purr } = useAudio();
  const { go } = useIris();
  const [state, setState] = useState<VoidState>('awake');
  const [count, setCount] = useState<number | null>(null);
  const [hint, setHint] = useState<number>(-1);
  const [hearts, setHearts] = useState<number[]>([]);
  const squish = useRef(0);
  const lastInput = useRef(0);
  const stateRef = useRef<VoidState>('awake');
  stateRef.current = state;
  const heartId = useRef(0);
  const holdTick = useRef(0);

  useEffect(() => {
    lastInput.current = performance.now();
    let on = true;
    countWishes()
      .then((c) => on && setCount((c ?? 0) + getPending().length))
      .catch(() => on && setCount(getPending().length));
    return () => {
      on = false;
    };
  }, []);

  // idle: after 20s she nods off, any input wakes her. After 8s idle a taped note gives a hint.
  useEffect(() => {
    const touch = () => {
      lastInput.current = performance.now();
      if (stateRef.current === 'asleep') setState('awake');
      setHint(-1);
    };
    window.addEventListener('pointermove', touch, { passive: true });
    window.addEventListener('pointerdown', touch, { passive: true });
    window.addEventListener('keydown', touch);
    let n = 0;
    const iv = window.setInterval(() => {
      const idle = performance.now() - lastInput.current;
      if (idle > 20000 && stateRef.current === 'awake') setState('asleep');
      else if (idle > 8000 && stateRef.current === 'awake') {
        setHint(n % HINTS.length);
        n += 1;
      }
    }, 4000);
    return () => {
      window.removeEventListener('pointermove', touch);
      window.removeEventListener('pointerdown', touch);
      window.removeEventListener('keydown', touch);
      window.clearInterval(iv);
      purr(false);
    };
  }, [purr]);

  const addHeart = useCallback(() => {
    const id = ++heartId.current;
    setHearts((h) => [...h, id]);
    window.setTimeout(() => setHearts((h) => h.filter((x) => x !== id)), 1200);
  }, []);

  const onPoke = () => {
    play('mrrp');
    addHeart();
  };
  const onHold = (on: boolean) => {
    window.clearInterval(holdTick.current);
    if (on) {
      setState('purr');
      purr(true);
      addHeart();
      holdTick.current = window.setInterval(addHeart, 420);
    } else {
      setState('awake');
      purr(false);
      play('mrrp');
    }
  };

  return (
    <>
      <SnowBg />
      <section className="scene" aria-label="Home">
        <CribObjects count={count ?? 0} onGo={(href) => go(href)} />

        <p className="font-note absolute bottom-[26dvh] left-[6vw] z-[2] hidden -rotate-3 text-[2.4rem] lg:block">
          <span className="paper px-3 py-1">welcome in</span>
        </p>

        {count !== null && (
          <p className="absolute right-4 top-[calc(50%+2rem)] z-[2] hidden rotate-2 text-[1.6rem] lg:block" aria-label={`${count} wishes so far`}>
            <span className="paper px-3 py-1">
              <Odometer value={count} /> wishes caught
            </span>
          </p>
        )}

        {hint >= 0 && (
          <p className="hint-note paper font-note text-[1.8rem]" style={{ right: '6vw', bottom: '40dvh' }} role="status">
            <span className="tape" aria-hidden="true" />
            {HINTS[hint]}
          </p>
        )}

        <Void3D className="void3d" state={state} onPoke={onPoke} onHold={onHold} squishRef={squish} />
        {hearts.map((id) => (
          <span key={id} className="heart" style={{ left: '50%', bottom: '38dvh', ['--dx' as string]: `${(id % 5) * 18 - 36}px` }}>
            <PixelHeart px={5} />
          </span>
        ))}

        <svg className="home-cloud" viewBox="0 0 1200 90" preserveAspectRatio="none" aria-hidden="true">
          <path
            d="M0 90V50Q20 22 70 36Q110 6 170 32Q230 4 290 38Q350 14 410 40Q470 8 540 36Q600 10 660 40Q730 6 790 36Q850 12 910 38Q980 8 1040 36Q1100 18 1150 40Q1190 34 1200 52V90Z"
            style={{ fill: 'var(--cloud)' }}
            stroke="#0d0b1a"
            strokeWidth="5"
          />
        </svg>
      </section>
      <main className="page !pt-0 !min-h-0" style={{ paddingBottom: '7.5rem' }}>
        <Footer />
      </main>
    </>
  );
}
