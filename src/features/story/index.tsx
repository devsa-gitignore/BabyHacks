'use client';

import { useState } from 'react';
import { ElasticHeading } from '@/components/fx/ElasticHeading';
import { useAudio } from '@/audio';
import { useTheme } from '@/theme/ThemeProvider';
import { PixelHeart, PixelStar } from '@/components/void/Pixel';
import { VoidFace } from '@/components/void/VoidFace';

type Chapter = {
  num: string;
  title: string;
  date: string;
  content: string[];
  quote: string;
};

const CHAPTERS: Chapter[] = [
  {
    num: '01',
    title: 'The Night with Nowhere to Land',
    date: 'A Tuesday, past 2:00 AM',
    content: [
      'It began on an ordinary Tuesday when someone whispered a wish so quiet that even the night wind nearly carried it into oblivion.',
      'A wish without a star has no home. It wandered across rooftops and through telephone wires, looking for a place soft enough to hold it without breaking.',
      'And right there, on the ledge of a nursery window, Void was born: a tiny black kitten with eyes as green as spring leaves and a heart attuned to quiet thoughts.',
    ],
    quote: 'every whisper deserves to become a constellation.',
  },
  {
    num: '02',
    title: 'Star Charm & Butterfly Whispers',
    date: 'The First Waxing Moon',
    content: [
      'Around Void’s neck hangs a tiny golden star charm. If you look closely, it glows whenever someone in the world feels a little lonely and closes their eyes.',
      'Void spends her evenings practicing leaps at pixel butterflies that flutter just outside the windowpane. She almost never catches them—which she insists is by design.',
      'Butterflies bring messages from the daytime; wishes arrive strictly by moonlight.',
    ],
    quote: 'she purrs the instant someone is kind to her.',
  },
  {
    num: '03',
    title: 'The Wish Keeper’s Vigil',
    date: 'Every Night, Without Exception',
    content: [
      'When the house falls quiet and clocks tick a little louder, Void presses her tiny paws against the cold glass pane.',
      'One by one, she catches the whispers: wishes for courage, wishes for warmth, secret dreams nobody else knows about.',
      'With a gentle paw and a soft mrrp, she folds each wish into a shining star and releases it upward into the sky canvas.',
    ],
    quote: 'the window is always open for you.',
  },
];

export default function StorySlot() {
  const { play } = useAudio();
  const { theme } = useTheme();
  const night = theme === 'night';
  const [activeChapter, setActiveChapter] = useState(0);

  const ch = CHAPTERS[activeChapter];

  return (
    <section id="story-slot" data-slot="story" className="min-h-[60dvh] pb-12">
      {/* Main Elastic Heading */}
      <div style={{ width: '100%', height: '240px', position: 'relative' }} className="mb-4">
        <ElasticHeading
          text="Story"
          material={night ? 'jelly' : 'balloon'}
          color={night ? '#9e8eff' : '#3b5bff'}
          inflate={1}
          stiffness={0.5}
          wobble={0.6}
          theme={night ? 'dark' : 'light'}
          height="100%"
        />
      </div>

      {/* Intro Subtitle */}
      <div className="paper relative mx-auto mb-10 max-w-xl px-6 py-4 text-center">
        <span className="tape" aria-hidden="true" />
        <div className="flex items-center justify-center gap-3">
          <VoidFace size={36} wink />
          <p className="font-note m-0 text-[1.8rem] text-[var(--ink)]">
            the legend of the baby black kitten who catches wishes
          </p>
        </div>
      </div>

      {/* Chapter Tabs */}
      <div className="mb-8 flex flex-wrap justify-center gap-3">
        {CHAPTERS.map((c, i) => (
          <button
            key={c.num}
            type="button"
            className={`px-btn transition-transform active:scale-95 ${
              activeChapter === i ? '!bg-[var(--eye)] font-bold text-[var(--ink)]' : ''
            }`}
            onClick={() => {
              play('tap');
              setActiveChapter(i);
            }}
          >
            <span>
              Ch. {c.num}: {c.title.split(' ')[0]}
            </span>
          </button>
        ))}
      </div>

      {/* Active Chapter Card */}
      <article className="paper relative mx-auto max-w-3xl p-8 md:p-10">
        <span className="tape" aria-hidden="true" />

        <header className="mb-6 border-b-2 border-dashed border-[var(--ink)] pb-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-note text-[1.6rem] text-[var(--berry)]">
              Chapter {ch.num}
            </span>
            <span className="text-sm font-semibold opacity-70">{ch.date}</span>
          </div>
          <h2 className="h-display m-0 mt-1 text-[2.4rem] text-[var(--ink)]">
            {ch.title}
          </h2>
        </header>

        <div className="space-y-4 text-[1.25rem] leading-relaxed">
          {ch.content.map((p, idx) => (
            <p key={idx} className="m-0">
              {p}
            </p>
          ))}
        </div>

        <blockquote className="mt-8 rounded-xl border-2 border-[var(--ink)] bg-white/50 p-4 text-center">
          <div className="mb-1 flex justify-center gap-2 text-[var(--eye)]">
            <PixelStar px={3} />
            <PixelHeart px={3} />
            <PixelStar px={3} />
          </div>
          <p className="font-note m-0 text-[1.9rem] text-[var(--ink)]">
            &ldquo;{ch.quote}&rdquo;
          </p>
        </blockquote>

        <footer className="mt-8 flex items-center justify-between pt-4">
          <button
            type="button"
            disabled={activeChapter === 0}
            className="px-btn text-base disabled:opacity-40"
            onClick={() => {
              play('tap');
              setActiveChapter((prev) => Math.max(0, prev - 1));
            }}
          >
            <span>&larr; Previous</span>
          </button>

          <span className="text-sm font-bold opacity-60">
            {activeChapter + 1} of {CHAPTERS.length}
          </span>

          <button
            type="button"
            disabled={activeChapter === CHAPTERS.length - 1}
            className="px-btn text-base disabled:opacity-40"
            onClick={() => {
              play('tap');
              setActiveChapter((prev) => Math.min(CHAPTERS.length - 1, prev + 1));
            }}
          >
            <span>Next &rarr;</span>
          </button>
        </footer>
      </article>
    </section>
  );
}
