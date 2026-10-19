'use client';

// Chapter 1: he climbs up, then a field-guide page draws callouts onto him as you scroll.
// Followed by his character sheet (Track 2: name, species, personality, craft, projects, origin).
import Link from 'next/link';
import { motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from 'motion/react';
import { useRef, useState } from 'react';
import { useAudio } from '@/audio';
import { CAT_NAME } from '@/config';
import { Kitten } from '@/features/_kit/Kitten';
import css from './chapters.module.css';

const KX = 440;
const KY = 170;
const KS = 1.6;
const at = (x: number, y: number) => ({ x: KX + x * KS, y: KY + y * KS });

const CALLOUTS = [
  { from: at(138, 112), to: { x: 905, y: 250 }, label: 'Eyes', text: 'enormous and green. built for the dark, mostly used for spotting snacks.' },
  { from: at(164, 26), to: { x: 880, y: 90 }, label: 'Ears', text: 'radar for crinkly snack bags.' },
  { from: at(100, 200), to: { x: 300, y: 420 }, label: 'Star charm', text: 'from the very first wish he ever caught.' },
  { from: at(198, 196), to: { x: 930, y: 520 }, label: 'Tail', text: '60% of his feelings live here.' },
  { from: at(72, 252), to: { x: 290, y: 640 }, label: 'Paws', text: 'softer than they look. mostly beans.' },
];

function Callout({ p, i, c }: { p: MotionValue<number>; i: number; c: (typeof CALLOUTS)[number] }) {
  const s = 0.3 + i * 0.11;
  const e = s + 0.1;
  const len = useTransform(p, [s, e], [0, 1]);
  const dot = useTransform(p, [s - 0.02, s], [0, 1]);
  const left = c.to.x < 600;
  const mid = { x: (c.from.x + c.to.x) / 2, y: c.from.y - 40 };
  return (
    <>
      <motion.circle cx={c.from.x} cy={c.from.y} r="9" className={css.dot} style={{ opacity: dot }} />
      <motion.path d={`M${c.from.x} ${c.from.y} Q${mid.x} ${mid.y} ${c.to.x + (left ? 14 : -14)} ${c.to.y}`} className={css.line} style={{ pathLength: len }} />
    </>
  );
}

function Label({ p, i, c }: { p: MotionValue<number>; i: number; c: (typeof CALLOUTS)[number] }) {
  const e = 0.3 + i * 0.11 + 0.1;
  const opacity = useTransform(p, [e - 0.03, e + 0.02], [0, 1]);
  const y = useTransform(p, [e - 0.03, e + 0.02], [12, 0]);
  const left = c.to.x < 600;
  return (
    <motion.p
      className={css.label}
      data-side={left ? 'l' : 'r'}
      style={{ left: `${(c.to.x / 1200) * 100}%`, top: `${(c.to.y / 700) * 100}%`, opacity, y }}
    >
      <b>{c.label}</b>
      <span>{c.text}</span>
    </motion.p>
  );
}

export function FieldGuide() {
  const { play } = useAudio();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const rise = useTransform(p, [0, 0.2], [300, 0]);
  const paper = useTransform(p, [0.12, 0.26], [0, 1]);
  const head = useTransform(p, [0.14, 0.26], [0, 1]);
  const stampS = useTransform(p, [0.88, 0.94], [2.2, 1]);
  const stampO = useTransform(p, [0.88, 0.92], [0, 1]);
  const [stamped, setStamped] = useState(false);
  useMotionValueEvent(p, 'change', (v) => {
    if (v > 0.9 && !stamped) {
      setStamped(true);
      play('stamp');
    } else if (v < 0.8 && stamped) setStamped(false);
  });

  return (
    <>
      <section ref={ref} className={css.guide} aria-label="Field notes about Void">
        <div className={css.sticky}>
          <motion.div className={css.guidePaper} style={{ opacity: paper }} aria-hidden="true" />
          <motion.header className={css.guideHead} style={{ opacity: head }}>
            <p className={css.kicker}>Field notes, page 1</p>
            <h2 className={css.h2}>What is a {CAT_NAME}?</h2>
          </motion.header>
          <div className={css.stage}>
            <svg viewBox="0 0 1200 700" className={css.stageSvg} aria-hidden="true">
              <motion.g style={{ y: rise }}>
                <Kitten eyes="normal" look={{ x: 0.5, y: -0.2 }} transform={`translate(${KX} ${KY}) scale(${KS})`} />
                <path d={`M${at(100, 200).x} ${at(100, 200).y - 18}l6 12 13 2-9 9 2 13-12-6-12 6 2-13-9-9 13-2z`} fill="#ffe27a" stroke="#c99a1e" strokeWidth="2" />
              </motion.g>
              {CALLOUTS.map((c, i) => (
                <Callout key={c.label} p={p} i={i} c={c} />
              ))}
            </svg>
            <div className={css.labels}>
              {CALLOUTS.map((c, i) => (
                <Label key={c.label} p={p} i={i} c={c} />
              ))}
            </div>
            <motion.p className={css.stamp} style={{ scale: stampS, opacity: stampO }} aria-hidden="true">
              Felis catus nocturnus
              <small>age: baby · size: one loaf</small>
            </motion.p>
          </div>
        </div>
      </section>

      <section className={css.sheetWrap} aria-label="Character sheet">
        <dl className={css.sheet}>
          <span className={css.sheetTape} aria-hidden="true" />
          <h2 className={css.sheetTitle}>Character sheet</h2>
          <div><dt>Name</dt><dd>{CAT_NAME}</dd></div>
          <div><dt>Species</dt><dd>baby black kitten (one loaf, give or take)</dd></div>
          <div><dt>Personality</dt><dd>curious, a little shy, startled by butterflies, purrs the second you are kind to him</dd></div>
          <div><dt>Voice</dt><dd>small &quot;mrrp?&quot;s, a big purr, tiny sneezes</dd></div>
          <div><dt>Craft</dt><dd>Wish Keeper of the Window. He catches the wishes you whisper and hangs each one in the sky as a star.</dd></div>
          <div><dt>Projects</dt><dd><Link href="/projects">shadow puppets, a gravity experiment, blanket forts, a very serious report</Link></dd></div>
          <div><dt>Origin</dt><dd>born on the night a wish had nowhere to land. <Link href="/story">watch his story →</Link></dd></div>
        </dl>
      </section>
    </>
  );
}
