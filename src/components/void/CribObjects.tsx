// The three crib-mobile objects. Original vector sticker art (ink outline, flat color, stepped details).
const INK = '#0d0b1a';
const O = { stroke: INK, strokeWidth: 4, strokeLinejoin: 'round', strokeLinecap: 'round' } as const;

export function StoryBook() {
  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%" aria-hidden="true" focusable="false">
      <g className="book-pages">
        <rect x="26" y="26" width="72" height="74" rx="6" fill="#fff8ec" {...O} transform="rotate(4 60 60)" />
        <rect x="22" y="22" width="72" height="74" rx="6" fill="#ff8fb1" {...O} />
        <rect x="22" y="22" width="14" height="74" rx="4" fill="#e0638c" {...O} />
        <path d="M46 44h34M46 56h26" stroke="#fff8ec" strokeWidth="5" strokeLinecap="round" />
        <path d="M76 22v26l7-6 7 6V22" fill="#ffe27a" {...O} />
        <rect x="50" y="68" width="26" height="14" rx="3" fill="#a8ecf0" {...O} />
      </g>
    </svg>
  );
}

export function ToyBlocks() {
  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%" aria-hidden="true" focusable="false">
      <g className="blocks">
        <rect x="14" y="62" width="44" height="44" rx="5" fill="#a8ecf0" {...O} />
        <rect x="62" y="62" width="44" height="44" rx="5" fill="#b3bfff" {...O} />
        <g transform="rotate(-9 60 40)">
          <rect x="38" y="18" width="44" height="44" rx="5" fill="#ffe27a" {...O} />
        </g>
        <text x="36" y="96" fontFamily="'Gochi Hand', cursive" fontSize="30" fill={INK}>A</text>
        <text x="84" y="96" fontFamily="'Gochi Hand', cursive" fontSize="30" fill={INK} textAnchor="middle">B</text>
        <path d="M60 36l3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1Z" fill="#ff6f91" {...O} strokeWidth="2.5" transform="rotate(-9 60 40)" />
      </g>
    </svg>
  );
}

const SLOTS: Array<[number, number, number]> = [
  [44, 78, 0], [70, 82, 1], [56, 62, 2], [36, 58, 3], [78, 60, 4], [50, 42, 5], [66, 44, 6], [42, 90, 7], [76, 92, 8], [58, 80, 9], [30, 76, 10], [84, 76, 11],
];

export function StarJar({ count = 0 }: { count?: number }) {
  const n = Math.min(12, Math.max(0, count));
  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%" aria-hidden="true" focusable="false">
      <g className="jar">
        <rect x="34" y="12" width="52" height="16" rx="4" fill="#ffc28a" {...O} />
        <path d="M30 28h60v12q14 8 14 26v30q0 14-14 14H30q-14 0-14-14V66q0-18 14-26Z" fill="rgba(255,255,255,0.55)" {...O} />
        <path d="M28 56q-4 12-2 26" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" />
        {SLOTS.slice(0, n).map(([x, y, i]) => (
          <path
            key={i}
            className="jar-star"
            d={`M${x} ${y - 7}l2.4 4.8 5.3.8-3.8 3.7.9 5.3-4.8-2.5-4.8 2.5.9-5.3-3.8-3.7 5.3-.8Z`}
            fill={i % 3 === 0 ? '#ffe27a' : i % 3 === 1 ? '#ff6f91' : '#b8f23a'}
            stroke={INK}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        ))}
        {n === 0 && <text x="60" y="84" textAnchor="middle" fontFamily="'Nanum Pen Script', cursive" fontSize="20" fill={INK} opacity=".55">empty</text>}
      </g>
    </svg>
  );
}

export function AboutBadge() {
  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%" aria-hidden="true" focusable="false">
      <g className="about-badge">
        {/* Ribbon banner */}
        <path d="M46 16L34 46L60 38L86 46L74 16Z" fill="#ff6f91" {...O} />
        {/* Rosette Medal */}
        <circle cx="60" cy="68" r="38" fill="#ffe27a" {...O} />
        <circle cx="60" cy="68" r="30" fill="#fff8ec" {...O} strokeDasharray="4 4" />
        {/* Kitten head silhouette */}
        <path d="M44 76C44 63 51 53 60 53C69 53 76 63 76 76Z" fill="#0d0b1a" {...O} strokeWidth="2.5" />
        {/* Ears */}
        <path d="M46 58L42 46L53 53Z" fill="#0d0b1a" {...O} strokeWidth="2" />
        <path d="M74 58L78 46L67 53Z" fill="#0d0b1a" {...O} strokeWidth="2" />
        {/* Eyes (lime green) */}
        <circle cx="53" cy="63" r="3.5" fill="#b8f23a" />
        <circle cx="67" cy="63" r="3.5" fill="#b8f23a" />
        {/* Star charm */}
        <path
          d="M60 76l1.8 3.6 3.9.6-2.8 2.7.7 3.9-3.6-1.9-3.6 1.9.7-3.9-2.8-2.7 3.9-.6Z"
          fill="#ffe27a"
          stroke="#0d0b1a"
          strokeWidth="1.2"
        />
      </g>
    </svg>
  );
}
