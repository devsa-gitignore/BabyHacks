// Lullaby music box (plan P5b). A soft pentatonic loop made with Web Audio. Nothing plays until a visitor asks.
// Returns a stop function. The loop plays through its eight notes, then rests a beat and starts again.

const NOTES = [523.25, 587.33, 659.25, 783.99, 880.0, 783.99, 659.25, 587.33]; // C5 D5 E5 G5 A5 G5 E5 D5
const STEP = 0.42; // seconds per note
const REST = 1.2; // breath between loops

let ctx: AudioContext | null = null;

function ensureContext(): AudioContext | null {
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function pluck(c: AudioContext, freq: number, when: number, out: AudioNode) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  const lp = c.createBiquadFilter();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, when);
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(1800, when);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(0.16, when + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + STEP * 2.2);
  osc.connect(lp).connect(gain).connect(out);
  osc.start(when);
  osc.stop(when + STEP * 2.4);
}

export function startLullaby(): () => void {
  const c = ensureContext();
  if (!c) return () => {};
  const bus = c.createGain();
  bus.gain.value = 0.9;
  bus.connect(c.destination);

  let stopped = false;
  let timer = 0;
  const loop = () => {
    if (stopped) return;
    const t0 = c.currentTime + 0.05;
    NOTES.forEach((f, i) => pluck(c, f, t0 + i * STEP, bus));
    timer = window.setTimeout(loop, (NOTES.length * STEP + REST) * 1000);
  };
  loop();

  return () => {
    stopped = true;
    window.clearTimeout(timer);
    // fade the bus out so the stop is soft, not a click
    const now = c.currentTime;
    bus.gain.cancelScheduledValues(now);
    bus.gain.setValueAtTime(bus.gain.value, now);
    bus.gain.linearRampToValueAtTime(0, now + 0.4);
    window.setTimeout(() => bus.disconnect(), 500);
  };
}
