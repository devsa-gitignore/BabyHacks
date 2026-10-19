'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { FEATURES } from '@/config';
import { Navbar } from './Navbar';
import { Toggles } from './Toggles';

const Easter = dynamic(() => import('@/features/easter'), { ssr: false });

/** Fixed UI on every route: sound + theme toggles always, navbar on inner pages (projects, story, wishes). */
export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHomeOrLanding = pathname === '/' || pathname === '/home';
  return (
    <>
      <Toggles />
      {!isHomeOrLanding && <Navbar />}
      {children}
      {FEATURES.easter && <Easter />}
    </>
  );
}
