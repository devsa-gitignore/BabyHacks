// Web Audio synthesis only: no audio files are loaded anywhere.
// Energy is kept in ~400Hz-3kHz so phone speakers can reproduce it.

export type SoundName =
  | 'tap'
  | 'hover'
  | 'mrrp'
  | 'toggleDay'
  | 'toggleNight'
  | 'wish'
  | 'whoosh'
  | 'chime'
  | 'pop'
  | 'boing'
  | 'crumple';

const PENTA = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51]; // C major pentatonic, 2 octaves

type NoteOpts = {
  f: number;
  t?: number;
  dur: number;
  vol: number;
  type?: OscillatorType;
  glide?: number;
  attack?: number;
  partial?: { ratio: number; vol: number; dur: number };
  vibrato?: number; // Hz, adds a purr-like flutter
};

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private input: GainNode | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private ends: number[] = [];
  private tapIdx = 0;
  private tapDir = 1;
  private lastHover = 0;
  private ambient: { gain: GainNode; oscs: OscillatorNode[] } | null = null;
  private listeners = new Set<() => void>();

  muted = false;
  unlocked = false;

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }
  private emit() {
    this.listeners.forEach((fn) => fn());
  }

  isRunning() {
    return !!this.ctx && this.ctx.state === 'running';
  }

  /** Must be called from inside a user gesture. Safe to call repeatedly. */
  unlock() {
    try {
      if (!this.ctx) {
        const AC: typeof AudioContext | undefined =
          window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        const ctx = new AC({ latencyHint: 'interactive' });
        const input = ctx.createGain();
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 280; // phone speakers cannot play bass anyway
        hp.Q.value = 0.7;
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -18;
        comp.knee.value = 18;
        comp.ratio.value = 6;
        comp.attack.value = 0.004;
        comp.release.value = 0.2;
        const master = ctx.createGain();
        master.gain.value = this.muted ? 0 : 0.5;
        input.connect(hp);
        hp.connect(comp);
        comp.connect(master);
        master.connect(ctx.destination);
        this.ctx = ctx;
        this.input = input;
        this.master = master;
        // iOS: let Web Audio play even when the silent switch is on (Safari 16.4+).
        try {
          const nav = navigator as unknown as { audioSession?: { type: string } };
          if (nav.audioSession) nav.audioSession.type = 'playback';
        } catch {}
        document.addEventListener('visibilitychange', this.onVisibility);
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume().catch(() => {});
      if (!this.unlocked) {
        this.unlocked = true;
        this.emit();
      }
    } catch {
      /* audio is optional: never throw */
    }
  }

  private onVisibility = () => {
    const ctx = this.ctx;
    if (!ctx) return;
    try {
      if (document.hidden) {
        if (ctx.state === 'running') void ctx.suspend().catch(() => {});
      } else if (!this.muted && ctx.state === 'suspended') {
        void ctx.resume().catch(() => {});
      }
    } catch {}
  };

  setMuted(m: boolean) {
    this.muted = m;
    const ctx = this.ctx;
    if (ctx && this.master) {
      try {
        this.master.gain.setTargetAtTime(m ? 0 : 0.5, ctx.currentTime, 0.04);
      } catch {}
    }
    if (m) this.stopAmbient();
    else this.startAmbient();
    this.emit();
  }

  // ---------- internals ----------
  private canPlay(priority: boolean) {
    const ctx = this.ctx;
    if (!ctx || !this.input || this.muted || document.hidden) return false;
    const now = ctx.currentTime;
    this.ends = this.ends.filter((e) => e > now);
    return this.ends.length < (priority ? 12 : 6); // max ~6 simultaneous voices for rapid taps
  }

  private note(o: NoteOpts) {
    const ctx = this.ctx!;
    const t0 = ctx.currentTime + (o.t ?? 0) + 0.005;
    const osc = ctx.createOscillator();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(o.f, t0);
    if (o.glide) osc.frequency.exponentialRampToValueAtTime(o.glide, t0 + o.dur * 0.9);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(o.vol, t0 + (o.attack ?? 0.006));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    osc.connect(g);
    g.connect(this.input!);
    let lfo: OscillatorNode | null = null;
    if (o.vibrato) {
      lfo = ctx.createOscillator();
      lfo.frequency.value = o.vibrato;
      const depth = ctx.createGain();
      depth.gain.value = o.vol * 0.55;
      lfo.connect(depth);
      depth.connect(g.gain);
      lfo.start(t0);
      lfo.stop(t0 + o.dur + 0.05);
    }
    osc.start(t0);
    osc.stop(t0 + o.dur + 0.05);
    osc.onended = () => {
      try {
        g.disconnect();
      } catch {}
    };
    this.ends.push(t0 + o.dur + 0.05);

    if (o.partial) {
      const p = ctx.createOscillator();
      p.type = 'sine';
      p.frequency.setValueAtTime(o.f * o.partial.ratio, t0);
      const pg = ctx.createGain();
      pg.gain.setValueAtTime(0.0001, t0);
      pg.gain.linearRampToValueAtTime(o.partial.vol, t0 + 0.004);
      pg.gain.exponentialRampToValueAtTime(0.0001, t0 + o.partial.dur);
      p.connect(pg);
      pg.connect(this.input!);
      p.start(t0);
      p.stop(t0 + o.partial.dur + 0.05);
      p.onended = () => {
        try {
          pg.disconnect();
        } catch {}
      };
    }
    void lfo;
  }

  private noiseBuffer() {
    const ctx = this.ctx!;
    if (!this.noise) {
      const len = ctx.sampleRate;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noise = buf;
    }
    return this.noise;
  }

  private sweep(t: number, from: number, to: number, dur: number, vol: number) {
    const ctx = this.ctx!;
    const t0 = ctx.currentTime + t + 0.005;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer();
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(from, t0);
    bp.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + dur * 0.45);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(bp);
    bp.connect(g);
    g.connect(this.input!);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
    src.onended = () => {
      try {
        g.disconnect();
      } catch {}
    };
    this.ends.push(t0 + dur + 0.05);
  }

  // ---------- public ----------
  play(name: SoundName) {
    try {
      const priority = name !== 'tap' && name !== 'hover';
      if (!this.canPlay(priority)) return;
      switch (name) {
        case 'tap': {
          const f = PENTA[this.tapIdx];
          this.tapIdx += this.tapDir;
          if (this.tapIdx >= PENTA.length - 1 || this.tapIdx <= 0) this.tapDir *= -1;
          this.tapIdx = Math.max(0, Math.min(PENTA.length - 1, this.tapIdx));
          this.note({ f, dur: 0.55, vol: 0.22, partial: { ratio: 3.01, vol: 0.05, dur: 0.16 } });
          break;
        }
        case 'hover': {
          if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
          const now = performance.now();
          if (now - this.lastHover < 70) return;
          this.lastHover = now;
          this.note({ f: 1760, dur: 0.05, vol: 0.035 });
          break;
        }
        case 'mrrp': {
          this.note({ f: 340, glide: 540, dur: 0.14, vol: 0.2, type: 'triangle', vibrato: 26 });
          this.note({ t: 0.12, f: 480, glide: 720, dur: 0.12, vol: 0.18, type: 'triangle', vibrato: 26 });
          break;
        }
        case 'toggleDay': {
          this.note({ f: 783.99, dur: 0.5, vol: 0.2, partial: { ratio: 2, vol: 0.06, dur: 0.2 } });
          this.note({ t: 0.11, f: 1046.5, dur: 0.7, vol: 0.2, partial: { ratio: 2, vol: 0.06, dur: 0.2 } });
          break;
        }
        case 'toggleNight': {
          this.note({ f: 1046.5, dur: 0.5, vol: 0.2, partial: { ratio: 2, vol: 0.06, dur: 0.2 } });
          this.note({ t: 0.11, f: 783.99, dur: 0.7, vol: 0.2, partial: { ratio: 2, vol: 0.06, dur: 0.2 } });
          break;
        }
        case 'wish': {
          [1046.5, 1318.5, 1568, 2093].forEach((f, i) =>
            this.note({ t: i * 0.07, f, dur: 0.6, vol: 0.14, partial: { ratio: 3.01, vol: 0.04, dur: 0.14 } }),
          );
          this.sweep(0, 700, 3000, 0.55, 0.06);
          break;
        }
        case 'whoosh': {
          this.sweep(0, 420, 2600, 0.5, 0.11);
          break;
        }
        case 'pop': {
          this.note({ f: 600, glide: 900, dur: 0.08, vol: 0.2, type: 'sine' });
          break;
        }
        case 'boing': {
          this.note({ f: 180, glide: 330, dur: 0.1, vol: 0.2, type: 'triangle' });
          this.note({ t: 0.09, f: 330, glide: 170, dur: 0.1, vol: 0.18, type: 'triangle' });
          break;
        }
        case 'crumple': {
          this.sweep(0, 1800, 900, 0.08, 0.1);
          this.sweep(0.09, 2400, 1200, 0.08, 0.09);
          this.sweep(0.18, 1500, 800, 0.08, 0.08);
          break;
        }
        case 'chime': {
          this.note({ f: 1568, dur: 0.9, vol: 0.16, partial: { ratio: 2, vol: 0.05, dur: 0.3 } });
          this.note({ t: 0.13, f: 2093, dur: 1.2, vol: 0.16, partial: { ratio: 2, vol: 0.04, dur: 0.3 } });
          break;
        }
      }
    } catch {
      /* swallow: sound must never break the page */
    }
  }

  private purr: { gain: GainNode; oscs: OscillatorNode[] } | null = null;

  /** Soft purr while a pointer is held on the cat. Energy sits near 110-220Hz so phone speakers can play it. */
  startPurr() {
    const ctx = this.ctx;
    if (!ctx || !this.input || this.muted || this.purr) return;
    try {
      const gain = ctx.createGain();
      gain.gain.value = 0.0001;
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.2);
      const am = ctx.createGain();
      am.gain.value = 0.5;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 24;
      const depth = ctx.createGain();
      depth.gain.value = 0.5;
      lfo.connect(depth);
      depth.connect(am.gain);
      const o1 = ctx.createOscillator();
      o1.type = 'triangle';
      o1.frequency.value = 110;
      const o2 = ctx.createOscillator();
      o2.type = 'sine';
      o2.frequency.value = 220;
      o1.connect(am);
      o2.connect(am);
      am.connect(gain);
      gain.connect(this.input);
      [lfo, o1, o2].forEach((o) => o.start());
      this.purr = { gain, oscs: [lfo, o1, o2] };
    } catch {}
  }

  stopPurr() {
    const p = this.purr;
    const ctx = this.ctx;
    if (!p || !ctx) return;
    this.purr = null;
    try {
      p.gain.gain.cancelScheduledValues(ctx.currentTime);
      p.gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.06);
      window.setTimeout(() => {
        p.oscs.forEach((o) => {
          try {
            o.stop();
          } catch {}
        });
        try {
          p.gain.disconnect();
        } catch {}
      }, 400);
    } catch {}
  }

  startAmbient() {
    const ctx = this.ctx;
    if (!ctx || !this.input || this.muted || this.ambient) return;
    try {
      const gain = ctx.createGain();
      gain.gain.value = 0.0001;
      gain.gain.linearRampToValueAtTime(0.045, ctx.currentTime + 3); // very quiet pad
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.07;
      const lfoDepth = ctx.createGain();
      lfoDepth.gain.value = 0.02;
      lfo.connect(lfoDepth);
      lfoDepth.connect(gain.gain);
      lfo.start();
      const oscs: OscillatorNode[] = [lfo];
      [392, 523.25, 659.25].forEach((f, i) => {
        [-3, 3].forEach((cents) => {
          const o = ctx.createOscillator();
          o.type = 'sine';
          o.frequency.value = f;
          o.detune.value = cents;
          o.connect(gain);
          o.start();
          oscs.push(o);
        });
      });
      gain.connect(this.input);
      this.ambient = { gain, oscs };
    } catch {}
  }

  stopAmbient() {
    const a = this.ambient;
    const ctx = this.ctx;
    if (!a || !ctx) return;
    this.ambient = null;
    try {
      a.gain.gain.cancelScheduledValues(ctx.currentTime);
      a.gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.25);
      window.setTimeout(() => {
        a.oscs.forEach((o) => {
          try {
            o.stop();
          } catch {}
        });
        try {
          a.gain.disconnect();
        } catch {}
      }, 1200);
    } catch {}
  }
}

let engine: AudioEngine | null = null;
export function getEngine(): AudioEngine {
  if (!engine) engine = new AudioEngine();
  return engine;
}
