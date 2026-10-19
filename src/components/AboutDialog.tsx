'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CAT_NAME, CHARACTER_SHEET } from '@/config';
import { CREDITS, CREDIT_NOTE } from '@/credits';
import { CreditButton } from './CreditButton';
import { VoidFace } from './void/VoidFace';

type AboutApi = { open: () => void };
const AboutContext = createContext<AboutApi>({ open: () => {} });
export const useAbout = () => useContext(AboutContext);

const FIELDS: Array<[string, keyof typeof CHARACTER_SHEET]> = [
  ['Name', 'name'],
  ['What they are', 'what'],
  ['What they do', 'does'],
  ['Their story', 'story'],
  ['Tagline', 'tagline'],
];

export function AboutProvider({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [isOpen, setOpen] = useState(false);

  const open = useCallback(() => {
    const d = ref.current;
    if (!d || d.open) return;
    d.classList.remove('closing');
    try {
      d.showModal();
      setOpen(true);
    } catch {}
  }, []);

  const close = useCallback(() => {
    const d = ref.current;
    if (!d || !d.open) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      d.close();
      return;
    }
    d.classList.add('closing');
    window.setTimeout(() => d.close(), 220);
  }, []);

  // Escape: let the closing animation play.
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      close();
    };
    d.addEventListener('cancel', onCancel);
    return () => d.removeEventListener('cancel', onCancel);
  }, [close]);

  const value = useMemo(() => ({ open }), [open]);

  return (
    <AboutContext.Provider value={value}>
      {children}
      <dialog
        ref={ref}
        className="about-dialog"
        aria-labelledby="about-title"
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === ref.current) close();
        }}
      >
        <div className="sheet paper" data-open={isOpen}>
          <span className="tape" aria-hidden="true" />
          <header className="flex items-center gap-3">
            <VoidFace size={52} />
            <h2 id="about-title" className="h-display m-0 text-[2.6rem]">
              Meet {CAT_NAME}
            </h2>
          </header>
          <dl className="m-0">
            {FIELDS.map(([label, key]) => (
              <div key={key}>
                <dt>{label}</dt>
                <dd>{CHARACTER_SHEET[key]}</dd>
              </div>
            ))}
          </dl>
          <section aria-label="Credits" className="mt-5">
            <div className="flex flex-wrap gap-3">
              {CREDITS.map((c) => (
                <CreditButton key={c.label} credit={c} />
              ))}
            </div>
            <p className="mt-3 text-base opacity-80">{CREDIT_NOTE}</p>
          </section>
          <div className="mt-5 flex justify-end">
            <button type="button" className="px-btn" onClick={close}>
              <span>Close</span>
            </button>
          </div>
        </div>
      </dialog>
    </AboutContext.Provider>
  );
}
