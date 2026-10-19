import type { Credit } from '@/credits';

// A classic 88x31 web button: pixel-art box, normal type.
export function CreditButton({ credit }: { credit: Credit }) {
  return (
    <a
      className="credit-btn"
      href={credit.href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ background: credit.bg }}
      aria-label={`${credit.label}: ${credit.sub} (opens in a new tab)`}
      title={`${credit.label}: ${credit.sub}`}
    >
      <b>{credit.label}</b>
      <i>{credit.sub}</i>
    </a>
  );
}
