'use client';

// Chapters 4-6: his voice (a soundboard), three doorways to the rest of the site, and goodnight.
import Link from 'next/link';
import { motion, useInView, useScroll, useTransform } from 'motion/react';
import { useEffect, useRef, useState, type PointerEvent as RPointerEvent, type ReactNode } from 'react';
import { useAudio, type SoundName } from '@/audio';
import { startLullaby } from '@/audio/musicbox';
import { IconSlot } from '@/components/IconSlot';
import { Kitten } from '@/features/_kit/Kitten';
import css from './chapters.module.css';

/* ---------------- voice ---------------- */
type Key = { id: string; label: string; bubble: string; color: string; sound?: SoundName; purr?: boolean; lullaby?: boolean };
const KEYS: Key[] = [
  { id: 'mrrp', label: 'mrrp', bubble: 'mrrp?', color: 'var(--sticker-yellow)', sound: 'mrrp' },
  { id: 'purr', label: 'purr', bubble: 'prrrrrrr', color: 'var(--sticker-pink)', purr: true },
  { id: 'chirp', label: 'chirp at birds', bubble: 'ek ek ek', color: 'var(--sticker-aqua)', sound: 'chirp' },
  { id: 'sneeze', label: 'tiny sneeze', bubble: 'ek-CHOO', color: 'var(--sticker-orange)', sound: 'sneeze' },
  { id: 'hum', label: 'hum a lullaby', bubble: '♪ hmm hm hmm ♪', color: 'var(--sticker-periwinkle)', lullaby: true },
];

export function Voice() {
  const { play, purr, muted } = useAudio();
  const [said, setSaid] = useState<string | null>(null);
  const [humming, setHumming] = useState(false);
  useEffect(() => {
    if (!humming) return;
    const stop = startLullaby();
    return () => stop();
  }, [humming]);
  useEffect(() => {
    if (muted) setHumming(false);
  }, [muted]);
  useEffect(() => () => purr(false), [purr]);

  const press = (k: Key) => {
    setSaid(k.id);
    window.setTimeout(() => setSaid((s) => (s === k.id ? null : s)), 1800);
    if (k.sound) play(k.sound);
    if (k.purr) {
      purr(true);
      window.setTimeout(() => purr(false), 1800);
    }
    if (k.lullaby) setHumming((h) => !h);
  };

  return (
    <section className={css.voice} aria-label="Void's voice">
      <p className={css.kicker}>Field notes, page 4</p>
      <h2 className={`${css.h2} ${css.onSky}`}>His voice</h2>
      <p className={css.voiceLine}>{muted ? 'sound is off. turn it on (top right) to hear him.' : 'press a key. he only talks in small sounds.'}</p>
      <div className={css.keys}>
        {KEYS.map((k) => (
          <div key={k.id} className={css.keyWrap}>
            {(said === k.id || (k.lullaby && humming)) && (
              <span className={css.say} aria-live="polite">
                {k.bubble}
              </span>
            )}
            <button type="button" data-sfx="off" className={css.key} style={{ ['--k' as string]: k.color }} aria-pressed={k.lullaby ? humming : undefined} onClick={() => press(k)}>
              <span className={css.keyCap}>{k.lullaby && humming ? '■' : '●'}</span>
              <span className={css.keyLabel}>{k.lullaby && humming ? 'stop humming' : k.label}</span>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- doorways ---------------- */
function Door({ href, title, line, cta, flip, children }: { href: string; title: string; line: string; cta: string; flip?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(p, [0, 1], [50, -50]);
  const tilt = (e: RPointerEvent<HTMLAnchorElement>) => {
    if (e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--rx', `${((e.clientY - r.top) / r.height - 0.5) * -5}deg`);
    e.currentTarget.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 5}deg`);
  };
  return (
    <Link ref={ref} href={href} className={css.door} data-flip={flip ? '1' : undefined} onPointerMove={tilt} onPointerLeave={(e) => (e.currentTarget.style.setProperty('--rx', '0deg'), e.currentTarget.style.setProperty('--ry', '0deg'))}>
      <motion.span className={css.doorArt} style={{ y }} aria-hidden="true">
        {children}
      </motion.span>
      <span className={css.doorText}>
        <span className={css.doorTitle}>{title}</span>
        <span className={css.doorLine}>{line}</span>
        <span className="btn">{cta} →</span>
      </span>
    </Link>
  );
}

function TV() {
  const ref = useRef<HTMLSpanElement>(null);
  const on = useInView(ref, { amount: 0.6 });
  return (
    <span ref={ref} className={css.tv} data-on={on ? '1' : undefined}>
      <span className={css.tvScreen}>
        <IconSlot name="nav-story" size={110} zoom={1.5} />
      </span>
      <span className={css.tvKnobs} />
    </span>
  );
}

function ToyBox() {
  const ref = useRef<HTMLSpanElement>(null);
  const open = useInView(ref, { amount: 0.6 });
  return (
    <span ref={ref} className={css.box} data-open={open ? '1' : undefined}>
      <span className={css.boxToys}>
        <IconSlot name="nav-projects" size={110} zoom={1.5} />
      </span>
      <span className={css.boxLid} />
      <span className={css.boxFront}>TOYS</span>
    </span>
  );
}

function Jar() {
  return (
    <span className={css.bigJar}>
      <span className={css.bigJarLid} />
      <span className={css.bigJarGlass}>
        <IconSlot name="icon-heart" size={70} />
        <IconSlot name="icon-star" size={56} />
        <IconSlot name="icon-sparkle" size={50} />
      </span>
    </span>
  );
}

export function Doorways() {
  return (
    <section className={css.doors} aria-label="Where to go next">
      <p className={css.kicker}>Field notes, page 5</p>
      <h2 className={`${css.h2} ${css.onSky}`}>Come see more</h2>
      <Door href="/story" title="His story" line="Five channels of late night TV about how a kitten nobody noticed became Void." cta="Turn on the TV">
        <TV />
      </Door>
      <Door href="/projects" title="His projects" line="Shadow puppets, a gravity experiment, blanket forts and a very serious report." cta="Open the toy box" flip>
        <ToyBox />
      </Door>
      <Door href="/wishes" title="The wish wall" line="Whisper a wish. He catches it and hangs it in the sky with everyone else's." cta="Make a wish">
        <Jar />
      </Door>
    </section>
  );
}

/* ---------------- goodnight ---------------- */
export function Goodnight() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start end', 'end end'] });
  const dim = useTransform(p, [0.2, 0.9], [0, 1]);
  const sleepy = useInView(ref, { amount: 0.7 });
  return (
    <section ref={ref} className={css.goodnight} aria-label="Goodnight">
      <motion.div className={css.dim} style={{ opacity: dim }} aria-hidden="true" />
      <div className={css.bed}>
        <svg viewBox="-30 -20 300 320" className={css.bedCat} aria-hidden="true">
          <ellipse cx="100" cy="268" rx="140" ry="34" fill="var(--sticker-periwinkle)" />
          <ellipse cx="100" cy="258" rx="128" ry="22" fill="#c9d1ff" />
          <Kitten eyes={sleepy ? 'closed' : 'normal'} tail="still" />
        </svg>
        {sleepy && (
          <span className={css.bedZ} aria-hidden="true">
            z<span>z</span>
            <span>z</span>
          </span>
        )}
      </div>
      <p className={css.goodLine}>you scrolled all the way down. he&apos;s proud of you.</p>
      <p className={css.goodHint}>psst… try typing h-u-s-h anywhere.</p>
    </section>
  );
}
