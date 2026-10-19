'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PixelStar, PixelHeart } from '@/components/void/Pixel';
import { useAudio } from '@/audio';
import { fetchWishes } from '@/lib/supabase';
import { getPending, type Wish } from '@/lib/wishes';
import { ElasticHeading } from '@/components/fx/ElasticHeading';

const SAMPLE_WISHES: Array<{ text: string; color: string }> = [
  { text: 'i wish everyone sleeping alone tonight feels a warm breeze.', color: 'var(--sticker-pink)' },
  { text: 'i wish tomorrow feels a little lighter than today did.', color: 'var(--sticker-aqua)' },
  { text: 'i wish the stars never run out of quiet listeners.', color: 'var(--sticker-yellow)' },
];

const LOG_CARDS = [
  {
    title: 'the midnight watch',
    date: 'past 2:00 am',
    text: 'Void stays awake by the cold glass pane, waiting for the softest whispers that have nowhere else to land.',
    tags: ['#nightshift', '#starlight'],
    color: 'pink',
    tilt: '-1.8deg',
    rise: '0px',
  },
  {
    title: 'purr resonance',
    date: 'acoustic study',
    text: 'Gentle 38Hz purrs recorded during cuddle calibration. Tuned to soothe bedtime thoughts and make the dark feel friendly.',
    tags: ['#acoustics', '#warmth'],
    color: 'aqua',
    tilt: '1.5deg',
    rise: '28px',
  },
  {
    title: 'the window latch',
    date: 'standing order',
    text: 'Kept unlatched every single night without exception. No dream or quiet thought ever has to knock twice.',
    tags: ['#openwindow', '#safeplace'],
    color: 'yellow',
    tilt: '-1.2deg',
    rise: '12px',
  },
];

export function BedtimeLog() {
  const { play } = useAudio();
  const [wishes, setWishes] = useState<Array<{ text: string; color: string }>>([]);

  useEffect(() => {
    let alive = true;
    fetchWishes(0)
      .then((data) => {
        if (!alive) return;
        const pending = getPending();
        const pool = [...pending, ...data];
        if (pool.length > 0) {
          const picked = pool.slice(0, 3).map((w: Wish) => ({
            text: w.text,
            color: `var(--sticker-${w.color || 'yellow'})`,
          }));
          setWishes(picked);
        } else {
          setWishes(SAMPLE_WISHES);
        }
      })
      .catch(() => {
        if (alive) setWishes(SAMPLE_WISHES);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="bedtime-section relative mx-auto mt-4 max-w-6xl px-4 py-12" aria-label="Bedtime Nursery Log">
      {/* Section Header */}
      <div className="mb-8 text-center">
        <div className="paper relative inline-block -rotate-1 px-6 py-2">
          <span className="tape" aria-hidden="true" />
          <ElasticHeading
            text="tonight by the glass"
            material="balloon"
            color="#ffe27a"
            height={82}
            className="w-[min(82vw,560px)]"
            fallbackClassName="h-display text-[clamp(1.8rem,5vw,2.5rem)] text-[var(--ink)]"
          />
        </div>
        <p className="font-note m-0 mt-2 text-[1.6rem] text-[var(--ink)] opacity-80">
          notes recorded from the windowsill observatory
        </p>
      </div>

      {/* Scattered observatory field notes */}
      <div className="log-board mb-14">
        <span className="log-board-stamp" aria-hidden="true">FIELD NOTES · VOL. 01</span>
        <div className="log-scrapbook">
          {LOG_CARDS.map((log, index) => (
            <article
              key={log.title}
              className="night-note paper relative flex flex-col justify-between p-5 md:p-6"
              style={{ ['--note-tilt' as string]: log.tilt, ['--note-rise' as string]: log.rise, ['--note-paper' as string]: `var(--sticker-${log.color})` }}
              onPointerEnter={() => play('hover')}
            >
              <span className="tape" aria-hidden="true" />
              <div>
                <div className="mb-2 flex items-baseline justify-between border-b border-dashed border-[var(--ink)] pb-2">
                  <span className="font-note text-[1.35rem] uppercase tracking-wider text-[var(--berry)]">
                    {log.date}
                  </span>
                  <span className="note-number">0{index + 1} <PixelStar px={2} /></span>
                </div>
                <h3 className="h-display m-0 mb-3 text-[1.8rem] text-[var(--ink)]">
                  {log.title}
                </h3>
                <p className="font-note text-[1.55rem] leading-snug text-[var(--ink)]">
                  {log.text}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 pt-2">
                {log.tags.map((t) => (
                  <span key={t} className="note-tag">{t}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Live Whispers Spotlight */}
      <div className="paper relative mx-auto mb-10 max-w-4xl p-6 md:p-8">
        <span className="tape" aria-hidden="true" />
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b-2 border-dashed border-[var(--ink)] pb-3">
          <div className="flex items-center gap-2">
            <PixelHeart px={3} />
            <h3 className="h-display m-0 text-[1.9rem] text-[var(--ink)]">
              whispers drifting past
            </h3>
          </div>
          <span className="font-note text-[1.4rem] opacity-75">
            captured live by the window
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {(wishes.length > 0 ? wishes : SAMPLE_WISHES).map((item, idx) => (
            <div
              key={idx}
              className="paper relative p-4 transition-transform hover:scale-102"
              style={{ backgroundColor: item.color }}
            >
              <span className="tape !top-[-10px] !w-10" aria-hidden="true" />
              <p className="font-note m-0 text-[1.65rem] leading-snug text-[var(--ink)]">
                &ldquo;{item.text}&rdquo;
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-center pt-2">
          <Link
            href="/wishes"
            onClick={() => play('tap')}
            className="px-btn text-base inline-flex items-center gap-2"
          >
            <PixelStar px={2} />
            <span>visit the wish wall &rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
