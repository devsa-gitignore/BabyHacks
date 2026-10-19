'use client';

// The giant peeking Void for the Home hero: ears, head top and two huge eyes above a ledge.
// Each eye aims at the target on its own, so a target close to his nose makes him go cross-eyed.
import { forwardRef, useEffect, useImperativeHandle, useRef, type MutableRefObject } from 'react';

export type PeekMood = 'awake' | 'asleep' | 'purr';
export type PeekHandle = { slowBlink: () => void; noseClient: () => { x: number; y: number } | null };
type Props = {
  mood: PeekMood;
  /** client-space point to look at; null = gentle idle wander */
  target: MutableRefObject<{ x: number; y: number } | null>;
  /** pupil size, 1 = normal, 1.4 = very interested */
  dilate?: number;
  className?: string;
};

const W = 1000;
const H = 560;
const HEAD = '#141024';
const RIM = '#2f2860';
const EYES = [
  { cx: 355, cy: 388 },
  { cx: 645, cy: 388 },
];
const NOSE = { x: 500, y: 520 };
const MAX = 34; // pupil travel in svg units
const LID_OPEN: Record<PeekMood, number> = { awake: 0, purr: 0.58, asleep: 1 };

export const VoidPeek = forwardRef<PeekHandle, Props>(function VoidPeek({ mood, target, dilate = 1, className = '' }, ref) {
  const svgRef = useRef<SVGSVGElement>(null);
  const headRef = useRef<SVGGElement>(null);
  const pupilRefs = useRef<(SVGGElement | null)[]>([]);
  const lidRefs = useRef<(SVGEllipseElement | null)[]>([]);
  const earRefs = useRef<(SVGGElement | null)[]>([]);
  const dil = useRef(dilate);
  dil.current = dilate;
  const moodRef = useRef(mood);
  moodRef.current = mood;

  const blink = (slow = false) => {
    if (moodRef.current === 'asleep') return;
    const from = LID_OPEN[moodRef.current];
    for (const l of lidRefs.current) {
      l?.animate(
        slow
          ? [{ transform: `scaleY(${from})` }, { transform: 'scaleY(1)', offset: 0.4 }, { transform: 'scaleY(1)', offset: 0.6 }, { transform: `scaleY(${from})` }]
          : [{ transform: `scaleY(${from})` }, { transform: 'scaleY(1)' }, { transform: `scaleY(${from})` }],
        { duration: slow ? 1900 : 170, easing: 'ease-in-out' },
      );
    }
  };

  useImperativeHandle(ref, () => ({
    slowBlink: () => blink(true),
    noseClient: () => {
      const r = svgRef.current?.getBoundingClientRect();
      if (!r) return null;
      const s = r.width / W;
      return { x: r.left + NOSE.x * s, y: r.top + NOSE.y * s };
    },
  }));

  // eyes, head tilt: one rAF loop, paused when off screen
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cur = EYES.map(() => ({ x: 0, y: 0 }));
    let d = 1;
    let tilt = 0;
    let wander = { x: 0, y: 0 };
    let raf = 0;
    let visible = true;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(tick);
    });
    io.observe(svg);
    const wanderIv = window.setInterval(() => {
      wander = { x: (Math.random() - 0.5) * 0.7, y: (Math.random() - 0.3) * 0.5 };
    }, 2600);

    function tick() {
      raf = 0;
      if (!visible || !svg) return;
      const r = svg.getBoundingClientRect();
      const s = r.width / W;
      const t = target.current;
      const ease = reduce ? 1 : 0.14;
      let tiltGoal = 0;
      EYES.forEach((e, i) => {
        let gx = wander.x * MAX;
        let gy = wander.y * MAX;
        if (t && s > 0) {
          const ex = r.left + e.cx * s;
          const ey = r.top + e.cy * s;
          const dx = t.x - ex;
          const dy = t.y - ey;
          const dist = Math.hypot(dx, dy) || 1;
          const mag = Math.min(1, dist / (r.width * 0.3)) * MAX;
          gx = (dx / dist) * mag;
          gy = (dy / dist) * mag;
        }
        cur[i].x += (gx - cur[i].x) * ease;
        cur[i].y += (gy - cur[i].y) * ease;
        const p = pupilRefs.current[i];
        p?.setAttribute('transform', `translate(${(e.cx + cur[i].x).toFixed(2)} ${(e.cy + cur[i].y).toFixed(2)}) scale(${d.toFixed(3)}) translate(${-e.cx} ${-e.cy})`);
      });
      if (t && s > 0) tiltGoal = Math.max(-1, Math.min(1, (t.x - (r.left + r.width / 2)) / (r.width * 0.9)));
      tilt += (tiltGoal * 4 - tilt) * (reduce ? 1 : 0.08);
      d += (dil.current - d) * 0.12;
      headRef.current?.setAttribute('transform', `rotate(${tilt.toFixed(2)} ${W / 2} ${H})`);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    // blinks every 3-6s, an ear twitch every ~9s
    let blinkT = 0;
    let earT = 0;
    const scheduleBlink = () => {
      blinkT = window.setTimeout(() => {
        if (!document.hidden) blink();
        scheduleBlink();
      }, 3000 + Math.random() * 3000);
    };
    const scheduleEar = () => {
      earT = window.setTimeout(() => {
        const ear = earRefs.current[Math.random() < 0.5 ? 0 : 1];
        ear?.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(-7deg)' }, { transform: 'rotate(3deg)' }, { transform: 'rotate(0deg)' }], { duration: 420, easing: 'ease-out' });
        scheduleEar();
      }, 7000 + Math.random() * 4000);
    };
    if (!reduce) {
      scheduleBlink();
      scheduleEar();
    }
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.clearInterval(wanderIv);
      window.clearTimeout(blinkT);
      window.clearTimeout(earT);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const lid = LID_OPEN[mood];

  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label="Void, a black kitten, peeking over the ledge at you">
      <defs>
        {EYES.map((e, i) => (
          <clipPath key={i} id={`peek-eye-${i}`}>
            <ellipse cx={e.cx} cy={e.cy} rx="96" ry="104" />
          </clipPath>
        ))}
        <radialGradient id="peek-iris" cx="50%" cy="42%" r="60%">
          <stop offset="0" stopColor="#e4ff9a" />
          <stop offset="0.55" stopColor="#b8f23a" />
          <stop offset="1" stopColor="#7cb51a" />
        </radialGradient>
      </defs>
      <g ref={headRef}>
        {/* ears */}
        <g ref={(el) => void (earRefs.current[0] = el)} style={{ transformBox: 'fill-box', transformOrigin: '70% 100%' }}>
          <path d="M165 330 Q132 96 228 18 Q338 92 410 214 Z" fill={HEAD} stroke={RIM} strokeWidth="6" strokeLinejoin="round" />
          <path d="M205 268 Q190 124 238 72 Q306 122 352 206 Z" fill="#ffa9c6" />
        </g>
        <g ref={(el) => void (earRefs.current[1] = el)} style={{ transformBox: 'fill-box', transformOrigin: '30% 100%' }}>
          <path d="M835 330 Q868 96 772 18 Q662 92 590 214 Z" fill={HEAD} stroke={RIM} strokeWidth="6" strokeLinejoin="round" />
          <path d="M795 268 Q810 124 762 72 Q694 122 648 206 Z" fill="#ffa9c6" />
        </g>
        {/* head (runs past the bottom, the ledge hides the rest) */}
        <rect x="118" y="168" width="764" height="560" rx="300" fill={HEAD} stroke={RIM} strokeWidth="6" />
        <path d="M470 176 Q486 150 500 172 Q514 146 530 176" fill="none" stroke={RIM} strokeWidth="6" strokeLinecap="round" />
        <ellipse cx="236" cy="506" rx="46" ry="20" fill="#ff6f91" opacity="0.22" />
        <ellipse cx="764" cy="506" rx="46" ry="20" fill="#ff6f91" opacity="0.22" />
        {/* eyes */}
        {EYES.map((e, i) => (
          <g key={i}>
            <ellipse cx={e.cx} cy={e.cy} rx="100" ry="108" fill="#0a0818" />
            <g clipPath={`url(#peek-eye-${i})`}>
              <ellipse cx={e.cx} cy={e.cy} rx="96" ry="104" fill="url(#peek-iris)" />
              <ellipse cx={e.cx} cy={e.cy} rx="88" ry="96" fill="none" stroke="#6aa012" strokeWidth="5" opacity="0.5" />
              <g ref={(el) => void (pupilRefs.current[i] = el)}>
                <ellipse cx={e.cx} cy={e.cy} rx="50" ry="62" fill="#0a0818" />
              </g>
              <circle cx={e.cx - 32} cy={e.cy - 40} r="17" fill="#fff" />
              <circle cx={e.cx + 30} cy={e.cy + 30} r="7" fill="#fff" opacity="0.85" />
              <ellipse
                ref={(el) => void (lidRefs.current[i] = el)}
                cx={e.cx}
                cy={e.cy}
                rx="104"
                ry="112"
                fill={HEAD}
                style={{ transformBox: 'fill-box', transformOrigin: '50% 0%', transform: `scaleY(${lid})`, transition: 'transform 420ms ease' }}
              />
            </g>
          </g>
        ))}
        {/* happy lid line when sleepy/purring */}
        {mood !== 'awake' &&
          EYES.map((e, i) => (
            <path key={i} d={`M${e.cx - 70} ${e.cy + (mood === 'asleep' ? 8 : 22)} Q${e.cx} ${e.cy + (mood === 'asleep' ? 34 : 46)} ${e.cx + 70} ${e.cy + (mood === 'asleep' ? 8 : 22)}`} fill="none" stroke={RIM} strokeWidth="7" strokeLinecap="round" />
          ))}
      </g>
    </svg>
  );
});
