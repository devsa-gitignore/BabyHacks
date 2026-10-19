// Story copy, verbatim from the ideation doc, split into caption beats. Edit text here only.
import type { BedName } from '@/audio';

export type SceneData = {
  id: 'alley' | 'rain' | 'discovery' | 'window' | 'home';
  title: string;
  beats: string[]; // joined with spaces = the original paragraph
  hint?: string; // sticky note on the TV
  closing?: string; // the last line, shown on its own after the final beat
  glow: string; // the colour the screen throws onto the room + Void
  warp: string; // CRT Warp plasma colour while tuning to this channel
  bed: BedName;
};

export const SCENES: SceneData[] = [
  {
    id: 'alley',
    title: 'The Alley',
    beats: [
      'Behind a sleepy bakery sat a very small kitten. His fur was so dark that the streetlights seemed to tiptoe around him.',
      "Everyone said he looked like nothing at all. 'Maybe I'm just a hole in the night,' he thought.",
      "So he stopped telling people his name. Later, he'd choose one on purpose: Void.",
    ],
    hint: 'psst, pet him',
    glow: '#7b6cff',
    warp: '#9d8cff',
    bed: 'alley',
  },
  {
    id: 'rain',
    title: 'The Rain',
    beats: [
      'Rain came down in fat, silly drops. Void squeezed under a cardboard box and found something round and cold.',
      'A flashlight! He batted it with his paw and, click, a circle of gold spilled across the wet ground.',
      'He had never seen the dark look so friendly.',
    ],
    hint: 'psst, tap the flashlight',
    glow: '#5a8cff',
    warp: '#6fb6ff',
    bed: 'rain',
  },
  {
    id: 'discovery',
    title: 'The Discovery',
    beats: [
      'Void waved his paw in the beam. On the wall, a butterfly fluttered!',
      'He wiggled again and made a bunny, then a dragon with excellent hair.',
      "'Light needs dark to be seen,' he whispered. 'Maybe I'm not empty. Maybe I'm where the light goes to rest.'",
    ],
    hint: 'psst, tap the wall',
    glow: '#ffc86e',
    warp: '#ffb86b',
    bed: 'discovery',
  },
  {
    id: 'window',
    title: 'The Window',
    beats: [
      'Up in a window, a child was watching the shadow show. She waved.',
      'Void had never been waved at before, so he waved back with his tail, very seriously, like a tiny diplomat.',
      'She held up a tiny sign that said COME IN. He thought about it for almost a full second.',
    ],
    hint: 'psst, wave back',
    glow: '#ffb070',
    warp: '#ff8fb0',
    bed: 'window',
  },
  {
    id: 'home',
    title: 'The Home',
    beats: [
      'Void moved in that night and made himself a job: Junior Darkness Designer.',
      'He builds shadow shows, blanket forts and gentle nightlights so no one has to be afraid of the dark.',
      'He still acts mysterious. But he purrs the second you pet him.',
    ],
    closing: "I'm not empty. I'm where the light goes to rest.",
    hint: 'psst, his tail…',
    glow: '#ffb38a',
    warp: '#b8f23a',
    bed: 'home',
  },
];

/** Beats per scene including the closing line. */
export const beatCount = (s: SceneData) => s.beats.length + (s.closing ? 1 : 0);
