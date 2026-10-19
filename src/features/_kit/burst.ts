// Tiny pixel-square confetti. DOM + Web Animations, no library. Skipped on reduced motion.
export const BURST_COLORS = ['#ff6f91', '#b8f23a', '#fff8ec', '#ffe27a'];

export function burst(x: number, y: number, colors: string[] = BURST_COLORS, count = 18) {
  if (typeof document === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const n = Math.min(count, 24);
  for (let i = 0; i < n; i++) {
    const el = document.createElement('div');
    const size = 6 + Math.round(Math.random() * 6);
    el.setAttribute('aria-hidden', 'true');
    el.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:${size}px;height:${size}px;background:${colors[i % colors.length]};border:2px solid transparent;pointer-events:none;z-index:95;`;
    document.body.appendChild(el);
    const a = Math.random() * Math.PI * 2;
    const d = 60 + Math.random() * 110;
    const dx = Math.cos(a) * d;
    const dy = Math.sin(a) * d - 40;
    const anim = el.animate(
      [
        { transform: 'translate(-50%,-50%) scale(1) rotate(0deg)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 120}px)) scale(0.5) rotate(${Math.random() * 360}deg)`, opacity: 0 },
      ],
      { duration: 800 + Math.random() * 500, easing: 'cubic-bezier(.2,.8,.3,1)' },
    );
    anim.onfinish = () => el.remove();
  }
}

/** Burst from the centre of an element. */
export function burstFrom(el: Element | null, colors?: string[], count?: number) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, colors, count);
}
