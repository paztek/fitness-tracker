/** Retours sonores et haptiques du minuteur de repos. */

let context: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  context ??= new Ctor();
  return context;
}

/** À appeler sur une interaction utilisateur : iOS n'autorise le son qu'ainsi. */
export function primeAudio(): void {
  const ctx = audioContext();
  if (ctx?.state === 'suspended') void ctx.resume();
}

export function beep(times = 2): void {
  const ctx = audioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') void ctx.resume();

  for (let i = 0; i < times; i++) {
    const start = ctx.currentTime + i * 0.28;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(i === times - 1 ? 1046 : 784, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.24);
  }
}

export function vibrate(pattern: number | number[] = [90, 60, 90]): void {
  if ('vibrate' in navigator) navigator.vibrate(pattern);
}
