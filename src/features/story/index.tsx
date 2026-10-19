'use client';

// Story slot (/story): "Void's Late Night Broadcast". One chunky CRT TV, pinned to the screen. The five scenes
// are channels; each scene's text types out as captions in 3 beats (auto-advances, tap/scroll/swipe/keys to go
// faster). Channel changes play the React Bits CRT Warp (unmodified) between scenes. The 3D Void sits on top.
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { useAudio } from '@/audio';
import CRTWarp from '@/components/react-bits/CRTWarp';
import type { Look } from '@/components/void/Void3DScene';
import type { VoidState } from '@/components/void/VoidHero';
import { hasWebGL2, useDevice, useReducedMotion } from '@/hooks/useDevice';
import { IconSlot } from '@/components/IconSlot';
import { Kitten } from '../_kit/Kitten';
import { Captions } from './Captions';
import { SCENES, beatCount } from './data';
import { ARTS, DepthProvider, useDepthSource, type SceneSignal } from './scenes';
import { useHostLook } from './StoryHost';
import css from './story.module.css';

const Host = dynamic(() => import('./StoryHost'), { ssr: false });

type Phase = 'off' | 'booting' | 'on' | 'switching';
type Warp = 'hidden' | 'in' | 'out';
const LAST = SCENES.length - 1;
const pad = (n: number) => String(n).padStart(2, '0');
// fairy-light bulbs hanging off the wire (4 swags across the top of the room)
const BULBS = Array.from({ length: 16 }, (_, k) => {
  const x = (k + 0.5) / 16;
  return { x: x * 100, y: 12 + 22 * Math.sin(Math.PI * ((x * 4) % 1)) };
});

export default function StorySlot() {
  const reduce = useReducedMotion();
  const device = useDevice();
  const touch = device === 'touch';
  const { play, purr, bed } = useAudio();

  const [phase, setPhase] = useState<Phase>('off');
  const [i, setI] = useState(0);
  const [b, setB] = useState(0);
  const [typed, setTyped] = useState(false);
  const [finish, setFinish] = useState(0);
  const [auto, setAuto] = useState(true);
  const [nudge, setNudge] = useState(0); // bump = restart the auto-advance wait
  const [warp, setWarp] = useState<Warp>('hidden');
  const [warpKey, setWarpKey] = useState(0);
  const [warpTo, setWarpTo] = useState(0);
  const [held, setHeld] = useState(false);
  const [gl, setGl] = useState<boolean | null>(null);

  const rootRef = useRef<HTMLElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const look = useRef<Look>({ x: 0, y: 0 });
  const squish = useRef(0);
  const timers = useRef<number[]>([]);
  const visible = useRef(false);

  const s = SCENES[i];
  const total = beatCount(s);
  const isClosing = !!s.closing && b === s.beats.length;
  const atEnd = i === LAST && b === total - 1;
  const text = isClosing ? s.closing! : s.beats[b];
  const on = phase !== 'off';

  const depth = useDepthSource(screenRef, on && !reduce, touch);
  useHostLook(look, hostRef, on && !reduce);
  useEffect(() => setGl(hasWebGL2()), []);

  const after = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => () => clearTimers(), []);

  // background loop follows the channel; the site pad comes back when we leave
  useEffect(() => {
    bed(on ? s.bed : 'off');
  }, [on, s.bed, bed]);
  useEffect(() => () => bed(null), [bed]);

  /* ---------------- transitions ---------------- */
  const runWarp = (to: number, holdMs: number) => {
    setWarpTo(to);
    setWarpKey((k) => k + 1);
    setWarp('in');
    after(holdMs, () => setWarp('out'));
    after(holdMs + 450, () => setWarp('hidden'));
  };

  const power = () => {
    clearTimers();
    if (on) {
      play('tvOff');
      setPhase('off');
      setWarp('hidden');
      return;
    }
    play('tvOn');
    squish.current = 1;
    setI(0);
    setB(0);
    setTyped(false);
    if (reduce) {
      setPhase('on');
      return;
    }
    setPhase('booting');
    runWarp(0, 1350);
    after(1250, () => setPhase('on'));
  };

  const goTo = (n: number) => {
    if (phase === 'off' || phase === 'booting' || n === i || n < 0 || n > LAST) return;
    clearTimers();
    play('channel');
    squish.current = 1;
    if (reduce) {
      setI(n);
      setB(0);
      setTyped(false);
      setPhase('on');
      return;
    }
    setPhase('switching');
    runWarp(n, 1000);
    after(480, () => {
      setI(n);
      setB(0);
      setTyped(false);
    });
    after(950, () => setPhase('on'));
  };

  const next = () => {
    if (phase === 'off') return power();
    if (phase !== 'on') return;
    if (!typed) return setFinish((f) => f + 1);
    if (b < total - 1) {
      setB(b + 1);
      setTyped(false);
    } else if (i < LAST) goTo(i + 1);
  };
  const prev = () => {
    if (phase !== 'on') return;
    if (b > 0) {
      setB(b - 1);
      setTyped(false);
    } else if (i > 0) goTo(i - 1);
  };
  const replay = () => {
    play('knob');
    goTo(0);
  };

  // latest handlers for timers / global listeners
  const api = useRef({ next, prev, goTo, atEnd, phase, i, b });
  api.current = { next, prev, goTo, atEnd, phase, i, b };

  /* ---------------- auto-advance ---------------- */
  useEffect(() => {
    if (phase !== 'on' || !typed || !auto || atEnd) return;
    const lastBeat = b === total - 1;
    const ms = 1500 + text.length * 34 + (lastBeat && s.hint ? 4000 : 0);
    const id = window.setTimeout(() => api.current.next(), ms);
    return () => window.clearTimeout(id);
  }, [phase, typed, auto, atEnd, b, total, text, s.hint, nudge]);

  const signal = useCallback(
    (sig: SceneSignal) => {
      if (sig === 'thunder') squish.current = 0.8;
      setNudge((n) => n + 1);
    },
    [],
  );

  /* ---------------- input: keys, wheel, swipe ---------------- */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(([e]) => (visible.current = e.intersectionRatio > 0.6), { threshold: [0, 0.6, 1] });
    io.observe(root);

    const onKey = (e: KeyboardEvent) => {
      if (!visible.current || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const a = api.current;
      if (e.key === 'ArrowRight') a.next();
      else if (e.key === 'ArrowLeft') a.prev();
      else if (e.key === ' ' && tag !== 'BUTTON') {
        e.preventDefault();
        a.next();
      } else if (/^[1-5]$/.test(e.key) && a.phase !== 'off') a.goTo(Number(e.key) - 1);
      else return;
    };

    // a wheel/trackpad flick = one beat. Free page scroll at the very start/end so the footer is reachable.
    let acc = 0;
    let last = 0;
    const onWheel = (e: WheelEvent) => {
      const a = api.current;
      if (a.phase === 'off') return;
      const down = e.deltaY > 0;
      if (down && a.atEnd) return;
      if (!down && a.i === 0 && a.b === 0) return;
      e.preventDefault();
      const now = performance.now();
      if (now - last < 650) return;
      acc += e.deltaY;
      if (Math.abs(acc) < 40) return;
      acc = 0;
      last = now;
      if (down) a.next();
      else a.prev();
    };
    window.addEventListener('keydown', onKey);
    root.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      io.disconnect();
      window.removeEventListener('keydown', onKey);
      root.removeEventListener('wheel', onWheel);
    };
  }, []);

  const swipe = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    swipe.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const st = swipe.current;
    swipe.current = null;
    if (!st) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - st.x;
    const dy = t.clientY - st.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) next();
      else prev();
    }
  };

  /* ---------------- host Void: tap = squish + mrrp, hold = purr ---------------- */
  const holdTimer = useRef(0);
  const hostDown = () => {
    window.clearTimeout(holdTimer.current);
    holdTimer.current = window.setTimeout(() => {
      setHeld(true);
      purr(true);
    }, 500);
  };
  const hostUp = () => {
    window.clearTimeout(holdTimer.current);
    if (held) {
      setHeld(false);
      purr(false);
      return;
    }
    squish.current = 1;
    play('mrrp');
  };
  const hostState: VoidState = !on ? 'asleep' : held || (i === LAST && b >= 2) ? 'purr' : 'awake';

  const Art = ARTS[s.id];
  const warpScene = SCENES[warpTo];

  return (
    <section
      id="story-slot"
      data-slot="story"
      ref={rootRef}
      className={css.slot}
      aria-label="Story: Void's late night broadcast"
      data-on={on ? '1' : undefined}
      data-home={on && i === LAST ? '1' : undefined}
      style={{ '--glow': on ? s.glow : '#000000' } as CSSProperties}
    >
      {/* ---------------- the room the TV lives in ---------------- */}
      <div className={css.room} aria-hidden="true">
        <div className={css.wall} />
        <div className={css.spill} />
        <svg className={css.fairyRow} viewBox="0 0 1000 60" preserveAspectRatio="none">
          <path d="M0 8Q125 52 250 14Q375 52 500 12Q625 52 750 14Q875 52 1000 8" fill="none" stroke="#0d0b1a" strokeWidth="3" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className={css.bulbs}>
          {BULBS.map((p, k) => (
            <span key={k} style={{ left: `${p.x}%`, top: `${p.y}px`, '--k': k, '--c': ['#ffe27a', '#a8ecf0', '#ffb3c9', '#b8f23a'][k % 4] } as CSSProperties} />
          ))}
        </div>
        <div className={css.moonWin}>
          <span />
        </div>
      </div>

      {/* ---------------- the TV ---------------- */}
      <div className={css.stage}>
        <div className={css.tv} data-bonk={warpKey % 2 ? 'a' : 'b'} data-phase={phase}>
          <div ref={hostRef} className={css.host} onPointerDown={hostDown} onPointerUp={hostUp} onPointerCancel={hostUp} onPointerLeave={() => held && hostUp()} role="img" aria-label="Void, sitting on top of the TV. Tap to poke, hold to pet.">
            {gl ? (
              <Host state={hostState} glow={on ? s.glow : '#000000'} tvOn={on} lookRef={look} squishRef={squish} granularity={touch ? 3 : 4} />
            ) : gl === false ? (
              <svg viewBox="-20 -10 240 280" className="h-full w-full">
                <Kitten eyes={on ? 'normal' : 'closed'} look={{ x: 0.4, y: 0.6 }} />
              </svg>
            ) : null}
          </div>
          <svg className={css.antenna} viewBox="0 0 120 70" aria-hidden="true">
            <path d="M60 64L22 6M60 64L102 12" fill="none" stroke="#3b3175" strokeWidth="4" strokeLinecap="round" />
            <circle cx="22" cy="6" r="5" fill="#ff6f91" stroke="#0d0b1a" strokeWidth="3" />
            <circle cx="102" cy="12" r="5" fill="#b8f23a" stroke="#0d0b1a" strokeWidth="3" />
            <path d="M42 70a18 14 0 0 1 36 0Z" fill="#3b3175" stroke="#0d0b1a" strokeWidth="3" />
          </svg>

          <div className={css.body}>
            <div className={css.bezel}>
              <div ref={screenRef} className={css.screen} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
                <div className={css.picture} data-phase={phase} data-closing={isClosing ? '1' : undefined}>
                  <div className={css.art}>
                    {/* the 4:3 scene, centred (and cropped top/bottom when the screen is widescreen) */}
                    <div className={css.artInner}>
                      {on && (
                        <DepthProvider value={depth}>
                          <Art key={s.id} reduce={reduce} beat={b} signal={signal} />
                        </DepthProvider>
                      )}
                    </div>
                  </div>
                  {!on && <div className={css.captionBtn} data-empty="1" aria-hidden="true" />}
                  {on && (
                    <>
                      <p className={css.osd} aria-hidden="true">
                        <span className={css.osdCh}>CH {pad(i + 1)}</span> {s.title.toUpperCase()}
                      </p>
                      <p className={css.osdRight} aria-hidden="true">
                        {auto ? '▶ AUTO' : '❚❚ PAUSED'}
                      </p>
                      {/* mouse/touch shortcut; keyboard users have the ▶ button and the arrow keys */}
                      <div className={css.captionBtn} onClick={next}>
                        <Captions key={`${i}-${b}`} text={text} instant={reduce} finishSignal={finish} onDone={() => setTyped(true)} big={isClosing} />
                      </div>
                      <div className={css.beats} aria-hidden="true">
                        {Array.from({ length: total }, (_, k) => (
                          <span key={k} data-on={k <= b ? '1' : undefined} />
                        ))}
                      </div>
                      {atEnd && typed && (
                        <button type="button" className={`px-btn butter sm ${css.again}`} data-sfx="off" onClick={replay}>
                          <span>↺ watch again</span>
                        </button>
                      )}
                    </>
                  )}
                </div>

                {phase === 'switching' && (
                  <p className={css.bigCh} aria-hidden="true">
                    CH {pad(warpTo + 1)}
                  </p>
                )}
                {warp !== 'hidden' && !reduce && (
                  <div className={css.warp} data-state={warp} aria-hidden="true">
                    <CRTWarp
                      key={warpKey}
                      color={warpScene.warp}
                      backgroundColor="#07060f"
                      intro={phase === 'booting'}
                      brightness={1.25}
                      variation={warpTo * 3 + 1}
                      speed={1.4}
                      levels={4}
                      columns={touch ? 46 : 72}
                      curvature={0.3}
                      scanlineStrength={0.7}
                      bloom={1.6}
                      interference={0.5}
                      mouseReact={false}
                      changeOnClick={false}
                      dpr={touch ? 1 : 1.5}
                      fps={touch ? 30 : 60}
                    />
                  </div>
                )}
                {phase === 'off' && (
                  <div className={css.offStars} aria-hidden="true">
                    {Array.from({ length: 12 }, (_, k) => (
                      <span key={k} style={{ left: `${(k * 37) % 92 + 4}%`, top: `${(k * 53) % 80 + 6}%`, animationDelay: `${(k % 4) * 0.9}s` }} />
                    ))}
                    <span className={css.offMoon}>
                      <IconSlot name="icon-moon" size={120} />
                    </span>
                  </div>
                )}
                {phase === 'off' && (
                  <button type="button" className={css.powerPrompt} data-sfx="off" onClick={power}>
                    <span>▶ PRESS POWER</span>
                    <small>Void&apos;s late night broadcast</small>
                  </button>
                )}
                <div className={css.glass} aria-hidden="true" />
              </div>
              <span className={css.brand} aria-hidden="true">
                VOID-O-VISION
              </span>
            </div>

            {/* ---------------- controls ---------------- */}
            <div className={css.panel}>
              <div className={css.grille} aria-hidden="true" />
              <button type="button" className={css.knob} data-sfx="off" onClick={() => (on ? goTo(i === LAST ? 0 : i + 1) : power())} aria-label="Channel knob: next channel" style={{ '--r': `${-60 + i * 30}deg` } as CSSProperties}>
                <span />
              </button>
              <div className={css.chans} role="group" aria-label="Channels">
                {SCENES.map((sc, k) => (
                  <button key={sc.id} type="button" className={css.chan} data-sfx="off" aria-label={`Channel ${k + 1}: ${sc.title}`} aria-current={on && i === k} disabled={!on} onClick={() => goTo(k)}>
                    {k + 1}
                  </button>
                ))}
              </div>
              <div className={css.panelNav}>
                <button type="button" className={css.navBtn} data-sfx="off" onClick={prev} disabled={!on || (i === 0 && b === 0)} aria-label="Previous">
                  ◀
                </button>
                <button type="button" className={css.navBtn} data-sfx="off" onClick={next} disabled={atEnd} aria-label="Next">
                  ▶
                </button>
              </div>
              <div className={css.row}>
                <button type="button" className={css.auto} data-sfx="off" aria-pressed={auto} aria-label="Auto-play the story" onClick={() => {
                  play('knob');
                  setAuto((a) => !a);
                }}>
                  <span />
                  <small>AUTO</small>
                </button>
                <button type="button" className={css.power} data-sfx="off" aria-pressed={on} aria-label={on ? 'Turn the TV off' : 'Turn the TV on'} onClick={power}>
                  <span className={css.led} />
                  <small>POWER</small>
                </button>
              </div>
            </div>
          </div>
          <div className={css.feet} aria-hidden="true">
            <span />
            <span />
          </div>
          <div className={css.shelf} aria-hidden="true" />
          {on && s.hint && (
            <p key={s.id} className={css.note} aria-hidden="true">
              {s.hint}
            </p>
          )}
        </div>
        <div className={css.navRow}>
          <button type="button" className={css.navBtn} data-sfx="off" onClick={prev} disabled={!on || (i === 0 && b === 0)} aria-label="Previous">
            ◀
          </button>
          <p className={css.help} aria-hidden="true">
            {on ? (touch ? 'tap the caption · swipe the screen' : 'click the caption · scroll · ← →') : 'turn it on'}
          </p>
          <button type="button" className={css.navBtn} data-sfx="off" onClick={next} disabled={atEnd} aria-label="Next">
            ▶
          </button>
        </div>
      </div>
    </section>
  );
}
