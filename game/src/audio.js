// Every sound is synthesised in Web Audio: no files, no network. The context is created on
// the first key press or click (browsers require a gesture), and a quiet two-oscillator pad
// sits under the effects. M mutes everything and the choice survives a reload.

const MUTE_KEY = 'glowmoth.muted.v1';

function readMuted() {
  try {
    return window.localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function createAudio() {
  let context = null;
  let master = null;
  let padGain = null;
  let muted = readMuted();
  let started = false;

  function ensure() {
    if (context === null) {
      const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
      if (typeof AudioContextClass !== 'function') return null;
      context = new AudioContextClass();
      master = context.createGain();
      master.gain.value = muted ? 0 : 0.42;
      master.connect(context.destination);
    }
    if (context.state === 'suspended') context.resume().catch(() => {});
    return context;
  }

  function startPad() {
    if (started || context === null) return;
    started = true;
    padGain = context.createGain();
    padGain.gain.value = 0.028;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    padGain.connect(filter);
    filter.connect(master);
    for (const [frequency, detune] of [[110, -5], [164.81, 6], [220, -3]]) {
      const oscillator = context.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      oscillator.detune.value = detune;
      oscillator.connect(padGain);
      oscillator.start();
    }
    const lfo = context.createOscillator();
    const lfoGain = context.createGain();
    lfo.frequency.value = 0.09;
    lfoGain.gain.value = 0.012;
    lfo.connect(lfoGain);
    lfoGain.connect(padGain.gain);
    lfo.start();
  }

  function tone({ frequency, endFrequency = null, duration = 0.18, type = 'sine', volume = 0.2, delay = 0, attack = 0.006 }) {
    if (context === null || muted) return;
    const at = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, at);
    if (endFrequency !== null) oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), at + duration);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(volume, at + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(at);
    oscillator.stop(at + duration + 0.04);
  }

  function noise({ duration = 0.3, volume = 0.2, lowpass = 900, delay = 0 }) {
    if (context === null || muted) return;
    const frames = Math.floor(context.sampleRate * duration);
    const buffer = context.createBuffer(1, frames, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < frames; index += 1) {
      data[index] = (Math.random() * 2 - 1) * (1 - index / frames) ** 2;
    }
    const source = context.createBufferSource();
    source.buffer = buffer;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = context.createGain();
    gain.gain.value = volume;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start(context.currentTime + delay);
  }

  function unlock() {
    const created = ensure();
    if (created === null) return;
    startPad();
  }

  function play(name, detail = 0) {
    if (context === null) return;
    switch (name) {
      case 'start':
        tone({ frequency: 392, duration: 0.16, type: 'triangle', volume: 0.16 });
        tone({ frequency: 587.33, duration: 0.3, type: 'sine', volume: 0.14, delay: 0.09 });
        break;
      case 'mote': {
        const pitch = 659.25 * 2 ** (Math.min(4, detail) * 0.055);
        tone({ frequency: pitch, endFrequency: pitch * 1.22, duration: 0.16, type: 'sine', volume: 0.14 });
        tone({ frequency: pitch * 2, duration: 0.08, type: 'triangle', volume: 0.04 });
        break;
      }
      case 'dew':
        tone({ frequency: 523.25, duration: 0.2, type: 'sine', volume: 0.16 });
        tone({ frequency: 783.99, duration: 0.35, type: 'sine', volume: 0.12, delay: 0.1 });
        break;
      case 'lantern':
        [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
          tone({ frequency, duration: 0.55, type: 'triangle', volume: 0.13, delay: index * 0.06 });
        });
        break;
      case 'flare':
        tone({ frequency: 220, endFrequency: 880, duration: 0.32, type: 'sine', volume: 0.15 });
        noise({ duration: 0.25, volume: 0.08, lowpass: 2200 });
        break;
      case 'hit':
        tone({ frequency: 146.83, endFrequency: 55, duration: 0.45, type: 'sawtooth', volume: 0.18 });
        noise({ duration: 0.35, volume: 0.2, lowpass: 700 });
        break;
      case 'clear':
        [392, 523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
          tone({ frequency, duration: 0.7, type: 'triangle', volume: 0.12, delay: index * 0.12 });
        });
        break;
      case 'over':
        [392, 329.63, 261.63, 196].forEach((frequency, index) => {
          tone({ frequency, duration: 0.7, type: 'sine', volume: 0.14, delay: index * 0.18 });
        });
        break;
      case 'victory':
        [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((frequency, index) => {
          tone({ frequency, duration: 0.9, type: 'triangle', volume: 0.12, delay: index * 0.15 });
        });
        break;
      default:
        break;
    }
  }

  function toggleMute() {
    muted = !muted;
    try {
      window.localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
    } catch {
      // Private windows keep the choice for this visit only.
    }
    if (master !== null) master.gain.value = muted ? 0 : 0.42;
    return muted;
  }

  return { unlock, play, toggleMute, isMuted: () => muted };
}
