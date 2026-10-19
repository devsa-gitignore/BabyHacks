'use client';

import { useState } from 'react';

/** Tiny Void face (navbar logo). `wink` = winks on click. */
export function VoidFace({ size = 40, wink = false }: { size?: number; wink?: boolean }) {
  const [w, setW] = useState(false);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 190"
      aria-hidden="true"
      focusable="false"
      onClick={() => {
        if (!wink) return;
        setW(true);
        window.setTimeout(() => setW(false), 300);
      }}
    >
      <path d="M20 90Q10 40 40 6Q80 26 100 60Z" fill="#0d0b1a" />
      <path d="M180 90Q190 40 160 6Q120 26 100 60Z" fill="#0d0b1a" />
      <path d="M36 70Q32 30 46 16Q70 30 84 56Z" fill="#ffa9c6" />
      <path d="M164 70Q168 30 154 16Q130 30 116 56Z" fill="#ffa9c6" />
      <rect x="14" y="56" width="172" height="130" rx="52" fill="#0d0b1a" />
      <ellipse cx="62" cy="116" rx="26" ry="30" fill="#b8f23a" />
      {w ? (
        <path d="M112 118Q138 96 164 118" stroke="#b8f23a" strokeWidth="9" fill="none" strokeLinecap="round" />
      ) : (
        <ellipse cx="138" cy="116" rx="26" ry="30" fill="#b8f23a" />
      )}
      <ellipse cx="62" cy="116" rx="7" ry="22" fill="#0d0b1a" />
      {!w && <ellipse cx="138" cy="116" rx="7" ry="22" fill="#0d0b1a" />}
      <circle cx="52" cy="102" r="6" fill="#fff" />
      {!w && <circle cx="128" cy="102" r="6" fill="#fff" />}
      <path d="M92 150Q100 145 108 150Q104 160 100 162Q96 160 92 150Z" fill="#ff7aa8" />
    </svg>
  );
}
