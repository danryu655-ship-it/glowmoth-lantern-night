// All tuning numbers, colours and strings live here. The playfield is a fixed 1280 x 720 logical
// area that the renderer scales to the window, so every rule below is independent of screen size.

export const FIELD = { width: 1280, height: 720, groundY: 556 };

/** The simulation's fixed step: 60 updates a second, whatever the display's refresh rate. */
export const STEP = 1 / 60;

export const BEST_KEY = 'glowmoth.best.v1';

export const MOTH = {
  radius: 15,
  accel: 2450,
  drag: 6.2,
  maxSpeed: 405,
  invulnerable: 2,
  trailRate: 26,
};

export const MOTE = {
  radius: 11,
  value: 10,
  max: 7,
  spawnInterval: 0.62,
  minInterval: 0.34,
  drift: 16,
  life: 16,
};

export const LANTERN = {
  count: 4,
  motesEach: 6,
  lightScore: 100,
  positions: [
    { x: 172, y: 536 },
    { x: 468, y: 590 },
    { x: 812, y: 590 },
    { x: 1108, y: 536 },
  ],
};

export const DEW = { value: 50, minGap: 17, maxGap: 25 };

export const RUN = {
  lives: 3,
  sparks: 2,
  maxSparks: 2,
  motesPerSpark: 5,
  nightsToWin: 3,
  comboWindow: 3,
  comboStep: 4,
  maxCombo: 5,
};

export const HAZARD = {
  max: 9,
  shade: { radius: 21, speed: 62, speedPerNight: 15, steer: 0.75 },
  dart: { radius: 11, speed: 540, speedPerNight: 55, aimTime: 0.9, telegraph: 1.05 },
  spawnGap: 3.1,
  gapPerNight: 0.42,
  minGap: 1.05,
};

export const FLARE = {
  cost: 1,
  radius: 255,
  duration: 0.42,
  stun: 1.3,
  push: 430,
};

export const PALETTE = {
  ink: '#0B0E14',
  skyTop: '#0B0E14',
  skyMid: '#0a1428',
  skyLow: '#123050',
  hillFar: '#081326',
  hillNear: '#0b1d32',
  meadow: '#0d2a32',
  meadowLow: '#071a20',
  moon: '#ffe9b8',
  moonGlow: 'rgba(255, 226, 158, 0.22)',
  amber: '#FFD54F',
  amberHot: '#FFD54F',
  mint: '#A7F3D0',
  mintDim: '#4fae95',
  violet: '#4A148C',
  violetDeep: '#241a45',
  shadow: '#171029',
  coral: '#ff6f8a',
  cream: '#FFFFFF',
  text: '#FFFFFF',
  textDim: '#a9b7c9',
  panel: 'rgba(7, 14, 27, 0.72)',
  star: '#dfeaff',
  grass: '#0a2429',
  grassLit: '#A7F3D0',
};

export const STRINGS = {
  title: 'GLOWMOTH',
  subtitle: 'LANTERN NIGHT',
  tagline: 'Keep the meadow alight until dawn.',
  begin: 'PRESS ENTER OR CLICK TO FLY',
  controls: 'WASD / ARROWS / MOUSE — FLY      SPACE / CLICK — FLARE      P — PAUSE      M — MUTE',
  goal: 'Collect golden motes to light four lanterns.  Survive three nights.',
  over: 'THE NIGHT TAKES YOU',
  overSub: 'The lanterns dim, and the meadow goes quiet.',
  victory: 'DAWN BREAKS',
  victorySub: 'You kept the meadow alight until morning.',
  again: 'PRESS ENTER OR CLICK TO FLY AGAIN',
  dawn: 'NIGHT SURVIVED',
  dawnSub: 'The lanterns hold the dark at bay.',
  next: 'PRESS ENTER OR CLICK FOR THE NEXT NIGHT',
};
