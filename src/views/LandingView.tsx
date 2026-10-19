'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudio } from '@/audio';
import { CloudSky } from '@/components/fx/CloudSky';
import { Wordmark } from '@/components/fx/Wordmark';
import { PixelButterfly, PixelHeart } from '@/components/void/Pixel';
import { VoidHero, type VoidHandle, type VoidState } from '@/components/void/VoidHero';
import { CAT_NAME, TAGLINE } from '@/config';
import { useReducedMotion } from '@/hooks/useDevice';
import { useIris } from '@/iris/IrisProvider';

type Heart = { id: number; dx: number };
const sleepMs = 20_000;

export function LandingView() {
  const { play, purr } = useAudio();
  const { go } = useIris();
  const reduce = useReducedMotion();
  const cat = useRef<VoidHandle>(null);
  const root = useRef<HTMLDivElement>(null);
  const catBox = useRef<HTMLDivElement>(null);

  const [curtain, setCurtain] = useState(true);
  const [showCat, setShowCat] = useState(false);
  const [tagLen, setTagLen] = useState(0);
  const [showCta, setShowCta] = useState(false);
  const [hint, setHint] = useState(false);
  const [state, setState] = useState<VoidState>('asleep');
  const [note, setNote] = useState<string | null>(null);
  const [hearts, setHearts] = useState<Heart[]>([]);
  const [zzz, setZzz] = useState([true, true, true]);
  const [fly, setFly] = useState(false);

  const awake = useRef(false);
  const lastInput = useRef(0);
  const skipped = useRef(false);
  const timers = useRef<number[]>([]);
  const heartId = useRef(0);
  const holdTick = useRef(0);
  const stateRef = useRef<VoidState>('asleep');
  stateRef.current = state;
  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  };

  const addHearts = useCallback((n: number) => {
    const fresh = Array.from({ length: n }, () => ({ id: ++heartId.current, dx: Math.round((Math.random() - 0.5) * 120) }));
    setHearts((h) => [...h, ...fresh]);
    window.setTimeout(() => setHearts((h) => h.filter((x) => !fresh.some((f) => f.id === x.id))), 1200);
  }, []);

  /* ---------- entrance timeline ---------- */
  const finishEntrance = useCallback(() => {
    setCurtain(false);
    setShowCat(true);
    setTagLen(TAGLINE.length);
    setShowCta(true);
    setHint(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const start = () => {
      if (cancelled) return;
      lastInput.current = performance.now();
      if (reduce) {
        finishEntrance();
        awake.current = true;
        setState('awake');
        return;
      }
      setCurtain(false); // 0: ink curtain fades out (600ms)
      later(() => setShowCat(true), 200); // 200: cloud + Void rise (700ms)
      later(() => {
        // 1300: tagline types at 38ms per character
        let i = 0;
        const iv = window.setInterval(() => {
          i += 1;
          setTagLen(i);
          if (i >= TAGLINE.length) window.clearInterval(iv);
        }, 38);
        timers.current.push(iv);
      }, 1300);
      later(() => setShowCta(true), 2800); // 2800: "Come in" drops in
      later(() => setHint(true), 3200); // 3200: hint + arrow
      later(() => wake(), 6000); // auto-wake if nobody moves
    };
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    const ready = fonts ? Promise.race([fonts.ready, new Promise((r) => setTimeout(r, 1200))]) : Promise.resolve();
    void ready.then(start);
    return () => {
      cancelled = true;
      timers.current.forEach((t) => {
        window.clearTimeout(t);
        window.clearInterval(t);
      });
      purr(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- wake sequence ---------- */
  const wake = useCallback(() => {
    if (awake.current) return;
    awake.current = true;
    lastInput.current = performance.now();
    setZzz([false, false, false]);
    setState('awake'); // 0-300: eyelids open, right eye 120ms later (CSS)
    later(() => cat.current?.squish(), 200); // 200-700 stretch
    later(() => cat.current?.yawn(), 700); // 700-1100 yawn
    later(() => play('mrrp'), 900);
    later(() => cat.current?.dilate(true, 500), 1100); // 1100 ears perk, eyes start tracking
    later(() => setNote('oh. hi.'), 1200); // 1200 note, shows 1800ms
    later(() => setNote(null), 3000);
    later(() => setFly(true), 9000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [play]);

  /* ---------- global input: wake, skip entrance, shy duck, idle sleep ---------- */
  useEffect(() => {
    let last = { x: 0, y: 0, t: 0 };
    let travelled = 0;
    let lastDuck = 0;
    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      lastInput.current = now;
      if (!awake.current) {
        travelled += Math.hypot(e.clientX - last.x, e.clientY - last.y);
        if (last.t && travelled > 24) wake();
      } else if (stateRef.current === 'asleep') {
        // she fell asleep again: any movement wakes her
        awake.current = false;
        wake();
      }
      // shy: a fast rush toward her makes her duck
      if (last.t && awake.current && stateRef.current === 'awake' && now - lastDuck > 6000) {
        const dt = Math.max(1, now - last.t);
        const speed = Math.hypot(e.clientX - last.x, e.clientY - last.y) / dt; // px per ms
        const r = cat.current?.el?.getBoundingClientRect();
        if (r && speed > 1.8) {
          const dist = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height * 0.6));
          if (dist < r.width * 0.45) {
            lastDuck = now;
            cat.current?.dilate(true, 600);
            void cat.current?.duck();
          }
        }
      }
      last = { x: e.clientX, y: e.clientY, t: now };
    };
    const onDown = () => {
      lastInput.current = performance.now();
      if (!skipped.current && !showCtaRef.current) {
        skipped.current = true;
        timers.current.forEach((t) => {
          window.clearTimeout(t);
          window.clearInterval(t);
        });
        finishEntrance();
        later(() => wake(), 100);
      } else {
        wake();
      }
    };
    const onKey = () => {
      lastInput.current = performance.now();
      wake();
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('keydown', onKey);
    const sleepCheck = window.setInterval(() => {
      if (awake.current && stateRef.current === 'awake' && performance.now() - lastInput.current > sleepMs) {
        setState('asleep');
        setZzz([true, true, true]);
        awake.current = false;
      }
    }, 2000);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
      window.clearInterval(sleepCheck);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wake, finishEntrance]);
  const showCtaRef = useRef(false);
  showCtaRef.current = showCta;

  /* ---------- butterfly: flutters past every 9-14s, startles her, tap to shoo ---------- */
  const bfRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!fly || reduce) return;
    const el = bfRef.current;
    if (!el) return;
    let raf = 0;
    let t0 = 0;
    let startled = false;
    let alive = true;
    const dur = 7000;
    const baseY = window.innerHeight * (0.3 + Math.random() * 0.12);
    const tick = (now: number) => {
      if (!alive) return;
      if (!t0) t0 = now;
      const p = (now - t0) / dur;
      const vw = window.innerWidth;
      const x = -70 + p * (vw + 140);
      const y = baseY + Math.sin(p * 11) * 38 + Math.sin(p * 27) * 8;
      el.style.transform = `translate(${x}px, ${y}px)`;
      const r = cat.current?.el?.getBoundingClientRect();
      if (r) {
        const cx = r.left + r.width / 2;
        if (stateRef.current === 'awake' && now - lastInput.current > 900) cat.current?.lookAt(x + 30, y + 24);
        if (!startled && Math.abs(x - cx) < 140 && stateRef.current === 'awake') {
          startled = true;
          cat.current?.hop();
          cat.current?.dilate(true, 800);
        }
      }
      if (p >= 1) {
        setFly(false);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      later(() => {
        if (document.hidden || stateRef.current !== 'awake') return;
        setFly(true);
      }, 9000 + Math.random() * 5000);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fly, reduce]);

  /* ---------- gestures on Void ---------- */
  const onPoke = () => {
    wake();
    if (stateRef.current === 'asleep') return;
    cat.current?.squish();
    cat.current?.dilate(true, 500);
    play('mrrp');
    addHearts(3);
    setHint(false);
  };
  const onHold = (on: boolean) => {
    wake();
    window.clearInterval(holdTick.current);
    if (on) {
      setState('purr');
      purr(true);
      addHearts(2);
      holdTick.current = window.setInterval(() => addHearts(1), 420);
      setHint(false);
    } else {
      setState('awake');
      purr(false);
      play('mrrp');
    }
  };

  const enter = () => {
    cat.current?.dilate(true, 0);
    const el = root.current;
    if (el) cat.current?.lookAt(window.innerWidth / 2, window.innerHeight * 0.9);
    go('/home');
  };

  const catAsleepOrAwake: VoidState = state;

  return (
    <div ref={root} className="landing">
      <CloudSky speed={0.8} count={5} />

      <Wordmark text={CAT_NAME} className="landing-word" />

      <p className="landing-tag font-note" aria-live="off">
        <span>{TAGLINE.slice(0, tagLen) || ' '}</span>
      </p>

      <div
        ref={catBox}
        className="landing-cat"
        style={{
          translate: showCat ? '0 0' : '0 35%',
          opacity: showCat ? 1 : 0,
          transition: reduce ? 'none' : 'translate 700ms cubic-bezier(.3,1.35,.5,1), opacity 500ms ease',
        }}
      >
        <VoidHero ref={cat} state={catAsleepOrAwake} onPoke={onPoke} onHold={onHold} className="block w-full cursor-pointer" />

        {/* Zzz: tap one to pop it */}
        {state === 'asleep' &&
          zzz.map(
            (on, i) =>
              on && (
                <button
                  key={i}
                  type="button"
                  data-sfx="off"
                  aria-label="Zzz"
                  className="zzz"
                  style={{ left: `${60 + i * 6}%`, top: `${26 - i * 5}%`, animationDelay: `${i * 0.8}s`, background: 'none', border: 0 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    play('pop');
                    setZzz((z) => z.map((v, j) => (j === i ? false : v)));
                    later(() => setZzz((z) => z.map((v, j) => (j === i ? true : v))), 2400);
                  }}
                >
                  Z
                </button>
              ),
          )}

        {hearts.map((h) => (
          <span key={h.id} className="heart" style={{ left: '48%', top: '38%', ['--dx' as string]: `${h.dx}px` }}>
            <PixelHeart px={5} />
          </span>
        ))}

        {note && (
          <p className="font-note paper absolute left-[8%] top-[6%] z-10 -rotate-3 px-3 text-[2rem]" role="status">
            {note}
          </p>
        )}
      </div>

      {fly && (
        <button
          ref={bfRef}
          type="button"
          aria-label="A butterfly. Tap to shoo it"
          data-sfx="off"
          className="fixed left-0 top-0 z-[7] border-0 bg-transparent p-2"
          style={{ willChange: 'transform' }}
          onClick={() => {
            play('pop');
            setFly(false);
          }}
        >
          <PixelButterfly px={6} />
        </button>
      )}

      {hint && state !== 'purr' && (
        <p className="font-note absolute right-[6vw] top-[44dvh] z-[6] hidden -rotate-6 text-[1.9rem] md:block" aria-hidden="true">
          psst, poke her
          <svg className="note-arrow absolute -left-14 top-6" width="60" height="50" viewBox="0 0 60 50">
            <path d="M58 4C30 2 12 14 8 40M8 40L2 28M8 40L20 34" />
          </svg>
        </p>
      )}

      <button
        type="button"
        className="px-btn landing-cta"
        onClick={enter}
        style={{
          opacity: showCta ? 1 : 0,
          pointerEvents: showCta ? 'auto' : 'none',
          translate: showCta ? '0 0' : '0 -140px',
          rotate: showCta ? '0deg' : '-8deg',
          transition: reduce ? 'none' : 'translate 420ms cubic-bezier(.3,1.7,.5,1), rotate 420ms cubic-bezier(.3,1.7,.5,1), opacity 200ms',
          fontSize: '2rem',
          minHeight: 68,
          padding: '0 2.4rem',
        }}
      >
        <span className="landing-cta-title" style={{ animation: showCta && !reduce ? 'wiggle-cta 5s 1s infinite' : undefined }}>Meet Void</span>
        <span className="landing-cta-hint">explore her world · leave a wish</span>
      </button>

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[90]"
        style={{ background: '#0d0b1a', opacity: curtain ? 1 : 0, transition: 'opacity 600ms ease-out' }}
      />
    </div>
  );
}
