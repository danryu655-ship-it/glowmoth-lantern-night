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
