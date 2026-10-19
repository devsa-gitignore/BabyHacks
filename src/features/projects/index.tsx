'use client';

import { useState } from 'react';
import { ElasticHeading } from '@/components/fx/ElasticHeading';
import { useAudio } from '@/audio';
import { useTheme } from '@/theme/ThemeProvider';
import { IconSlot } from '@/components/IconSlot';
import { PixelStar, PixelHeart } from '@/components/void/Pixel';

type Project = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  tags: string[];
  status: 'operational' | 'experimenting' | 'patented';
  icon: 'nav-wishes' | 'nav-home' | 'nav-story' | 'nav-about';
  actionLabel: string;
  sound: 'boing' | 'mrrp' | 'tap' | 'chime';
};

const PROJECTS: Project[] = [
  {
    id: 'wish-catcher',
    title: 'Wish Catcher 3000',
    tagline: 'Starlight whisper capture apparatus',
    description:
      'A spun-glass vacuum jar with starry gold trim. Catches whispers drifting through open night windows and converts them into permanent stars.',
    tags: ['Starlight', 'Glasswork', 'Celestial'],
    status: 'operational',
    icon: 'nav-wishes',
    actionLabel: 'Catch a Wish',
    sound: 'chime',
  },
  {
    id: 'butterfly-tracker',
    title: 'Butterfly Pounce Engine',
    tagline: 'High-speed cuteness trajectory matrix',
    description:
      'Calculates the optimal leap angle toward fluttering pixel butterflies, specifically tuned to achieve a 98% adorable near-miss rate.',
    tags: ['Physics', 'Reflexes', 'Pounce'],
    status: 'experimenting',
    icon: 'nav-home',
    actionLabel: 'Test Leap',
    sound: 'boing',
  },
  {
    id: 'purr-tuner',
    title: 'Purr Frequency Lab',
    tagline: 'Acoustic healing resonance (25-50 Hz)',
    description:
      'Harmonic acoustic chamber that measures the soothing frequencies produced when Void is held gently. Instant remedy for night-time anxiety.',
    tags: ['Acoustics', 'Comfort', 'Zen'],
    status: 'patented',
    icon: 'nav-about',
    actionLabel: 'Calibrate Purr',
    sound: 'mrrp',
  },
  {
    id: 'constellation-loom',
    title: 'Constellation Loom',
    tagline: 'Automated sky tapestry weaver',
    description:
      'Connects every wish on the wall into celestial constellations visible from any bedtime window across the globe.',
    tags: ['Astronomy', 'Weaving', 'Sky'],
    status: 'operational',
    icon: 'nav-story',
    actionLabel: 'Map Sky',
    sound: 'tap',
  },
];

export default function ProjectsSlot() {
  const { play } = useAudio();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [sparkleId, setSparkleId] = useState<string | null>(null);

  const filters = ['all', 'operational', 'experimenting', 'patented'];

  const filtered = activeFilter === 'all'
    ? PROJECTS
    : PROJECTS.filter((p) => p.status === activeFilter);

  const handleAction = (p: Project) => {
    play(p.sound);
    setSparkleId(p.id);
    setTimeout(() => setSparkleId(null), 900);
  };

  const { theme } = useTheme();
  const night = theme === 'night';

  return (
    <section id="projects-slot" data-slot="projects" className="min-h-[60dvh] pb-12">
      {/* Main Elastic Heading */}
      <div style={{ width: '100%', height: '240px', position: 'relative' }} className="mb-4">
        <ElasticHeading
          text="Projects"
          material={night ? 'jelly' : 'balloon'}
          color={night ? '#9e8eff' : '#3b5bff'}
          inflate={1}
          stiffness={0.5}
          wobble={0.6}
          theme={night ? 'dark' : 'light'}
          height="100%"
        />
      </div>

      {/* Intro Note */}
      <div className="paper relative mx-auto mb-10 max-w-2xl px-6 py-4 text-center">
        <span className="tape" aria-hidden="true" />
        <p className="font-note m-0 text-[1.8rem] text-[var(--ink)]">
          &ldquo;things Void engineered by the window while everyone was sound asleep.&rdquo;
        </p>
      </div>

      {/* Status Filter Badges */}
      <div className="mb-8 flex flex-wrap justify-center gap-3">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            className={`px-btn transition-transform active:scale-95 ${
              activeFilter === f ? '!bg-[var(--eye)] font-bold text-[var(--ink)]' : ''
            }`}
            onClick={() => {
              play('tap');
              setActiveFilter(f);
            }}
          >
            <span>{f.charAt(0).toUpperCase() + f.slice(1)}</span>
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        {filtered.map((project) => {
          const isSparkling = sparkleId === project.id;
          return (
            <article
              key={project.id}
              className="paper relative flex flex-col justify-between overflow-hidden p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
            >
              <span className="tape" aria-hidden="true" />

              <div>
                <header className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-block rounded-xl border-2 border-[var(--ink)] bg-[var(--cloud)] p-2">
                      <IconSlot name={project.icon} size={32} />
                    </span>
                    <div>
                      <h2 className="h-display m-0 text-[1.9rem] leading-none text-[var(--ink)]">
                        {project.title}
                      </h2>
                      <span className="font-note text-[1.4rem] opacity-75">
                        {project.tagline}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`rounded-full border-2 border-[var(--ink)] px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                      project.status === 'operational'
                        ? 'bg-[var(--eye)] text-[var(--ink)]'
                        : project.status === 'experimenting'
                        ? 'bg-[var(--butter)] text-[var(--ink)]'
                        : 'bg-[var(--berry)] text-white'
                    }`}
                  >
                    {project.status}
                  </span>
                </header>

                <p className="mb-5 text-[1.15rem] leading-relaxed opacity-90">
                  {project.description}
                </p>
              </div>

              <div>
                <div className="mb-4 flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded border border-[var(--ink)] bg-white/60 px-2 py-0.5 text-xs font-semibold text-[var(--ink)]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    className="px-btn text-base"
                    onClick={() => handleAction(project)}
                  >
                    <span>{project.actionLabel}</span>
                  </button>

                  {isSparkling && (
                    <div className="flex animate-bounce items-center gap-1 text-[var(--berry)]">
                      <PixelHeart px={3} />
                      <PixelStar px={3} />
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
