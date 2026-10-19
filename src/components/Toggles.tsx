'use client';

import { useAudio } from '@/audio';
import { useTheme } from '@/theme/ThemeProvider';
import { MoonIcon, SoundOffIcon, SoundOnIcon, SunIcon } from './icons';

export function SoundToggle() {
  const { muted, toggle } = useAudio();
  return (
    <button
      type="button"
      className="icon-btn"
      data-sfx="off"
      onClick={toggle}
      aria-pressed={muted}
      aria-label={muted ? 'Sound is off. Turn sound on' : 'Sound is on. Mute sound'}
      title={muted ? 'Unmute' : 'Mute'}
    >
      {muted ? <SoundOffIcon /> : <SoundOnIcon />}
    </button>
  );
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const { play } = useAudio();
  const night = theme === 'night';
  return (
    <button
      type="button"
      className="icon-btn"
      data-sfx="off"
      onClick={() => {
        const next = toggle();
        play(next === 'night' ? 'toggleNight' : 'toggleDay');
      }}
      aria-pressed={night}
      aria-label={night ? 'Night mode on. Switch to day' : 'Day mode on. Switch to night'}
      title={night ? 'Switch to day' : 'Switch to night'}
    >
      {night ? <MoonIcon /> : <SunIcon />}
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
