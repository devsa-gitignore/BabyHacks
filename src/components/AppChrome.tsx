'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { FEATURES } from '@/config';
import { Navbar } from './Navbar';
import { NavPending } from './NavPending';
import { Toggles } from './Toggles';

const Easter = dynamic(() => import('@/features/easter'), { ssr: false });

/** Fixed UI on every route: sound + theme toggles always, navbar everywhere except the landing page. */
export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <>
      <NavPending />
      <Toggles />
      {pathname !== '/' && <Navbar />}
      {children}
      {FEATURES.easter && <Easter />}
    </>
  );
}
