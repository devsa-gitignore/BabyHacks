'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CAT_NAME, NAV_ITEMS } from '@/config';
import { useAbout } from './AboutDialog';
import { IconSlot } from './IconSlot';
import { VoidFace } from './void/VoidFace';

function Loop() {
  return (
    <svg className="loop" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
      <path d="M8 22C6 8 40 2 70 6C98 10 98 32 62 36C26 40 4 32 10 16" />
    </svg>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { open } = useAbout();

  return (
    <>
      {/* Laptop: taped paper strip */}
      <nav className="nav-strip" aria-label="Main">
        <Link href="/home" className="nav-logo" aria-label={`${CAT_NAME}: home`}>
          <VoidFace size={52} wink />
          <span>{CAT_NAME}</span>
        </Link>
        {NAV_ITEMS.map((it) => (
          <Link key={it.key} href={it.href} className="nav-link" aria-current={pathname === it.href ? 'page' : undefined}>
            <IconSlot name={`nav-${it.key}`} size={46} zoom={1.7} />
            <span className="nav-label">{it.label}</span>
            <Loop />
          </Link>
        ))}
        <button type="button" className="nav-link" onClick={open}>
          <IconSlot name="nav-about" size={46} zoom={1.7} />
          <span className="nav-label">About</span>
        </button>
      </nav>

      {/* Phone / tablet: bottom dock in thumb reach */}
      <nav className="dock" aria-label="Main">
        {NAV_ITEMS.map((it) => (
          <Link key={it.key} href={it.href} className="dock-item" aria-current={pathname === it.href ? 'page' : undefined}>
            <span>
              <IconSlot name={`nav-${it.key}`} size={40} zoom={1.6} />
            </span>
            <span>{it.label}</span>
          </Link>
        ))}
        <button type="button" className="dock-item" onClick={open}>
          <span>
            <IconSlot name="nav-about" size={40} zoom={1.6} />
          </span>
          <span>About</span>
        </button>
      </nav>
    </>
  );
}
