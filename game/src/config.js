// All tuning numbers, colours and strings live here. The playfield is a fixed 1280 x 720 logical
// area that the renderer scales to the window, so every rule below is independent of screen size.

export const FIELD = { width: 1280, height: 720, groundY: 556 };

/** The simulation's fixed step: 60 updates a second, whatever the display's refresh rate. */
export const STEP = 1 / 60;

export const BEST_KEY = 'glowmoth.best.v1';

// ANDROID BUILD ONLY (v1.5.0) — earned badges for the Skill screen.
export const BADGES_KEY = 'glowmoth.badges.v1';

// ANDROID BUILD ONLY (v1.6.0) — the moth's skin, picked on the title screen.
export const SKIN_KEY = 'glowmoth.skin.v1';

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
  // ANDROID BUILD ONLY (v1.6.0) — the Void Scorpion: a ground crawler that
  // lunges when close. Flare only stuns it — it is too heavy to push.
  scorpion: { radius: 22, speed: 68, speedPerNight: 10, lungeRange: 170, lungeSpeed: 330, lungeCooldown: 3 },
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

// ANDROID BUILD ONLY (v1.5.0) — the Skill screen: button rects on the title
// and skill screens, and the guide content. The skills are buffs, not
// buttons: the screen only displays them; in-game only Flare is triggered
// (tap / Space), the rest run on their own.
export const SKILL_BUTTON = { x: 1120, y: 24, w: 132, h: 40 };
export const BACK_BUTTON = { x: 550, y: 662, w: 180, h: 38 };

// ANDROID BUILD ONLY (v1.9.0) — mode + character select, shown from the
// title before a run (friend feedback 22 Nov 2026: "saat di tampilan mau
// masuk game ada pilihan mode story dan mode endless"). Story is the game
// as it is now (prologue, dawn stories, companions joining, epilogue);
// Endless skips the story beats — nights run on until the moth falls,
// bosses and companions still show up. The last pick is remembered.
export const SELECT_KEY = 'glowmoth.select.v1';
// ANDROID BUILD ONLY (v1.9.0 round 2) — the mode is picked FIRST, on its
// own screen. QUEST is the story as it is now (Luma, prologue, dawn
// stories, companions joining, epilogue); TANPA AKHIR goes to the
// character picker and then plays with no story beats. The 'feat' line
// is the one-line summary under each card's description.
export const MODES = [
  { id: 'quest', name: 'QUEST', tag: 'ALUR CERITA', color: '#ffd54f', desc: 'Alur cerita seperti sekarang — prolog, cerita fajar, teman bergabung, dan epilog.', feat: 'LUMA · PROLOG · 15 MOMEN CERITA' },
  { id: 'endless', name: 'TANPA AKHIR', tag: 'MAIN SAMPAI BOSAN', color: '#8ff0d0', desc: 'Pilih karakter dulu, lalu main tanpa potongan cerita. Malam jalan terus.', feat: '5 KARAKTER · TANPA CERITA · MALAM TANPA AKHIR' },
];
export const MODE_CARDS = [
  { id: 'quest', x: 150, y: 210, w: 460, h: 240 },
  { id: 'endless', x: 670, y: 210, w: 460, h: 240 },
];
// Playable characters: the five moths already in the game, no new art.
// Flare stays for everyone; the passive is what differs. The chosen
// character does NOT re-join on their night — they are already you.
// The 'skill' line is the passive's name, shown on each character card.
// ANDROID BUILD ONLY (v1.9.3) — hp / speed are DISPLAY-ONLY ratings
// (1-5) for the character cards, from the user: HP Luma 4, Lumi 3,
// Lulu 2, Koko 2, Zephyr 2; Kecepatan Luma 5, Lumi 2, Lulu 3, Koko 4,
// Zephyr 3. They do not change the run: Lulu still starts with 4
// hearts (her shield passive) and all moths fly at the same speed.
export const CHARACTERS = [
  { id: 'luma', name: 'LUMA', tag: 'SEIMBANG', skill: 'FLARE BURST', portrait: 'luma', color: '#f59e0b', hp: 4, speed: 5, desc: 'Seimbang. Flare seperti biasa.' },
  { id: 'lumi', name: 'LUMI', tag: 'MAGNET', skill: 'MOTE MAGNET', portrait: 'lumi', color: '#8ff0d0', hp: 3, speed: 2, desc: 'Kunang ketarik dari jauh sejak malam 1.' },
  { id: 'lulu', name: 'LULU', tag: 'PELINDUNG', skill: "LULU'S SHIELD", portrait: 'lulu', color: '#8ecbff', hp: 2, speed: 3, desc: 'Mulai 2 hati + perisai tiap 60 detik.' },
  { id: 'koko', name: 'KOKO', tag: 'PENYERANG', skill: 'KOKO EMBER', portrait: 'companionKoko', color: '#fb923c', hp: 2, speed: 4, desc: 'Bakar 1 shade terdekat tiap 8 detik.' },
  { id: 'zephyr', name: 'ZEPHYR', tag: 'CEPAT', skill: 'ZEPHYR DRIFT', portrait: 'companionZephyr', color: '#c084fc', hp: 2, speed: 3, desc: 'Semua bahaya 25% lebih lambat.' },
];
export const CHARACTER_CARDS = [
  { id: 'luma', x: 85, y: 150, w: 210, h: 396 },
  { id: 'lumi', x: 310, y: 150, w: 210, h: 396 },
  { id: 'lulu', x: 535, y: 150, w: 210, h: 396 },
  { id: 'koko', x: 760, y: 150, w: 210, h: 396 },
  { id: 'zephyr', x: 985, y: 150, w: 210, h: 396 },
];
export const START_BUTTON = { x: 490, y: 560, w: 300, h: 44 };
// ANDROID BUILD ONLY (v1.9.1) — the in-game HUD buttons, in a row right
// under the top bar (y 100-134), directly below the LIVES / FLARE
// cluster. JEDA pauses, ULANG restarts the run, MENU goes to the title.
// A tap on one never fires a Flare (main.js checks them first).
export const HUD_BUTTONS = {
  menu: { x: 1046, y: 100, w: 64, h: 34 },
  restart: { x: 1118, y: 100, w: 72, h: 34 },
  pause: { x: 1198, y: 100, w: 60, h: 34 },
};
// ANDROID BUILD ONLY (v1.9.1) — the pause screen's own buttons.
export const PAUSE_BUTTONS = {
  resume: { x: 490, y: 450, w: 300, h: 44 },
  restart: { x: 490, y: 506, w: 300, h: 44 },
  menu: { x: 490, y: 562, w: 300, h: 44 },
};

// ANDROID BUILD ONLY (v1.6.0) — moth skins, picked on the title screen.
// The portraits are the user's own SVGs (Golden Sun, Cyber Neon); the
// default skin uses the Luma portrait. The moth in flight is still drawn
// procedurally — the skin only swaps its colours (see SKIN_PALETTES).
export const SKIN_BUTTON = { x: 976, y: 24, w: 132, h: 40 };

// ANDROID BUILD ONLY (v1.8.0) — in-game tips ("Tips Sambil Main"): short
// hints that appear while playing, at the moment each one matters, then
// fade away. They replace the v1.7.0/v1.7.1 Cara Main screen, which the
// player never read before playing. The numbers are verified against the
// code: 6 motes per lantern (LANTERN.motesEach), hearts from the
// hero's hp (CHARACTERS), Flare costs 1 Spark, refill 1 per 5 motes,
// max 2.
export const TIPS = [
  { id: 'collect', text: 'Terbang menyentuh kunang emas untuk mengambil cahayanya — tiap lentera butuh 6 kunang.' },
  { id: 'flare', text: 'Shade mendekat! Ketuk layar / Spasi untuk Flare.' },
  { id: 'spark', text: 'Flare memakai 1 Spark — isi ulang 1 tiap 5 motes (maks 2).' },
  { id: 'lantern', text: 'Lentera menyala! Kumpulkan kunang untuk lentera berikutnya.' },
  { id: 'lives', text: 'Kena serang: −1 hati. Cari embun untuk memulihkan 1 hati.' },
  { id: 'dew', text: 'Embun muncul! Sentuh untuk +1 hati & +50 poin.' },
];
export const SKIN_CARDS = [
  { id: 'luma', x: 150, y: 150, w: 340, h: 440 },
  { id: 'golden', x: 470, y: 150, w: 340, h: 440 },
  { id: 'cyber', x: 790, y: 150, w: 340, h: 440 },
];
export const SKINS = [
  { id: 'luma', portrait: 'luma', name: 'LUMA', tag: 'KLASIK', color: '#ffd54f', desc: 'Luma seperti biasa — emas hangat padang rumput.' },
  { id: 'golden', portrait: 'skinGolden', name: 'GOLDEN SUN', tag: 'MALAM 1', color: '#f59e0b', desc: 'Sayap emas terang dengan halo matahari.' },
  { id: 'cyber', portrait: 'skinCyber', name: 'CYBER NEON', tag: 'MALAM 1', color: '#22d3ee', desc: 'Neon sian & pink — Luma dari kota masa depan.' },
];
export const SKIN_PALETTES = {
  luma: null, // the default gold/cream moth, as drawn since v1.0.0.
  golden: {
    aura: ['rgba(255, 214, 64, 0.5)', 'rgba(255, 190, 80, 0.2)', 'rgba(245, 158, 11, 0)'],
    upper: ['rgba(255, 247, 214, 0.95)', 'rgba(255, 213, 79, 0.85)', 'rgba(245, 158, 11, 0.25)'],
    lower: ['rgba(255, 236, 180, 0.85)', 'rgba(255, 180, 60, 0.2)'],
    body: ['#fffbe9', '#ffd54f', '#b45309'],
    head: '#fff3c9',
    wingStroke: 'rgba(255, 240, 190, 0.5)',
    antenna: 'rgba(255, 240, 190, 0.8)',
  },
  cyber: {
    aura: ['rgba(34, 211, 238, 0.45)', 'rgba(236, 72, 153, 0.18)', 'rgba(34, 211, 238, 0)'],
    upper: ['rgba(165, 243, 252, 0.92)', 'rgba(34, 211, 238, 0.75)', 'rgba(236, 72, 153, 0.3)'],
    lower: ['rgba(34, 211, 238, 0.72)', 'rgba(236, 72, 153, 0.2)'],
    body: ['#e0e7ff', '#818cf8', '#1e1b2e'],
    head: '#f0abfc',
    wingStroke: 'rgba(165, 243, 252, 0.5)',
    antenna: 'rgba(165, 243, 252, 0.8)',
  },
};
// ANDROID BUILD ONLY (v1.9.2) — the player moth's colours per chosen
// character, in the same shape as SKIN_PALETTES and the same hues as
// the companion palettes in render.js (lumi mint, lulu blue, koko
// orange, zephyr purple). Luma is null: she keeps the default gold
// moth, and the title-screen skins still apply to her. The skins are
// Luma-only — a chosen character always flies in its own colours.
export const CHARACTER_PALETTES = {
  luma: null,
  lumi: {
    aura: ['rgba(143, 240, 208, 0.4)', 'rgba(143, 240, 208, 0.15)', 'rgba(143, 240, 208, 0)'],
    upper: ['rgba(210, 255, 238, 0.95)', 'rgba(143, 240, 208, 0.75)', 'rgba(143, 240, 208, 0.25)'],
    lower: ['rgba(210, 255, 238, 0.85)', 'rgba(143, 240, 208, 0.2)'],
    body: ['#eafff5', '#8ff0d0', '#0f766e'],
    head: '#d2ffef',
    wingStroke: 'rgba(210, 255, 238, 0.5)',
    antenna: 'rgba(210, 255, 238, 0.8)',
  },
  lulu: {
    aura: ['rgba(142, 203, 255, 0.4)', 'rgba(142, 203, 255, 0.15)', 'rgba(142, 203, 255, 0)'],
    upper: ['rgba(214, 235, 255, 0.95)', 'rgba(142, 203, 255, 0.75)', 'rgba(142, 203, 255, 0.25)'],
    lower: ['rgba(214, 235, 255, 0.85)', 'rgba(142, 203, 255, 0.2)'],
    body: ['#eff6ff', '#8ecbff', '#1d4ed8'],
    head: '#dbeafe',
    wingStroke: 'rgba(214, 235, 255, 0.5)',
    antenna: 'rgba(214, 235, 255, 0.8)',
  },
  koko: {
    aura: ['rgba(251, 146, 60, 0.4)', 'rgba(251, 146, 60, 0.15)', 'rgba(251, 146, 60, 0)'],
    upper: ['rgba(254, 215, 170, 0.95)', 'rgba(251, 146, 60, 0.75)', 'rgba(251, 146, 60, 0.25)'],
    lower: ['rgba(254, 215, 170, 0.85)', 'rgba(251, 146, 60, 0.2)'],
    body: ['#fff7ed', '#fb923c', '#9a3412'],
    head: '#ffedd5',
    wingStroke: 'rgba(254, 215, 170, 0.5)',
    antenna: 'rgba(254, 215, 170, 0.8)',
  },
  zephyr: {
    aura: ['rgba(192, 132, 252, 0.4)', 'rgba(192, 132, 252, 0.15)', 'rgba(192, 132, 252, 0)'],
    upper: ['rgba(233, 213, 255, 0.95)', 'rgba(192, 132, 252, 0.75)', 'rgba(192, 132, 252, 0.25)'],
    lower: ['rgba(233, 213, 255, 0.85)', 'rgba(192, 132, 252, 0.2)'],
    body: ['#faf5ff', '#c084fc', '#6b21a8'],
    head: '#f3e8ff',
    wingStroke: 'rgba(233, 213, 255, 0.5)',
    antenna: 'rgba(233, 213, 255, 0.8)',
  },
};
export const SKILL_GUIDE = [
  {
    id: 'flare', icon: 'icon-flare.svg', portrait: 'skillFlare', letter: 'F', name: 'FLARE BURST',
    tag: 'AKTIF  •  LUMA', color: '#f59e0b',
    desc: 'Ketuk di luar joystick / Spasi: ledakan cahaya radius 255 — dorong bayangan 430, stun 1,3 dtk. 1 Spark; isi ulang tiap 5 motes (maks 2).',
  },
  {
    id: 'magnet', icon: 'icon-magnet.svg', portrait: 'skillMagnet', letter: 'M', name: 'MOTE MAGNET',
    tag: 'PASIF  •  LUMI  —  MALAM 3', color: '#8ff0d0',
    desc: 'Lumi terbang mendampingimu dan menarik motes dalam radius 120, supaya combo tetap terjaga.',
  },
  {
    id: 'shield', icon: 'icon-shield.svg', portrait: 'skillShield', letter: 'S', name: "LULU'S SHIELD",
    tag: 'PASIF  •  LULU  —  MALAM 6', color: '#8ecbff',
    desc: 'Perisai tiap 60 detik, menahan 1 serangan utuh. Saat Lulu bergabung, hati maksimal +1.',
  },
  {
    id: 'dew', icon: 'icon-dewdrop.svg', portrait: 'skillDew', letter: 'D', name: 'DEWDROP VITALITY',
    tag: 'POWER-UP', color: '#67e8f9',
    desc: 'Embun muncul tiap 17–25 detik: +50 poin & pulihkan 1 hati.',
  },
  {
    id: 'koko', icon: 'companion-koko.svg', portrait: 'companionKoko', letter: 'K', name: 'KOKO EMBER',
    tag: 'PASIF  •  KOKO  —  MALAM 9', color: '#fb923c',
    desc: 'Koko membakar 1 bayangan terdekat tiap 8 detik.',
  },
  {
    id: 'zephyr', icon: 'companion-zephyr.svg', portrait: 'companionZephyr', letter: 'Z', name: 'ZEPHYR DRIFT',
    tag: 'PASIF  •  ZEPHYR  —  MALAM 12', color: '#c084fc',
    desc: 'Zephyr memperlambat semua bayangan & panah 25%.',
  },
];
export const BADGE_GUIDE = [
  { id: 'lumi', icon: 'badge-lumi.svg', portrait: 'badgeLumi', name: 'LUMI', night: 3, color: '#8ff0d0' },
  { id: 'lulu', icon: 'badge-lulu.svg', portrait: 'badgeLulu', name: 'LULU', night: 6, color: '#8ecbff' },
  { id: 'pekat', icon: 'badge-pekat.svg', portrait: 'badgePekat', name: 'DARK PEKAT', night: 10, color: '#a98bff' },
  { id: 'ratu', icon: 'boss-ratu-laba-laba.svg', portrait: 'bossRatu', name: 'RATU LABA-LABA', night: 20, color: '#c084fc' },
];

// ANDROID BUILD ONLY (v1.3.0) — companions and the boss.
export const COMPANION = {
  magnetRadius: 120,
  magnetPull: 150,
  trail: 54,
  // ANDROID BUILD ONLY (v1.6.0) — Koko (night 9) and Zephyr (night 12)
  // join later in endless mode, like Lumi (3) and Lulu (6).
  kokoNight: 9,
  zephyrNight: 12,
  kokoScorchInterval: 8,
  kokoScorchRange: 420,
  zephyrSlow: 0.75,
};

export const BOSS = {
  every: 10,
  radius: 55,
  bonus: 1000,
  spawnBoost: 0.55,
  attackGap: 3.5,
};

// ANDROID BUILD ONLY (v1.6.0) — the second boss. Dark Pekat keeps nights
// 10, 30, 50, ...; the Shadow Spider Queen takes nights 20, 40, 60, ...
// The fight is the same (4 lanterns = defeat); only the face, the arena
// and the name change.
export const BOSS_KINDS = {
  pekat: { name: 'DARK PEKAT', color: '#a98bff' },
  ratu: { name: 'RATU LABA-LABA', color: '#c084fc' },
};

export function bossKind(night) {
  return night % 20 === 0 ? 'ratu' : 'pekat';
}

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
  controls: 'LEFT THUMB: JOYSTICK — FLY      TAP — FLARE      K — SKILL',
  goal: 'Lumi dan Lulu dipenjara Dark Pekat. Nyalakan 4 lampion tiap malam untuk membebaskan mereka.',
  over: 'THE NIGHT TAKES YOU',
  overSub: 'Lumi dan Lulu masih menunggu dalam gelap.',
  victory: 'DAWN BREAKS',
  victorySub: 'Lumi bebas — tapi Lulu masih terjebak di kegelapan yang lebih dalam.',
  again: 'PRESS ENTER OR CLICK TO FLY AGAIN',
  dawn: 'NIGHT SURVIVED',
  dawnSub: 'The lanterns hold the dark at bay.',
  // ANDROID BUILD ONLY — story line shown on each dawn screen (index: night - 1).
  // Kronik Luminaria: nights 3 and 6 are carried by their cutscenes, so their
  // lines stay short; night 9 has no dawn text in the Kronik (it gives the
  // pre-sleep dialogue instead, deferred) — the line below is Rias's, in the
  // same voice, so the dawn card is never empty.
  dawnStory: [
    'Malam pertama berlalu. Satu per satu lampion berhasil dipertahankan, namun dari kejauhan terdengar tawa dingin Dark Pekat yang menggema di langit.',
    'Malam kedua berakhir. Cahaya Luma mulai stabil, dan di cakrawala barat, terlihat pendaran hijau mint samar-samar berkedip meminta tolong.',
    'Malam ketiga berlalu. Lumi bebas! Dia bergabung dengan Luma — cahayanya menarik serpihan dari kejauhan.',
    'Malam keempat berlalu. Dua lentera kecil yang terbang bersama membuktikan bahwa kegelapan bukanlah penguasa mutlak di padang rumput ini.',
    'Malam kelima dilewati dengan luka sayap yang perih, tapi di depan mata, kepompong es hitam tempat Lulu dikurung sudah berada dalam jangkauan.',
    'Malam keenam berlalu. Lulu bebas! Ketiga cahaya kini terbang bersama.',
    'Malam ketujuh berakhir. Angin mendadak berhenti bertiup. Keheningan yang menakutkan menyelimuti padang rumput... tanda sang badai sesungguhnya segera tiba.',
    'Malam kedelapan bertahan. Tiga sahabat ini tidak lagi sekadar bertahan hidup; mereka kini bertarung seperti satu jiwa yang tak terpisahkan.',
    'Malam kesembilan berlalu. Malam terpanjang telah dilewati — besok, Dark Pekat turun sendiri.',
    // Nights 10–12 are Rias's, in the same voice (the Kronik's dawn lines
    // stop at night 9): the first boss falls, then the Queen's web closes in.
    'Malam kesepuluh berlalu. Dark Pekat kalah! Keempat lampion memancarkan pilar cahaya yang mengurungnya, dan zirah obsidiannya retak perlahan.',
    'Malam kesebelas berlalu. Fajar semakin dekat, tapi dari sarang obsidian yang gelap, terdengar suara kaki-kaki raksasa merayap mendekat.',
    'Malam kedua belas berlalu. Zephyr bebas! Sayap kosmiknya membentang, memperlambat bayangan yang mengejar kalian.',
  ],
  next: 'PRESS ENTER OR CLICK FOR THE NEXT NIGHT',
  // ANDROID BUILD ONLY (v1.4.5) — prologue, shown once before the first run,
  // in two pages: the world of Luminaria, then Dark Pekat's tragedy.
  prologueTitle: 'PADANG RUMPUT LUMINARIA',
  prologue: [
    [
      'Di padang rumput Luminaria, tanah tak pernah disinari matahari secara langsung. Kehidupan dipertahankan oleh Pohon Bulan yang meneteskan embun energi dan menerbangkan serpihan cahaya bintang.',
      'Nenek moyang mendirikan 4 Lampion Purba: Barat (Lentera Harapan), Tengah-Kiri (Lentera Keberanian), Tengah-Kanan (Lentera Harmoni), Timur (Lentera Fajar). Jika keempatnya padam dalam satu malam, padang rumput membeku dalam kegelapan abadi.',
    ],
    [
      'Ratusan siklus lalu, Dark Pekat adalah Kumbang Zirah Pengembara penjaga perbatasan. Saat badai bayangan purba melanda, ia merasa ditinggalkan sendirian di kegelapan.',
      'Rasa sakit dan kesepian itu membusuk, menarik Zat Kehampaan merasuki tubuhnya. Cangkangnya menjadi obsidian hitam, sayapnya robek menjadi kabut asap ungu, dan hatinya diliputi satu obsesi: jika ia ditakdirkan hidup dalam gelap, seluruh dunia pun harus padam bersamanya.',
      'Lumi dan Lulu tertangkap dan disekap dalam kurungan bayangan. Kini, tinggal Luma seorang diri yang harus menerjang kegelapan, menyalakan lampion satu per satu demi membebaskan keluarganya.',
    ],
  ],
  prologueBegin: 'PRESS ENTER UNTUK MEMULAI',
  prologueNext: 'KETUK UNTUK LANJUT',
  // ANDROID BUILD ONLY (v1.4.5) — epilogue, shown once when the boss first falls.
  epilogueTitle: 'FAJAR KEMENANGAN',
  epilogue: [
    'Ketika Lampion ke-4 menyala sempurna di Malam ke-10, keempat lampion memancarkan tiang pilar cahaya emas yang terhubung satu sama lain, membentuk jaring konstelasi raksasa yang mengurung Dark Pekat.',
    'Dark Pekat: "Tidak... cahaya ini... mengapa terasa begitu... hangat...?" Zirah obsidian hitam pekat itu retak perlahan. Dari celah retakannya, bukan cairan racun yang keluar, melainkan butiran cahaya yang terperangkap selama ratusan tahun. Tubuh raksasanya memudar menjadi serpihan debu bintang yang terbang damai tertiup angin pagi.',
    'Di ufuk timur, untuk pertama kalinya dalam sejarah Luminaria, Matahari Terbit. Cahaya keemasan menyapu seluruh padang rumput, menumbuhkan bunga-bunga bercahaya baru di tanah yang tadinya tandus.',
    'Luma, Lumi, dan Lulu terbang melingkar bersama menuju langit fajar, menyambut era baru di mana malam tak lagi menjadi musuh, melainkan rumah yang penuh kehangatan.',
  ],
};

// ANDROID BUILD ONLY (v1.4.5) — one-time story flags in localStorage.
export const PROLOGUE_KEY = 'glowmoth.prologue.v1';
export const EPILOGUE_KEY = 'glowmoth.epilogue.v1';

// ANDROID BUILD ONLY (v1.4.4) — dawn cutscenes: short dialogue scenes that
// play on the dawn screen after night 3 (Lumi freed) and night 6 (Lulu
// freed), before the dawn card. Tap/Enter skips a beat; beats also advance
// on their own after beatSeconds.
export const CUTSCENE = {
  beatSeconds: 3.4,
};

export const CUTSCENES = {
  3: {
    title: 'LUMI BEBAS',
    beats: [
      { who: 'lumi', text: 'Luma...! Kamu benar-benar datang... Aku pikir aku akan terkikis habis oleh dinginnya kegelapan ini.' },
      { who: 'luma', text: 'Aku tidak akan pernah membiarkanmu padam, Lumi. Tapi di mana Lulu?' },
      { who: 'lumi', text: 'Dark Pekat menyeretnya ke lapisan stratosfer hitam. Lulu dikurung dalam es bayangan pekat... dia tidak bisa bertahan lebih dari tiga malam lagi!' },
      { who: 'luma', text: 'Kalau begitu, kita tidak boleh buang waktu. Ayo kita terbang bersama!' },
      { who: 'lumi', text: 'Lentera mint-ku memiliki resonansi magnetik. Aku akan membantumu menarik serpihan cahaya emas dari kejauhan agar kamu bisa fokus menghindari serangan bayangan!' },
    ],
  },
  6: {
    title: 'LULU BEBAS',
    beats: [
      { who: 'lulu', text: 'Luma... Lumi... Maafkan aku, aku tidak cukup kuat melawan cakar raksasa itu...' },
      { who: 'lumi', text: 'Jangan bicara lagi, Lulu. Kamu sudah aman sekarang bersama kami.' },
      { who: 'lulu', text: 'Kalian berdua datang begitu jauh menembus badai panah itu demi aku...' },
      { who: 'luma', text: 'Padang rumput ini butuh kita bertiga, Lulu. Dan aku tidak akan menjadi Luma yang utuh tanpa kalian berdua.' },
      { who: 'lulu', text: 'Kalau begitu, dengarkan aku: Dark Pekat telah mengumpulkan seluruh pasukannya. Dia akan turun sendiri ke padang rumput ini pada Malam ke-10. Aku telah mempelajari sifat energinya — lenteraku bisa menciptakan perisai untuk melindungi kita dari serangan fatalnya!' },
    ],
  },
  // Boss intro: plays when a boss night (10, 20, ...) starts, before the fight.
  boss: {
    title: 'DARK PEKAT',
    beats: [
      { who: 'darkPekat', text: 'Lentera-lentera kecil yang menyedihkan... Kalian pikir reuni kecil kalian ini punya arti di hadapan kehampaan semesta?' },
      { who: 'luma', text: 'Kamu takut pada cahaya kami, Dark Pekat! Karena dalam cahaya, kamu melihat betapa kosongnya dirimu!' },
      { who: 'darkPekat', text: 'KOSONG?! Aku adalah malam itu sendiri! Aku akan menginjak-injak lampion kalian dan memastikan fajar tak akan pernah terbit lagi di tanah ini!' },
      { who: 'lulu', text: 'Pasang perisai! Dia menyerang!' },
      { who: 'lumi', text: 'Luma, kumpulkan serpihan motes dan nyalakan lampionnya! Setiap lampion yang berkobar akan membakar zirah hitamnya!' },
    ],
  },
};
