'use client';

import css from './kit.module.css';

export type PuppetId = 'butterfly' | 'bunny' | 'bird' | 'dragon';

export const PUPPETS: Array<{ id: PuppetId; label: string; says: string }> = [
  { id: 'butterfly', label: 'Butterfly', says: 'Her name is Brenda.' },
  { id: 'bunny', label: 'Bunny', says: "He's very serious about carrots." },
  { id: 'bird', label: 'Bird', says: 'Technically a pigeon.' },
  { id: 'dragon', label: 'Dragon', says: 'Excellent hair.' },
];

const FILL = '#0d0b1a';

/** Silhouettes drawn in a 100x100 box. Returns a <g>, so it can sit inside any <svg>. Parts carry classes so CSS can animate them. */
export function PuppetShape({ id }: { id: PuppetId }) {
  switch (id) {
    // Hand-shadow style: each animal is a few flowing curves (no circles/rects), slightly asymmetric so it reads hand-made.
    case 'butterfly':
      return (
        <g className={css.all} fill={FILL}>
          <path className={css.wl} d="M49 47C45 31 35 15 21 12C9 10 3 21 8 31C10 35 8 38 11 41C16 46 31 50 49 51Z" />
          <path className={css.wl} d="M49 54C40 55 27 60 22 71C19 79 24 88 32 85C34 89 40 87 42 82C46 75 48 65 49 58Z" />
          <path className={css.wr} d="M51 46C56 29 67 13 81 11C92 10 97 22 92 31C90 35 92 39 88 42C83 47 69 50 51 51Z" />
          <path className={css.wr} d="M51 54C60 56 72 62 77 72C80 80 74 88 67 84C64 88 59 86 57 80C54 73 52 64 51 58Z" />
          <path d="M50 33C53 34 53.6 45 53 57C52.4 67 51 73 50 73C49 73 47.6 67 47 57C46.4 45 47 34 50 33Z" />
          <path d="M49 35C47 27 42 20 35 17M51 35C54 26 60 21 66 19" stroke={FILL} strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M33 15.5a2.6 2.6 0 1 0 0.1 0ZM67.5 17a2.6 2.6 0 1 0 0.1 0Z" />
        </g>
      );
    case 'bunny':
      return (
        <g className={css.all} fill={FILL}>
          <path d="M44 31C39 23 33 11 35 4C37 -1 44 4 47 14C49 21 49 27 48 31Z" />
          <path d="M54 30C57 22 63 14 71 11C77 10 79 16 73 20C67 24 61 28 58 33Z" />
          <path d="M50 27C59 26 66 32 66 40C68 41 69 43 66 45C65 48 62 50 60 51C70 55 78 64 77 75C76 86 67 92 55 92H37C31 92 28 89 32 86C27 82 25 75 27 67C29 58 35 52 41 50C36 46 34 41 35 36C37 30 43 27 50 27Z" />
          <path d="M76 78C79 73 86 74 86 79C88 82 84 87 80 85C77 85 75 82 76 78Z" />
        </g>
      );
    case 'bird':
      return (
        <g className={css.all} fill={FILL}>
          <path d="M8 50C16 46 25 48 32 52C38 44 50 40 62 42C65 35 73 31 80 35C83 37 85 40 86 42L96 45L86 49C84 54 78 58 72 60C68 66 58 70 46 69C37 68 31 65 28 61C20 63 12 61 5 56C9 55 11 53 8 50Z" />
          <path className={css.wing} d="M40 53C39 41 49 28 63 25C61 35 59 47 54 57Z" />
          <path d="M45 68C44 75 41 82 38 86M55 68C56 76 58 82 61 86" stroke={FILL} strokeWidth="2.6" fill="none" strokeLinecap="round" />
        </g>
      );
    case 'dragon':
      return (
        <g className={css.all} fill={FILL}>
          {/* the excellent hair: flowing locks off the back of the head */}
          <path d="M67 31C61 21 50 20 43 27C49 25 54 27 56 31C49 29 42 32 38 39C45 36 51 38 55 41C50 43 46 48 46 53C52 48 59 45 64 43Z" />
          <path d="M73 30C73 23 77 18 83 15C81 20 81 25 80 30Z" />
          <path d="M14 82C8 78 10 70 18 72C24 74 29 76 35 71C41 65 45 58 54 54C60 52 63 50 65 46C61 41 62 34 68 30C74 26 82 28 86 34L96 38C98 40 96 43 92 43L86 44C84 50 78 53 72 55C70 63 66 70 58 76C56 84 54 89 51 92H46C47 88 48 84 46 80C42 80 39 80 36 82C36 86 36 89 34 92H30C30 88 30 84 28 80C22 84 18 86 14 82Z" />
          <path className={css.wing} d="M50 57C44 45 34 35 21 31C25 37 27 41 27 45C21 43 17 43 13 45C21 49 30 55 38 63Z" />
        </g>
      );
  }
}

/** Standalone SVG wrapper. `act` replays the puppet's little animation; `idle` keeps it gently alive. */
export function Puppet({ id, act, idle, className, x, y, width, height }: { id: PuppetId; act?: boolean; idle?: boolean; className?: string; x?: number; y?: number; width?: number; height?: number }) {
  return (
    <svg x={x} y={y} width={width} height={height} viewBox="0 0 100 100" className={`${css.puppet} ${className ?? ''}`} data-kind={id} data-act={act ? 'on' : undefined} data-idle={idle ? '1' : undefined} aria-hidden="true" focusable="false">
      <PuppetShape id={id} />
    </svg>
  );
}
