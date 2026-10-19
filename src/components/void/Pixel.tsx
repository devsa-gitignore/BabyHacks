// Tiny pixel-art sprites built from character grids. Pixelation as design: shapes only, never type.
import type { CSSProperties } from 'react';

export function Sprite({
  rows,
  palette,
  px = 4,
  className,
  style,
}: {
  rows: string[];
  palette: Record<string, string>;
  px?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const w = Math.max(...rows.map((r) => r.length));
  return (
    <svg
      viewBox={`0 0 ${w} ${rows.length}`}
      width={w * px}
      height={rows.length * px}
      shapeRendering="crispEdges"
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      {rows.flatMap((row, y) =>
        [...row].map((ch, x) => (palette[ch] ? <rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" fill={palette[ch]} /> : null)),
      )}
    </svg>
  );
}

const WING = [
  '..XX....',
  '.XXXX...',
  'XXOOXX..',
  'XXOOXX..',
  '.XXXX...',
  '.XXXXX..',
  '..XXX...',
  '...X....',
];
const mirror = (r: string) => [...r].reverse().join('');

export function PixelButterfly({ px = 6 }: { px?: number }) {
  const rows = WING.map((r) => r + mirror(r));
  return (
    <span className="butterfly-wings inline-block" style={{ lineHeight: 0 }}>
      <Sprite rows={rows} px={px} palette={{ X: '#ff6f91', O: '#ffe27a' }} />
    </span>
  );
}

export const STAR_ROWS = [
  '....X....',
  '....X....',
  '...XXX...',
  'XXXXXXXXX',
  '.XXXXXXX.',
  '..XXXXX..',
  '..XXXXX..',
  '.XXX.XXX.',
  '.XX...XX.',
];

export function PixelStar({ px = 3, color = '#ffe27a' }: { px?: number; color?: string }) {
  return <Sprite rows={STAR_ROWS} px={px} palette={{ X: color }} />;
}

export function PixelHeart({ px = 3, color = '#ff6f91' }: { px?: number; color?: string }) {
  return (
    <Sprite
      rows={['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...']}
      px={px}
      palette={{ X: color }}
    />
  );
}
