import type { ReactNode } from 'react';

// Flat sticker-style fallback icons (24x24). Lottie files, when present, replace these via <IconSlot/>.
const S = { stroke: 'var(--ink)', strokeWidth: 1.8, strokeLinejoin: 'round', strokeLinecap: 'round' } as const;

const STAR4 = 'M12 2.5 L14.3 9.7 L21.5 12 L14.3 14.3 L12 21.5 L9.7 14.3 L2.5 12 L9.7 9.7Z';

const base: Record<string, ReactNode> = {
  home: <path d="M3.5 11.5 12 4l8.5 7.5V20h-5.5v-5.5h-6V20H3.5Z" fill="#ffd93d" {...S} />,
  story: (
    <>
      <path d="M3.5 5.5h7.2c.8 0 1.3.5 1.3 1.3v11.7c0-.7-.5-1.2-1.3-1.2H3.5Z" fill="#ffb3c9" {...S} />
      <path d="M20.5 5.5h-7.2c-.8 0-1.3.5-1.3 1.3v11.7c0-.7.5-1.2 1.3-1.2h7.2Z" fill="#a8ecf0" {...S} />
    </>
  ),
  projects: (
    <>
      <rect x="3.5" y="12.5" width="8" height="8" rx="1.6" fill="#8da7ec" {...S} />
      <rect x="12.5" y="12.5" width="8" height="8" rx="1.6" fill="#ffb3c9" {...S} />
      <rect x="8" y="3.5" width="8" height="8" rx="1.6" fill="#ffd93d" {...S} />
    </>
  ),
  wishes: <path d={STAR4} fill="#ffa31a" {...S} />,
  about: (
    <>
      <circle cx="12" cy="12" r="8.5" fill="#a8ecf0" {...S} />
      <path d="M12 11v5.2" {...S} />
      <circle cx="12" cy="7.9" r="0.6" fill="var(--ink)" {...S} />
    </>
  ),
  star: <path d={STAR4} fill="#ffd93d" {...S} />,
  heart: (
    <path
      d="M12 20.2C4.5 14.8 3 10 5.6 7c2.2-2.4 5-1.2 6.4 1.2C13.4 5.8 16.2 4.6 18.4 7c2.6 3 1.1 7.8-6.4 13.2Z"
      fill="#ff7aa8"
      {...S}
    />
  ),
  moon: <path d="M15.5 3.5A8.8 8.8 0 1 0 20.5 15 7.2 7.2 0 0 1 15.5 3.5Z" fill="#ffe58a" {...S} />,
  cloud: (
    <path
      d="M7 18.5a3.6 3.6 0 0 1-.4-7.2A5.2 5.2 0 0 1 16.6 9.6a4.4 4.4 0 0 1 .9 8.9Z"
      fill="#f7dede"
      {...S}
    />
  ),
  sparkle: (
    <>
      <path d="M10 3.5 11.8 9l5.5 1.8-5.5 1.8L10 18.2 8.2 12.6 2.7 10.8 8.2 9Z" fill="#ffd93d" {...S} />
      <path d="M18.5 14.2l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9Z" fill="#a8ecf0" {...S} />
    </>
  ),
};

const alias: Record<string, string> = {
  'door-story': 'story',
  'door-projects': 'projects',
  'door-wishes': 'wishes',
  'nav-home': 'home',
  'nav-story': 'story',
  'nav-projects': 'projects',
  'nav-wishes': 'wishes',
  'nav-about': 'about',
  'icon-star': 'star',
  'icon-heart': 'heart',
  'icon-moon': 'moon',
  'icon-cloud': 'cloud',
  'icon-sparkle': 'sparkle',
  'wish-star': 'star',
  'wish-heart': 'heart',
  'wish-moon': 'moon',
  'wish-cloud': 'cloud',
  'wish-sparkle': 'sparkle',
};

export function FallbackIcon({ name, size = 24 }: { name: string; size?: number }) {
  const key = alias[name] ?? name;
  const body = base[key] ?? base.star;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" style={{ display: 'block' }}>
      {body}
    </svg>
  );
}

export function StarShape({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="star-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd93d" />
          <stop offset="1" stopColor="#ff8a00" />
        </linearGradient>
      </defs>
      <path d={STAR4} fill="url(#star-grad)" stroke="#ffe27a" strokeWidth="0.8" strokeLinejoin="round" />
    </svg>
  );
}

export const SoundOnIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z" fill="currentColor" fillOpacity=".25" />
    <path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11" />
  </svg>
);
export const SoundOffIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z" fill="currentColor" fillOpacity=".25" />
    <path d="m16 9.5 5 5m0-5-5 5" />
  </svg>
);
export const SunIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4.2" fill="currentColor" fillOpacity=".3" />
    <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
  </svg>
);
export const MoonIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15.5 3.5A8.8 8.8 0 1 0 20.5 15 7.2 7.2 0 0 1 15.5 3.5Z" fill="currentColor" fillOpacity=".3" />
  </svg>
);
