'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import ElasticMesh, { type ElasticMeshMaterial } from '@/components/react-bits/ElasticMesh';
import { hasWebGL2, useReducedMotion } from '@/hooks/useDevice';
import { useAudio } from '@/audio';
import { useTheme } from '@/theme/ThemeProvider';

export interface ElasticHeadingProps {
  text?: string;
  src?: string;
  as?: 'h1' | 'h2' | 'h3';
  material?: ElasticMeshMaterial;
  color?: string;
  imageColors?: boolean;
  inflate?: number;
  stiffness?: number;
  wobble?: number;
  grabRadius?: number;
  stretch?: number;
  press?: number;
  shadow?: number;
  intro?: boolean;
  theme?: 'dark' | 'light';
  fontFamily?: string;
  fontWeight?: number | string;
  height?: string | number;
  className?: string;
  style?: CSSProperties;
  fallbackClassName?: string;
}

export function ElasticHeading({
  text = 'Squish',
  src,
  as: Tag = 'h1',
  material = 'balloon',
  color = '#3b5bff',
  imageColors = false,
  inflate = 1,
  stiffness = 0.5,
  wobble = 0.6,
  grabRadius = 70,
  stretch = 0.5,
  press = 0.5,
  shadow = 0.5,
  intro,
  theme,
  fontFamily = "'Gochi Hand', cursive",
  fontWeight = 400,
  height = '240px',
  className = '',
  style,
  fallbackClassName = '',
}: ElasticHeadingProps) {
  const [gl, setGl] = useState<boolean | null>(null);
  const reduce = useReducedMotion();
  const { theme: currentTheme } = useTheme();
  const { play } = useAudio();

  useEffect(() => {
    setGl(hasWebGL2());
  }, []);

  const activeTheme: 'dark' | 'light' = theme ?? (currentTheme === 'night' ? 'dark' : 'light');
  const shouldIntro = intro !== undefined ? intro : !reduce;
  const containerHeight = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`relative w-full cursor-grab active:cursor-grabbing select-none ${className}`}
      style={{
        width: '100%',
        height: containerHeight,
        position: 'relative',
        ...style,
      }}
      onPointerDown={() => play('boing')}
    >
      <Tag className="sr-only">{text}</Tag>
      {gl ? (
        <ElasticMesh
          key={`${text}-${activeTheme}`}
          text={text}
          src={src}
          material={material}
          color={color}
          imageColors={imageColors}
          inflate={inflate}
          stiffness={stiffness}
          wobble={wobble}
          grabRadius={grabRadius}
          stretch={stretch}
          press={press}
          shadow={shadow}
          intro={shouldIntro}
          theme={activeTheme}
          fontFamily={fontFamily}
          fontWeight={fontWeight}
        />
      ) : (
        <div
          aria-hidden="true"
          className={`grid h-full w-full place-items-center ${fallbackClassName}`}
        >
          <span className="h-display text-[clamp(2.6rem,7vw,4.5rem)] text-[var(--paper)] [text-shadow:4px_4px_0_var(--ink)]">
            {text}
          </span>
        </div>
      )}
    </div>
  );
}

export default ElasticHeading;
