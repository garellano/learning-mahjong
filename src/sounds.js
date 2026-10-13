// Old profiles stored the original silent default without recording a choice.
// Only a deliberate preference in the new version should override sound on.
export function resolveSoundPreference(savedProfile) {
  if (
    savedProfile?.soundPreferenceSet === true &&
    typeof savedProfile.sound === "boolean"
  ) {
    return savedProfile.sound;
  }
  return true;
}

// Each note is [delay, duration, start frequency, end frequency, volume, wave].
// Brief, quiet synthesized sounds keep the table responsive without downloads.
const SOUNDS = {
  tap: [[0, 0.055, 1100, 420, 0.03, "triangle"]],
  draw: [[0, 0.12, 420, 650, 0.028, "sine"]],
  discard: [[0, 0.075, 470, 170, 0.04, "triangle"]],
  pass: [
    [0, 0.065, 500, 330, 0.028, "triangle"],
    [0.08, 0.085, 690, 460, 0.028, "triangle"],
  ],
  success: [
    [0, 0.13, 523.25, 523.25, 0.035, "sine"],
    [0.11, 0.17, 659.25, 659.25, 0.035, "sine"],
  ],
  retry: [[0, 0.18, 330, 275, 0.028, "sine"]],
  win: [
    [0, 0.12, 523.25, 523.25, 0.035, "sine"],
    [0.11, 0.12, 659.25, 659.25, 0.035, "sine"],
    [0.22, 0.19, 783.99, 783.99, 0.035, "sine"],
  ],
};

export function createSoundPlayer({
  AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext,
  enabled = () => true,
  ducked = () => false,
} = {}) {
  let context;
  let disposed = false;
  const active = new Set();

  function release(voice) {
    active.delete(voice);
    voice.oscillator.onended = null;
    try {
      voice.oscillator.disconnect();
    } catch {}
    try {
      voice.gain.disconnect();
    } catch {}
  }

  function stop() {
    for (const voice of active) {
      try {
        voice.oscillator.stop(context?.currentTime || 0);
      } catch {}
      release(voice);
    }
  }

  function play(type = "tap") {
    if (disposed || !enabled() || ducked() || !AudioContext) return false;
    try {
      // Browsers unlock audio from a user gesture; callers play from an action.
      context ||= new AudioContext();
      if (context.state === "closed") return false;
      if (context.state === "suspended" || context.state === "interrupted") {
        context.resume()?.catch(() => {});
      }
      stop();
      const now = context.currentTime;
      for (const [delay, duration, from, to, volume, wave] of SOUNDS[type] ||
        SOUNDS.tap) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const voice = { oscillator, gain };
        active.add(voice);
        oscillator.onended = () => release(voice);
        oscillator.type = wave;
        oscillator.connect(gain);
        gain.connect(context.destination);
        const start = now + delay;
        const end = start + duration;
        oscillator.frequency.setValueAtTime(from, start);
        oscillator.frequency.exponentialRampToValueAtTime(to, end);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, end);
        oscillator.start(start);
        oscillator.stop(end + 0.01);
      }
      return true;
    } catch {
      stop();
      return false;
    }
  }

  function dispose() {
    disposed = true;
    stop();
    try {
      if (context?.state !== "closed") context?.close()?.catch(() => {});
    } catch {}
  }

  return { play, stop, dispose };
}
