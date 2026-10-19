import type { ReactNode } from 'react';

// 220ms fade + 12px slide for ordinary route changes (the iris handles Landing -> Home).
export default function Template({ children }: { children: ReactNode }) {
  return <div className="page-in">{children}</div>;
}
