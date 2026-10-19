'use client';

// Pixel Trail on laptops (hover + fine pointer), star Click Spark on phones (touch). Both are the
// React Bits components, unmodified. ClickSpark always wraps the app (disabled on laptop) so the
// React tree never remounts when the device type is detected.
import type { ReactNode } from 'react';
import ClickSpark from '@/components/react-bits/ClickSpark';
import PixelTrail from '@/components/react-bits/PixelTrail';
import { useDevice, useReducedMotion } from '@/hooks/useDevice';

export function FxLayer({ children }: { children: ReactNode }) {
  const device = useDevice();
  const reduce = useReducedMotion();
  return (
    <ClickSpark
      disabled={device !== 'touch' || reduce}
      shape="star"
      sparkColor={['#ffe27a', '#ff6f91', '#b8f23a', '#ffffff']}
      sparkCount={10}
      sparkSize={14}
      sparkRadius={34}
      duration={650}
      easing="ease-out"
      style={{ height: 'auto', minHeight: '100dvh' }}
    >
      {children}
      {device === 'laptop' && !reduce && (
        <div className="pointer-events-none fixed inset-0 z-[2]" aria-hidden="true">
          <PixelTrail
            shape="diamond"
            color="#ffe27a"
            gooeyFilter={false}
            decay="shrink"
            maxAge={240}
            gridSize={96}
            trailSize={0.032}
            sparkle={0.25}
            glow={0.15}
            clickBurst
            stopOverComponents
          />
        </div>
      )}
    </ClickSpark>
  );
}
