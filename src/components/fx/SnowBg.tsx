'use client';

// React Bits Pixel Snow, unmodified, as a fixed background (Home + Wishes).
import PixelSnow from '@/components/react-bits/PixelSnow';
import { useDevice, useReducedMotion } from '@/hooks/useDevice';
import { useTheme } from '@/theme/ThemeProvider';

export function SnowBg({ paused = false }: { paused?: boolean }) {
  const { theme } = useTheme();
  const device = useDevice();
  const reduce = useReducedMotion();
  const night = theme === 'night';
  if (device === null) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <PixelSnow
        key={theme}
        variant="square"
        lightMode={!night}
        color={night ? '#ffe485' : '#ffffff'}
        density={device === 'touch' ? 0.35 : 0.5}
        speed={night ? 0.45 : 0.6}
        flakeSize={1.2}
        pixelSize={device === 'touch' ? 4 : 5}
        mouseInteraction
        intro={false}
        paused={paused || reduce}
      />
    </div>
  );
}
