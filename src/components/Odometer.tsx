'use client';

/** Rolling digit counter. Each digit column slides to its number over 700ms. */
export function Odometer({ value, className = '' }: { value: number; className?: string }) {
  const digits = String(Math.max(0, Math.floor(value))).split('');
  return (
    <span className={`odo ${className}`} aria-label={String(value)} role="text">
      {digits.map((d, i) => (
        <span key={digits.length - i} className="odo-col" aria-hidden="true">
          <div style={{ transform: `translateY(-${Number(d) * 1.15}em)` }}>
            {Array.from({ length: 10 }, (_, n) => (
              <span key={n}>{n}</span>
            ))}
          </div>
        </span>
      ))}
    </span>
  );
}
