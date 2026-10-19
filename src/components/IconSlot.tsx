'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { FallbackIcon } from './icons';

// Lottie files live in /public/lottie/<name>.lottie. A name is only fetched if it is listed in
// /public/lottie/manifest.json (so a missing file never produces a 404 in the console).
let manifestPromise: Promise<string[]> | null = null;
function loadManifest(): Promise<string[]> {
  if (!manifestPromise) {
    manifestPromise = fetch('/lottie/manifest.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((j) => (Array.isArray(j) ? (j as string[]) : []))
      .catch(() => []);
  }
  return manifestPromise;
}

const MAX_ANIMATING = 3;
let animating = 0;

type DotLottie = ComponentType<{ src: string; loop?: boolean; autoplay?: boolean; style?: React.CSSProperties }>;
let playerPromise: Promise<DotLottie | null> | null = null;
function loadPlayer(): Promise<DotLottie | null> {
  if (!playerPromise) {
    playerPromise = import('@lottiefiles/dotlottie-react')
      .then((m) => m.DotLottieReact as unknown as DotLottie)
      .catch(() => null);
  }
  return playerPromise;
}

export function IconSlot({ name, size = 28, label }: { name: string; size?: number; label?: string }) {
  const [Player, setPlayer] = useState<DotLottie | null>(null);

  useEffect(() => {
    let cancelled = false;
    let claimed = false;
    const run = async () => {
      const list = await loadManifest();
      if (cancelled || !list.includes(name) || animating >= MAX_ANIMATING) return;
      animating += 1;
      claimed = true;
      const P = await loadPlayer();
      if (cancelled) return;
      if (P) setPlayer(() => P);
      else {
        animating -= 1;
        claimed = false;
      }
    };
    const idle = (window as unknown as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    const handle = idle ? idle(() => void run()) : window.setTimeout(() => void run(), 400);
    return () => {
      cancelled = true;
      if (claimed) animating -= 1;
      if (!idle) window.clearTimeout(handle as number);
    };
  }, [name]);

  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ display: 'inline-block', width: size, height: size, lineHeight: 0 }}
    >
      {Player ? (
        <Player src={`/lottie/${name}.lottie`} loop autoplay style={{ width: size, height: size }} />
      ) : (
        <FallbackIcon name={name} size={size} />
      )}
    </span>
  );
}
