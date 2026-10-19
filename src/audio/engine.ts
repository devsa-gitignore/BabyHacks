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
  | 'crumple'
  | 'click'
  | 'thud'
  | 'swat'
  | 'flap'
  | 'chirp'
  | 'puff'
  | 'stamp'
  | 'sneeze'
  | 'cord'
  // story TV
  | 'tvOn'
  | 'tvOff'
  | 'channel'
  | 'knob'
  | 'blip'
  | 'flutter'
  | 'squeak'
  | 'thunder'
  | 'beam';

/** Story background loops. 'off' = story page with the TV off (no site pad, no loop). */
export type BedName = 'off' | 'alley' | 'rain' | 'discovery' | 'window' | 'home';

const PENTA = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51]; // C major pentatonic, 2 octaves

// Story lullaby: 32 steps of C pentatonic (0 = rest). Bass changes every 8 steps.
const C5 = 523.25, D5 = 587.33, E5 = 659.25, G5 = 783.99, A5 = 880.0, C6 = 1046.5;
const LULLABY = [E5, G5, A5, G5, E5, D5, C5, 0, D5, E5, G5, E5, D5, 0, 0, 0, E5, G5, A5, C6, A5, G5, E5, 0, D5, E5, D5, C5, C5, 0, 0, 0];
const LULLABY_BASS = [261.63, 220.0, 196.0, 261.63];
const LONELY = [440.0, 523.25, 659.25, 587.33, 440.0, 392.0]; // sparse, the alley and the rain

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
  out?: AudioNode; // default: the phone-safe input (280Hz highpass)
  bed?: boolean; // background-loop note: does not count against the voice limit
};

type NoiseOpts = {
  t?: number;
  dur: number;
  vol: number;
  from: number;
  to?: number;
  q?: number;
  filter?: BiquadFilterType;
  attack?: number; // fraction of dur
  out?: AudioNode;
  bed?: boolean;
};

type Bed = { name: BedName; gain: GainNode; nodes: AudioScheduledSourceNode[]; timers: number[] };

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
  private story: GainNode | null = null; // story bus: only a 70Hz highpass, so thunks and thunder keep their weight
  private bed: Bed | null = null;
  private bedName: BedName | null = null; // what the story wants, kept while muted
  private lastBlip = 0;

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
        const story = ctx.createGain();
        const storyHp = ctx.createBiquadFilter();
        storyHp.type = 'highpass';
        storyHp.frequency.value = 70;
        story.connect(storyHp);
        storyHp.connect(comp);
        this.ctx = ctx;
        this.input = input;
        this.master = master;
        this.story = story;
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
        this.applyBed();
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
    this.applyBed();
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
    g.connect(o.out ?? this.input!);
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
    if (!o.bed) this.ends.push(t0 + o.dur + 0.05);

    if (o.partial) {
      const p = ctx.createOscillator();
      p.type = 'sine';
      p.frequency.setValueAtTime(o.f * o.partial.ratio, t0);
      const pg = ctx.createGain();
      pg.gain.setValueAtTime(0.0001, t0);
      pg.gain.linearRampToValueAtTime(o.partial.vol, t0 + 0.004);
      pg.gain.exponentialRampToValueAtTime(0.0001, t0 + o.partial.dur);
      p.connect(pg);
      pg.connect(o.out ?? this.input!);
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
    this.noiseHit({ t, dur, vol, from, to });
  }

  /** Filtered noise burst. Starts at a random spot in the buffer so repeated hits do not sound identical. */
  private noiseHit(o: NoiseOpts) {
    const ctx = this.ctx!;
    const t0 = ctx.currentTime + (o.t ?? 0) + 0.005;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer();
    src.loop = true; // the buffer is 1s; long hits (thunder) wrap around
    const f = ctx.createBiquadFilter();
    f.type = o.filter ?? 'bandpass';
    f.Q.value = o.q ?? 1.2;
    f.frequency.setValueAtTime(o.from, t0);
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t0 + o.dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(o.vol, t0 + o.dur * (o.attack ?? 0.45));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    src.connect(f);
    f.connect(g);
    g.connect(o.out ?? this.input!);
    src.start(t0, Math.random() * 0.8);
    src.stop(t0 + o.dur + 0.05);
    src.onended = () => {
      try {
        g.disconnect();
      } catch {}
    };
    if (!o.bed) this.ends.push(t0 + o.dur + 0.05);
  }

  // ---------- public ----------
  play(name: SoundName) {
    try {
      const priority = name !== 'tap' && name !== 'hover' && name !== 'blip';
      if (!this.canPlay(priority)) return;
      if (priority) this.duck();
      const S = this.story!;
      switch (name) {
        case 'blip': {
          // teletext typing: very short, slightly random pitch, rate-limited
          const now = performance.now();
          if (now - this.lastBlip < 45) return;
          this.lastBlip = now;
          this.note({ f: [1046.5, 1174.66, 1318.51, 1568][Math.floor(Math.random() * 4)], dur: 0.03, vol: 0.028, type: 'square' });
          break;
        }
        case 'knob': {
          this.note({ f: 2400, dur: 0.018, vol: 0.08, type: 'square' });
          this.note({ t: 0.014, f: 520, glide: 380, dur: 0.06, vol: 0.16, type: 'triangle', out: S });
          this.noiseHit({ dur: 0.035, vol: 0.07, from: 3200, to: 1400 });
          break;
        }
        case 'channel': {
          // knob clunk, a burst of static, and a wobbly tuning tone, timed with the warp
          this.note({ f: 2400, dur: 0.018, vol: 0.08, type: 'square' });
          this.note({ t: 0.014, f: 300, glide: 160, dur: 0.09, vol: 0.22, type: 'triangle', out: S });
          this.noiseHit({ t: 0.04, dur: 0.55, vol: 0.1, from: 4200, to: 1600, q: 0.5, attack: 0.15 });
          this.noiseHit({ t: 0.04, dur: 0.4, vol: 0.05, from: 900, q: 0.8, attack: 0.2 });
          this.note({ t: 0.08, f: 980, glide: 560, dur: 0.38, vol: 0.05, type: 'sine', vibrato: 11 });
          break;
        }
        case 'tvOn': {
          this.note({ f: 170, glide: 80, dur: 0.2, vol: 0.32, type: 'triangle', out: S }); // switch thunk
          this.note({ t: 0.08, f: 95, glide: 58, dur: 0.9, vol: 0.26, type: 'sine', vibrato: 28, out: S }); // degauss bwoom
          this.note({ t: 0.1, f: 310, dur: 0.7, vol: 0.04, type: 'sawtooth', attack: 0.1 });
          this.noiseHit({ t: 0.12, dur: 0.8, vol: 0.06, from: 5000, to: 2400, q: 0.4, attack: 0.25 });
          this.note({ t: 0.2, f: 3800, glide: 7400, dur: 1.3, vol: 0.012, type: 'sine', attack: 0.5 }); // tube whine
          break;
        }
        case 'tvOff': {
          this.note({ f: 1900, glide: 110, dur: 0.38, vol: 0.1, type: 'sine' });
          this.note({ t: 0.33, f: 140, glide: 70, dur: 0.12, vol: 0.2, type: 'triangle', out: S });
          break;
        }
        case 'flutter': {
          [0, 0.06, 0.12, 0.18, 0.24].forEach((t) => this.noiseHit({ t, dur: 0.05, vol: 0.06, from: 2600, to: 1500 }));
          this.note({ t: 0.05, f: 1568, glide: 2093, dur: 0.25, vol: 0.04 });
          break;
        }
        case 'squeak': {
          // a dragon, but tiny
          this.note({ f: 620, glide: 1250, dur: 0.16, vol: 0.09, type: 'sawtooth', vibrato: 22 });
          this.note({ t: 0.15, f: 1150, glide: 700, dur: 0.24, vol: 0.08, type: 'sawtooth', vibrato: 18 });
          this.noiseHit({ dur: 0.3, vol: 0.04, from: 1800, q: 0.7 });
          break;
        }
        case 'thunder': {
          this.noiseHit({ dur: 0.22, vol: 0.12, from: 1800, to: 600, q: 0.6, attack: 0.05 }); // crack
          this.noiseHit({ t: 0.08, dur: 2.4, vol: 0.38, from: 420, to: 110, q: 0.7, filter: 'lowpass', attack: 0.18, out: S }); // rumble
          break;
        }
        case 'beam': {
          this.note({ f: 520, glide: 640, dur: 0.55, vol: 0.06, attack: 0.08, partial: { ratio: 2, vol: 0.02, dur: 0.4 } });
          this.note({ t: 0.06, f: 1046.5, dur: 0.6, vol: 0.04, attack: 0.1 });
          break;
        }
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
        case 'click': {
          this.note({ f: 1500, dur: 0.035, vol: 0.1, type: 'square' });
          this.note({ t: 0.05, f: 950, dur: 0.06, vol: 0.1, type: 'square' });
          break;
        }
        case 'thud': {
          this.note({ f: 230, glide: 110, dur: 0.16, vol: 0.3, type: 'triangle' });
          this.note({ f: 110, glide: 60, dur: 0.2, vol: 0.25, type: 'sine' });
          this.sweep(0, 500, 180, 0.12, 0.1);
          break;
        }
        case 'swat': {
          this.sweep(0, 700, 2600, 0.12, 0.12);
          break;
        }
        case 'flap': {
          [0, 0.08, 0.16].forEach((t) => this.sweep(t, 1700, 900, 0.07, 0.07));
          break;
        }
        case 'chirp': {
          this.note({ f: 2000, glide: 2800, dur: 0.07, vol: 0.12, type: 'sine' });
          this.note({ t: 0.1, f: 2700, glide: 2100, dur: 0.08, vol: 0.12, type: 'sine' });
          this.note({ t: 0.22, f: 2300, glide: 3000, dur: 0.08, vol: 0.12, type: 'sine' });
          break;
        }
        case 'puff': {
          this.sweep(0, 400, 1800, 0.35, 0.08);
          [2093, 2637, 3136].forEach((f, i) => this.note({ t: 0.1 + i * 0.07, f, dur: 0.25, vol: 0.07 }));
          break;
        }
        case 'stamp': {
          this.note({ f: 190, glide: 90, dur: 0.12, vol: 0.3, type: 'triangle' });
          this.sweep(0, 1300, 400, 0.07, 0.09);
          break;
        }
        case 'sneeze': {
          // a tiny kitten sneeze: a quick inhale, then a soft 'ek'
          this.note({ f: 900, glide: 1500, dur: 0.18, vol: 0.05, type: 'sine', attack: 0.12 });
          this.noiseHit({ t: 0.22, dur: 0.09, vol: 0.12, from: 3600, to: 1800 });
          this.note({ t: 0.22, f: 1700, glide: 1100, dur: 0.07, vol: 0.09, type: 'triangle' });
          break;
        }
        case 'cord': {
          // a pull-cord light switch: soft tug, then a click
          this.sweep(0, 600, 1200, 0.08, 0.05);
          this.note({ t: 0.09, f: 2200, dur: 0.02, vol: 0.12, type: 'square' });
          this.note({ t: 0.1, f: 700, dur: 0.05, vol: 0.12, type: 'triangle' });
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
      const out = this.bedName !== null && this.story ? this.story : this.input; // story bus keeps the 110Hz body
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
      gain.connect(out);
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

  // ---------- story background loops ----------

  /** The story page calls this per scene; null when it unmounts (the site pad comes back). */
  setBed(name: BedName | null) {
    this.bedName = name;
    if (name !== null) this.stopAmbient();
    this.applyBed();
    if (name === null) this.startAmbient();
  }

  private live() {
    return !!this.ctx && this.ctx.state === 'running' && !document.hidden && !this.muted;
  }

  /** SFX briefly push the loop down so they read clearly. */
  private duck() {
    const b = this.bed;
    const ctx = this.ctx;
    if (!b || !ctx) return;
    try {
      const g = b.gain.gain;
      g.cancelScheduledValues(ctx.currentTime);
      g.setTargetAtTime(0.5, ctx.currentTime, 0.03);
      g.setTargetAtTime(1, ctx.currentTime + 0.3, 0.35);
    } catch {}
  }

  private applyBed() {
    const want = this.muted || !this.ctx || !this.story ? null : this.bedName;
    if ((this.bed?.name ?? null) === want || (want === 'off' && !this.bed)) return;
    this.fadeOutBed();
    if (want && want !== 'off') {
      try {
        this.bed = this.buildBed(want);
      } catch {
        this.bed = null;
      }
    }
  }

  private fadeOutBed() {
    const b = this.bed;
    const ctx = this.ctx;
    if (!b || !ctx) return;
    this.bed = null;
    b.timers.forEach((t) => window.clearInterval(t));
    try {
      b.gain.gain.cancelScheduledValues(ctx.currentTime);
      b.gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.3);
    } catch {}
    window.setTimeout(() => {
      b.nodes.forEach((n) => {
        try {
          n.stop();
        } catch {}
      });
      try {
        b.gain.disconnect();
      } catch {}
    }, 1600);
  }

  private buildBed(name: BedName): Bed {
    const ctx = this.ctx!;
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    gain.gain.setTargetAtTime(1, ctx.currentTime, 0.5);
    gain.connect(this.story!);
    const bed: Bed = { name, gain, nodes: [], timers: [] };

    const osc = (f: number, type: OscillatorType, vol: number, to: AudioNode = gain) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = vol;
      o.connect(g);
      g.connect(to);
      o.start();
      bed.nodes.push(o);
      return { o, g };
    };
    const noise = (type: BiquadFilterType, f: number, q: number, vol: number, to: AudioNode = gain) => {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer();
      src.loop = true;
      const flt = ctx.createBiquadFilter();
      flt.type = type;
      flt.frequency.value = f;
      flt.Q.value = q;
      const g = ctx.createGain();
      g.gain.value = vol;
      src.connect(flt);
      flt.connect(g);
      g.connect(to);
      src.start(0, Math.random());
      bed.nodes.push(src);
      return { src, flt, g };
    };
    const every = (ms: () => number, fn: () => void) => {
      // self-rescheduling random interval, stored so fadeOutBed can clear it
      const loop = () => {
        if (this.bed !== bed) return;
        if (this.live()) fn();
        const id = window.setTimeout(loop, ms());
        bed.timers.push(id);
        if (bed.timers.length > 8) bed.timers.splice(0, bed.timers.length - 8);
      };
      bed.timers.push(window.setTimeout(loop, ms()));
    };
    const box = (f: number, t: number, vol: number, out: AudioNode = gain) =>
      this.note({ f, t, dur: 1.2, vol, partial: { ratio: 4, vol: vol * 0.35, dur: 0.22 }, out, bed: true });
    // step sequencer with a little look-ahead so notes land on time
    const sequence = (stepSec: number, fn: (step: number, t: number) => void) => {
      let step = 0;
      let next = ctx.currentTime + 0.4;
      const id = window.setInterval(() => {
        if (this.bed !== bed) return;
        if (!this.live()) {
          next = ctx.currentTime + 0.2;
          return;
        }
        while (next < ctx.currentTime + 0.3) {
          fn(step, Math.max(0, next - ctx.currentTime));
          step++;
          next += stepSec;
        }
      }, 100);
      bed.timers.push(id);
    };

    // every scene: the TV itself, a soft mains hum and a hiss
    osc(120, 'sine', 0.012);
    osc(240, 'sine', 0.007);
    noise('bandpass', 7000, 0.5, 0.006);

    switch (name) {
      case 'alley': {
        noise('lowpass', 320, 0.7, 0.06); // distant city
        // streetlight buzz; drops out with the CSS flicker (4s loop: 44-48%, 78-80%)
        const buzzBp = ctx.createBiquadFilter();
        buzzBp.type = 'bandpass';
        buzzBp.frequency.value = 900;
        buzzBp.Q.value = 2;
        buzzBp.connect(gain);
        const buzz = osc(120, 'sawtooth', 0.006, buzzBp);
        const flick = () => {
          const t = ctx.currentTime;
          const g = buzz.g.gain;
          g.setValueAtTime(0.006, t);
          g.setValueAtTime(0.0, t + 1.76);
          g.setValueAtTime(0.006, t + 1.92);
          g.setValueAtTime(0.002, t + 3.12);
          g.setValueAtTime(0.006, t + 3.2);
        };
        flick();
        bed.timers.push(window.setInterval(() => this.live() && flick(), 4000));
        sequence(2.4, (s, t) => {
          if (s % 2 === 0) box(LONELY[(s / 2) % LONELY.length], t, 0.05);
        });
        break;
      }
      case 'rain': {
        noise('bandpass', 1800, 0.45, 0.075); // rain body
        noise('highpass', 5200, 0.6, 0.022); // sizzle
        every(
          () => 180 + Math.random() * 520,
          () => {
            const f = 1700 + Math.random() * 1600;
            this.note({ f, glide: f * 0.62, dur: 0.05, vol: 0.022 + Math.random() * 0.02, out: gain, bed: true }); // drips on cardboard
          },
        );
        sequence(3.2, (s, t) => {
          if (s % 2 === 1) box(LONELY[(s + 3) % LONELY.length], t, 0.04);
        });
        break;
      }
      case 'discovery': {
        const pad = osc(392, 'sine', 0.014);
        osc(587.33, 'sine', 0.01);
        pad.o.detune.value = -4;
        sequence(0.42, (s, t) => {
          if (Math.random() < 0.45) box(PENTA[3 + Math.floor(Math.random() * 5)], t, 0.022);
        });
        break;
      }
      case 'window': {
        // the lullaby, muffled, coming from inside the lit window
        const muffle = ctx.createBiquadFilter();
        muffle.type = 'lowpass';
        muffle.frequency.value = 1300;
        muffle.connect(gain);
        sequence(0.44, (s, t) => {
          const f = LULLABY[s % LULLABY.length];
          if (f) box(f, t, 0.07, muffle);
        });
        break;
      }
      case 'home': {
        noise('lowpass', 480, 0.7, 0.03); // fire body
        every(
          () => 50 + Math.random() * 200,
          () => this.noiseHit({ dur: 0.012 + Math.random() * 0.02, vol: 0.025 + Math.random() * 0.06, from: 2200 + Math.random() * 2600, q: 2, attack: 0.1, out: gain, bed: true }),
        );
        sequence(0.44, (s, t) => {
          const f = LULLABY[s % LULLABY.length];
          if (f) box(f, t, 0.06);
          if (s % 8 === 0) this.note({ f: LULLABY_BASS[(s / 8) % 4], t, dur: 3.2, vol: 0.05, type: 'triangle', attack: 0.08, out: gain, bed: true });
        });
        break;
      }
    }
    return bed;
  }

  startAmbient() {
    const ctx = this.ctx;
    if (!ctx || !this.input || this.muted || this.ambient || this.bedName !== null) return;
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
