'use client';

import { useAudio } from '@/audio';
import { useTheme } from '@/theme/ThemeProvider';
import { IconSlot } from './IconSlot';

// Sound: three bars that breathe while sound is on, settle into dots when muted.
export function SoundToggle() {
  const { muted, toggle } = useAudio();
  return (
    <button
      type="button"
      className="icon-btn snd"
      data-sfx="off"
      data-muted={muted ? '1' : undefined}
      onClick={toggle}
      aria-pressed={muted}
      aria-label={muted ? 'Sound is off. Turn sound on' : 'Sound is on. Mute sound'}
      title={muted ? 'Unmute' : 'Mute'}
    >
      <span className="snd-halo" aria-hidden="true">
        <IconSlot name="icon-cloud" size={44} />
      </span>
      <span className="snd-bars" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </button>
  );
}

// Theme: a sun with slowly turning rays by day, the moon Lottie by night.
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const { play } = useAudio();
  const night = theme === 'night';
  return (
    <button
      type="button"
      className="icon-btn thm"
      data-sfx="off"
      onClick={() => {
        const next = toggle();
        play(next === 'night' ? 'toggleNight' : 'toggleDay');
      }}
      aria-pressed={night}
      aria-label={night ? 'Night mode on. Switch to day' : 'Day mode on. Switch to night'}
      title={night ? 'Switch to day' : 'Switch to night'}
    >
      {night ? (
        <span className="thm-moon">
          <IconSlot name="icon-moon" size={40} />
        </span>
      ) : (
        <svg className="thm-sun" viewBox="0 0 40 40" width="34" height="34" aria-hidden="true">
          <circle cx="20" cy="20" r="8" fill="var(--butter)" stroke="var(--ink)" strokeOpacity=".25" strokeWidth="2" />
          {Array.from({ length: 8 }, (_, k) => (
            <line key={k} x1="20" y1="4" x2="20" y2="9" transform={`rotate(${k * 45} 20 20)`} stroke="var(--ink)" strokeOpacity=".55" strokeWidth="2.5" strokeLinecap="round" />
          ))}
        </svg>
      )}
    </button>
  );
}

export function Toggles() {
  return (
    <div className="toggles">
      <SoundToggle />
      <ThemeToggle />
    </div>
  );
}
