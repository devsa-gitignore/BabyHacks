'use client';

// React Bits Elastic Mesh, unmodified, rendering the "Void" wordmark. Falls back to plain text without WebGL2.
import { useEffect, useState } from 'react';
import ElasticMesh from '@/components/react-bits/ElasticMesh';
import { hasWebGL2, useReducedMotion } from '@/hooks/useDevice';
import { useAudio } from '@/audio';
import { useTheme } from '@/theme/ThemeProvider';

export function Wordmark({ text, className = '' }: { text: string; className?: string }) {
  const [gl, setGl] = useState<boolean | null>(null);
  const reduce = useReducedMotion();
  const { theme } = useTheme();
  const { play } = useAudio();
  useEffect(() => setGl(hasWebGL2()), []);
  const night = theme === 'night';

  return (
    <div className={className} onPointerDown={() => play('boing')}>
      <h1 className="sr-only">{text}</h1>
      {gl ? (
        <ElasticMesh
          text={text}
          fontFamily="'Gochi Hand', cursive"
          fontWeight={400}
          color={night ? '#fff8ec' : '#0d0b1a'}
          material={night ? 'jelly' : 'balloon'}
          inflate={1.1}
          wobble={0.7}
          shadow={0.6}
          intro={!reduce}
          theme={night ? 'dark' : 'light'}
        />
      ) : (
        <p aria-hidden="true" className="h-display grid h-full place-items-center text-[clamp(6rem,24vw,13rem)]">
          {text}
        </p>
      )}
    </div>
  );
}
