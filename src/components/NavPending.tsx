'use client';

// Instant feedback for in-site links. Heavy pages (3D, WebGL) can take a second to mount, and without a
// visible response a click looked like it did nothing. A soft bar runs along the top and the clicked link
// pulses until the new route arrives.
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export function NavPending() {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const clicked = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      clicked.current?.removeAttribute('data-loading');
      a.setAttribute('data-loading', '1');
      clicked.current = a;
      setPending(true);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // dev only: pages compile on first visit, which took seconds and made nav clicks look dead. Warm every
  // route in the background once the site has loaded, so the first click is quick.
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    const timers: number[] = [];
    timers.push(
      window.setTimeout(() => {
        ['/home', '/story', '/projects', '/wishes'].forEach((h, i) =>
          timers.push(window.setTimeout(() => void fetch(h, { priority: 'low' } as RequestInit).catch(() => {}), i * 1200)),
        );
      }, 2500),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  // the route arrived (or gave up after 15s): clear the feedback
  useEffect(() => {
    clicked.current?.removeAttribute('data-loading');
    clicked.current = null;
    setPending(false);
  }, [pathname]);
  useEffect(() => {
    if (!pending) return;
    const t = window.setTimeout(() => setPending(false), 15000);
    return () => window.clearTimeout(t);
  }, [pending]);

  return <div className="nav-pending" data-on={pending ? '1' : undefined} role="progressbar" aria-hidden={!pending} aria-label="Loading the next page" />;
}
