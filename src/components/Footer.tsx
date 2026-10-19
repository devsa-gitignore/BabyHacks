import { CREDITS, CREDIT_NOTE } from '@/credits';
import { CreditButton } from './CreditButton';

export function Footer() {
  return (
    <footer className="relative z-[1] mt-16 text-center">
      <div className="flex flex-wrap justify-center gap-3">
        {CREDITS.map((c) => (
          <CreditButton key={c.label} credit={c} />
        ))}
      </div>
      <p className="footer-note mx-auto mt-4 inline-block rounded bg-[var(--paper)] px-3 py-1 [border:3px_solid_transparent]">{CREDIT_NOTE}</p>
    </footer>
  );
}
