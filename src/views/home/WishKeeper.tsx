'use client';

// Chapter 3: what he does. The page darkens, paper wishes float up and fold into stars, and the stars
// draw a constellation that spells VOID.
import Link from 'next/link';
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Odometer } from '@/components/Odometer';
import { countWishes } from '@/lib/supabase';
import { getPending } from '@/lib/wishes';
import css from './chapters.module.css';

// constellation points in a 1000 x 420 box
const STARS = [
  { x: 90, y: 70 }, { x: 165, y: 330 }, { x: 240, y: 70 }, // V
  { x: 400, y: 70 }, { x: 500, y: 200 }, { x: 400, y: 330 }, { x: 300, y: 200 }, // O
  { x: 600, y: 70 }, { x: 600, y: 330 }, // I
  { x: 720, y: 70 }, { x: 720, y: 330 }, { x: 880, y: 200 }, // D
];
const LINES = [
  'M90 70 L165 330 L240 70',
  'M400 70 Q500 70 500 200 Q500 330 400 330 Q300 330 300 200 Q300 70 400 70',
  'M600 70 L600 330',
  'M720 70 L720 330 Q880 330 880 200 Q880 70 720 70',
];
const WISHES = ['i wish my cat would sleep in', 'a good grade', 'grandma feels better', 'i wish for snow', 'to be brave tomorrow', 'one more summer', 'more naps', 'that she says yes'];
const COLORS = ['pink', 'aqua', 'periwinkle', 'yellow', 'orange'];

function Note({ p, i }: { p: MotionValue<number>; i: number }) {
  const star = STARS[i];
  const s = 0.08 + i * 0.065;
  const e = s + 0.16;
  const top = useTransform(p, [s, e], [130, (star.y / 420) * 100]);
  const opacity = useTransform(p, [s, s + 0.02, e - 0.03, e], [0, 1, 1, 0]);
  const scale = useTransform(p, [e - 0.05, e], [1, 0.2]);
  const rotate = useTransform(p, [s, e], [i % 2 ? -8 : 8, 0]);
  return (
    <motion.span
      className={css.wishNote}
      style={{ left: `${(star.x / 1000) * 100}%`, top: useTransform(top, (v) => `${v}%`), opacity, scale, rotate, ['--c' as string]: `var(--sticker-${COLORS[i % COLORS.length]})` }}
      aria-hidden="true"
    >
      {WISHES[i]}
    </motion.span>
  );
}

function Star({ p, i }: { p: MotionValue<number>; i: number }) {
  const at = i < WISHES.length ? 0.08 + i * 0.065 + 0.16 : 0.66 + (i - WISHES.length) * 0.03;
  const opacity = useTransform(p, [at - 0.01, at + 0.02], [0, 1]);
  const scale = useTransform(p, [at - 0.01, at + 0.02, at + 0.05], [0.2, 1.5, 1]);
  return <motion.circle cx={STARS[i].x} cy={STARS[i].y} r="10" className={css.cStar} style={{ opacity, scale }} />;
}

function Line({ p, d, i }: { p: MotionValue<number>; d: string; i: number }) {
  const len = useTransform(p, [0.72 + i * 0.04, 0.84 + i * 0.04], [0, 1]);
  return <motion.path d={d} className={css.cLine} style={{ pathLength: len }} />;
}

export function WishKeeper() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const dark = useTransform(p, [0, 0.12], [0, 1]);
  const outro = useTransform(p, [0.88, 0.96], [0, 1]);
  const outroHit = useTransform(outro, (v) => (v > 0.5 ? 'auto' : 'none'));
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    let on = true;
    countWishes()
      .then((c) => on && setCount((c ?? 0) + getPending().length))
      .catch(() => on && setCount(getPending().length));
    return () => {
      on = false;
    };
  }, []);

  return (
    <section ref={ref} className={css.keeper} aria-label="What Void does">
      <div className={css.sticky}>
        <motion.div className={css.night} style={{ opacity: dark }} aria-hidden="true" />
        <header className={css.keeperHead}>
          <p className={`${css.kicker} ${css.onDark}`}>Field notes, page 3</p>
          <h2 className={`${css.h2} ${css.onDark}`}>What he does</h2>
          <p className={css.keeperLine}>Every night he sits by the window and catches the wishes people whisper. Then he hangs each one in the sky.</p>
        </header>
        <div className={css.sky}>
          <svg viewBox="0 0 1000 420" className={css.skySvg} aria-hidden="true">
            {LINES.map((d, i) => (
              <Line key={i} p={p} d={d} i={i} />
            ))}
            {STARS.map((_, i) => (
              <Star key={i} p={p} i={i} />
            ))}
          </svg>
          {WISHES.map((_, i) => (
            <Note key={i} p={p} i={i} />
          ))}
        </div>
        <motion.div className={css.keeperOut} style={{ opacity: outro, pointerEvents: outroHit }}>
          <p className={css.onDark}>
            <span className={css.bigCount}>{count === null ? '…' : <Odometer value={count} />}</span> wishes caught so far
          </p>
          <Link href="/wishes" className="btn">
            Whisper one to him
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
