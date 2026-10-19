'use client';

// Aceternity Cloud Shader, used as published (src/components/ui/cloud-shader.tsx is untouched).
// The shader has no pause/reduced-motion/DPR options, so this wrapper (a) renders it in a box
// ~60% the size and scales it up with CSS (about 2.8x fewer pixels, softer clouds), (b) hides the
// instant recolor on day/night change behind a 350ms cross-fade, (c) shows a static gradient for
// reduced-motion users or when WebGL is unavailable.

import { useEffect, useRef, useState } from 'react';
import { CloudShader } from '@/components/ui/cloud-shader';
import { useReducedMotion } from '@/hooks/useDevice';
import { useTheme } from '@/theme/ThemeProvider';

export const SKY = {
  day: { top: '#3876ba', bottom: '#8cbfe8', cloud: '#fbf8f2' },
  night: { top: '#14123a', bottom: '#3b2a7a', cloud: '#cfc4f2' },
} as const;

const SCALE = 0.6;

export function CloudSky({ speed = 0.8, count = 5, className = '' }: { speed?: number; count?: number; className?: string }) {
  const { theme } = useTheme();
  const reduce = useReducedMotion();
  const p = SKY[theme === 'night' ? 'night' : 'day'];
  const prev = useRef(p);
  const [veil, setVeil] = useState<{ top: string; bottom: string; on: boolean } | null>(null);

  useEffect(() => {
    if (prev.current === p) return;
    const old = prev.current;
    prev.current = p;
    setVeil({ top: old.top, bottom: old.bottom, on: true });
    const a = requestAnimationFrame(() => requestAnimationFrame(() => setVeil((v) => (v ? { ...v, on: false } : v))));
    const b = window.setTimeout(() => setVeil(null), 420);
    return () => {
      cancelAnimationFrame(a);
      window.clearTimeout(b);
    };
  }, [p]);

  const gradient = `linear-gradient(180deg, ${p.top}, ${p.bottom})`;
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} style={{ background: gradient }} aria-hidden="true">
      {!reduce && (
        <div style={{ width: `${SCALE * 100}%`, height: `${SCALE * 100}%`, transform: `scale(${1 / SCALE})`, transformOrigin: '0 0' }}>
          <CloudShader
            className="min-h-0"
            speed={speed * (theme === 'night' ? 0.6 : 1)}
            count={count}
            cloudColor={p.cloud}
            skyTopColor={p.top}
            skyBottomColor={p.bottom}
          />
        </div>
      )}
      {veil && (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, ${veil.top}, ${veil.bottom})`,
            opacity: veil.on ? 1 : 0,
            transition: 'opacity 350ms ease',
          }}
        />
      )}
    </div>
  );
}
