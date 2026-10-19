'use client';

import css from './kit.module.css';

/**
 * An invisible <button> placed over an SVG scene by viewBox coordinates.
 * Real button = keyboard + screen-reader + 44px minimum tap target for free.
 */
export function Hotspot({
  cx,
  cy,
  w,
  h,
  vbW = 400,
  vbH = 300,
  label,
  onPress,
  pressed,
  disabled,
  pulse,
}: {
  cx: number;
  cy: number;
  w: number;
  h: number;
  vbW?: number;
  vbH?: number;
  label: string;
  onPress: (e: React.MouseEvent<HTMLButtonElement>) => void;
  pressed?: boolean;
  disabled?: boolean;
  pulse?: boolean;
}) {
  return (
    <button
      type="button"
      data-sfx="off"
      data-pulse={pulse ? '1' : undefined}
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      className={css.hot}
      style={{ left: `${(cx / vbW) * 100}%`, top: `${(cy / vbH) * 100}%`, width: `${(w / vbW) * 100}%`, height: `${(h / vbH) * 100}%` }}
      onClick={onPress}
    />
  );
}
