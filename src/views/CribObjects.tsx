'use client';

import { useRef } from 'react';
import { useAudio } from '@/audio';
import { Odometer } from '@/components/Odometer';
import { StarJar, StoryBook, ToyBlocks } from '@/components/void/CribObjects';

type Item = { key: string; label: string; href: string; soon?: boolean; left: string; len: number; dur: number; delay: number };
const ITEMS: Item[] = [
  { key: 'story', label: 'Story', href: '/story', soon: true, left: '17%', len: 150, dur: 4.2, delay: -1 },
  { key: 'wishes', label: 'Wishes', href: '/wishes', left: '50%', len: 70, dur: 5.1, delay: -2.4 },
  { key: 'projects', label: 'Projects', href: '/projects', soon: true, left: '83%', len: 110, dur: 4.7, delay: -0.3 },
];

export function CribObjects({ count, onGo }: { count: number; onGo: (href: string) => void }) {
  const { play } = useAudio();
  const refs = useRef<Record<string, HTMLDivElement | null>>({});

  const swing = (key: string, amp: number, ms: number) => {
    const el = refs.current[key];
    if (!el) return;
    try {
      el.animate(
        [{ rotate: '0deg' }, { rotate: `${amp}deg` }, { rotate: `${-amp * 0.75}deg` }, { rotate: `${amp * 0.5}deg` }, { rotate: `${-amp * 0.25}deg` }, { rotate: '0deg' }],
        { duration: ms, easing: 'ease-in-out' },
      );
    } catch {}
  };

  return (
    <div className="crib">
      <div className="rod" aria-hidden="true" />
      {ITEMS.map((it) => (
        <div
          key={it.key}
          ref={(el) => void (refs.current[it.key] = el)}
          className="dangle"
          style={{ left: it.left, marginLeft: 'calc(var(--osz, 168px) / -2)', ['--len' as string]: `${it.len}px`, ['--dur' as string]: `${it.dur}s`, ['--delay' as string]: `${it.delay}s` }}
        >
          <div className="string" aria-hidden="true" />
          <button
            type="button"
            className="obj"
            data-sfx="off"
            aria-label={`${it.label}${it.soon ? ' (coming soon)' : ''}`}
            onPointerEnter={(e) => {
              if (e.pointerType === 'mouse') {
                swing(it.key, 9, 900);
                play('hover');
              }
            }}
            onClick={() => {
              play('tap');
              swing(it.key, 14, 380);
              window.setTimeout(() => onGo(it.href), 380);
            }}
          >
            {it.key === 'story' && <StoryBook />}
            {it.key === 'projects' && <ToyBlocks />}
            {it.key === 'wishes' && <StarJar count={count} />}
            {it.soon && <span className="soon">soon</span>}
            <span className="tag">
              {it.label}
              {it.key === 'wishes' && (
                <span className="ml-2 lg:hidden">
                  <Odometer value={count} />
                </span>
              )}
            </span>
          </button>
        </div>
      ))}
    </div>
  );
}
