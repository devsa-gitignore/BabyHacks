'use client';

// Void peeking over the edge of a cloud. Original vector art.
// Eyes (slit pupils) follow the cursor / last touch via useEyeTracking; ears and head lean toward it too.

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { CAT_NAME } from '@/config';
import { useEyeTracking } from '@/hooks/useEyeTracking';

export type VoidState = 'asleep' | 'awake' | 'purr';
export type VoidHandle = {
  el: SVGSVGElement | null;
  squish: () => void;
  hop: () => void;
  duck: () => Promise<void>;
  yawn: () => void;
  dilate: (on: boolean, ms?: number) => void;
  lookAt: (x: number, y: number) => void;
};

type Props = {
  className?: string;
  state?: VoidState;
  tracking?: boolean;
  onPoke?: () => void;
  onHold?: (on: boolean) => void;
  style?: React.CSSProperties;
  /** Draw the foreground cloud + paws (landing). Off for the small corner Void. */
  cloud?: boolean;
};

const INK = '#0d0b1a';
const RIM = '#2b2547';

function Eye({ side, cx }: { side: 'l' | 'r'; cx: number }) {
  return (
    <g data-cat-eye={side} className={`eye-${side}`} transform={`translate(${cx} 350)`}>
      <ellipse rx="66" ry="76" fill="url(#void-iris)" />
      <ellipse rx="66" ry="76" fill="none" stroke="#6fb10f" strokeWidth="4" opacity=".6" />
      <g className="pupil">
        <ellipse rx="16" ry="56" fill={INK} />
      </g>
      <circle cx="-22" cy="-30" r="12" fill="#fff" />
      <circle cx="20" cy="26" r="6" fill="#fff" opacity=".9" />
      <ellipse className="lid" rx="69" ry="79" fill={INK} />
      <path className="sleepy-arc" d="M-52 8 Q0 40 52 8" stroke="#8a80b8" strokeWidth="7" fill="none" strokeLinecap="round" />
    </g>
  );
}

export const VoidHero = forwardRef<VoidHandle, Props>(function VoidHero(
  { className, state = 'awake', tracking = true, onPoke, onHold, style, cloud = true },
  ref,
) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { lookAt, dilate: dil } = useEyeTracking(svgRef, tracking, { max: 18, cy: 350 / 560 });
  const holdTimer = useRef(0);
  const held = useRef(false);
  const dilTimer = useRef(0);

  const head = () => svgRef.current?.querySelector<SVGGElement>('[data-head]') ?? null;
  const anim = (kf: Keyframe[], opt: KeyframeAnimationOptions) => {
    try {
      return head()?.animate(kf, opt);
    } catch {
      return undefined;
    }
  };

  const squish = useCallback(() => {
    anim(
      [
        { transform: 'scale(1,1)' },
        { transform: 'scale(1.05,0.93)', offset: 0.3 },
        { transform: 'scale(0.98,1.04)', offset: 0.62 },
        { transform: 'scale(1,1)' },
      ],
      { duration: 420, easing: 'ease-out' },
    );
  }, []);
  const hop = useCallback(() => {
    anim(
      [{ transform: 'translateY(0)' }, { transform: 'translateY(-34px)', offset: 0.45 }, { transform: 'translateY(0)' }],
      { duration: 480, easing: 'cubic-bezier(.3,1.3,.5,1)' },
    );
  }, []);
  const duck = useCallback(async () => {
    const a = anim(
      [
        { transform: 'translateY(0)' },
        { transform: 'translateY(190px)', offset: 0.16 },
        { transform: 'translateY(190px)', offset: 0.78 },
        { transform: 'translateY(0)' },
      ],
      { duration: 1650, easing: 'ease-in-out' },
    );
    if (a) await a.finished.catch(() => {});
  }, []);
  const yawn = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.dataset.yawn = '1';
    window.setTimeout(() => {
      if (svg.dataset.yawn) delete svg.dataset.yawn;
    }, 420);
  }, []);
  const dilate = useCallback(
    (on: boolean, ms = 800) => {
      dil(on);
      window.clearTimeout(dilTimer.current);
      if (on && ms > 0) dilTimer.current = window.setTimeout(() => dil(false), ms);
    },
    [dil],
  );

  useImperativeHandle(ref, () => ({ el: svgRef.current, squish, hop, duck, yawn, dilate, lookAt }), [squish, hop, duck, yawn, dilate, lookAt]);

  // Ears and head lean toward the pointer (CSS vars, smoothed by CSS transitions).
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !tracking) return;
    const onMove = (e: PointerEvent) => {
      const r = svg.getBoundingClientRect();
      if (!r.width) return;
      const nx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width * 0.6)));
      const ny = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height * 0.6)) / (r.height * 0.6)));
      svg.style.setProperty('--lx', nx.toFixed(2));
      svg.style.setProperty('--ly', ny.toFixed(2));
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [tracking]);

  useEffect(() => () => window.clearTimeout(holdTimer.current), []);

  const down = () => {
    held.current = false;
    window.clearTimeout(holdTimer.current);
    holdTimer.current = window.setTimeout(() => {
      held.current = true;
      onHold?.(true);
    }, 600);
  };
  const up = () => {
    window.clearTimeout(holdTimer.current);
    if (held.current) {
      held.current = false;
      onHold?.(false);
    } else {
      onPoke?.();
    }
  };

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 800 560"
      className={`void-svg ${className ?? ''}`}
      style={style}
      data-state={state}
      data-cat-root
      role="img"
      aria-label={`${CAT_NAME}, a baby black kitten with big green eyes, peeking over a cloud`}
      onPointerDown={down}
      onPointerUp={up}
      onPointerCancel={() => {
        window.clearTimeout(holdTimer.current);
        if (held.current) {
          held.current = false;
          onHold?.(false);
        }
      }}
    >
      <defs>
        <radialGradient id="void-iris" cx="45%" cy="40%" r="65%">
          <stop offset="0" stopColor="#d9ff7a" />
          <stop offset="0.6" stopColor="#b8f23a" />
          <stop offset="1" stopColor="#79c20c" />
        </radialGradient>
      </defs>
      <g data-head style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}>
        {/* ears */}
        <g className="ear ear-l">
          <path d="M125 262Q108 130 160 34Q250 88 312 194Z" fill={INK} stroke={RIM} strokeWidth="3" />
          <path d="M152 218Q142 134 168 82Q216 116 258 192Z" fill="#ffa9c6" />
        </g>
        <g className="ear ear-r">
          <path d="M675 262Q692 130 640 34Q550 88 488 194Z" fill={INK} stroke={RIM} strokeWidth="3" />
          <path d="M648 218Q658 134 632 82Q584 116 542 192Z" fill="#ffa9c6" />
        </g>
        {/* head */}
        <path d="M118 570L118 300Q118 188 230 188L570 188Q682 188 682 300L682 570Z" fill={INK} stroke={RIM} strokeWidth="3" />
        <ellipse cx="190" cy="438" rx="34" ry="18" fill="#ff7aa8" opacity=".4" />
        <ellipse cx="610" cy="438" rx="34" ry="18" fill="#ff7aa8" opacity=".4" />
        <Eye side="l" cx={268} />
        <Eye side="r" cx={532} />
        {/* nose + mouth */}
        <path d="M378 412Q400 402 422 412Q412 436 400 440Q388 436 378 412Z" fill="#ff7aa8" />
        <g className="mouth-closed" stroke="#ff9db8" strokeWidth="5" fill="none" strokeLinecap="round">
          <path d="M400 440L400 456M400 456Q380 474 356 458M400 456Q420 474 444 458" />
        </g>
        <g className="mouth-open">
          <ellipse cx="400" cy="472" rx="26" ry="30" fill="#5a1f3a" />
          <ellipse cx="400" cy="486" rx="14" ry="9" fill="#ff7aa8" />
        </g>
        {/* whiskers */}
        <g stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none">
          <path className="whisker" d="M140 430L18 396" />
          <path className="whisker" style={{ animationDelay: '-.6s' }} d="M140 450L6 452" />
          <path className="whisker" style={{ animationDelay: '-1.4s' }} d="M146 470L28 510" />
          <path className="whisker r" d="M660 430L782 396" />
          <path className="whisker r" style={{ animationDelay: '-.9s' }} d="M660 450L794 452" />
          <path className="whisker r" style={{ animationDelay: '-1.8s' }} d="M654 470L772 510" />
        </g>
      </g>
      {cloud && (
        <>
          <path
            d="M-60 580L-60 530Q-60 485 10 492Q50 450 120 480Q180 440 250 490Q320 465 380 500Q440 470 500 495Q560 450 630 485Q700 455 760 492Q860 485 860 540L860 580Z"
            style={{ fill: 'var(--cloud)' }}
            stroke={INK}
            strokeWidth="6"
            strokeLinejoin="round"
          />
          <path d="M70 528Q110 512 150 528M420 538Q470 520 520 538M650 524Q690 508 730 524" stroke="#9db6e8" strokeWidth="5" fill="none" strokeLinecap="round" opacity=".7" />
          {/* paws */}
          {[290, 510].map((x) => (
            <g key={x} transform={`translate(${x} 498)`}>
              <ellipse rx="50" ry="32" fill={INK} stroke={RIM} strokeWidth="3" />
              <path d="M-16 -4L-16 14M0 -6L0 16M16 -4L16 14" stroke={RIM} strokeWidth="4" strokeLinecap="round" />
            </g>
          ))}
        </>
      )}
    </svg>
  );
});
