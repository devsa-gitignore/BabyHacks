'use client';

// Teletext-style captions: types the beat out with soft blips. `done` flips once the whole line is on screen.
// Screen readers get the full line at once through a polite live region (the typing itself is aria-hidden).
import { useEffect, useRef, useState } from 'react';
import { useAudio } from '@/audio';
import css from './story.module.css';

const PAUSE: Record<string, number> = { '.': 260, '!': 260, '?': 260, ',': 110, ':': 160, '…': 260 };

export function Captions({
  text,
  instant,
  finishSignal,
  onDone,
  big,
}: {
  text: string;
  instant: boolean;
  finishSignal: number; // bump to finish typing right away
  onDone: () => void;
  big?: boolean;
}) {
  const { play } = useAudio();
  const [n, setN] = useState(instant ? text.length : 0);
  const pos = useRef(n);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  // restart typing on every new line
  useEffect(() => {
    if (instant) {
      pos.current = text.length;
      setN(text.length);
      return;
    }
    pos.current = 0;
    setN(0);
    let id = 0;
    const step = () => {
      if (pos.current >= text.length) return; // finished early
      const i = ++pos.current;
      setN(i);
      if (i % 2 === 0 && text[i - 1] !== ' ') play('blip');
      if (i < text.length) id = window.setTimeout(step, 26 + (PAUSE[text[i - 1]] ?? 0));
    };
    id = window.setTimeout(step, 180);
    return () => window.clearTimeout(id);
  }, [text, instant, play]);

  const firstSignal = useRef(finishSignal);
  useEffect(() => {
    if (finishSignal === firstSignal.current) return;
    pos.current = text.length;
    setN(text.length);
  }, [finishSignal, text.length]);

  const done = n >= text.length;
  useEffect(() => {
    if (done) doneRef.current();
  }, [done, text]);

  return (
    <div className={css.caption} data-big={big ? '1' : undefined}>
      <p className={css.captionText} aria-hidden="true">
        <span>{text.slice(0, n)}</span>
        <span className={css.cursor} data-done={done ? '1' : undefined} />
        {/* the untyped rest, invisible, so the caption box never jumps in size */}
        <span className={css.captionGhost}>{text.slice(n)}</span>
      </p>
      <p className="sr-only" aria-live="polite">
        {text}
      </p>
    </div>
  );
}
