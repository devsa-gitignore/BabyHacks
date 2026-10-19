'use client';

import type { ReactNode } from 'react';
import { AudioProvider } from '@/audio';
import { IrisProvider } from '@/iris/IrisProvider';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { AboutProvider } from './AboutDialog';
import { AppChrome } from './AppChrome';
import { FxLayer } from './fx/FxLayer';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AudioProvider>
        <AboutProvider>
          <IrisProvider>
            <FxLayer>
              <AppChrome>{children}</AppChrome>
            </FxLayer>
          </IrisProvider>
        </AboutProvider>
      </AudioProvider>
    </ThemeProvider>
  );
}
