'use client';

import dynamic from 'next/dynamic';
import { motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAudio } from '@/audio';
import { IconSlot } from '@/components/IconSlot';
import { Odometer } from '@/components/Odometer';
import { SnowBg } from '@/components/fx/SnowBg';
import { PixelStar } from '@/components/void/Pixel';
import { VoidHero, type VoidHandle } from '@/components/void/VoidHero';
import { WISH_COLORS, WISH_COOLDOWN_MS, WISH_ICONS, WISH_MAX, WISH_PAGE_SIZE } from '@/config';
import { useDevice, useReducedMotion } from '@/hooks/useDevice';
import { noteDataUrl } from '@/lib/noteImage';
import { isProfane } from '@/lib/profanity';
import { countWishes, fetchWishes, hasBackend, insertWish, subscribeWishes } from '@/lib/supabase';
import {
  getDeviceId,
  getLastWish,
  getPending,
  setLastWish,
  setPending,
  tiltFor,
  timeAgo,
  type NewWish,
  type Wish,
  type WishColor,
  type WishIcon,
} from '@/lib/wishes';

// React Bits Paper Crumple, unmodified. Dynamic import: it pulls in three.js and is only needed while sending.
const PaperCrumple = dynamic(() => import('@/components/react-bits/PaperCrumple'), { ssr: false });

type Phase = 'write' | 'crumple' | 'sending' | 'thrown';
type Card = Wish & { local?: boolean };

function WishCard({ w, fresh, drag }: { w: Card; fresh: boolean; drag: boolean }) {
  const tilt = useMemo(() => tiltFor(w.id), [w.id]);
  return (
    <motion.article
      className="wish-card"
      style={{ ['--c' as string]: `var(--sticker-${w.color})`, rotate: tilt }}
      initial={fresh ? { scale: 0.2, opacity: 0, y: -40 } : false}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 18 }}
      drag={drag}
      dragSnapToOrigin
      dragElastic={0.5}
      dragMomentum={false}
      whileDrag={{ scale: 1.06, zIndex: 5 }}
    >
      <span className="tape" style={{ width: 56, height: 20, top: -11 }} aria-hidden="true" />
      <p className="text m-0">{w.text}</p>
      <div className="meta">
        <IconSlot name={`icon-${w.icon}`} size={30} />
        <span>{w.local ? 'saved on this device' : timeAgo(w.created_at)}</span>
      </div>
    </motion.article>
  );
}

export function WishesView() {
  const { play } = useAudio();
  const device = useDevice();
  const reduce = useReducedMotion();
  const voidRef = useRef<VoidHandle>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const jarRef = useRef<HTMLDivElement>(null);

  const [text, setText] = useState('');
  const [color, setColor] = useState<WishColor>('yellow');
  const [icon, setIcon] = useState<WishIcon>('star');
  const [phase, setPhase] = useState<Phase>('write');
  const [noteSrc, setNoteSrc] = useState('');
  const [resetKey, setResetKey] = useState(0);
  const [msg, setMsg] = useState('');
  const [wishes, setWishes] = useState<Card[]>([]);
  const [freshIds, setFreshIds] = useState<string[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bursts, setBursts] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const myId = useRef('');

  const merge = useCallback((list: Card[]) => {
    setWishes((cur) => {
      const map = new Map<string, Card>();
      [...cur, ...list].forEach((w) => map.set(w.id, w));
      return [...map.values()].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    });
  }, []);

  /* ---------- load, live updates, flush offline wishes ---------- */
  useEffect(() => {
    myId.current = getDeviceId();
    let on = true;
    const pending = getPending().map((p) => ({ ...p, local: true }));
    merge(pending);
    (async () => {
      try {
        const [rows, c] = await Promise.all([fetchWishes(0), countWishes()]);
        if (!on) return;
        merge(rows);
        setMore(rows.length >= WISH_PAGE_SIZE);
        setTotal((c ?? 0) + pending.length);
      } catch {
        if (on) setTotal(pending.length);
      } finally {
        if (on) setLoading(false);
      }
    })();
    const off = subscribeWishes((w) => {
      if (w.device_id === myId.current) return;
      merge([w]);
      setFreshIds((f) => [...f, w.id]);
      setTotal((t) => (t ?? 0) + 1);
    });
    // flush wishes saved while offline, one every 11s (the database allows one per 10s per device)
    let flushing = true;
    (async () => {
      if (!hasBackend) return;
      for (const p of getPending()) {
        if (!flushing) return;
        const r = await insertWish({ text: p.text, color: p.color, icon: p.icon, device_id: p.device_id });
        if (r.ok) {
          setPending(getPending().filter((x) => x.id !== p.id));
          setWishes((cur) => cur.filter((x) => x.id !== p.id));
          merge([r.wish]);
          await new Promise((res) => setTimeout(res, 11_000));
        } else break;
      }
    })();
    return () => {
      on = false;
      flushing = false;
      off();
    };
  }, [merge]);

  const loadMore = async () => {
    try {
      const rows = await fetchWishes(page + 1);
      merge(rows);
      setPage((p) => p + 1);
      setMore(rows.length >= WISH_PAGE_SIZE);
    } catch {
      setMsg("couldn't load more. try again in a sec.");
    }
  };

  /* ---------- compose + send ---------- */
  const startSend = async () => {
    const t = text.trim();
    if (!t) return setMsg('write a tiny wish first.');
    if (isProfane(t)) return setMsg("Void only catches kind wishes. try rewording?");
    const wait = WISH_COOLDOWN_MS - (Date.now() - getLastWish());
    if (wait > 0) return setMsg(`slow down, Void needs ${Math.ceil(wait / 1000)}s.`);
    setMsg('');
    setNoteSrc(await noteDataUrl(t, color, icon));
    setPhase('crumple');
    play('tap');
  };

  const bringBack = (why: string) => {
    setMsg(why);
    setResetKey((k) => k + 1);
    setPhase('crumple');
  };

  const launch = useCallback(async () => {
    if (phase === 'sending' || phase === 'thrown') return;
    setPhase('sending');
    const t = text.trim();
    const wish: NewWish = { text: t, color, icon, device_id: myId.current || getDeviceId() };
    let result: Card | null = null;
    if (hasBackend) {
      const r = await Promise.race([insertWish(wish), new Promise<null>((res) => setTimeout(() => res(null), 4000))]);
      if (r && r.ok) result = r.wish;
      else if (r && !r.ok && r.rateLimited) return bringBack('slow down, Void needs a minute.');
    }
    if (!result) {
      // offline or no backend: keep it on this device and sync later
      const local: Card = {
        ...wish,
        id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now()),
        created_at: new Date().toISOString(),
        local: true,
      };
      setPending([...getPending(), local]);
      result = local;
    }
    setLastWish();

    // throw the crumpled paper to the jar counter (600ms arc), then burst
    const stage = stageRef.current;
    const jar = jarRef.current?.getBoundingClientRect();
    const sr = stage?.getBoundingClientRect();
    play('whoosh');
    if (stage && jar && sr && !reduce) {
      const dx = jar.left + jar.width / 2 - (sr.left + sr.width / 2);
      const dy = jar.top + jar.height / 2 - (sr.top + sr.height / 2);
      const a = stage.animate(
        [
          { transform: 'translate(0,0) rotate(0) scale(1)', opacity: 1, offset: 0 },
          { transform: 'translate(0,6px) rotate(0) scale(1.04,0.92)', opacity: 1, offset: 0.17 },
          { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 150}px) rotate(270deg) scale(.7)`, opacity: 1, offset: 0.6 },
          { transform: `translate(${dx}px, ${dy}px) rotate(540deg) scale(.15)`, opacity: 0.2, offset: 1 },
        ],
        { duration: 720, easing: 'ease-in-out', fill: 'forwards' },
      );
      await a.finished.catch(() => {});
    }
    setPhase('thrown');
    const bx = jar ? jar.left + jar.width / 2 : window.innerWidth / 2;
    const by = jar ? jar.top + jar.height / 2 : 120;
    const id = Date.now();
    setBursts((b) => [...b, { id, x: bx, y: by }]);
    window.setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 900);
    play('pop');
    window.setTimeout(() => play('wish'), 40);
    setTotal((n) => (n ?? 0) + 1);
    merge([result]);
    setFreshIds((f) => [...f, result!.id]);
    window.setTimeout(() => {
      voidRef.current?.dilate(true, 700);
      voidRef.current?.hop();
      play('mrrp');
    }, 650);
    window.setTimeout(() => {
      if (stage) stage.getAnimations().forEach((x) => x.cancel());
      setText('');
      setNoteSrc('');
      setResetKey((k) => k + 1);
      setPhase('write');
    }, 1500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, text, color, icon, play, reduce]);

  const onCrumpleState = useCallback(
    (s: string) => {
      if (s === 'holding') play('crumple');
      if (s === 'crumpled' || s === 'creased') void launch();
    },
    [launch, play],
  );

  const writing = phase === 'write';
  const charsLeft = WISH_MAX - text.length;

  return (
    <>
      <SnowBg />
      <main className="page">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <h1 className="h-display m-0 text-[clamp(3.4rem,10vw,5.5rem)] text-[var(--paper)] [text-shadow:4px_4px_0_var(--ink)]">Wishes</h1>
          <div ref={jarRef} className="paper flex items-center gap-3 px-4 py-2 text-[1.7rem]" aria-label={`${total ?? 0} wishes caught`}>
            <IconSlot name="nav-wishes" size={34} />
            {total === null ? <span>…</span> : <Odometer value={total} />}
            <span>caught</span>
          </div>
        </header>

        <section className="paper relative mb-12 grid gap-6 px-5 pb-6 pt-8 md:grid-cols-[1.1fr_1fr] md:px-8" aria-label="Make a wish">
          <span className="tape" aria-hidden="true" />
          <div>
            <label htmlFor="wish" className="font-note block text-[1.9rem]">
              whisper it to Void
            </label>
            <div className="rounded border-[3px] border-dashed border-[var(--ink)] bg-white/40 p-3">
              <textarea
                id="wish"
                className="note-input"
                value={text}
                maxLength={WISH_MAX}
                disabled={!writing}
                placeholder="i wish..."
                onChange={(e) => {
                  setText(e.target.value.slice(0, WISH_MAX));
                  setMsg('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void startSend();
                  }
                }}
              />
              <div className="text-right text-base opacity-70" aria-live="polite">
                {charsLeft} left
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3" role="radiogroup" aria-label="Paper color">
              {WISH_COLORS.map((c, i) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={color === c}
                  aria-label={c}
                  className="swatch"
                  style={{ ['--c' as string]: `var(--sticker-${c})` }}
                  disabled={!writing}
                  onClick={() => {
                    setColor(c);
                    play('tap');
                    void i;
                  }}
                />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-3" role="radiogroup" aria-label="Icon">
              {WISH_ICONS.map((ic) => (
                <button key={ic} type="button" role="radio" aria-checked={icon === ic} aria-label={ic} className="pick" disabled={!writing} onClick={() => setIcon(ic)}>
                  <IconSlot name={`icon-${ic}`} size={34} />
                </button>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button type="button" className="px-btn butter" disabled={!writing} onClick={() => void startSend()} style={{ fontSize: '1.8rem', minHeight: 64 }}>
                <span>Send it up</span>
                <PixelStar px={3} color="#0d0b1a" />
              </button>
              {msg && (
                <p className="font-note m-0 text-[1.7rem] text-[var(--ink)]" role="status">
                  {msg}
                </p>
              )}
            </div>
          </div>

          {/* stage: the paper note, then Paper Crumple while sending */}
          <div className="relative flex min-h-[320px] flex-col items-center justify-center">
            <div ref={stageRef} className="stage w-full max-w-[340px]" style={{ willChange: 'transform' }}>
              {phase === 'write' || !noteSrc ? (
                <div
                  className="mx-auto grid h-[300px] w-[300px] place-items-center rounded border-[3px] border-[var(--ink)] p-5 text-center font-note text-[2.1rem] [box-shadow:4px_5px_0_var(--ink)]"
                  style={{ background: `var(--sticker-${color})`, transform: 'rotate(-2deg)' }}
                  aria-hidden="true"
                >
                  <span className="break-words">{text || 'your wish shows up here'}</span>
                </div>
              ) : (
                <PaperCrumple
                  src={noteSrc}
                  alt="Your wish on a paper note"
                  width={300}
                  height={300}
                  sceneHeight={340}
                  releaseBehavior="stay"
                  draggable={false}
                  paperColor="#fff8ec"
                  resetKey={resetKey}
                  disabled={phase !== 'crumple'}
                  onStateChange={onCrumpleState}
                />
              )}
            </div>
            {phase === 'crumple' && (
              <div className="mt-2 text-center">
                <p className="font-note m-0 text-[1.9rem]">hold the paper to scrunch it!</p>
                <button type="button" className="px-btn sm paper mt-2" onClick={() => void launch()}>
                  <span>or just send it</span>
                </button>
              </div>
            )}
            <div className="pointer-events-none absolute -bottom-8 -right-6 hidden w-[150px] md:block">
              <VoidHero ref={voidRef} state="awake" cloud className="block w-full" />
            </div>
          </div>
        </section>

        <section aria-label="Wall of wishes">
          <h2 className="h-display m-0 mb-5 text-[2.6rem] text-[var(--paper)] [text-shadow:3px_3px_0_var(--ink)]">the wall</h2>
          {loading && wishes.length === 0 ? (
            <p className="font-note text-[2rem]">looking at the sky…</p>
          ) : wishes.length === 0 ? (
            <p className="paper font-note inline-block px-4 py-2 text-[2rem]">no wishes yet. be the first star.</p>
          ) : (
            <div className="wall">
              {wishes.map((w) => (
                <WishCard key={w.id} w={w} fresh={freshIds.includes(w.id)} drag={device === 'laptop'} />
              ))}
            </div>
          )}
          {more && (
            <div className="mt-6 text-center">
              <button type="button" className="px-btn paper" onClick={() => void loadMore()}>
                <span>load more wishes</span>
              </button>
            </div>
          )}
          {!hasBackend && (
            <p className="font-note mt-6 text-[1.5rem] opacity-80">(wishes are saved on this device until the wall is connected)</p>
          )}
        </section>

        {bursts.map((b) => (
          <span key={b.id} className="pointer-events-none fixed z-[80]" style={{ left: b.x, top: b.y }} aria-hidden="true">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <motion.span
                key={i}
                className="absolute"
                initial={{ x: 0, y: 0, scale: 0.4, opacity: 1 }}
                animate={{ x: Math.cos((i / 6) * Math.PI * 2) * 70, y: Math.sin((i / 6) * Math.PI * 2) * 70, scale: 1.2, opacity: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                <PixelStar px={4} color={i % 2 ? '#ff6f91' : '#ffe27a'} />
              </motion.span>
            ))}
          </span>
        ))}
        <FooterSlot />
      </main>
    </>
  );
}

import { Footer } from '@/components/Footer';
function FooterSlot() {
  return <Footer />;
}
