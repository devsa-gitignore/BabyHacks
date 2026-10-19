'use client';

// Home hero, "The Peek": a giant Void peeks over a full-width ledge. His eyes follow you, and toys
// sit all around him: yarn, a feather on a string, the wish jar, fireflies, a window, two polaroids.
import Link from 'next/link';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useCallback, useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { useAudio } from '@/audio';
import { IconSlot } from '@/components/IconSlot';
import { Odometer } from '@/components/Odometer';
import { PixelHeart } from '@/components/void/Pixel';
import { VoidPeek, type PeekHandle, type PeekMood } from '@/components/void/VoidPeek';
import { CAT_NAME, TAGLINE } from '@/config';
import { useReducedMotion } from '@/hooks/useDevice';
import { countWishes } from '@/lib/supabase';
import { getPending } from '@/lib/wishes';
import { useTheme } from '@/theme/ThemeProvider';
import css from './home.module.css';

type Pt = { x: number; y: number };
const FIREFLIES = [
  { left: 12, top: 30 },
  { left: 26, top: 14 },
  { left: 70, top: 22 },
  { left: 86, top: 40 },
  { left: 40, top: 8 },
  { left: 60, top: 46 },
];
const FEATHER_LEN = 190;

export function PeekHero() {
  const { play, purr } = useAudio();
  const { theme, toggle } = useTheme();
  const reduce = useReducedMotion();
  const peek = useRef<PeekHandle>(null);
  const root = useRef<HTMLElement>(null);
  const headBox = useRef<HTMLDivElement>(null);
  const ledge = useRef<HTMLDivElement>(null);
  const jarRef = useRef<HTMLButtonElement>(null);
  const yarnRef = useRef<HTMLButtonElement>(null);

  // where Void looks: an override (a toy) wins over the pointer
  const target = useRef<Pt | null>(null);
  const pointer = useRef<Pt | null>(null);
  const override = useRef<Pt | null>(null);
  const sync = () => (target.current = override.current ?? pointer.current);

  const [mood, setMood] = useState<PeekMood>('awake');
  const [dilate, setDilate] = useState(1);
  const [ducked, setDucked] = useState(false);
  const [squish, setSquish] = useState(0);
  const [hearts, setHearts] = useState<number[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [sky, setSky] = useState<Array<{ id: number; from: Pt; to: Pt }>>([]);
  const [landed, setLanded] = useState<number | null>(null);
  const [away, setAway] = useState<number[]>([]);
  const [swipe, setSwipe] = useState(false);
  const [pat, setPat] = useState(false);
  const moodRef = useRef(mood);
  moodRef.current = mood;
  const ids = useRef(0);

  useEffect(() => {
    let on = true;
    countWishes()
      .then((c) => on && setCount((c ?? 0) + getPending().length))
      .catch(() => on && setCount(getPending().length));
    return () => {
      on = false;
    };
  }, []);

  const say = useCallback((t: string, ms = 3200) => {
    setNote(t);
    window.setTimeout(() => setNote((n) => (n === t ? null : n)), ms);
  }, []);

  const addHearts = useCallback((n: number) => {
    const fresh = Array.from({ length: n }, () => ++ids.current);
    setHearts((h) => [...h, ...fresh]);
    window.setTimeout(() => setHearts((h) => h.filter((x) => !fresh.includes(x))), 1200);
  }, []);

  /* ---------- pointer: look, rush = duck, stillness on his head = slow blink, leave = sleep ---------- */
  useEffect(() => {
    let last = { x: 0, y: 0, t: 0 };
    let lastDuck = 0;
    let lastBlink = 0;
    let still = 0;
    let sleepT = 0;
    let scrollT = 0;
    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      pointer.current = { x: e.clientX, y: e.clientY };
      sync();
      window.clearTimeout(sleepT);
      if (moodRef.current === 'asleep') setMood('awake');
      const r = headBox.current?.getBoundingClientRect();
      if (r && e.pointerType === 'mouse') {
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height * 0.6;
        const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
        if (last.t) {
          const speed = Math.hypot(e.clientX - last.x, e.clientY - last.y) / Math.max(1, now - last.t);
          if (speed > 2.4 && dist < r.width * 0.55 && now - lastDuck > 6000 && !reduce) {
            lastDuck = now;
            setDucked(true);
            window.setTimeout(() => setDucked(false), 1300);
          }
        }
        setDilate((d) => {
          const want = override.current ? d : dist < r.width * 0.45 ? 1.25 : 1;
          return Math.abs(want - d) > 0.01 ? want : d;
        });
        // hold still on his head for 2.5s: he slow-blinks back
        window.clearTimeout(still);
        const inside = e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom;
        if (inside && now - lastBlink > 20000) {
          still = window.setTimeout(() => {
            lastBlink = performance.now();
            peek.current?.slowBlink();
            say('he slow-blinked at you. that means he trusts you.', 4200);
          }, 2500);
        }
      }
      last = { x: e.clientX, y: e.clientY, t: now };
    };
    const onLeave = (e: MouseEvent) => {
      if (e.relatedTarget) return;
      window.clearTimeout(sleepT);
      sleepT = window.setTimeout(() => setMood((m) => (m === 'awake' ? 'asleep' : m)), 6000);
    };
    // scrolling: he glances down after you
    const onScroll = () => {
      override.current = { x: window.innerWidth / 2, y: window.innerHeight * 1.4 };
      sync();
      window.clearTimeout(scrollT);
      scrollT = window.setTimeout(() => {
        override.current = null;
        sync();
      }, 900);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onMove, { passive: true });
    document.addEventListener('mouseout', onLeave);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onMove);
      document.removeEventListener('mouseout', onLeave);
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(still);
      window.clearTimeout(sleepT);
      window.clearTimeout(scrollT);
    };
  }, [reduce, say]);

  /* ---------- his head: tap = mrrp + hearts, hold = purr ---------- */
  const holdT = useRef(0);
  const holding = useRef(false);
  const headDown = () => {
    window.clearTimeout(holdT.current);
    holdT.current = window.setTimeout(() => {
      holding.current = true;
      setMood('purr');
      purr(true);
      addHearts(3);
    }, 450);
  };
  const headUp = () => {
    window.clearTimeout(holdT.current);
    if (holding.current) {
      holding.current = false;
      setMood('awake');
      purr(false);
      return;
    }
    setSquish((s) => s + 1);
    play('mrrp');
    addHearts(3);
  };
  useEffect(() => () => purr(false), [purr]);

  /* ---------- yarn: flick it along the ledge; roll it under his nose and he bats it back ---------- */
  const yx = useMotionValue(0);
  const yRot = useTransform(yx, (v) => v * 1.5);
  const yarnLook = useRef(0);
  useEffect(
    () =>
      yx.on('change', () => {
        const r = yarnRef.current?.getBoundingClientRect();
        if (!r) return;
        override.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        sync();
        window.clearTimeout(yarnLook.current);
        yarnLook.current = window.setTimeout(() => {
          override.current = null;
          sync();
        }, 900);
      }),
    [yx],
  );
  const checkBat = () => {
    const r = yarnRef.current?.getBoundingClientRect();
    const nose = peek.current?.noseClient();
    if (!r || !nose || ducked) return;
    const dx = r.left + r.width / 2 - nose.x;
    if (Math.abs(dx) > 150) return;
    setSwipe(true);
    play('swat');
    window.setTimeout(() => {
      const lr = ledge.current?.getBoundingClientRect();
      const room = lr ? (dx < 0 ? -(r.left - lr.left - 20) : lr.right - r.right - 20) : 200;
      void animate(yx, yx.get() + Math.sign(room) * Math.min(Math.abs(room), 300), { type: 'spring', stiffness: 90, damping: 14 });
      window.setTimeout(() => play('thud'), 380);
    }, 160);
    window.setTimeout(() => setSwipe(false), 700);
  };
  const nudgeYarn = () => {
    play('boing');
    void animate(yx, yx.get() + 160, { type: 'spring', stiffness: 80, damping: 14 }).then(checkBat);
  };

  /* ---------- feather on a string ---------- */
  const fx = useMotionValue(0);
  const fy = useMotionValue(0);
  const stringRot = useTransform([fx, fy], ([a, b]: number[]) => `rotate(${(-Math.atan2(a, FEATHER_LEN + b) * 180) / Math.PI}deg)`);
  const stringLen = useTransform([fx, fy], ([a, b]: number[]) => Math.hypot(a, FEATHER_LEN + b));
  const featherRef = useRef<HTMLButtonElement>(null);
  const followFeather = () => {
    const r = featherRef.current?.getBoundingClientRect();
    if (!r) return;
    override.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    sync();
  };

  /* ---------- wish jar: each tap sends a star into the sky ---------- */
  const tapJar = () => {
    const sec = root.current?.getBoundingClientRect();
    const j = jarRef.current?.getBoundingClientRect();
    if (!sec || !j) return;
    play('wish');
    const from = { x: j.left + j.width / 2 - sec.left, y: j.top + j.height * 0.3 - sec.top };
    const to = { x: sec.width * (0.06 + Math.random() * 0.88), y: sec.height * (0.06 + Math.random() * 0.4) };
    setSky((s) => [...s.slice(-23), { id: ++ids.current, from, to }]);
  };

  /* ---------- fireflies: one lands on his nose, he goes cross-eyed ---------- */
  const catchFly = (i: number) => {
    if (landed !== null) return;
    const nose = peek.current?.noseClient();
    play('pop');
    setLanded(i);
    if (nose) {
      override.current = nose;
      sync();
    }
    setDilate(1.35);
    say('boop.', 1600);
    window.setTimeout(() => {
      override.current = null;
      sync();
      setDilate(1);
      setLanded(null);
      setAway((a) => [...a, i]);
      window.setTimeout(() => setAway((a) => a.filter((x) => x !== i)), 4000);
    }, 1700);
  };

  /* ---------- hidden paw: linger on the ledge's far corner ---------- */
  const patT = useRef(0);
  const cornerEnter = () => {
    window.clearTimeout(patT.current);
    patT.current = window.setTimeout(() => {
      setPat(true);
      play('tap');
      window.setTimeout(() => play('tap'), 260);
      window.setTimeout(() => setPat(false), 1700);
    }, 3000);
  };

  /* ---------- polaroids tilt toward the cursor ---------- */
  const tilt = (e: RPointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--rx', `${((e.clientY - r.top) / r.height - 0.5) * -14}deg`);
    e.currentTarget.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 14}deg`);
  };
  const untilt = (e: RPointerEvent<HTMLElement>) => {
    e.currentTarget.style.setProperty('--rx', '0deg');
    e.currentTarget.style.setProperty('--ry', '0deg');
  };

  const night = theme === 'night';

  return (
    <section ref={root} className={css.hero} aria-label={`Meet ${CAT_NAME}`}>
      {/* ---------- the wall ---------- */}
      <div className={css.wall} aria-hidden="true">
        <div className={css.stars} />
        <span className={`${css.cloud} ${css.c1}`} />
        <span className={`${css.cloud} ${css.c2}`} />
        <span className={`${css.cloud} ${css.c3}`} />
      </div>

      <button
        type="button"
        className={css.window}
        data-sfx="off"
        onClick={() => play(toggle() === 'night' ? 'toggleNight' : 'toggleDay')}
        aria-label={night ? 'The moon is out. Open the curtains to day' : 'The sun is out. Draw the curtains for night'}
      >
        <span className={css.windowGlass}>
          {night ? <IconSlot name="icon-moon" size={72} zoom={1.2} /> : <span className={css.sun} />}
        </span>
        <span className={css.curtainL} />
        <span className={css.curtainR} />
      </button>

      <Link href="/story" className={`${css.polaroid} ${css.polL}`} onPointerMove={tilt} onPointerLeave={untilt}>
        <span className={css.polTape} aria-hidden="true" />
        <span className={css.polPic}>
          <IconSlot name="nav-story" size={96} zoom={1.6} />
        </span>
        <span className={css.polCap}>his story</span>
      </Link>
      <Link href="/projects" className={`${css.polaroid} ${css.polR}`} onPointerMove={tilt} onPointerLeave={untilt}>
        <span className={css.polTape} aria-hidden="true" />
        <span className={css.polPic}>
          <IconSlot name="nav-projects" size={96} zoom={1.6} />
        </span>
        <span className={css.polCap}>his projects</span>
      </Link>

      {FIREFLIES.map((f, i) => (
        <button
          key={i}
          type="button"
          data-sfx="off"
          className={css.firefly}
          data-gone={landed === i || away.includes(i) ? '1' : undefined}
          style={{ left: `${f.left}%`, top: `${f.top}%`, animationDelay: `${-i * 1.7}s` }}
          onClick={() => catchFly(i)}
          aria-label="A firefly. Tap to let it land on Void's nose"
        >
          <span />
        </button>
      ))}

      {/* the feather toy, hanging from the top */}
      <div className={css.featherRig}>
        <motion.span className={css.string} style={{ height: stringLen, transform: stringRot }} aria-hidden="true" />
        <motion.button
          ref={featherRef}
          type="button"
          data-sfx="off"
          className={css.feather}
          style={{ x: fx, y: fy, top: FEATHER_LEN }}
          drag
          dragSnapToOrigin
          dragElastic={0.8}
          dragTransition={{ bounceStiffness: 140, bounceDamping: 7 }}
          onDragStart={() => {
            setDilate(1.45);
            play('flap');
          }}
          onDrag={followFeather}
          onDragEnd={() => {
            window.setTimeout(() => {
              override.current = null;
              sync();
              setDilate(1);
            }, 700);
          }}
          onKeyDown={(e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            e.preventDefault();
            play('flap');
            setDilate(1.45);
            void animate(fx, [0, 60, -50, 30, 0], { duration: 1.6 }).then(() => setDilate(1));
          }}
          aria-label="A feather on a string. Drag it, or press Enter to wiggle it"
        >
          <svg viewBox="0 0 60 120" width="56" height="112" aria-hidden="true">
            <path d="M30 4 C 52 30 52 80 30 116 C 8 80 8 30 30 4 Z" fill="#ffb3c9" />
            <path d="M30 6 V 118" stroke="#d9789a" strokeWidth="3" strokeLinecap="round" />
            <path d="M30 34 L 18 26 M30 52 L 16 44 M30 70 L 18 64 M30 34 L 42 26 M30 52 L 44 44 M30 70 L 42 64" stroke="#d9789a" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </motion.button>
      </div>

      {/* the stars sent up from the jar */}
      {sky.map((s) => (
        <motion.span
          key={s.id}
          className={css.skyStar}
          initial={{ x: s.from.x, y: s.from.y, scale: 0.3, opacity: 0 }}
          animate={{ x: s.to.x, y: s.to.y, scale: 1, opacity: 1 }}
          transition={{ duration: reduce ? 0 : 1.1, ease: [0.22, 0.61, 0.36, 1] }}
          aria-hidden="true"
        >
          <IconSlot name="icon-star" size={34} />
        </motion.span>
      ))}

      {/* ---------- Void ---------- */}
      <div ref={headBox} className={css.head} data-ducked={ducked ? '1' : undefined}>
        <div key={squish} className={squish ? css.squish : undefined}>
          <button type="button" data-sfx="off" className={css.headBtn} onPointerDown={headDown} onPointerUp={headUp} onPointerLeave={() => holding.current && headUp()} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), headUp())} aria-label="Pet Void. Tap to say hi, hold to make him purr">
            <VoidPeek ref={peek} mood={mood} target={target} dilate={dilate} className={css.peekSvg} />
          </button>
        </div>
        {landed !== null && <span className={css.noseFly} aria-hidden="true" />}
        {hearts.map((id) => (
          <span key={id} className="heart" style={{ left: '50%', top: '30%', ['--dx' as string]: `${(id % 5) * 26 - 52}px` }} aria-hidden="true">
            <PixelHeart px={6} />
          </span>
        ))}
        {mood === 'asleep' && (
          <span className={css.zzz} aria-hidden="true">
            z<span>z</span>
            <span>z</span>
          </span>
        )}
        {note && (
          <p className={`font-note ${css.note}`} role="status">
            {note}
          </p>
        )}
      </div>

      {/* the paw that bats the yarn comes up from behind the ledge */}
      <span className={css.swipeBox} aria-hidden="true">
        <span className={css.swipePaw} data-on={swipe ? '1' : undefined} />
      </span>

      {/* ---------- the ledge ---------- */}
      <div ref={ledge} className={css.ledge}>
        <span className={`${css.grip} ${css.gripL}`} data-ducked={ducked ? '1' : undefined} aria-hidden="true" />
        <span className={`${css.grip} ${css.gripR}`} data-ducked={ducked ? '1' : undefined} aria-hidden="true" />

        <motion.button
          ref={yarnRef}
          type="button"
          data-sfx="off"
          className={css.yarn}
          style={{ x: yx, rotate: yRot }}
          drag="x"
          dragConstraints={ledge}
          dragElastic={0.15}
          dragTransition={{ power: 0.5, timeConstant: 420 }}
          onDragStart={() => play('boing')}
          onDragTransitionEnd={checkBat}
          onKeyDown={(e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            e.preventDefault();
            nudgeYarn();
          }}
          aria-label="A ball of yarn. Flick it along the ledge, or press Enter to roll it"
        >
          <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
            <circle cx="50" cy="50" r="46" fill="#ff8fab" />
            <path d="M12 38 Q50 20 88 40 M8 56 Q50 34 92 58 M14 72 Q50 52 86 76 M30 12 Q20 50 36 92 M54 6 Q44 50 62 96" fill="none" stroke="#d9587d" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </motion.button>

        <div className={css.sign}>
          <h1 className={css.title}>
            Hi, I&apos;m {CAT_NAME}.
          </h1>
          <p className={`font-note ${css.tagline}`}>{TAGLINE}</p>
          <p className={css.cue} aria-hidden="true">
            scroll. he&apos;ll follow you. <span>↓</span>
          </p>
        </div>

        <div className={css.jarWrap}>
          <button ref={jarRef} type="button" data-sfx="off" className={css.jar} onClick={tapJar} aria-label={`The wish jar. ${count ?? 0} wishes caught. Tap to send a star into the sky`}>
            <span className={css.jarLid} aria-hidden="true" />
            <span className={css.jarGlass} aria-hidden="true">
              <IconSlot name="icon-star" size={40} />
              <IconSlot name="icon-sparkle" size={34} />
            </span>
            <span className={css.jarCount}>{count === null ? '…' : <Odometer value={count} />}</span>
          </button>
          <Link href="/wishes" className={css.jarLink}>
            read the wishes →
          </Link>
        </div>

        <span className={css.corner} onPointerEnter={cornerEnter} onPointerLeave={() => window.clearTimeout(patT.current)} aria-hidden="true">
          <span className={css.patPaw} data-on={pat ? '1' : undefined} />
        </span>
      </div>
    </section>
  );
}
