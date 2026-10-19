import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '@fontsource/gochi-hand/400.css';
import '@fontsource/nanum-pen-script/400.css';
import './globals.css';
import { Providers } from '@/components/Providers';
import { CAT_NAME, TAGLINE } from '@/config';

export const metadata: Metadata = {
  title: `${CAT_NAME}: the kitten who catches wishes`,
  description: `${TAGLINE} A sky-nursery portfolio starring ${CAT_NAME}, a baby black kitten.`,
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#3876ba',
};

// Runs before first paint so there is no day/night flash. First visit follows the OS setting.
const THEME_BOOT = `try{var t=localStorage.getItem('wk.theme');if(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches){t='night'}if(t==='night'){document.documentElement.setAttribute('data-theme','night');document.documentElement.classList.add('dark','night');}else{document.documentElement.setAttribute('data-theme','day');document.documentElement.classList.remove('dark','night');}}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
