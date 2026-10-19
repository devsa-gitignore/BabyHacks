'use client';

import { useCallback, useEffect, useRef, type RefObject } from 'react';


type State = {
  tx: number;
  ty: number;
  cx: number;
  cy: number;
  dil: number;
  cdil: number;
  raf: number;
  lastMove: number;
};

export function useEyeTracking(
  root: RefObject<SVGSVGElement | null>,
  enabled = true,
  opts: { max?: number; cy?: number } = {},
) {
  const MAX = opts.max ?? 12; // max pupil travel in SVG units
  const CY = opts.cy ?? 0.54; // vertical position of the eyes inside the svg box (0..1)
  const s = useRef<State>({ tx: 0, ty: 0, cx: 0, cy: 0, dil: 1, cdil: 1, raf: 0, lastMove: 0 });
  const api = useRef<{ aim: (x: number, y: number) => void; kick: () => void }>({
    aim: () => {},
    kick: () => {},
  });

  useEffect(() => {
    const svg = root.current;
    if (!svg || !enabled) return;
    const st = s.current;
    const pupils = Array.from(svg.querySelectorAll<SVGGElement>('.pupil'));
    const lids = Array.from(svg.querySelectorAll<SVGElement>('.lid'));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    let recenter = 0;
    let wander = 0;
    let blink = 0;

    const apply = () => {
      const t = `translate(${st.cx.toFixed(2)}px, ${st.cy.toFixed(2)}px) scale(${st.cdil.toFixed(3)})`;
      for (const p of pupils) p.style.transform = t;
    };

    const tick = () => {
      st.cx += (st.tx - st.cx) * 0.18;
      st.cy += (st.ty - st.cy) * 0.18;
      st.cdil += (st.dil - st.cdil) * 0.2;
      apply();
      const moving =
        Math.abs(st.tx - st.cx) > 0.02 || Math.abs(st.ty - st.cy) > 0.02 || Math.abs(st.dil - st.cdil) > 0.002;
      st.raf = moving ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => {
      if (!st.raf) st.raf = requestAnimationFrame(tick);
    };

    const aim = (clientX: number, clientY: number) => {
      const r = svg.getBoundingClientRect();
      if (r.width === 0) return;
      const cx = r.left + r.width * 0.5;
      const cy = r.top + r.height * CY;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const mag = Math.min(1, dist / (r.width * 0.8)) * MAX;
      st.tx = (dx / dist) * mag;
      st.ty = (dy / dist) * mag;
      st.lastMove = performance.now();
      kick();
    };
    api.current = { aim, kick };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      aim(e.clientX, e.clientY);
    };
    const onDown = (e: PointerEvent) => {
      aim(e.clientX, e.clientY);
      if (e.pointerType === 'touch') {
        window.clearTimeout(recenter);
        recenter = window.setTimeout(() => {
          st.tx = 0;
          st.ty = 0;
          kick();
        }, 1200);
      }
    };
    if (canHover) window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });

    const scheduleWander = () => {
      wander = window.setTimeout(() => {
        if (!document.hidden && performance.now() - st.lastMove > 2000) {
          st.tx = (Math.random() - 0.5) * 10;
          st.ty = (Math.random() - 0.5) * 7;
          kick();
        }
        scheduleWander();
      }, 2000 + Math.random() * 2000);
    };
    const scheduleBlink = () => {
      blink = window.setTimeout(() => {
        if (!document.hidden && svg.dataset.state !== 'asleep' && svg.dataset.state !== 'purr') {
          for (const l of lids) {
            try {
              l.animate(
                [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }, { transform: 'scaleY(0)' }],
                { duration: 140, easing: 'ease-in-out' },
              );
            } catch {}
          }
        }
        scheduleBlink();
      }, 3000 + Math.random() * 3000);
    };
    if (!reduce) {
      scheduleWander();
      scheduleBlink();
    }

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.clearTimeout(recenter);
      window.clearTimeout(wander);
      window.clearTimeout(blink);
      if (st.raf) cancelAnimationFrame(st.raf);
      st.raf = 0;
    };
  }, [root, enabled, MAX, CY]);

  const lookAt = useCallback((x: number, y: number) => api.current.aim(x, y), []);
  const dilate = useCallback((on: boolean) => {
    s.current.dil = on ? 1.25 : 1;
    api.current.kick();
  }, []);

  return { lookAt, dilate };
}
