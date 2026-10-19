'use client';

// React Bits Pixel Snow, unmodified, as a fixed background (Home + Wishes).
import PixelSnow from '@/components/react-bits/PixelSnow';
import { useDevice, useReducedMotion } from '@/hooks/useDevice';
import { useTheme } from '@/theme/ThemeProvider';

// glow: draw only the flakes (no light-mode wash), for pages that keep their own sky visible.
export function SnowBg({ paused = false, glow = false }: { paused?: boolean; glow?: boolean }) {
  const { theme } = useTheme();
  const device = useDevice();
  const reduce = useReducedMotion();
  const night = theme === 'night';
  if (device === null) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <PixelSnow
        variant="square"
        lightMode={!night && !glow}
        color={night ? '#ffe27a' : '#ffffff'}
        density={device === 'touch' ? 0.35 : 0.5}
        speed={0.6}
        flakeSize={1.2}
        pixelSize={device === 'touch' ? 4 : 5}
        mouseInteraction
        intro={!reduce}
        paused={paused || reduce}
      />
    </div>
  );
}
