'use client';

// The "eyes open" page transition, ~1.8s:
//   swell  (0.45s) black circle grows out of the cat until it fills the screen
//   dark   (>=0.75s) black screen with two glowing cat eyes; router.push happens here
//   open   (0.8s)  two circles grow from the eyes and reveal the next page
// Reduced motion: a quick 200ms fade instead.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { useAudio } from '@/audio';
import { NAV_ITEMS } from '@/config';

type Eye = { x: number; y: number; r: number };
type Phase = 'idle' | 'swell' | 'dark' | 'open' | 'fade-in' | 'fade-out';
type IrisApi = { go: (href: string) => void };

const IrisContext = createContext<IrisApi>({ go: () => {} });
export const useIris = () => useContext(IrisContext);

const INK = '#171226';
const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

export function IrisProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { play } = useAudio();
  const [phase, setPhase] = useState<Phase>('idle');
  const [geo, setGeo] = useState<{ ox: number; oy: number; eyes: Eye[]; diag: number }>({
    ox: 0,
    oy: 0,
    eyes: [],
    diag: 2000,
  });
  const busy = useRef(false);
  const waiters = useRef<Array<{ path: string; res: () => void }>>([]);

  // Load every page in the background up front. Without this the first visit to a page could take longer
  // than the transition, the eyes reopened on the OLD page, and it looked like the click did nothing.
  useEffect(() => {
    const id = window.setTimeout(() => {
      ['/home', ...NAV_ITEMS.map((n) => n.href)].forEach((h) => {
        try {
          router.prefetch(h);
        } catch {}
      });
    }, 300);
    return () => window.clearTimeout(id);
  }, [router]);

  useEffect(() => {
    waiters.current = waiters.current.filter((w) => {
      if (w.path === pathname) {
        w.res();
        return false;
      }
      return true;
    });
  }, [pathname]);

  const waitFor = useCallback(
    (path: string, ms: number) =>
      new Promise<void>((res) => {
        if (window.location.pathname === path) return res();
        const t = window.setTimeout(res, ms);
        waiters.current.push({
          path,
          res: () => {
            window.clearTimeout(t);
            res();
          },
        });
      }),
    [],
  );

  const go = useCallback(
    async (href: string) => {
      if (busy.current) return;
      busy.current = true;
      try {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce) {
          setPhase('fade-in');
          await sleep(220);
          router.push(href);
          await waitFor(href, 12000);
          setPhase('fade-out');
          await sleep(260);
          setPhase('idle');
          return;
        }

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const root = document.querySelector('[data-cat-root]');
        const rr = root?.getBoundingClientRect();
        const eyes: Eye[] = Array.from(document.querySelectorAll('[data-cat-eye]'))
          .slice(0, 2)
          .map((el) => {
            const r = el.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: (r.width / 2) * 0.96 };
          });
        const safeEyes: Eye[] =
          eyes.length === 2
            ? eyes
            : [
                { x: vw / 2 - 70, y: vh / 2, r: 44 },
                { x: vw / 2 + 70, y: vh / 2, r: 44 },
              ];
        setGeo({
          ox: rr ? rr.left + rr.width / 2 : vw / 2,
          oy: rr ? rr.top + rr.height * 0.55 : vh * 0.8,
          eyes: safeEyes,
          diag: Math.hypot(vw, vh) * 1.1,
        });

        play('whoosh');
        setPhase('swell');
        await sleep(460);
        setPhase('dark'); // screen is fully black now, safe to swap the route underneath
        router.push(href);
        // stay dark until the new page is really there (only reopen early if it takes absurdly long)
        await Promise.all([sleep(750), waitFor(href, 12000)]);
        play('chime');
        setPhase('open');
        await sleep(900);
        setPhase('idle');
      } finally {
        busy.current = false;
      }
    },
    [router, play, waitFor],
  );

  const api = useMemo(() => ({ go: (href: string) => void go(href) }), [go]);
  const { ox, oy, eyes, diag } = geo;

  return (
    <IrisContext.Provider value={api}>
      {children}
      {phase !== 'idle' && (
        <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
          {phase === 'fade-in' || phase === 'fade-out' ? (
            <motion.div
              initial={{ opacity: phase === 'fade-in' ? 0 : 1 }}
              animate={{ opacity: phase === 'fade-in' ? 1 : 0 }}
              transition={{ duration: 0.2 }}
              style={{ position: 'absolute', inset: 0, background: INK }}
            />
          ) : (
            <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
              <defs>
                <mask id="iris-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
                  <rect width="100%" height="100%" fill="#fff" />
                  {phase === 'open' &&
                    eyes.map((e, i) => (
                      <motion.circle
                        key={i}
                        cx={e.x}
                        cy={e.y}
                        fill="#000"
                        initial={{ r: e.r }}
                        animate={{ r: diag }}
                        transition={{ duration: 0.8, ease: [0.55, 0, 0.25, 1] }}
                      />
                    ))}
                </mask>
                <filter id="eye-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="9" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {phase === 'swell' && (
                <motion.circle
                  cx={ox}
                  cy={oy}
                  fill={INK}
                  initial={{ r: 0 }}
                  animate={{ r: diag }}
                  transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                />
              )}

              {(phase === 'dark' || phase === 'open') && (
                <rect width="100%" height="100%" fill={INK} mask={phase === 'open' ? 'url(#iris-mask)' : undefined} />
              )}

              {(phase === 'dark' || phase === 'open') &&
                eyes.map((e, i) => (
                  <motion.g
                    key={`eye-${i}`}
                    style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                    initial={{ opacity: 1, scaleY: 1 }}
                    animate={phase === 'dark' ? { scaleY: [1, 1, 0.08, 1] } : { opacity: 0 }}
                    transition={phase === 'dark' ? { duration: 0.7, times: [0, 0.35, 0.55, 1] } : { duration: 0.35 }}
                  >
                    <circle cx={e.x} cy={e.y} r={e.r} fill="#9bef2f" filter="url(#eye-glow)" />
                    <circle cx={e.x} cy={e.y} r={e.r * 0.69} fill={INK} />
                    <circle cx={e.x - e.r * 0.23} cy={e.y - e.r * 0.27} r={e.r * 0.17} fill="#fff" />
                    <circle cx={e.x + e.r * 0.25} cy={e.y + e.r * 0.23} r={e.r * 0.1} fill="#fff" />
                  </motion.g>
                ))}
            </svg>
          )}
        </div>
      )}
    </IrisContext.Provider>
  );
}
