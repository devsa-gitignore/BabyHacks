'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudio } from '@/audio';
import { Footer } from '@/components/Footer';
import { Odometer } from '@/components/Odometer';
import { SnowBg } from '@/components/fx/SnowBg';
import { CribObjects } from '@/views/CribObjects';
import { Void3D } from '@/components/void/Void3D';
import type { VoidState } from '@/components/void/VoidHero';
import { PixelHeart, PixelStar } from '@/components/void/Pixel';
import { useIris } from '@/iris/IrisProvider';
import { countWishes } from '@/lib/supabase';
import { getPending } from '@/lib/wishes';
import { HomeButterfly } from './home/HomeButterfly';
import { BedtimeLog } from './home/BedtimeLog';

const HINTS = [
  'psst, tap the jar',
  'hold her. she purrs.',
  'drag her around, gently',
  'watch the stars sparkle',
];

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

        {/* Playful Pixel Butterfly */}
        <HomeButterfly />

        {/* Nursery Status Notes (Left) */}
        <div className="absolute bottom-[22dvh] left-[4vw] z-[6] flex flex-col items-start gap-2">
          <p className="font-note m-0 -rotate-3 text-[1.8rem] md:text-[2.4rem]">
            <span className="paper px-3 py-1">welcome in</span>
          </p>
          <p className="font-note m-0 rotate-1 text-[1.35rem] md:text-[1.55rem]">
            <span className="paper px-2.5 py-0.5 opacity-90">status: {state}</span>
          </p>
        </div>

        {/* Wish Counter & Quick Whisper Action (Right) */}
        {count !== null && (
          <div className="absolute right-4 top-[calc(48%+1.5rem)] z-[6] hidden flex-col items-end gap-2 md:flex">
            <p
              className="paper font-note m-0 rotate-2 px-3 py-1 text-[1.6rem]"
              aria-label={`${count} wishes caught`}
            >
              <Odometer value={count} /> wishes caught
            </p>
            <button
              type="button"
              onClick={() => {
                play('tap');
                go('/wishes');
              }}
              className="paper font-note m-0 flex items-center gap-2 -rotate-1 px-3 py-1 text-[1.45rem] transition-transform active:scale-95"
            >
              <PixelStar px={2} />
              <span>whisper to the glass &rarr;</span>
            </button>
          </div>
        )}

        {hint >= 0 && (
          <p
            className="hint-note paper font-note text-[1.8rem]"
            style={{ right: '6vw', bottom: '40dvh' }}
            role="status"
          >
            <span className="tape" aria-hidden="true" />
            {HINTS[hint]}
          </p>
        )}

        {/* Back Cloud Cushion (Behind Void - extends across entire screen) */}
        <svg
          className="home-cloud-back"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M 0 320 L 0 150 C 70 85 170 75 270 115 C 380 55 520 35 660 75 C 750 25 890 25 980 75 C 1120 35 1260 55 1360 115 C 1400 90 1425 100 1440 135 L 1440 320 Z"
            style={{
              fill: 'var(--cloud)',
              stroke: 'var(--cloud-stroke, #0d0b1a)',
              transition: 'fill 350ms ease, stroke 350ms ease',
            }}
            strokeWidth="5"
          />
        </svg>

        <Void3D className="void3d" state={state} onPoke={onPoke} onHold={onHold} squishRef={squish} />
        {hearts.map((id) => (
          <span
            key={id}
            className="heart"
            style={{ left: '50%', bottom: '38dvh', ['--dx' as string]: `${(id % 5) * 18 - 36}px` }}
          >
            <PixelHeart px={5} />
          </span>
        ))}

        {/* Front Cloud Layer (Cradles Void - extends across entire screen) */}
        <svg
          className="home-cloud"
          viewBox="0 0 1440 240"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M 0 240 L 0 105 C 90 55 200 55 300 95 C 400 45 530 35 640 80 C 720 30 840 30 920 80 C 1030 35 1160 45 1260 95 C 1340 65 1400 75 1440 115 L 1440 240 Z"
            style={{
              fill: 'var(--cloud)',
              stroke: 'var(--cloud-stroke, #0d0b1a)',
              transition: 'fill 350ms ease, stroke 350ms ease',
            }}
            strokeWidth="5"
          />
          {/* Hand-drawn ink contour accents */}
          <path
            d="M 180 110 C 220 90 270 95 310 115 M 520 90 C 570 73 630 75 670 100 M 810 90 C 850 73 910 75 950 100 M 1150 110 C 1190 90 1240 95 1280 115"
            stroke="var(--cloud-stroke, #0d0b1a)"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.5"
          />
        </svg>
      </section>

      {/* Bedside Log & Community Whispers */}
      <div className="relative z-[6]">
        <BedtimeLog />
      </div>

      <main className="page !min-h-0 !pt-2 relative z-[6]" style={{ paddingBottom: '7.5rem' }}>
        <Footer />
      </main>
    </>
  );
}
