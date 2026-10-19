'use client';

import css from './kit.module.css';

/**
 * The one Void drawing used by every Story scene and Project.
 * It is a <g> (not a full <svg>) so a scene can place it with `transform`.
 * Local size: 200 wide x 262 tall (head 190 tall on top, body underneath).
 */
export type KittenProps = {
  eyes?: 'normal' | 'wide' | 'closed';
  look?: { x: number; y: number }; // -1..1, where the pupils point
  body?: boolean; // false = head only (peeking out of a box)
  tail?: 'sway' | 'fast' | 'still';
  blinkDelay?: number; // seconds, so scenes do not blink in sync
  transform?: string;
  onPressDown?: () => void;
};

export const KITTEN_W = 200;
export const KITTEN_H = 262;
/** Where the tail lives in kitten-local coordinates (centre + size), for placing a Hotspot over it. */
export const TAIL_BOX = { cx: 184, cy: 214, w: 64, h: 86 };

const RIM = '#2b2656'; // faint rim light so black stays visible on dark scenes

export function Kitten({ eyes = 'normal', look = { x: 0, y: 0 }, body = true, tail = 'sway', blinkDelay = 0, transform, onPressDown }: KittenProps) {
  const lx = look.x * 7;
  const ly = look.y * 7;
  return (
    <g transform={transform} className={css.kitten} data-eyes={eyes} onPointerDown={onPressDown}>
      {body && (
        <>
          <g className={css.tail} data-tail={tail}>
            <path d="M148 244 C 198 248 220 212 198 178" fill="none" stroke={RIM} strokeWidth="26" strokeLinecap="round" />
            <path d="M148 244 C 198 248 220 212 198 178" fill="none" stroke="#0d0b1a" strokeWidth="21" strokeLinecap="round" />
          </g>
          <ellipse cx="100" cy="206" rx="62" ry="52" fill="#0d0b1a" stroke={RIM} strokeWidth="3" />
          <ellipse cx="72" cy="252" rx="21" ry="9" fill="#171330" stroke={RIM} strokeWidth="2.5" />
          <ellipse cx="128" cy="252" rx="21" ry="9" fill="#171330" stroke={RIM} strokeWidth="2.5" />
        </>
      )}
      {/* head: same shapes as the logo */}
      <path d="M20 90Q10 40 40 6Q80 26 100 60Z" fill="#0d0b1a" stroke={RIM} strokeWidth="3" />
      <path d="M180 90Q190 40 160 6Q120 26 100 60Z" fill="#0d0b1a" stroke={RIM} strokeWidth="3" />
      <path d="M36 70Q32 30 46 16Q70 30 84 56Z" fill="#ffa9c6" />
      <path d="M164 70Q168 30 154 16Q130 30 116 56Z" fill="#ffa9c6" />
      <rect x="14" y="56" width="172" height="130" rx="52" fill="#0d0b1a" stroke={RIM} strokeWidth="3" />
      <ellipse cx="42" cy="152" rx="13" ry="7" fill="#ff6f91" opacity="0.35" />
      <ellipse cx="158" cy="152" rx="13" ry="7" fill="#ff6f91" opacity="0.35" />
      {[62, 138].map((cx) => (
        <g key={cx} className={css.eye} style={{ animationDelay: `${blinkDelay}s` }}>
          <ellipse className={css.eyeball} cx={cx} cy="116" rx="26" ry="30" fill="#b8f23a" />
          <ellipse className={css.pupil} cx={cx + lx} cy={116 + ly} rx="7" ry="22" fill="#0d0b1a" />
          <circle cx={cx - 10 + lx * 0.6} cy={102 + ly * 0.6} r="6" fill="#fff" />
        </g>
      ))}
      <path d="M92 150Q100 145 108 150Q104 160 100 162Q96 160 92 150Z" fill="#ff7aa8" />
      <path d="M100 162V167M100 167Q92 173 85 167M100 167Q108 173 115 167" stroke="#ff7aa8" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <g stroke="#fff8ec" strokeWidth="2.5" strokeLinecap="round" opacity="0.8">
        <path d="M26 148L-10 140M26 156L-12 160" />
        <path d="M174 148L210 140M174 156L212 160" />
      </g>
    </g>
  );
}
