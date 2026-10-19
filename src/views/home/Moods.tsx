'use client';

// Chapter 2: his moods. Vertical scroll slides a row of five mood cards sideways. Each card does one thing.
import { motion, useScroll, useTransform } from 'motion/react';
import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { useAudio } from '@/audio';
import { IconSlot } from '@/components/IconSlot';
import { PixelButterfly } from '@/components/void/Pixel';
import { Kitten } from '@/features/_kit/Kitten';
import css from './chapters.module.css';

type Look = { x: number; y: number };

function Face({ eyes, look = { x: 0, y: 0 } }: { eyes: 'normal' | 'wide' | 'closed'; look?: Look }) {
  return (
    <svg viewBox="-24 -8 248 210" className={css.moodFace} aria-hidden="true">
      <Kitten eyes={eyes} look={look} body={false} />
    </svg>
  );
}

function Sleepy() {
  const { play } = useAudio();
  const [yawn, setYawn] = useState(false);
  return (
    <button type="button" data-sfx="off" className={css.moodBody} onClick={() => {
      play('mrrp');
      setYawn(true);
      window.setTimeout(() => setYawn(false), 1600);
    }} aria-label="Tap the sleepy Void to make him yawn">
      <Face eyes={yawn ? 'normal' : 'closed'} />
      {yawn ? <span className={css.bubble}>*yaaawn*</span> : <span className={css.zz} aria-hidden="true">z z z</span>}
    </button>
  );
}

function Curious() {
  const [look, setLook] = useState<Look>({ x: 0, y: 0 });
  const onMove = (e: RPointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setLook({ x: ((e.clientX - r.left) / r.width - 0.5) * 2, y: ((e.clientY - r.top) / r.height - 0.5) * 2 });
  };
  return (
    <div className={css.moodBody} onPointerMove={onMove} onPointerLeave={() => setLook({ x: 0, y: 0 })}>
      <Face eyes="wide" look={look} />
      <span className={css.hintSmall}>move around in here</span>
    </div>
  );
}

function Startled() {
  const { play } = useAudio();
  const [fly, setFly] = useState(0);
  return (
    <button type="button" data-sfx="off" className={css.moodBody} onClick={() => {
      play('flutter');
      setFly((f) => f + 1);
    }} aria-label="Tap to send a butterfly past Void">
      <span key={fly} className={fly ? css.puff : undefined}>
        <Face eyes={fly ? 'wide' : 'normal'} />
      </span>
      {fly > 0 && (
        <span key={`b${fly}`} className={css.butterfly} aria-hidden="true">
          <PixelButterfly px={5} />
        </span>
      )}
      <span className={css.hintSmall}>tap for a butterfly</span>
    </button>
  );
}

function Purring() {
  const { purr } = useAudio();
  const [on, setOn] = useState(false);
  useEffect(() => () => purr(false), [purr]);
  const start = () => {
    setOn(true);
    purr(true);
  };
  const stop = () => {
    setOn(false);
    purr(false);
  };
  return (
    <button type="button" data-sfx="off" className={css.moodBody} data-purr={on ? '1' : undefined} onPointerDown={start} onPointerUp={stop} onPointerLeave={() => on && stop()} onKeyDown={(e) => e.key === ' ' && !on && start()} onKeyUp={stop} aria-label="Hold to pet Void and hear him purr">
      <Face eyes={on ? 'closed' : 'normal'} />
      <span className={css.hintSmall}>{on ? 'prrrrrrr' : 'press and hold'}</span>
    </button>
  );
}

function Mysterious() {
  const [blink, setBlink] = useState(0);
  return (
    <button type="button" data-sfx="off" className={`${css.moodBody} ${css.dark}`} onClick={() => setBlink((b) => b + 1)} aria-label="Tap the dark. Something blinks back">
      <span key={blink} className={blink ? css.blinkOnce : undefined}>
        <Face eyes="normal" look={{ x: 0, y: 0.3 }} />
      </span>
      <span className={css.hintSmall}>…is someone there?</span>
    </button>
  );
}

const MOODS = [
  { title: 'Sleepy', line: 'his default setting. 16 hours a day, minimum.', icon: 'icon-moon', tint: 'var(--sticker-periwinkle)', Body: Sleepy },
  { title: 'Curious', line: 'eyes like saucers. follows anything that moves.', icon: 'icon-star', tint: 'var(--sticker-yellow)', Body: Curious },
  { title: 'Startled', line: 'butterflies are his one true enemy.', icon: 'icon-sparkle', tint: 'var(--sticker-aqua)', Body: Startled },
  { title: 'Purring', line: 'be kind to him and the motor starts.', icon: 'icon-heart', tint: 'var(--sticker-pink)', Body: Purring },
  { title: 'Mysterious', line: 'in the dark, only his eyes give him away.', icon: 'icon-cloud', tint: '#2a2440', Body: Mysterious },
];

export function Moods() {
  const ref = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [dist, setDist] = useState(0);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const x = useTransform(p, [0.05, 0.95], [0, -dist]);

  useEffect(() => {
    const measure = () => setDist(Math.max(0, (track.current?.scrollWidth ?? 0) - window.innerWidth));
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  return (
    <section ref={ref} className={css.moods} aria-label="Void's moods">
      <div className={css.sticky}>
        <header className={css.moodsHead}>
          <p className={css.kicker}>Field notes, page 2</p>
          <h2 className={css.h2}>His moods</h2>
        </header>
        <motion.div ref={track} className={css.track} style={{ x }}>
          {MOODS.map(({ title, line, icon, tint, Body }, i) => (
            <article key={title} className={css.moodCard} style={{ ['--tint' as string]: tint, ['--tilt' as string]: `${i % 2 ? 1.5 : -1.5}deg` }}>
              <span className={css.moodTape} aria-hidden="true" />
              <span className={css.moodIcon} aria-hidden="true">
                <IconSlot name={icon} size={56} />
              </span>
              <Body />
              <h3 className={css.moodTitle}>{title}</h3>
              <p className={css.moodLine}>{line}</p>
            </article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
