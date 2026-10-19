'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getEngine, type SoundName } from './engine';

type AudioApi = {
  play: (name: SoundName) => void;
  purr: (on: boolean) => void;
  muted: boolean;
  toggle: () => void;
  unlocked: boolean;
};

const AudioContextValue = createContext<AudioApi>({
  play: () => {},
  purr: () => {},
  muted: false,
  toggle: () => {},
  unlocked: false,
});

const SFX_SELECTOR = 'button, a[href], [role="button"], summary, [data-sfx]';
const SOUND_NAMES: SoundName[] = ['tap', 'hover', 'mrrp', 'toggleDay', 'toggleNight', 'wish', 'whoosh', 'chime'];

export function AudioProvider({ children }: { children: ReactNode }) {
  const engine = getEngine();
  const [muted, setMuted] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    let saved = false;
    try {
      saved = localStorage.getItem('wk.muted') === '1';
    } catch {}
    engine.muted = saved;
    setMuted(saved);

    const off = engine.subscribe(() => {
      setUnlocked(engine.unlocked);
      setMuted(engine.muted);
    });

    // 1) Unlock on the first real gesture (several events: iOS only honours some of them).
    const unlockEvents = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'] as const;
    const onGesture = () => {
      engine.unlock();
      if (engine.isRunning()) {
        unlockEvents.forEach((e) => window.removeEventListener(e, onGesture, true));
      }
      if (!engine.muted) engine.startAmbient();
    };
    unlockEvents.forEach((e) => window.addEventListener(e, onGesture, true));

    // 2) Delegated UI sounds: tap on press, a quiet tick on hover (mouse only).
    const pickSound = (target: EventTarget | null): SoundName | null => {
      const el = (target as Element | null)?.closest?.(SFX_SELECTOR) as HTMLElement | null;
      if (!el || el.hasAttribute('disabled')) return null;
      const tag = el.getAttribute('data-sfx');
      if (tag === 'off') return null;
      return SOUND_NAMES.includes(tag as SoundName) ? (tag as SoundName) : 'tap';
    };
    const onDown = (e: PointerEvent) => {
      engine.unlock();
      const s = pickSound(e.target);
      if (s) engine.play(s);
    };
    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const el = (e.target as Element | null)?.closest?.(SFX_SELECTOR) as HTMLElement | null;
      if (!el || el.getAttribute('data-sfx') === 'off' || el.hasAttribute('disabled')) return;
      // only fire when entering the element (not when moving between its children)
      const from = e.relatedTarget as Node | null;
      if (from && el.contains(from)) return;
      engine.play('hover');
    };
    window.addEventListener('pointerdown', onDown, true);
    window.addEventListener('pointerover', onOver, true);

    return () => {
      off();
      unlockEvents.forEach((e) => window.removeEventListener(e, onGesture, true));
      window.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('pointerover', onOver, true);
    };
  }, [engine]);

  const play = useCallback((name: SoundName) => engine.play(name), [engine]);
  const purr = useCallback((on: boolean) => (on ? engine.startPurr() : engine.stopPurr()), [engine]);

  const toggle = useCallback(() => {
    const next = !engine.muted;
    engine.unlock();
    engine.setMuted(next);
    try {
      localStorage.setItem('wk.muted', next ? '1' : '0');
    } catch {}
    setMuted(next);
    if (!next) {
      engine.startAmbient();
      engine.play('tap');
    }
  }, [engine]);

  const value = useMemo(() => ({ play, purr, muted, toggle, unlocked }), [play, purr, muted, toggle, unlocked]);
  return <AudioContextValue.Provider value={value}>{children}</AudioContextValue.Provider>;
}

export const useAudio = () => useContext(AudioContextValue);
