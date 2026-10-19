'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CAT_NAME } from '@/config';
import { hasWebGL2, useDevice } from '@/hooks/useDevice';
import { useTheme } from '@/theme/ThemeProvider';
import { VoidHero, type VoidState } from './VoidHero';

const Scene = dynamic(() => import('./Void3DScene'), { ssr: false });

/** 3D pixelated Void with gestures (tap = squish, hold = purr). Falls back to the 2D Void without WebGL2. */
export function Void3D({
  state,
  onPoke,
  onHold,
  squishRef,
  className = '',
}: {
  state: VoidState;
  onPoke: () => void;
  onHold: (on: boolean) => void;
  squishRef: React.MutableRefObject<number>;
  className?: string;
}) {
  const [gl, setGl] = useState<boolean | null>(null);
  const device = useDevice();
  const { theme } = useTheme();
  const look = useRef({ x: 0, y: 0 });
  const holdTimer = useRef(0);
  const held = useRef(false);
  const drag = useRef<{ x: number; moved: boolean } | null>(null);
  useEffect(() => setGl(hasWebGL2()), []);
  useEffect(() => () => window.clearTimeout(holdTimer.current), []);

  const down = useCallback(
    (e: React.PointerEvent) => {
      drag.current = { x: e.clientX, moved: false };
      held.current = false;
      window.clearTimeout(holdTimer.current);
      holdTimer.current = window.setTimeout(() => {
        if (drag.current && !drag.current.moved) {
          held.current = true;
          onHold(true);
        }
      }, 600);
    },
    [onHold],
  );
  const up = useCallback(() => {
    window.clearTimeout(holdTimer.current);
    if (held.current) {
      held.current = false;
      onHold(false);
    } else if (drag.current && !drag.current.moved) {
      squishRef.current = 1;
      onPoke();
    }
    drag.current = null;
  }, [onHold, onPoke, squishRef]);
  const move = useCallback((e: React.PointerEvent) => {
    if (drag.current && Math.abs(e.clientX - drag.current.x) > 10) drag.current.moved = true;
  }, []);

  if (gl === null) return <div className={className} />;
  if (!gl) {
    return (
      <div className={className}>
        <VoidHero state={state} cloud={false} onPoke={onPoke} onHold={onHold} className="block h-full w-full" />
      </div>
    );
  }
  return (
    <div
      className={className}
      role="img"
      aria-label={`${CAT_NAME}, a pixelated 3D baby black kitten. Tap to poke, hold to pet.`}
      onPointerDown={down}
      onPointerUp={up}
      onPointerMove={move}
      onPointerCancel={up}
      style={{ cursor: 'pointer' }}
    >
      <Scene state={state} granularity={device === 'touch' ? 4 : 6} night={theme === 'night'} lookRef={look} squishRef={squishRef} />
    </div>
  );
}
