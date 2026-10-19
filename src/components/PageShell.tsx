import type { ReactNode } from 'react';
import { Footer } from './Footer';

/** Shared wrapper for every inner page. The navbar, theme, audio and toggles come from the root layout. */
export function PageShell({ children, footer = true }: { children: ReactNode; footer?: boolean }) {
  return (
    <main className="page">
      {children}
      {footer && <Footer />}
    </main>
  );
}
