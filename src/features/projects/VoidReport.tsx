'use client';

// Project 4. A cute fake paper. The "Peer review" switch reveals Void's sticky-note comments.
import { useEffect, useRef, useState } from 'react';
import { useAudio } from '@/audio';
import { Stage } from './Stage';
import css from './projects.module.css';

const SECTIONS = [
  { h: 'Abstract', p: 'We observed one (1) kitten staring at one (1) wall for 14 minutes. The wall did nothing. Void did not blink. Results suggest the wall is either very interesting or haunted by a dust bunny. Further research (and snacks) are needed.', note: 'Reviewer 2 (also Void): needs more naps.' },
  { h: 'Introduction', p: 'Cats have stared at walls since the invention of walls. Scientists have mostly stared back at the cats.', note: 'Reviewer 1 (also Void): who is the wall, and why is it so confident?' },
  { h: 'Methods', p: 'One kitten, one wall, one stopwatch. Snacks were withheld until the experiment ended, for science and for leverage.', note: 'Reviewer 3 (also Void): 14 minutes? I have stared for longer. Show-off.' },
  { h: 'Results', p: 'The wall remained a wall. The kitten remained unblinking. A dust bunny was briefly implicated and has declined to comment.', note: 'Reviewer 2 (also Void): the napping bar is correct. 10/10.' },
  { h: 'Conclusion', p: 'Walls are interesting. Or haunted. Either way, the kitten is not leaving.', note: 'Reviewer 2 again: please send snacks with the revision.' },
];

// Figure 1: minutes spent. `inf` bars run off the edge with an arrow.
const BARS = [
  { label: 'Staring at wall', v: 14, text: '14 min', c: '#b3bfff' },
  { label: 'Napping', v: 240, text: '240 min', c: '#a8ecf0' },
  { label: 'Knocking things off tables', v: 3, text: '3 min', c: '#ffc28a' },
  { label: 'Judging you', v: Infinity, text: 'infinite', c: '#ff6f91' },
];
const X0 = 14;
const MAXW = 290; // width of the 240-minute bar

function Figure() {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setSeen(true), io.disconnect()), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <figure ref={ref} className={css.figure} data-seen={seen ? '1' : undefined}>
      <svg viewBox="0 0 400 196" role="img" aria-label="Bar chart. Staring at wall 14 minutes, napping 240 minutes, knocking things off tables 3 minutes, judging you infinite.">
        {BARS.map((b, i) => {
          const y = 8 + i * 47;
          const inf = !isFinite(b.v);
          const w = inf ? 372 : Math.max(6, (b.v / 240) * MAXW);
          return (
            <g key={b.label}>
              <text x={X0} y={y + 12} className={css.figLabel}>{b.label}</text>
              <rect className={css.bar} style={{ '--d': `${i * 120}ms` } as React.CSSProperties} x={X0} y={y + 18} width={w} height="18" rx="3" fill={b.c} stroke="#0d0b1a" strokeWidth="2.5" />
              {inf ? (
                <>
                  <path className={css.barArrow} d={`M382 ${y + 21}L396 ${y + 27}L382 ${y + 33}Z`} fill="#0d0b1a" />
                  <text x={X0 + 10} y={y + 32} className={css.figVal}>forever</text>
                </>
              ) : (
                <text x={X0 + w + 8} y={y + 32} className={css.figVal}>{b.text}</text>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption className={css.figCap}><b>Figure 1.</b> Time Spent Staring at Wall vs. Other Activities. (The bar for judging you does not fit on the page.)</figcaption>
    </figure>
  );
}

export default function VoidReport() {
  const { play } = useAudio();
  const [review, setReview] = useState(false);
  return (
    <Stage id="report-title" title="The Void Report" subtitle="A peer-reviewed* study.">
      <div className={css.reviewBar}>
        <span id="review-label">Peer review</span>
        <button
          type="button"
          role="switch"
          aria-checked={review}
          aria-labelledby="review-label"
          className={css.switch}
          onClick={() => {
            setReview((v) => !v);
            play(review ? 'pop' : 'chime');
          }}
        >
          <i />
        </button>
      </div>

      <article className={`paper ${css.report}`}>
        <span className="tape" aria-hidden="true" />
        <h3 className={css.paperTitle}>Why Do Cats Stare at Walls? A Longitudinal Study of Nothing</h3>
        <p className={css.author}>V. Void, Junior Darkness Designer, Department of Midnight Studies</p>

        {SECTIONS.slice(0, 1).map((s, i) => <Sec key={s.h} s={s} i={i} review={review} abstract />)}
        {SECTIONS.slice(1, 4).map((s, i) => (
          <Sec key={s.h} s={s} i={i + 1} review={review}>
            {s.h === 'Results' && <Figure />}
          </Sec>
        ))}
        {SECTIONS.slice(4).map((s, i) => <Sec key={s.h} s={s} i={i + 4} review={review} />)}

        <footer className={css.paperFoot}>
          <span>Funded by: snacks.</span>
          <span>*reviewed by one (1) cat</span>
        </footer>
      </article>
    </Stage>
  );
}

function Sec({ s, i, review, abstract, children }: { s: (typeof SECTIONS)[number]; i: number; review: boolean; abstract?: boolean; children?: React.ReactNode }) {
  return (
    <section className={css.sec}>
      <div>
        <h4 className={css.secHead}>{s.h}</h4>
        <p className={abstract ? css.abstract : css.secText}>{s.p}</p>
        {children}
      </div>
      {review && (
        <p className={css.sticky} style={{ '--i': i } as React.CSSProperties} role="note">
          {s.note}
        </p>
      )}
    </section>
  );
}
