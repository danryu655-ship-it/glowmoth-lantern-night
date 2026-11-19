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

// ANDROID BUILD ONLY (v1.6.0) — moth skins, picked on the title screen.
// The portraits are the user's own SVGs (Golden Sun, Cyber Neon); the
// default skin uses the Luma portrait. The moth in flight is still drawn
// procedurally — the skin only swaps its colours (see SKIN_PALETTES).
export const SKIN_BUTTON = { x: 976, y: 24, w: 132, h: 40 };

// ANDROID BUILD ONLY (v1.7.0) — the how-to-play tutorial: a button on the
// title screen, and the guide content. Shown once before the first run
// (after the prologue), replayable from the title any time.
export const HOWTO_BUTTON = { x: 832, y: 24, w: 132, h: 40 };
export const HOWTO_KEY = 'glowmoth.howto.v1';
export const HOWTO_GUIDE = [
  {
    letter: '1', name: 'TUJUAN', tag: '4 LENTERA TIAP MALAM', color: '#ffd54f',
    desc: 'Kumpulkan kunang emas — tiap lentera menyala setelah cukup kunang terkumpul. Nyalakan keempatnya untuk menamatkan malam.',
  },
  {
    letter: '2', name: 'TERBANG — HP', tag: 'JOYSTICK KIRI', color: '#8ff0d0',
    desc: 'Jempol kiri: joystick muncul di mana jarimu menyentuh. Seret ke arah yang kamu mau, Luma terbang ke sana.',
  },
  {
    letter: '3', name: 'TERBANG — PC', tag: 'WASD / PANAH / MOUSE', color: '#8ecbff',
    desc: 'Tahan WASD atau tombol panah, atau arahkan mouse — Luma terbang ke arah kursor.',
  },
  {
    letter: '4', name: 'FLARE', tag: 'KETUK / SPASI  •  1 SPARK', color: '#f59e0b',
    desc: 'Kilau cahaya radius 255: shade pingsan 1,3 detik & terdorong, dart hancur, kalajengking hanya pingsan. Isi ulang 1 Spark tiap 5 motes (maks 2).',
  },
  {
    letter: '5', name: 'BAHAYA', tag: 'SHADE & DART', color: '#f87171',
    desc: 'Hindari shade dan dart — kena serang, 1 hati hilang. Embun yang muncul memulihkan 1 hati (+50 poin).',
  },
  {
    letter: '6', name: 'BOS', tag: 'MALAM 10, 20, 30…', color: '#c084fc',
    desc: 'Tiap malam kelipatan 10 ada bos — Dark Pekat atau Ratu Laba-laba. Nyalakan 4 lentera untuk mengalahkannya.',
  },
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
