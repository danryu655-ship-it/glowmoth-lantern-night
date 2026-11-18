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

// ANDROID BUILD ONLY (v1.4.0) — Lulu's shield.
export const SHIELD = {
  interval: 60,
  radius: 46,
  popLife: 0.45,
};

// ANDROID BUILD ONLY (v1.3.0) — companions and the boss.
export const COMPANION = {
  magnetRadius: 120,
  magnetPull: 150,
  trail: 54,
};

export const BOSS = {
  every: 10,
  radius: 55,
  bonus: 1000,
  spawnBoost: 0.55,
  attackGap: 3.5,
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
  lumi: '#8ff0d0',
  lulu: '#8ecbff',
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
  controls: 'LEFT THUMB: JOYSTICK — FLY      TAP — FLARE',
  goal: 'Lumi dan Lulu dipenjara Dark Pekat. Nyalakan 4 lampion tiap malam untuk membebaskan mereka.',
  over: 'THE NIGHT TAKES YOU',
  overSub: 'Lumi dan Lulu masih menunggu dalam gelap.',
  victory: 'DAWN BREAKS',
  victorySub: 'Lumi bebas — tapi Lulu masih terjebak di kegelapan yang lebih dalam.',
  again: 'PRESS ENTER OR CLICK TO FLY AGAIN',
  dawn: 'NIGHT SURVIVED',
  dawnSub: 'The lanterns hold the dark at bay.',
  // ANDROID BUILD ONLY — story line shown on each dawn screen (index: night - 1).
  dawnStory: [
    'Malam pertama berlalu. Satu lampion menyala — dari kejauhan, Lumi dan Lulu masih memanggil.',
    'Malam kedua berlalu. Bayangan Dark Pekat semakin gelap, tapi cahaya Luma semakin terang.',
    'Malam ketiga berlalu. Lumi bebas! Dia bergabung dengan Luma — cahayanya menarik serpihan dari kejauhan.',
    'Malam keempat berlalu. Lumi dan Luma menjaga taman bersama.',
    'Malam kelima berlalu. Kegelapan semakin pekat — tapi dua cahaya kini terbang bersama.',
    'Malam keenam berlalu. Lulu bebas! Ketiga cahaya kini terbang bersama.',
  ],
  next: 'PRESS ENTER OR CLICK FOR THE NEXT NIGHT',
};
