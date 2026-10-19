'use client';

import type { ReactNode } from 'react';
import css from './projects.module.css';

/** Shared frame for every project: title, subtitle, the stage itself. */
export function Stage({ id, title, subtitle, children }: { id: string; title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className={css.stage}>
      <header className={css.stageHead}>
        <h2 id={id} className={css.stageTitle}>{title}</h2>
        <p className={css.stageSub}>{subtitle}</p>
      </header>
      {children}
    </div>
  );
}
