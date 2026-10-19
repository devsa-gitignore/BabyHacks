'use client';

// Projects slot (/projects), plan P5. Four project cards on one calm page. Tap a card to open it in place.
// A dream route draws across the top as you scroll. #puppets #table #forts #report deep-link to a card.
import { useEffect, useState, type KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useAudio } from '@/audio';
import { startLullaby } from '@/audio/musicbox';
import { IconSlot } from '@/components/IconSlot';
import { useReducedMotion } from '@/hooks/useDevice';
import { Kitten } from '../_kit/Kitten';
import BlanketFortBlueprints from './BlanketFortBlueprints';
import KnockItOffTable from './KnockItOffTable';
import ShadowPuppetTheater from './ShadowPuppetTheater';
import VoidReport from './VoidReport';
import css from './projects.module.css';

const PROJECTS = [
  { id: 'puppets', title: 'Shadow Puppet Theater', line: 'A little theater behind the wall. Pick a puppet and see what it does.', icon: 'icon-star', Panel: ShadowPuppetTheater },
  { id: 'table', title: 'Knock-It-Off Table', line: 'Six objects. One very serious experiment about gravity.', icon: 'icon-cloud', Panel: KnockItOffTable },
  { id: 'forts', title: 'Blanket Fort Architecture', line: 'Four forts, carefully engineered. Tap a blueprint to flip it.', icon: 'icon-heart', Panel: BlanketFortBlueprints },
  { id: 'report', title: 'The Void Report', line: 'A study of why cats stare at walls. Funded by snacks.', icon: 'icon-sparkle', Panel: VoidReport },
] as const;
type Id = (typeof PROJECTS)[number]['id'];

export default function ProjectsSlot() {
  const reduce = useReducedMotion();
  const { muted } = useAudio();
  const [open, setOpen] = useState<Id | null>(null);
  const [scrolled, setScrolled] = useState(0);
  const [humming, setHumming] = useState(false);

  // deep link: /projects#forts
  useEffect(() => {
    const h = window.location.hash.slice(1);
    if (PROJECTS.some((p) => p.id === h)) setOpen(h as Id);
  }, []);

  // dream route: progress is how far down the page the visitor has scrolled
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // the lullaby stops when muted, when the visitor leaves, or when tapped again
  useEffect(() => {
    if (!humming) return;
    const stop = startLullaby();
    return () => stop();
  }, [humming]);
  useEffect(() => {
    if (muted) setHumming(false);
  }, [muted]);

  const choose = (id: Id | null) => {
    setOpen(id);
    try {
      window.history.replaceState(null, '', id ? `#${id}` : window.location.pathname);
    } catch {}
    if (id) window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  // arrow keys move between cards
  const onGridKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];
    if (!keys.includes(e.key)) return;
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[data-card]'));
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    e.preventDefault();
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
    items[(i + step + items.length) % items.length].focus();
  };

  const route = reduce ? 1 : scrolled;

  return (
    <section id="projects-slot" data-slot="projects" className={css.slot}>
      <header className={css.head}>
        <h1 className="h-display on-sky m-0" style={{ fontSize: "var(--fs-h1)" }}>Void&apos;s Projects</h1>
        <p className="font-note on-sky m-0">Four very serious experiments.</p>
        <button type="button" className="btn-quiet" aria-pressed={humming} disabled={muted} title={muted ? 'sound is off' : undefined} onClick={() => setHumming((h) => !h)}>
          <span aria-hidden="true">{humming ? '■' : '♪'}</span>
          {humming ? 'Stop the lullaby' : 'Hum a lullaby'}
        </button>
      </header>

      {!open && (
        <div className={css.route} aria-hidden="true">
          <svg viewBox="0 0 1000 90" preserveAspectRatio="none" className={css.routeSvg}>
            <path
              d="M0 46 C 140 6, 240 84, 380 44 S 640 4, 780 44 S 930 76, 1000 40"
              pathLength={1}
              style={{ strokeDasharray: 1, strokeDashoffset: 1 - route }}
            />
          </svg>
          <span className={css.routeVoid} style={{ left: `${route * 94}%` }}>
            <svg viewBox="-20 -10 240 280" width="54" height="64">
              <Kitten eyes="normal" look={{ x: 0.4, y: 0.6 }} />
            </svg>
          </span>
        </div>
      )}

      <AnimatePresence mode="wait" initial={false}>
        {open ? (
          <motion.article
            key={open}
            className={`soft ${css.expanded}`}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.15 : 0.42, ease: [0.22, 0.61, 0.36, 1] }}
            id={`panel-${open}`}
          >
            <div className={css.expandedBar}>
              <h2 className={css.expandedTitle}>{PROJECTS.find((p) => p.id === open)!.title}</h2>
              <button type="button" className="btn-quiet" onClick={() => choose(null)}>
                <span aria-hidden="true">←</span> Back to the wall
              </button>
            </div>
            {(() => {
              const Active = PROJECTS.find((p) => p.id === open)!.Panel;
              return <Active />;
            })()}
          </motion.article>
        ) : (
          <motion.div key="grid" className={css.grid} onKeyDown={onGridKey} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            {PROJECTS.map((p) => (
              <button key={p.id} type="button" data-card className={`soft ${css.card}`} aria-expanded={false} aria-controls={`panel-${p.id}`} onClick={() => choose(p.id)}>
                <span className={css.cardIcon} aria-hidden="true">
                  <IconSlot name={p.icon} size={72} />
                </span>
                <span className={css.cardTitle}>{p.title}</span>
                <span className={css.cardLine}>{p.line}</span>
                <span className="btn sm">Open</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
