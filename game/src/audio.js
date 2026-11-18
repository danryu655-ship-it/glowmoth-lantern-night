// Sound effects are synthesised in Web Audio: no files, no network. The context is created
// on the first key press or click (browsers require a gesture), and a quiet two-oscillator
// pad sits under the effects. M mutes everything and the choice survives a reload.
// ANDROID BUILD ONLY — music: two bundled tracks in audio/ (still no network).
// 'opening' plays on the title, dawn, victory and game-over screens; 'game' plays
// during a night. Switching is wired into play(): 'start' -> game, 'clear' /
// 'victory' / 'over' -> opening. The tracks are plain <audio> elements so they
// can start on the title screen without a gesture (the wrapper allows autoplay).

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

  // --- Music (Android only): two bundled <audio> loops. ---
  const MUSIC_VOLUME = 0.3;
  let currentTrack = 'opening';
  let fadeTimer = null;

  function makeTrack(file) {
    const element = document.createElement('audio');
    element.src = new URL(`audio/${file}`, document.baseURI).href;
    element.loop = true;
    element.preload = 'auto';
    element.volume = 0;
    element.muted = muted;
    return element;
  }

  const openingTrack = makeTrack('opening.mp3');
  const gameTrack = makeTrack('game.mp3');

  function fadeTo(element, target) {
    if (fadeTimer !== null) {
      clearInterval(fadeTimer);
      fadeTimer = null;
    }
    const steps = 16;
    let step = 0;
    const from = element.volume;
    fadeTimer = setInterval(() => {
      step += 1;
      element.volume = from + (target - from) * (step / steps);
      if (step >= steps) {
        clearInterval(fadeTimer);
        fadeTimer = null;
        element.volume = target;
        if (target === 0) element.pause();
      }
    }, 50);
  }

  function setMusic(which) {
    if (currentTrack === which) return;
    const prev = currentTrack === 'game' ? gameTrack : openingTrack;
    const next = which === 'game' ? gameTrack : openingTrack;
    currentTrack = which;
    if (prev !== next) fadeTo(prev, 0);
    next.play().catch(() => {});
    fadeTo(next, MUSIC_VOLUME);
  }

  // Try to start the opening track at once (the Android wrapper allows
  // autoplay); where a gesture is required this fails silently and unlock()
  // below retries it on the first tap or key press.
  openingTrack.play().catch(() => {});
  fadeTo(openingTrack, MUSIC_VOLUME);

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
    const track = currentTrack === 'game' ? gameTrack : openingTrack;
    track.play().catch(() => {});
  }

  function play(name, detail = 0) {
    if (context === null) return;
    if (name === 'start') setMusic('game');
    if (name === 'clear' || name === 'victory' || name === 'over') setMusic('opening');
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
      case 'shield':
        tone({ frequency: 880, duration: 0.25, type: 'sine', volume: 0.14 });
        tone({ frequency: 1318.5, duration: 0.4, type: 'sine', volume: 0.11, delay: 0.09 });
        break;
      case 'shieldBreak':
        tone({ frequency: 1046.5, endFrequency: 392, duration: 0.28, type: 'triangle', volume: 0.15 });
        noise({ duration: 0.18, volume: 0.07, lowpass: 3200 });
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
    openingTrack.muted = muted;
    gameTrack.muted = muted;
    return muted;
  }

  return { unlock, play, toggleMute, isMuted: () => muted };
}
