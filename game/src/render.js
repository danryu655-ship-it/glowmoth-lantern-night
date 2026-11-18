// The painter: a cached night meadow, the living things, the HUD and the screens. It knows
// nothing about the rules; it reads a world state and draws it. All art is vector and gradient
// work on one canvas, with no image or font file anywhere.

import {
  BACK_BUTTON, BOSS, BOSS_KINDS, CUTSCENE, CUTSCENES, FIELD, LANTERN, PALETTE as C, RUN, SHIELD, SKILL_BUTTON, SKILL_GUIDE, BADGE_GUIDE, STRINGS, SKIN_BUTTON, SKIN_CARDS, SKINS, SKIN_PALETTES, bossKind,
} from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_SKILLS = 'skills';
export const SCREEN_SKINS = 'skins';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_DAWN = 'dawn';
export const SCREEN_CUTSCENE = 'cutscene';
export const SCREEN_PROLOGUE = 'prologue';
export const SCREEN_EPILOGUE = 'epilogue';
export const SCREEN_OVER = 'over';
export const SCREEN_VICTORY = 'victory';

const W = FIELD.width;
const H = FIELD.height;
const TITLE_FONT = "'P052', 'DejaVu Serif', Georgia, serif";
const BODY_FONT = "'DejaVu Sans', system-ui, sans-serif";
const MONO_FONT = "'DejaVu Sans Mono', ui-monospace, monospace";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// ANDROID BUILD ONLY (v1.5.0) — '#rrggbb' + alpha to an rgba() string, for
// the skill guide's per-skill glow and ring colours.
function hexA(hex, alpha) {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function label(ctx, text, x, y, options = {}) {
  const {
    font = `600 16px ${BODY_FONT}`,
    color = C.text,
    align = 'left',
    baseline = 'alphabetic',
    spacing = 0,
    alpha = 1,
    glow = 0,
    glowColor = C.amber,
  } = options;
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.globalAlpha = alpha;
  try {
    ctx.letterSpacing = `${spacing}px`;
  } catch {
    // Older engines ignore letter spacing and draw the text normally.
  }
  if (glow > 0) {
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = glow;
  }
  ctx.fillText(text, x, y);
  ctx.restore();
}

function backgroundLayer() {
  const layer = document.createElement('canvas');
  layer.width = W;
  layer.height = H;
  const ctx = layer.getContext('2d');

  // ANDROID BUILD ONLY (v1.6.0) — the sky, the stars and the moon live in
  // the parallax SVG layers now (drawn in drawField); this cached layer
  // holds only the ground, so the layers show through above the hills.
  // The scatter below still feeds the grass blades.
  let seed = 20261117;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  // Three receding hill lines, each darker than the one behind it.
  const hills = [
    { base: 512, colour: '#0a1a2d', amp: 34, waves: [[0.0031, 18], [0.0077, 9]] },
    { base: 548, colour: C.hillNear, amp: 26, waves: [[0.0044, 14], [0.011, 6]] },
    { base: 582, colour: '#0c2233', amp: 18, waves: [[0.0062, 9], [0.015, 4]] },
  ];
  for (const hill of hills) {
    ctx.fillStyle = hill.colour;
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, hill.base);
    for (let x = 0; x <= W; x += 8) {
      let y = hill.base;
      for (const [frequency, amplitude] of hill.waves) y += Math.sin(x * frequency + hill.base) * amplitude;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
  }

  // The meadow floor and a field of grass blades.
  const meadow = ctx.createLinearGradient(0, 560, 0, H);
  meadow.addColorStop(0, C.meadow);
  meadow.addColorStop(1, C.meadowLow);
  ctx.fillStyle = meadow;
  ctx.fillRect(0, 566, W, H - 566);

  const blades = 150;
  for (let index = 0; index < blades; index += 1) {
    const x = (index / blades) * (W + 40) - 20 + random() * 14;
    const ground = 568 + random() * 30;
    const height = 22 + random() * 86;
    const lean = (random() - 0.5) * 46;
    const lit = random() < 0.22;
    ctx.strokeStyle = lit ? C.grassLit : C.grass;
    ctx.lineWidth = 1 + random() * 2.1;
    ctx.beginPath();
    ctx.moveTo(x, ground);
    ctx.quadraticCurveTo(x + lean * 0.3, ground - height * 0.6, x + lean, ground - height);
    ctx.stroke();
  }
  for (let index = 0; index < 26; index += 1) {
    const x = random() * W;
    const y = 596 + random() * 110;
    ctx.fillStyle = `rgba(143, 240, 208, ${(0.05 + random() * 0.1).toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(x, y, 30 + random() * 60, 4 + random() * 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  return layer;
}

// ANDROID BUILD ONLY (v1.3.1) — character portraits drawn by the user.
function loadImage(src) {
  if (typeof Image === 'undefined') return null;
  const img = new Image();
  img.src = src;
  return img;
}

function portraitReady(img) {
  return img !== null && img !== undefined && img.complete && img.naturalWidth > 0;
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const portraits = {
    luma: loadImage('characters/luma.jpg'),
    lumi: loadImage('characters/lumi.jpg'),
    lulu: loadImage('characters/lulu.jpg'),
    darkPekat: loadImage('characters/dark-pekat.jpg'),
    titleLegends: loadImage('title-legends.jpg'),
    // ANDROID BUILD ONLY (v1.5.0) — the user's skill icons and badges.
    skillFlare: loadImage('skills/icon-flare.svg'),
    skillMagnet: loadImage('skills/icon-magnet.svg'),
    skillShield: loadImage('skills/icon-shield.svg'),
    skillDew: loadImage('skills/icon-dewdrop.svg'),
    badgeLumi: loadImage('skills/badge-lumi.svg'),
    badgeLulu: loadImage('skills/badge-lulu.svg'),
    badgePekat: loadImage('skills/badge-pekat.svg'),
    // ANDROID BUILD ONLY (v1.6.0) — parallax backgrounds, the second boss,
    // the scorpion, the new companions, the cutscene cards and the skins.
    bgParallax1: loadImage('backgrounds/bg-parallax-1.svg'),
    bgParallax2: loadImage('backgrounds/bg-parallax-2.svg'),
    bgBossObsidian: loadImage('backgrounds/bg-boss-obsidian.svg'),
    bossRatu: loadImage('bosses/boss-ratu-laba-laba.svg'),
    enemyScorpion: loadImage('enemies/enemy-kalajengking-void.svg'),
    companionKoko: loadImage('companions/companion-koko.svg'),
    companionZephyr: loadImage('companions/companion-zephyr.svg'),
    cardNight3: loadImage('cutscenes/cutscene-night-3.svg'),
    cardNight6: loadImage('cutscenes/cutscene-night-6.svg'),
    cardEnding: loadImage('cutscenes/cutscene-ending.svg'),
    skinGolden: loadImage('skins/skin-luma-golden.svg'),
    skinCyber: loadImage('skins/skin-luma-cyber.svg'),
  };
  const base = backgroundLayer();
  // ANDROID BUILD ONLY (v1.6.0) — the active skin, set by draw() from
  // main.js; drawMoth reads it when no skin is passed in the options.
  let skin = 'luma';

  function resize() {
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    const scale = Math.min(width / W, height / H);
    canvas.__scale = scale;
    canvas.__offsetX = (width - W * scale) / 2;
    canvas.__offsetY = (height - H * scale) / 2;
  }

  resize();
  window.addEventListener('resize', resize);

  function begin() {
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const width = canvas.width / ratio;
    const height = canvas.height / ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = C.ink;
    ctx.fillRect(0, 0, width, height);
    const scale = Math.min(width / W, height / H);
    ctx.setTransform(ratio * scale, 0, 0, ratio * scale, ratio * ((width - W * scale) / 2), ratio * ((height - H * scale) / 2));
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.clip();
  }

  function end() {
    ctx.restore();
  }

  function drawFireflies(state, time) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let index = 0; index < 22; index += 1) {
      const speed = 0.16 + (index % 5) * 0.045;
      const x = 80 + ((index * 173 + Math.sin(time * speed + index) * 120) % (W - 160) + (W - 160)) % (W - 160);
      const y = 130 + ((index * 97 + Math.cos(time * speed * 0.8 + index * 1.7) * 90) % 420 + 420) % 420;
      const pulse = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * (1.2 + (index % 3) * 0.4) + index));
      const radius = 6 + (index % 3) * 2.5;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
      glow.addColorStop(0, `rgba(210, 255, 238, ${(0.42 * pulse).toFixed(3)})`);
      glow.addColorStop(0.35, `rgba(143, 240, 208, ${(0.16 * pulse).toFixed(3)})`);
      glow.addColorStop(1, 'rgba(143, 240, 208, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(232, 255, 247, ${(0.7 * pulse).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(x, y, 1.05, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    const mist = ctx.createLinearGradient(0, 500, 0, 610);
    mist.addColorStop(0, 'rgba(18, 48, 80, 0)');
    mist.addColorStop(1, 'rgba(18, 48, 80, 0.18)');
    ctx.fillStyle = mist;
    ctx.fillRect(0, 500, W, 110);
    void state;
  }

  function drawLanterns(state, time, sparse = false) {
    for (let index = 0; index < LANTERN.positions.length; index += 1) {
      if (sparse && index !== 0 && index !== LANTERN.positions.length - 1) continue;
      const spot = LANTERN.positions[index];
      const lantern = state.lanterns[index];
      const glow = lantern?.glow ?? 0;
      const pulse = lantern?.pulse ?? 0;
      const sway = Math.sin(time * 0.8 + index * 1.3) * 1.6;
      ctx.save();
      ctx.translate(spot.x + sway, spot.y);
      if (glow > 0.01) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        // 3-layer bloom/glow
        for (let i = 0; i < 3; i++) {
          const opacity = [0.7, 0.4, 0.2][i];
          const radiusMult = [1, 1.5, 2][i];
          const halo = ctx.createRadialGradient(0, 0, 8, 0, 0, (190 + pulse * 45) * radiusMult);
          halo.addColorStop(0, `rgba(255, 213, 79, ${(0.32 * glow * opacity).toFixed(3)})`);
          halo.addColorStop(0.4, `rgba(255, 196, 96, ${(0.13 * glow * opacity).toFixed(3)})`);
          halo.addColorStop(1, 'rgba(255, 196, 96, 0)');
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(0, 0, (210 + pulse * 45) * radiusMult, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      // Post and foot.
      ctx.strokeStyle = '#0a111c';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 30);
      ctx.lineTo(0, 172);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(120, 150, 170, 0.14)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-2, 38);
      ctx.lineTo(-2, 168);
      ctx.stroke();
      ctx.fillStyle = '#081019';
      ctx.beginPath();
      ctx.ellipse(0, 174, 16, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Crown and hexagonal glass.
      ctx.fillStyle = '#101a28';
      ctx.beginPath();
      ctx.moveTo(-24, -34);
      ctx.lineTo(0, -49);
      ctx.lineTo(24, -34);
      ctx.lineTo(0, -26);
      ctx.closePath();
      ctx.fill();
      const glass = ctx.createLinearGradient(0, -30, 0, 30);
      if (glow > 0.01) {
        glass.addColorStop(0, `rgba(255, 245, 205, ${0.45 + 0.5 * glow})`);
        glass.addColorStop(0.55, `rgba(255, 207, 107, ${0.55 + 0.4 * glow})`);
        glass.addColorStop(1, 'rgba(255, 160, 74, 0.82)');
      } else {
        glass.addColorStop(0, '#1a2836');
        glass.addColorStop(0.6, '#101b28');
        glass.addColorStop(1, '#0b1520');
      }
      ctx.fillStyle = glass;
      ctx.beginPath();
      ctx.moveTo(-21, -28);
      ctx.lineTo(21, -28);
      ctx.lineTo(17, 32);
      ctx.lineTo(-17, 32);
      ctx.closePath();
      ctx.fill();
      if (glow > 0.01) {
        ctx.fillStyle = `rgba(255, 249, 220, ${(0.55 + 0.4 * glow).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(0, -12 - 4 * Math.sin(time * 7 + index));
        ctx.bezierCurveTo(11, -2, 7, 13, 0, 20);
        ctx.bezierCurveTo(-7, 13, -11, -2, 0, -12 - 4 * Math.sin(time * 7 + index));
        ctx.fill();
      }
      ctx.strokeStyle = glow > 0.5 ? 'rgba(255, 228, 160, 0.5)' : 'rgba(120, 160, 180, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -28);
      ctx.lineTo(0, 32);
      ctx.moveTo(-21, -28);
      ctx.lineTo(-17, 32);
      ctx.moveTo(21, -28);
      ctx.lineTo(17, 32);
      ctx.stroke();
      // Base plate.
      ctx.fillStyle = '#0d1722';
      ctx.beginPath();
      ctx.moveTo(-23, 32);
      ctx.lineTo(23, 32);
      ctx.lineTo(19, 40);
      ctx.lineTo(-19, 40);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  function drawDew(state, time) {
    const dew = state.dew;
    if (dew === null) return;
    const fade = dew.age > dew.life - 2 ? Math.max(0, (dew.life - dew.age) / 2) : 1;
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.globalCompositeOperation = 'lighter';
    const bob = Math.sin(time * 2.4 + dew.phase) * 4;
    const halo = ctx.createRadialGradient(dew.x, dew.y + bob, 2, dew.x, dew.y + bob, 46);
    halo.addColorStop(0, 'rgba(196, 255, 230, 0.9)');
    halo.addColorStop(0.3, 'rgba(143, 240, 208, 0.35)');
    halo.addColorStop(1, 'rgba(143, 240, 208, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(dew.x, dew.y + bob, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(216, 255, 243, 0.95)';
    ctx.beginPath();
    ctx.moveTo(dew.x, dew.y + bob - 18);
    ctx.bezierCurveTo(dew.x + 12, dew.y + bob - 2, dew.x + 10, dew.y + bob + 13, dew.x, dew.y + bob + 16);
    ctx.bezierCurveTo(dew.x - 10, dew.y + bob + 13, dew.x - 12, dew.y + bob - 2, dew.x, dew.y + bob - 18);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.ellipse(dew.x - 3, dew.y + bob, 2.2, 4.5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawMotes(state, time) {
    for (const mote of state.motes) {
      const fadeIn = Math.min(1, mote.age / 0.5);
      const fadeOut = mote.life - mote.age < 2.2 ? Math.max(0, (mote.life - mote.age) / 2.2) : 1;
      const alpha = Math.min(fadeIn, fadeOut);
      if (alpha <= 0.01) continue;
      const pulse = 0.86 + 0.14 * Math.sin(time * 3 + mote.phase);
      const radius = mote.r * 3.05 * pulse;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.globalCompositeOperation = 'lighter';
      const glow = ctx.createRadialGradient(mote.x, mote.y, 0, mote.x, mote.y, radius);
      glow.addColorStop(0, 'rgba(255, 252, 235, 1)');
      glow.addColorStop(0.24, 'rgba(255, 221, 138, 0.78)');
      glow.addColorStop(0.66, 'rgba(255, 176, 82, 0.2)');
      glow.addColorStop(1, 'rgba(255, 176, 82, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(mote.x, mote.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 240, 190, ${(0.7 * pulse).toFixed(3)})`;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(mote.x, mote.y, mote.r + 4 + Math.sin(time * 2 + mote.phase) * 1.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#fff9e2';
      ctx.beginPath();
      ctx.arc(mote.x, mote.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawShade(hazard, time) {
    const wobble = Math.sin(time * 3.2 + hazard.phase) * 2.4;
    ctx.save();
    ctx.translate(hazard.x, hazard.y + wobble);
    ctx.rotate(Math.sin(time * 0.6 + hazard.phase) * 0.12);
    const halo = ctx.createRadialGradient(0, 0, 4, 0, 0, hazard.r * 2.6);
    halo.addColorStop(0, 'rgba(169, 139, 255, 0.24)');
    halo.addColorStop(1, 'rgba(169, 139, 255, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, hazard.r * 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hazard.stun > 0 ? '#2b2350' : '#171029';
    ctx.beginPath();
    const petals = 7;
    for (let index = 0; index <= petals; index += 1) {
      const angle = (index / petals) * Math.PI * 2;
      const radius = hazard.r * (1 + 0.13 * Math.sin(time * 4 + index * 2.1 + hazard.phase));
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (index === 0) ctx.moveTo(x, y);
      else {
        const previous = ((index - 1) / petals) * Math.PI * 2;
        const cx = Math.cos(previous + 0.45) * radius * 1.45;
        const cy = Math.sin(previous + 0.45) * radius * 1.45;
        ctx.quadraticCurveTo(cx, cy, x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(169, 139, 255, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // Two pale eyes, tilted inward.
    ctx.fillStyle = hazard.stun > 0 ? 'rgba(143, 240, 208, 0.55)' : 'rgba(255, 236, 196, 0.9)';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * 7.5, -2.5, 3.3, 5.2, side * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(23, 16, 41, 0.9)';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(side * 7.6, -1.4, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawDart(hazard, time) {
    ctx.save();
    if (hazard.mode === 'aim') {
      const length = 760;
      ctx.strokeStyle = `rgba(255, 111, 138, ${0.18 + 0.1 * Math.sin(time * 12)})`;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([9, 11]);
      ctx.beginPath();
      ctx.moveTo(hazard.x, hazard.y);
      ctx.lineTo(hazard.x + Math.cos(hazard.angle) * length, hazard.y + Math.sin(hazard.angle) * length);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.translate(hazard.x, hazard.y);
      ctx.rotate(hazard.angle);
      ctx.fillStyle = `rgba(255, 111, 138, ${0.5 + 0.3 * Math.sin(time * 12)})`;
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(-10, -7);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-10, 7);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.translate(hazard.x, hazard.y);
      ctx.rotate(hazard.angle);
      const tail = ctx.createLinearGradient(-90, 0, 12, 0);
      tail.addColorStop(0, 'rgba(169, 139, 255, 0)');
      tail.addColorStop(0.6, 'rgba(169, 139, 255, 0.22)');
      tail.addColorStop(1, 'rgba(169, 139, 255, 0.55)');
      ctx.fillStyle = tail;
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(-92, -7);
      ctx.lineTo(-92, 7);
      ctx.closePath();
      ctx.fill();
      const body = ctx.createLinearGradient(-12, 0, 16, 0);
      body.addColorStop(0, '#241a45');
      body.addColorStop(0.6, '#4d3a85');
      body.addColorStop(1, '#d9ccff');
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.moveTo(20, 0);
      ctx.lineTo(-4, -8);
      ctx.lineTo(-12, 0);
      ctx.lineTo(-4, 8);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(217, 204, 255, 0.55)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  }

  // ANDROID BUILD ONLY (v1.3.0) — companions and the boss.
  function drawCompanion(companion, time) {
    const palette = {
      lumi: { core: 'rgba(143, 240, 208, 0.95)', wing: 'rgba(210, 255, 238, 0.85)', glow: 'rgba(143, 240, 208, 0.28)' },
      lulu: { core: 'rgba(142, 203, 255, 0.95)', wing: 'rgba(214, 235, 255, 0.85)', glow: 'rgba(142, 203, 255, 0.28)' },
      koko: { core: 'rgba(251, 146, 60, 0.95)', wing: 'rgba(254, 215, 170, 0.85)', glow: 'rgba(251, 146, 60, 0.28)' },
      zephyr: { core: 'rgba(192, 132, 252, 0.95)', wing: 'rgba(233, 213, 255, 0.85)', glow: 'rgba(192, 132, 252, 0.28)' },
    }[companion.color] || { core: 'rgba(143, 240, 208, 0.95)', wing: 'rgba(210, 255, 238, 0.85)', glow: 'rgba(143, 240, 208, 0.28)' };
    const core = palette.core;
    const wing = palette.wing;
    const flap = Math.sin(companion.flap);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(companion.x, companion.y, 0, companion.x, companion.y, 26);
    glow.addColorStop(0, core);
    glow.addColorStop(0.4, palette.glow);
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(companion.x, companion.y, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.save();
    ctx.translate(companion.x, companion.y);
    ctx.rotate(Math.sin(time * 2 + companion.phase) * 0.2);
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.scale(side, 1);
      ctx.rotate(-0.3 * flap * side);
      ctx.fillStyle = wing;
      ctx.beginPath();
      ctx.ellipse(5, -3, 7, 3.4, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  function drawBoss(boss, state, time) {
    // One HP segment per lantern left to light.
    const hp = Math.max(0, LANTERN.count - state.litCount);
    ctx.save();
    ctx.translate(boss.x, boss.y + Math.sin(time * 1.4 + boss.phase) * 3);
    const aura = ctx.createRadialGradient(0, 0, 10, 0, 0, boss.r * 2.4);
    aura.addColorStop(0, 'rgba(36, 26, 69, 0.55)');
    aura.addColorStop(1, 'rgba(36, 26, 69, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, boss.r * 2.4, 0, Math.PI * 2);
    ctx.fill();
    // ANDROID BUILD ONLY (v1.4.2) — the user's Dark Pekat artwork in a
    // circle, like the character portraits (Ø220, as in the approved
    // preview). The vector shadow below stays as the fallback until the
    // image loads. Hitbox and behaviour are unchanged.
    // ANDROID BUILD ONLY (v1.6.0) — the Spider Queen wears her own portrait.
    const bossImg = boss.kind === 'ratu' ? portraits.bossRatu : portraits.darkPekat;
    const bossPortrait = portraitReady(bossImg);
    if (bossPortrait) {
      drawPortrait(bossImg, 0, 0, 220, boss.kind === 'ratu' ? 'rgba(192, 132, 252, 0.30)' : 'rgba(128, 60, 220, 0.30)', boss.kind === 'ratu' ? 'rgba(216, 180, 254, 0.95)' : 'rgba(169, 139, 255, 0.95)');
      if (boss.flash > 0) {
        ctx.globalAlpha = boss.flash * 0.5;
        ctx.fillStyle = '#ffd54f';
        ctx.beginPath();
        ctx.arc(0, 0, 110, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    } else {
      // Body: a big jagged shadow, like a giant shade.
      ctx.fillStyle = boss.flash > 0 ? '#3d2b5e' : '#171029';
      ctx.beginPath();
      const petals = 9;
      for (let index = 0; index <= petals; index += 1) {
        const angle = (index / petals) * Math.PI * 2;
        const radius = boss.r * (1 + 0.1 * Math.sin(time * 3 + index * 2.3 + boss.phase));
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius * 0.82;
        if (index === 0) ctx.moveTo(x, y);
        else {
          const previous = ((index - 1) / petals) * Math.PI * 2;
          const cx = Math.cos(previous + 0.35) * radius * 1.4;
          const cy = Math.sin(previous + 0.35) * radius * 1.4;
          ctx.quadraticCurveTo(cx, cy, x, y);
        }
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(169, 139, 255, 0.5)';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      // Two glowing red eyes, angry.
      ctx.fillStyle = 'rgba(255, 90, 90, 0.95)';
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(side * 19, -6, 7, 10, side * -0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(23, 16, 41, 0.95)';
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(side * 19, -4, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
      if (boss.flash > 0) {
        ctx.globalAlpha = boss.flash * 0.5;
        ctx.fillStyle = '#ffd54f';
        ctx.beginPath();
        ctx.arc(0, 0, boss.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    // HP bar under the boss (below the portrait when it is shown).
    const barW = 110;
    const barX = -barW / 2;
    const barY = (bossPortrait ? 110 : boss.r) + 16;
    ctx.fillStyle = 'rgba(7, 14, 27, 0.7)';
    ctx.fillRect(barX - 3, barY - 3, barW + 6, 12);
    for (let index = 0; index < LANTERN.count; index += 1) {
      ctx.fillStyle = index < hp ? '#ff5a5a' : 'rgba(169, 183, 201, 0.25)';
      ctx.fillRect(barX + index * (barW / LANTERN.count) + 1.5, barY, barW / LANTERN.count - 3, 6);
    }
    ctx.restore();
  }

  function drawBeam(state) {
    if (!state.beam || !state.boss) return;
    const alpha = Math.max(0, 1 - state.beam.age / 0.5);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = 'rgba(255, 213, 79, 0.9)';
    ctx.lineWidth = 7;
    ctx.shadowColor = 'rgba(255, 213, 79, 0.9)';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(state.beam.x, state.beam.y);
    ctx.lineTo(state.boss.x, state.boss.y);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(state.beam.x, state.beam.y);
    ctx.lineTo(state.boss.x, state.boss.y);
    ctx.stroke();
    ctx.restore();
  }

  // ANDROID BUILD ONLY (v1.3.1) — circular character portrait with glow + ring.
  function drawPortrait(img, x, y, diameter, glowRgba, ringRgba = 'rgba(255, 213, 79, 0.95)') {
    const r = diameter / 2;
    ctx.save();
    const glow = ctx.createRadialGradient(x, y, r * 0.35, x, y, r * 1.55);
    glow.addColorStop(0, glowRgba);
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, r * 1.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, x - r, y - r, diameter, diameter);
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = ringRgba;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
  }

  function wrapLines(value, maxWidth, font) {
    ctx.save();
    ctx.font = font;
    const words = value.split(' ');
    const lines = [];
    let line = '';
    for (const word of words) {
      const trial = line ? `${line} ${word}` : word;
      if (ctx.measureText(trial).width <= maxWidth) line = trial;
      else {
        lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
    ctx.restore();
    return lines;
  }

  function drawMoth(player, time, options = {}) {
    const { scale = 1, alpha = 1, noFlicker = false } = options;
    const flicker = noFlicker ? 1 : player.invuln > 0 ? 0.45 + 0.55 * Math.abs(Math.sin(time * 18)) : 1;
    const flap = Math.sin(player.flap);
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.face + Math.PI / 2);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha * flicker;

    // ANDROID BUILD ONLY (v1.6.0) — the active skin swaps the moth's
    // colours; the default skin (luma) keeps the old stops exactly.
    const pal = SKIN_PALETTES[options.skin ?? skin] ?? null;
    const aura = ctx.createRadialGradient(0, 0, 2, 0, 0, 54);
    aura.addColorStop(0, pal ? pal.aura[0] : 'rgba(255, 243, 201, 0.35)');
    aura.addColorStop(0.45, pal ? pal.aura[1] : 'rgba(200, 255, 235, 0.12)');
    aura.addColorStop(1, pal ? pal.aura[2] : 'rgba(143, 240, 208, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, 54, 0, Math.PI * 2);
    ctx.fill();

    const spread = 0.55 + 0.45 * Math.abs(flap);
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.scale(side, 1);
      ctx.rotate(-0.18 * flap * side);
      // Upper wing.
      const upper = ctx.createLinearGradient(2, -18, 30, 8);
      upper.addColorStop(0, pal ? pal.upper[0] : 'rgba(255, 246, 223, 0.92)');
      upper.addColorStop(0.55, pal ? pal.upper[1] : 'rgba(201, 245, 227, 0.72)');
      upper.addColorStop(1, pal ? pal.upper[2] : 'rgba(143, 240, 208, 0.18)');
      ctx.fillStyle = upper;
      ctx.beginPath();
      ctx.moveTo(2, -7);
      ctx.bezierCurveTo(13 * spread, -31, 35 * spread, -30, 30 * spread, -7);
      ctx.bezierCurveTo(27 * spread, 4, 12, 4, 2, -2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = pal ? pal.wingStroke : 'rgba(255, 249, 228, 0.42)';
      ctx.lineWidth = 0.9;
      ctx.stroke();
      // Lower wing.
      const lower = ctx.createLinearGradient(2, 2, 24, 24);
      lower.addColorStop(0, pal ? pal.lower[0] : 'rgba(255, 243, 201, 0.72)');
      lower.addColorStop(1, pal ? pal.lower[1] : 'rgba(255, 207, 107, 0.12)');
      ctx.fillStyle = lower;
      ctx.beginPath();
      ctx.moveTo(2, 2);
      ctx.bezierCurveTo(22 * spread, 10, 24 * spread, 27, 9, 24);
      ctx.bezierCurveTo(3, 22, 1, 10, 2, 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 249, 228, 0.3)';
      ctx.stroke();
      ctx.restore();
    }
    // Body, head, antennae.
    const body = ctx.createLinearGradient(0, -14, 0, 18);
    body.addColorStop(0, pal ? pal.body[0] : '#fff8e4');
    body.addColorStop(0.55, pal ? pal.body[1] : '#ffe4a3');
    body.addColorStop(1, pal ? pal.body[2] : '#c98d45');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(0, 3, 5.2, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = pal ? pal.head : '#fff3c9';
    ctx.beginPath();
    ctx.arc(0, -12, 5.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = pal ? pal.antenna : 'rgba(255, 243, 201, 0.8)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-2.5, -16);
    ctx.quadraticCurveTo(-12, -29, -17, -27);
    ctx.moveTo(2.5, -16);
    ctx.quadraticCurveTo(12, -29, 17, -27);
    ctx.stroke();
    ctx.fillStyle = '#3a2b1e';
    ctx.beginPath();
    ctx.arc(-2, -12.5, 1.15, 0, Math.PI * 2);
    ctx.arc(2, -12.5, 1.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ANDROID BUILD ONLY (v1.6.0) — the Void Scorpion, drawn with the user's
  // own SVG in a circle like the boss portrait; the vector ring stands in
  // until the image loads.
  function drawScorpion(hazard, time) {
    ctx.save();
    ctx.translate(hazard.x, hazard.y + Math.sin(time * 2 + hazard.phase) * 2);
    const img = portraits.enemyScorpion;
    if (portraitReady(img)) {
      drawPortrait(img, 0, 0, 64, 'rgba(192, 132, 252, 0.30)', 'rgba(216, 180, 254, 0.95)');
    } else {
      ctx.fillStyle = 'rgba(23, 16, 41, 0.95)';
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawParticles(state) {    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const particle of state.particles) {
      const alpha = clamp(particle.life / Math.max(0.001, particle.maxLife), 0, 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      if (particle.shape === 'petal') {
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.angle);
        ctx.beginPath();
        ctx.ellipse(0, 0, particle.size * 1.7, particle.size * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (particle.shape === 'streak') {
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = Math.max(0.6, particle.size * 0.6);
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(particle.x - particle.vx * 0.035, particle.y - particle.vy * 0.035);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // Floating score numbers: small, warm and rising, so a collected mote reads as a reward.
  function drawPops(state) {
    if (!state.pops || state.pops.length === 0) return;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    for (const pop of state.pops) {
      const t = clamp(pop.age / pop.life, 0, 1);
      const alpha = t < 0.7 ? 1 : Math.max(0, (1 - t) / 0.3);
      const rise = 26 * (1 - (1 - t) ** 2);
      ctx.globalAlpha = alpha;
      ctx.font = `700 ${pop.big ? 22 : 16}px ${MONO_FONT}`;
      ctx.fillStyle = pop.big ? 'rgba(255, 248, 224, 0.98)' : 'rgba(255, 213, 79, 0.95)';
      ctx.shadowColor = 'rgba(255, 207, 107, 0.7)';
      ctx.shadowBlur = pop.big ? 14 : 8;
      ctx.fillText(pop.text, pop.x, pop.y - rise);
    }
    ctx.restore();
  }

  function drawFlare(state) {
    const flare = state.flare;
    if (flare === null) return;
    const t = clamp(flare.age / 0.42, 0, 1);
    const radius = 30 + (FLARE_RADIUS - 30) * (1 - (1 - t) ** 2);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = (1 - t) * 0.9;
    const ring = ctx.createRadialGradient(flare.x, flare.y, radius * 0.72, flare.x, flare.y, radius);
    ring.addColorStop(0, 'rgba(143, 240, 208, 0)');
    ring.addColorStop(0.72, 'rgba(143, 240, 208, 0.22)');
    ring.addColorStop(0.9, 'rgba(216, 255, 243, 0.65)');
    ring.addColorStop(1, 'rgba(143, 240, 208, 0)');
    ctx.fillStyle = ring;
    ctx.beginPath();
    ctx.arc(flare.x, flare.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(216, 255, 243, ${(1 - t) * 0.8})`;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(flare.x, flare.y, radius * 0.92, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  const FLARE_RADIUS = 255;

  // ANDROID BUILD ONLY (v1.4.0) — Lulu's shield: pulsing blue bubble
  // around the moth while it holds, expanding ring when it shatters.
  function drawShield(state, time) {
    const player = state.player;
    const pulse = 0.75 + 0.25 * Math.sin(time * 5);
    const radius = SHIELD.radius * (1 + 0.03 * Math.sin(time * 5));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(player.x, player.y, radius * 0.4, player.x, player.y, radius * 1.35);
    glow.addColorStop(0, 'rgba(142, 203, 255, 0)');
    glow.addColorStop(0.7, `rgba(142, 203, 255, ${(0.10 * pulse).toFixed(3)})`);
    glow.addColorStop(1, 'rgba(142, 203, 255, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(player.x, player.y, radius * 1.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = `rgba(142, 203, 255, ${(0.10 * pulse).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(player.x, player.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(216, 239, 255, ${(0.85 * pulse).toFixed(3)})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(player.x, player.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawShieldPop(state) {
    const t = 1 - state.shieldPop / SHIELD.popLife;
    const radius = SHIELD.radius + t * 55;
    ctx.save();
    ctx.strokeStyle = `rgba(142, 203, 255, ${((1 - t) * 0.9).toFixed(3)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawField(state, time, hideMoth = false, sparse = false) {
    if (state.boss) {
      // ANDROID BUILD ONLY (v1.6.0) — boss nights fight in the obsidian nest.
      if (portraitReady(portraits.bgBossObsidian)) ctx.drawImage(portraits.bgBossObsidian, 0, 0);
      else ctx.drawImage(base, 0, 0);
    } else {
      // ANDROID BUILD ONLY (v1.6.0) — parallax: the sky and the crystal
      // forest drift with the moth; the procedural meadow stays in front.
      const drift = state.player.x - FIELD.width / 2;
      if (portraitReady(portraits.bgParallax1)) {
        ctx.drawImage(portraits.bgParallax1, -30 + drift * 0.03, -17, 1340, 754);
      }
      if (portraitReady(portraits.bgParallax2)) {
        ctx.drawImage(portraits.bgParallax2, -60 + drift * 0.08, -34, 1400, 788);
      }
      ctx.drawImage(base, 0, 0);
    }
    drawFireflies(state, time);
    drawLanterns(state, time, sparse);
    drawDew(state, time);
    drawMotes(state, time);
    for (const hazard of state.hazards) {
      if (hazard.kind === 'shade') drawShade(hazard, time);
      else if (hazard.kind === 'scorpion') drawScorpion(hazard, time);
      else drawDart(hazard, time);
    }
    if (state.boss) drawBoss(state.boss, state, time);
    drawBeam(state);
    drawFlare(state);
    if (!hideMoth) drawMoth(state.player, time, { scale: 1.1 });
    if (!hideMoth) {
      if (state.lumi && state.lumiPos) drawCompanion(state.lumiPos, time);
      if (state.lulu && state.luluPos) drawCompanion(state.luluPos, time);
      if (state.koko && state.kokoPos) drawCompanion(state.kokoPos, time);
      if (state.zephyr && state.zephyrPos) drawCompanion(state.zephyrPos, time);
    }
    if (!hideMoth && state.shield) drawShield(state, time);
    if (!hideMoth && state.shieldPop > 0) drawShieldPop(state);
    drawParticles(state);
    const vignette = ctx.createRadialGradient(W / 2, H / 2, 240, W / 2, H / 2, 760);
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(0.72, 'rgba(0, 0, 0, 0.18)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);
    drawPops(state);
  }

  function drawWingIcon(x, y, filled) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(0.44, 0.44);
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.scale(side, 1);
      ctx.fillStyle = filled ? 'rgba(255, 207, 107, 0.92)' : 'rgba(169, 183, 201, 0.16)';
      ctx.beginPath();
      ctx.moveTo(2, -6);
      ctx.bezierCurveTo(15, -34, 38, -30, 31, -7);
      ctx.bezierCurveTo(27, 6, 12, 5, 2, -1);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = filled ? '#fff3c9' : 'rgba(169, 183, 201, 0.24)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 4.6, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawLanternLifeIcon(x, y, filled) {
    ctx.save();
    ctx.translate(x, y);
    // The little lantern reads as a life: amber and lit while it holds, dim red once lost.
    if (filled) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, 16);
      glow.addColorStop(0, 'rgba(255, 226, 158, 0.6)');
      glow.addColorStop(1, 'rgba(255, 207, 107, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.strokeStyle = filled ? 'rgba(255, 236, 196, 0.9)' : 'rgba(198, 40, 40, 0.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(0, -10);
    ctx.stroke();
    ctx.fillStyle = filled ? '#33241a' : 'rgba(28, 24, 32, 0.85)';
    ctx.beginPath();
    ctx.moveTo(-8, -10);
    ctx.lineTo(0, -14);
    ctx.lineTo(8, -10);
    ctx.lineTo(0, -6);
    ctx.closePath();
    ctx.fill();
    const glass = ctx.createLinearGradient(0, -8, 0, 9);
    if (filled) {
      glass.addColorStop(0, '#fff6d6');
      glass.addColorStop(0.5, '#ffd873');
      glass.addColorStop(1, '#e59a3c');
    } else {
      glass.addColorStop(0, 'rgba(198, 40, 40, 0.34)');
      glass.addColorStop(1, 'rgba(120, 24, 28, 0.28)');
    }
    ctx.fillStyle = glass;
    ctx.beginPath();
    ctx.moveTo(-6.5, -6);
    ctx.lineTo(6.5, -6);
    ctx.lineTo(5, 10);
    ctx.lineTo(-5, 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = filled ? 'rgba(255, 244, 214, 0.85)' : 'rgba(198, 40, 40, 0.5)';
    ctx.stroke();
    ctx.fillStyle = filled ? 'rgba(255, 255, 255, 0.95)' : 'rgba(198, 40, 40, 0.4)';
    ctx.beginPath();
    ctx.arc(0, 1, 2.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ANDROID BUILD ONLY (v1.4.0) — small shield icon for the HUD.
  function drawShieldIcon(x, y, filled) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(9, -7);
    ctx.lineTo(9, 1);
    ctx.quadraticCurveTo(9, 8, 0, 12);
    ctx.quadraticCurveTo(-9, 8, -9, 1);
    ctx.lineTo(-9, -7);
    ctx.closePath();
    ctx.fillStyle = filled ? 'rgba(142, 203, 255, 0.95)' : 'rgba(142, 203, 255, 0.18)';
    ctx.fill();
    if (filled) {
      ctx.strokeStyle = 'rgba(216, 239, 255, 0.85)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSparkIcon(x, y, filled) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = filled ? 'rgba(143, 240, 208, 0.95)' : 'rgba(169, 183, 201, 0.16)';
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(6, 0);
    ctx.lineTo(0, 10);
    ctx.lineTo(-6, 0);
    ctx.closePath();
    ctx.fill();
    if (filled) {
      ctx.strokeStyle = 'rgba(216, 255, 243, 0.8)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawHud(state, time) {
    ctx.save();
    roundedRect(ctx, 22, 16, W - 44, 74, 14);
    const panel = ctx.createLinearGradient(0, 16, 0, 90);
    panel.addColorStop(0, 'rgba(7, 14, 27, 0.4)');
    panel.addColorStop(1, 'rgba(7, 14, 27, 0.2)');
    ctx.fillStyle = panel;
    ctx.fill();
    ctx.strokeStyle = 'rgba(74, 20, 140, 0.55)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    label(ctx, 'SCORE', 44, 38, { font: `600 12px ${MONO_FONT}`, color: C.textDim, spacing: 3 });
    label(ctx, state.score.toLocaleString('en-US'), 44, 70, { font: `700 24px ${MONO_FONT}`, color: C.amber, glow: 10, glowColor: 'rgba(255, 213, 79, 0.45)' });
    // Combo lives at the bottom centre, fading in while the chain holds and out when it breaks.
    if (state.combo > 1) {
      const fade = clamp(state.comboTimer / 0.5, 0, 1);
      const pulse = 0.86 + 0.14 * Math.sin(time * 9);
      const cx = W / 2;
      const cy = H - 78;
      ctx.save();
      ctx.globalAlpha = fade;
      roundedRect(ctx, cx - 92, cy - 31, 184, 46, 23);
      ctx.fillStyle = 'rgba(7, 14, 27, 0.55)';
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 213, 79, ${(0.3 + 0.3 * pulse).toFixed(3)})`;
      ctx.lineWidth = 1.3;
      ctx.stroke();
      label(ctx, `COMBO ×${state.combo}`, cx, cy + 2, {
        font: `700 21px ${MONO_FONT}`, color: C.amber, align: 'center', spacing: 2, glow: 12, glowColor: 'rgba(255, 213, 79, 0.55)',
      });
      ctx.restore();
    }

    // ANDROID BUILD ONLY (v1.6.0) — the top-centre HUD sits on the
    // parallax moon (layer 1, cx 640 cy 220 r 135): pale yellow on pale
    // yellow, the lantern count unreadable. A dark pill behind the whole
    // cluster keeps it legible over any background.
    ctx.save();
    roundedRect(ctx, W / 2 - 150, 26, 300, 72, 16);
    ctx.fillStyle = 'rgba(7, 14, 27, 0.55)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 213, 79, 0.25)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
    const bossNight = state.night % BOSS.every === 0;
    // ANDROID BUILD ONLY (v1.6.0) — past the original 3-night goal the
    // counter reads "NIGHT 5 / 3", which looks broken in endless mode.
    const nightLabel = bossNight ? `NIGHT ${state.night} — BOSS`
      : state.night <= RUN.nightsToWin ? `NIGHT ${state.night} / ${RUN.nightsToWin}` : `NIGHT ${state.night}`;
    label(ctx, nightLabel, W / 2, 40, { font: `700 15px ${MONO_FONT}`, color: bossNight ? C.coral : C.mint, align: 'center', spacing: 3 });
    for (let index = 0; index < LANTERN.count; index += 1) {
      const x = W / 2 - (LANTERN.count - 1) * 24 + index * 48;
      const lit = state.lanterns[index]?.lit ?? false;
      const progress = index === state.litCount && !lit ? state.progress / LANTERN.motesEach : 0;
      ctx.save();
      ctx.translate(x, 66);
      ctx.strokeStyle = lit ? 'rgba(255, 213, 79, 0.95)' : 'rgba(255, 213, 79, 0.28)';
      ctx.fillStyle = lit ? 'rgba(255, 213, 79, 0.9)' : 'rgba(255, 213, 79, 0.08)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-8, -7);
      ctx.lineTo(8, -7);
      ctx.lineTo(6, 9);
      ctx.lineTo(-6, 9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, 9);
      ctx.lineTo(0, 14);
      ctx.stroke();
      if (lit) {
        ctx.shadowColor = C.amber;
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 1, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (progress > 0) {
        ctx.strokeStyle = C.amber;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 1, 12, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
    label(ctx, `${state.litCount} / ${LANTERN.count} LIT`, W / 2, 87, { font: `600 10px ${MONO_FONT}`, color: C.textDim, align: 'center', spacing: 2 });

    const maxLives = state.maxLives ?? RUN.lives;
    for (let index = 0; index < maxLives; index += 1) {
      drawLanternLifeIcon(W - 196 - (maxLives - RUN.lives) * 34 + index * 34, 50, index < state.lives);
    }
    label(ctx, 'LIVES', W - 196, 84, { font: `600 10px ${MONO_FONT}`, color: C.textDim, spacing: 2 });
    // ANDROID BUILD ONLY (v1.4.0) — Lulu's shield status.
    if (state.lulu) {
      drawShieldIcon(292, 50, state.shield);
      label(ctx, 'SHIELD', 312, 42, { font: `600 10px ${MONO_FONT}`, color: C.textDim, spacing: 2 });
      label(ctx, state.shield ? 'AKTIF' : `${Math.ceil(state.shieldTimer)}s`, 312, 70, { font: `700 20px ${MONO_FONT}`, color: state.shield ? C.lulu : C.textDim });
    }
    for (let index = 0; index < RUN.maxSparks; index += 1) {
      drawSparkIcon(W - 84 + index * 24, 50, index < state.sparks);
    }
    label(ctx, 'FLARE', W - 90, 84, { font: `600 10px ${MONO_FONT}`, color: C.textDim, spacing: 2 });

    label(ctx, 'LEFT THUMB: JOYSTICK TO FLY   ·   TAP TO FLARE', W / 2, H - 14, {
      font: `500 12px ${MONO_FONT}`,
      color: 'rgba(169, 183, 201, 0.6)',
      align: 'center',
      spacing: 1,
    });
    ctx.restore();
  }

  function overlay(alpha = 0.62) {
    const shade = ctx.createRadialGradient(W / 2, 320, 90, W / 2, 360, 760);
    shade.addColorStop(0, `rgba(4, 7, 16, ${alpha * 0.62})`);
    shade.addColorStop(1, `rgba(2, 4, 10, ${alpha})`);
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, W, H);
  }

  function drawTitle(state, best, time, demo = false) {
    overlay(0.48);
    // ANDROID BUILD ONLY (v1.4.3) — the user's GLOWMOTH LEGENDS artwork as
    // the title background (entry screen only; the app icon logo is
    // unchanged). When it is loaded, the big title text and the Luma
    // portrait are skipped — both are already in the artwork.
    const titleArt = portraitReady(portraits.titleLegends);
    if (titleArt) {
      ctx.drawImage(portraits.titleLegends, 0, 0, W, H);
      const shade = ctx.createLinearGradient(0, 500, 0, H);
      shade.addColorStop(0, 'rgba(5, 8, 14, 0)');
      shade.addColorStop(1, 'rgba(5, 8, 14, 0.75)');
      ctx.fillStyle = shade;
      ctx.fillRect(0, 500, W, H - 500);
    }
    // Two lit lanterns frame the title; the world's decorative moth hovers below it.
    if (!titleArt) {
    const titleY = 178;
    ctx.save();
    const grad = ctx.createLinearGradient(0, titleY - 90, 0, titleY + 20);
    grad.addColorStop(0, '#fff9e4');
    grad.addColorStop(0.55, '#ffe1a0');
    grad.addColorStop(1, '#f0a94f');
    ctx.font = `700 104px ${TITLE_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    try { ctx.letterSpacing = '13px'; } catch { /* no letter spacing */ }
    ctx.shadowColor = 'rgba(255, 207, 107, 0.35)';
    ctx.shadowBlur = 38;
    ctx.fillStyle = grad;
    ctx.fillText(STRINGS.title, W / 2, titleY);
    ctx.shadowBlur = 0;
    ctx.restore();

    label(ctx, STRINGS.subtitle, W / 2, 226, { font: `600 18px ${MONO_FONT}`, color: C.mint, align: 'center', spacing: 12 });
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 207, 107, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 170, 252);
    ctx.lineTo(W / 2 - 18, 252);
    ctx.moveTo(W / 2 + 18, 252);
    ctx.lineTo(W / 2 + 170, 252);
    ctx.stroke();
    ctx.fillStyle = C.amber;
    ctx.beginPath();
    ctx.moveTo(W / 2, 246);
    ctx.lineTo(W / 2 + 6, 252);
    ctx.lineTo(W / 2, 258);
    ctx.lineTo(W / 2 - 6, 252);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    label(ctx, STRINGS.tagline, W / 2, 300, { font: `italic 500 24px ${TITLE_FONT}`, color: 'rgba(247, 241, 220, 0.9)', align: 'center' });

    if (state !== null) {
      if (portraitReady(portraits.luma)) {
        drawPortrait(portraits.luma, W / 2, 405, 180, 'rgba(255, 213, 79, 0.30)');
      } else {
        drawMoth({ ...state.player, x: W / 2, y: 418, face: -Math.PI / 2, invuln: 0, flap: time * 10 }, time, { scale: 1.55, noFlicker: true });
      }
    }
    }

    const buttonY = 528;
    const glow = 0.55 + 0.45 * Math.sin(time * 2.6);
    roundedRect(ctx, W / 2 - 224, buttonY - 30, 448, 58, 29);
    ctx.fillStyle = `rgba(255, 207, 107, ${0.08 + 0.05 * glow})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 207, 107, ${0.45 + 0.3 * glow})`;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    label(ctx, demo ? 'AUTOPILOT DEMO — THE MOTH FLIES ITSELF' : STRINGS.begin, W / 2, buttonY + 7, { font: `700 17px ${MONO_FONT}`, color: C.cream, align: 'center', spacing: 2, glow: 10, glowColor: 'rgba(255, 207, 107, 0.5)' });

    label(ctx, STRINGS.goal, W / 2, 604, { font: `500 17px ${BODY_FONT}`, color: 'rgba(247, 241, 220, 0.78)', align: 'center' });
    label(ctx, demo ? 'RECORDED LIVE FROM THE GAME · AUTOPILOT ON' : STRINGS.controls, W / 2, 662, { font: `500 12px ${MONO_FONT}`, color: 'rgba(169, 183, 201, 0.72)', align: 'center', spacing: 0.5 });
    label(ctx, best > 0 ? `BEST  ${best.toLocaleString('en-US')}` : 'AN ORIGINAL ARCADE GAME', 36, H - 26, { font: `600 12px ${MONO_FONT}`, color: 'rgba(255, 207, 107, 0.75)', spacing: 2 });
    label(ctx, 'THREE NIGHTS · THREE LIVES · FOUR LANTERNS', W - 36, H - 26, { font: `600 12px ${MONO_FONT}`, color: 'rgba(169, 183, 201, 0.6)', align: 'right', spacing: 2 });

    // ANDROID BUILD ONLY (v1.5.0) — the Skill screen opens from here
    // (tap the button, or press K). A tap anywhere else starts the run.
    ctx.save();
    roundedRect(ctx, SKILL_BUTTON.x, SKILL_BUTTON.y, SKILL_BUTTON.w, SKILL_BUTTON.h, 20);
    ctx.fillStyle = 'rgba(5, 8, 14, 0.72)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 207, 107, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    const skillCy = SKILL_BUTTON.y + SKILL_BUTTON.h / 2;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(SKILL_BUTTON.x + 10, skillCy);
    ctx.lineTo(SKILL_BUTTON.x + 18, skillCy - 8);
    ctx.lineTo(SKILL_BUTTON.x + 26, skillCy);
    ctx.lineTo(SKILL_BUTTON.x + 18, skillCy + 8);
    ctx.closePath();
    ctx.fillStyle = C.amber;
    ctx.fill();
    ctx.restore();
    label(ctx, 'SKILL', SKILL_BUTTON.x + 80, skillCy + 5, { font: `700 16px ${MONO_FONT}`, color: C.cream, align: 'center' });

    // ANDROID BUILD ONLY (v1.6.0) — the SKIN button, same style, left of SKILL.
    ctx.save();
    roundedRect(ctx, SKIN_BUTTON.x, SKIN_BUTTON.y, SKIN_BUTTON.w, SKIN_BUTTON.h, 20);
    ctx.fillStyle = 'rgba(5, 8, 14, 0.72)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 207, 107, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    const skinCy = SKIN_BUTTON.y + SKIN_BUTTON.h / 2;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(SKIN_BUTTON.x + 10, skinCy);
    ctx.lineTo(SKIN_BUTTON.x + 18, skinCy - 8);
    ctx.lineTo(SKIN_BUTTON.x + 26, skinCy);
    ctx.lineTo(SKIN_BUTTON.x + 18, skinCy + 8);
    ctx.closePath();
    ctx.fillStyle = C.amber;
    ctx.fill();
    ctx.restore();
    label(ctx, 'SKIN', SKIN_BUTTON.x + 80, skinCy + 5, { font: `700 16px ${MONO_FONT}`, color: C.cream, align: 'center' });
  }

  // ANDROID BUILD ONLY (v1.5.0) — the Skill & Badge guide. Display only:
  // the skills are buffs, nothing here is clicked except KEMBALI. Each icon
  // is the user's own SVG; until it loads, a coloured ring + letter stands
  // in. Badges unlock when their night is cleared (night 3 Lumi, night 6
  // Lulu, night 10 Dark Pekat, night 20 Ratu Laba-laba) and stay earned in
  // localStorage.
  function drawSkills(state, badges, time) {
    overlay(0.58);
    ctx.save();
    roundedRect(ctx, 40, 28, 1200, 668, 18);
    ctx.fillStyle = C.panel;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 207, 107, 0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    label(ctx, 'SKILL & BADGE', W / 2, 62, { font: `700 42px ${TITLE_FONT}`, color: C.amber, align: 'center', spacing: 4, glow: 22, glowColor: 'rgba(255, 207, 107, 0.5)' });
    label(ctx, 'Kekuatan cahaya Luma, Lumi, Lulu, Koko & Zephyr', W / 2, 100, { font: `italic 500 19px ${TITLE_FONT}`, color: 'rgba(247, 241, 220, 0.92)', align: 'center' });

    // ANDROID BUILD ONLY (v1.6.0) — six skills now, in two columns of three.
    const colX = [70, 660];
    SKILL_GUIDE.forEach((skill, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const y = 132 + row * 92;
      const cy = y + 32;
      const iconCx = colX[col] + 48;
      const textX = colX[col] + 96;
      const img = portraits[skill.portrait];
      if (portraitReady(img)) {
        drawPortrait(img, iconCx, cy, 64, hexA(skill.color, 0.30), hexA(skill.color, 0.95));
      } else {
        ctx.save();
        ctx.beginPath();
        ctx.arc(iconCx, cy, 32, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(12, 18, 28, 1)';
        ctx.fill();
        ctx.strokeStyle = skill.color;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
        label(ctx, skill.letter, iconCx, cy + 1, { font: `700 30px ${BODY_FONT}`, color: skill.color, align: 'center', baseline: 'middle' });
      }
      label(ctx, skill.name, textX, y + 12, { font: `700 19px ${MONO_FONT}`, color: C.cream, align: 'left' });
      ctx.save();
      ctx.font = `700 19px ${MONO_FONT}`;
      const nameWidth = ctx.measureText(skill.name).width;
      ctx.restore();
      label(ctx, `—  ${skill.tag}`, textX + nameWidth + 14, y + 12, { font: `700 12px ${MONO_FONT}`, color: skill.color, align: 'left' });
      const descLines = wrapLines(skill.desc, 440, `500 15px ${BODY_FONT}`);
      let lineY = y + 40;
      for (const line of descLines) {
        label(ctx, line, textX, lineY, { font: `500 15px ${BODY_FONT}`, color: 'rgba(220, 228, 238, 0.95)', align: 'left' });
        lineY += 20;
      }
    });

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 207, 107, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(120, 440);
    ctx.lineTo(W - 120, 440);
    ctx.stroke();
    ctx.restore();
    label(ctx, 'BADGE  —  DIDAPAT SAAT MENAMATKAN MALAM', W / 2, 462, { font: `700 12px ${MONO_FONT}`, color: C.textDim, align: 'center', spacing: 2 });

    BADGE_GUIDE.forEach((badge, index) => {
      const cx = 340 + index * 200;
      const cy = 520;
      const earned = badges[badge.id] === true;
      const img = portraits[badge.portrait];
      if (earned && portraitReady(img)) {
        drawPortrait(img, cx, cy, 72, hexA(badge.color, 0.30), hexA(badge.color, 0.95));
      } else if (earned) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, 36, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(12, 18, 28, 1)';
        ctx.fill();
        ctx.strokeStyle = badge.color;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
        label(ctx, String(badge.night), cx, cy + 1, { font: `700 26px ${BODY_FONT}`, color: badge.color, align: 'center', baseline: 'middle' });
      } else {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, 36, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(40, 48, 64, 1)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(90, 100, 120, 1)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
        label(ctx, String(badge.night), cx, cy + 1, { font: `700 26px ${BODY_FONT}`, color: 'rgba(120, 130, 150, 1)', align: 'center', baseline: 'middle' });
      }
      label(ctx, badge.name, cx, 572, { font: `700 13px ${MONO_FONT}`, color: earned ? C.cream : C.textDim, align: 'center', spacing: 1 });
      label(ctx, earned ? 'DIDAPAT' : 'TERKUNCI', cx, 590, { font: `700 11px ${MONO_FONT}`, color: earned ? C.mint : C.textDim, align: 'center', spacing: 1 });
    });

    ctx.save();
    roundedRect(ctx, BACK_BUTTON.x, BACK_BUTTON.y, BACK_BUTTON.w, BACK_BUTTON.h, 19);
    ctx.fillStyle = 'rgba(5, 8, 14, 0.72)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 207, 107, 0.5)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();
    const backCx = BACK_BUTTON.x + BACK_BUTTON.w / 2;
    const backCy = BACK_BUTTON.y + BACK_BUTTON.h / 2;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(backCx - 38, backCy);
    ctx.lineTo(backCx - 28, backCy - 7);
    ctx.lineTo(backCx - 28, backCy + 7);
    ctx.closePath();
    ctx.fillStyle = C.cream;
    ctx.fill();
    ctx.restore();
    label(ctx, 'KEMBALI', backCx + 10, backCy + 5, { font: `700 14px ${MONO_FONT}`, color: C.cream, align: 'center' });
    void state;
    void time;
  }

  // ANDROID BUILD ONLY (v1.6.0) — pick the moth's skin. Tap a card to
  // choose it (saved at once); KEMBALI returns to the title. The in-flight
  // moth is drawn procedurally — the skin only swaps its colours.
  function drawSkinScreen(state, skin, time) {
    overlay(0.58);
    ctx.save();
    roundedRect(ctx, 40, 28, 1200, 668, 18);
    ctx.fillStyle = C.panel;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 207, 107, 0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    label(ctx, 'PILIH SKIN', W / 2, 62, { font: `700 42px ${TITLE_FONT}`, color: C.amber, align: 'center', spacing: 4, glow: 22, glowColor: 'rgba(255, 207, 107, 0.5)' });
    label(ctx, 'Warna sayap Luma di dalam game', W / 2, 100, { font: `italic 500 19px ${TITLE_FONT}`, color: 'rgba(247, 241, 220, 0.92)', align: 'center' });
    for (const option of SKINS) {
      const card = SKIN_CARDS.find((entry) => entry.id === option.id);
      const cx = card.x + card.w / 2;
      const selected = skin === option.id;
      ctx.save();
      roundedRect(ctx, card.x, card.y, card.w, card.h, 18);
      ctx.fillStyle = selected ? 'rgba(255, 207, 107, 0.14)' : 'rgba(5, 8, 14, 0.5)';
      ctx.fill();
      ctx.strokeStyle = selected ? 'rgba(255, 207, 107, 0.95)' : 'rgba(169, 183, 201, 0.35)';
      ctx.lineWidth = selected ? 2.5 : 1.4;
      ctx.stroke();
      ctx.restore();
      const img = portraits[option.portrait];
      if (portraitReady(img)) {
        drawPortrait(img, cx, 310, 200, hexA(option.color, 0.30), hexA(option.color, 0.95));
      } else {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, 310, 100, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(12, 18, 28, 1)';
        ctx.fill();
        ctx.strokeStyle = option.color;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
        label(ctx, option.name[0], cx, 311, { font: `700 64px ${BODY_FONT}`, color: option.color, align: 'center', baseline: 'middle' });
      }
      label(ctx, option.name, cx, 460, { font: `700 20px ${MONO_FONT}`, color: C.cream, align: 'center', spacing: 1 });
      label(ctx, option.tag, cx, 486, { font: `700 12px ${MONO_FONT}`, color: option.color, align: 'center', spacing: 1 });
      const descLines = wrapLines(option.desc, 300, `500 14px ${BODY_FONT}`);
      let lineY = 512;
      for (const line of descLines) {
        label(ctx, line, cx, lineY, { font: `500 14px ${BODY_FONT}`, color: 'rgba(220, 228, 238, 0.95)', align: 'center' });
        lineY += 19;
      }
      if (selected) {
        label(ctx, 'DIPILIH', cx, 556, { font: `700 14px ${MONO_FONT}`, color: C.amber, align: 'center', spacing: 2 });
      }
    }
    ctx.save();
    roundedRect(ctx, BACK_BUTTON.x, BACK_BUTTON.y, BACK_BUTTON.w, BACK_BUTTON.h, 19);
    ctx.fillStyle = 'rgba(5, 8, 14, 0.72)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 207, 107, 0.5)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();
    const backCx = BACK_BUTTON.x + BACK_BUTTON.w / 2;
    const backCy = BACK_BUTTON.y + BACK_BUTTON.h / 2;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(backCx - 38, backCy);
    ctx.lineTo(backCx - 28, backCy - 7);
    ctx.lineTo(backCx - 28, backCy + 7);
    ctx.closePath();
    ctx.fillStyle = C.cream;
    ctx.fill();
    ctx.restore();
    label(ctx, 'KEMBALI', backCx + 10, backCy + 5, { font: `700 14px ${MONO_FONT}`, color: C.cream, align: 'center' });
    void state;
    void time;
  }

  function drawButton(text, y) {
    roundedRect(ctx, W / 2 - 260, y - 28, 520, 54, 27);
    ctx.fillStyle = 'rgba(255, 207, 107, 0.09)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 207, 107, 0.5)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    label(ctx, text, W / 2, y + 7, { font: `700 15px ${MONO_FONT}`, color: C.cream, align: 'center', spacing: 1 });
  }

  function drawEndScreen(state, screen, best, time) {
    overlay(0.7);
    const victory = screen === SCREEN_VICTORY;
    if (victory) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const dawn = ctx.createRadialGradient(W / 2, 690, 40, W / 2, 690, 620);
      dawn.addColorStop(0, 'rgba(255, 190, 98, 0.22)');
      dawn.addColorStop(0.5, 'rgba(255, 160, 80, 0.08)');
      dawn.addColorStop(1, 'rgba(255, 160, 80, 0)');
      ctx.fillStyle = dawn;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    const heading = victory ? STRINGS.victory : STRINGS.over;
    const sub = victory ? STRINGS.victorySub : STRINGS.overSub;
    const colour = victory ? C.amber : C.coral;
    ctx.save();
    ctx.font = `700 58px ${TITLE_FONT}`;
    try { ctx.letterSpacing = '6px'; } catch { /* no letter spacing */ }
    ctx.textAlign = 'center';
    ctx.fillStyle = colour;
    ctx.shadowColor = colour;
    ctx.shadowBlur = 28;
    ctx.fillText(heading, W / 2, 214);
    ctx.restore();
    label(ctx, sub, W / 2, 262, { font: `italic 500 23px ${TITLE_FONT}`, color: 'rgba(247, 241, 220, 0.88)', align: 'center' });
    label(ctx, 'FINAL SCORE', W / 2, 340, { font: `600 13px ${MONO_FONT}`, color: C.textDim, align: 'center', spacing: 4 });
    label(ctx, state.score.toLocaleString('en-US'), W / 2, 408, { font: `700 68px ${MONO_FONT}`, color: C.cream, align: 'center', glow: 18, glowColor: 'rgba(255, 207, 107, 0.4)' });
    label(ctx, `BEST  ${Math.max(best, state.score).toLocaleString('en-US')}`, W / 2, 448, { font: `600 17px ${MONO_FONT}`, color: C.amber, align: 'center', spacing: 2 });
    const stats = `NIGHT ${state.night}   ·   ${state.litCount} LANTERNS   ·   ${state.motesCollected ?? 0} MOTES`;
    label(ctx, stats, W / 2, 492, { font: `600 13px ${MONO_FONT}`, color: C.textDim, align: 'center', spacing: 1.5 });
    drawButton(STRINGS.again, 566);
    label(ctx, victory ? 'A new run starts again at Night 1.' : 'The meadow gives you another night.', W / 2, 632, { font: `500 15px ${BODY_FONT}`, color: 'rgba(169, 183, 201, 0.68)', align: 'center' });
    void time;
  }

  // ANDROID BUILD ONLY (v1.4.4) — dawn cutscene: the freed companion thanks
  // Luma in a short dialogue before the dawn card. The moths fly above the
  // speech bubble; the speaker's portrait sits at the bubble's left. If a
  // portrait image is missing, a glowing initial stands in for it.
  function drawCutsceneScreen(state, cutscene, time) {
    const scene = cutscene && cutscene.boss ? CUTSCENES.boss
      : cutscene && CUTSCENES[cutscene.night] ? CUTSCENES[cutscene.night] : CUTSCENES[3];
    const beats = scene.beats;
    const beat = cutscene ? Math.min(cutscene.beat, beats.length - 1) : 0;
    const line = beats[beat];
    // ANDROID BUILD ONLY (v1.6.0) — the illustration card comes first: the
    // user's own full-screen scene, with its own text baked in. Tap/Enter
    // moves on to the dialogue beats.
    if (cutscene && cutscene.card && !cutscene.cardDone) {
      const cardImg = portraits[cutscene.card];
      if (portraitReady(cardImg)) {
        ctx.drawImage(cardImg, 0, 0, W, H);
      } else {
        overlay(0.58);
        label(ctx, scene.title, W / 2, 300, { font: `700 54px ${TITLE_FONT}`, color: C.amber, align: 'center', spacing: 6 });
      }
      // ANDROID BUILD ONLY (v1.6.0) — the hint sat exactly on the card's
      // dialogue-box edge (y 690) and read as cut off. It now rides inside
      // the box's lower padding (dialogue text ends at 638, box ends at
      // 690) on a dark chip so it reads over any card.
      ctx.save();
      roundedRect(ctx, W / 2 - 120, 656, 240, 28, 14);
      ctx.fillStyle = 'rgba(7, 14, 27, 0.6)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(247, 241, 220, 0.25)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
      label(ctx, 'KETUK UNTUK LANJUT', W / 2, 672, { font: `700 14px ${MONO_FONT}`, color: 'rgba(247, 241, 220, 0.85)', align: 'center', spacing: 2 });
      return;
    }
    const speakers = {
      luma: { name: 'LUMA', color: C.amber, img: portraits.luma, glow: 'rgba(255, 213, 79, 0.30)' },
      lumi: { name: 'LUMI', color: C.lumi, img: portraits.lumi, glow: 'rgba(143, 240, 208, 0.30)' },
      lulu: { name: 'LULU', color: C.lulu, img: portraits.lulu, glow: 'rgba(142, 203, 255, 0.30)' },
      darkPekat: { name: 'DARK PEKAT', color: '#a98bff', img: portraits.darkPekat, glow: 'rgba(128, 60, 220, 0.30)' },
    };
    const speaker = speakers[line.who] || speakers.luma;
    const isBoss = !!(cutscene && cutscene.boss);
    overlay(0.58);
    label(ctx, scene.title, W / 2, 92, { font: `700 54px ${TITLE_FONT}`, color: isBoss ? '#a98bff' : C.amber, align: 'center', spacing: 6, glow: 26, glowColor: isBoss ? 'rgba(169, 139, 255, 0.5)' : 'rgba(255, 207, 107, 0.5)' });
    // ANDROID BUILD ONLY (v1.4.4) — boss intro: Dark Pekat looms above while
    // the three moths face it from below.
    if (isBoss) {
      if (portraitReady(portraits.darkPekat)) {
        drawPortrait(portraits.darkPekat, W / 2, 218, 170, 'rgba(128, 60, 220, 0.30)', 'rgba(169, 139, 255, 0.95)');
      } else {
        ctx.save();
        const glow = ctx.createRadialGradient(W / 2, 218, 20, W / 2, 218, 130);
        glow.addColorStop(0, 'rgba(128, 60, 220, 0.30)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(W / 2, 218, 130, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(W / 2, 218, 85, 0, Math.PI * 2);
        ctx.fillStyle = '#241a45';
        ctx.fill();
        ctx.restore();
        label(ctx, 'D', W / 2, 234, { font: `700 64px ${TITLE_FONT}`, color: '#a98bff', align: 'center' });
      }
    }
    // The freed friends fly with Luma above the bubble.
    const mothY = isBoss ? 356 : 268;
    const flyers = isBoss
      ? [
        { kind: 'luma', x: 480 },
        { kind: 'lumi', x: 640 },
        { kind: 'lulu', x: 800 },
      ]
      : cutscene && cutscene.night === 6
        ? [
          { kind: 'luma', x: 480 },
          { kind: 'lumi', x: 640 },
          { kind: 'lulu', x: 800 },
        ]
        : [
          { kind: 'luma', x: 560 },
          { kind: 'lumi', x: 720 },
        ];
    for (const [index, flyer] of flyers.entries()) {
      const bob = Math.sin(time * 2 + index * 1.7) * 12;
      if (flyer.kind === 'luma') {
        drawMoth({ ...state.player, x: flyer.x, y: mothY + bob, face: -Math.PI / 2, invuln: 0, flap: time * 10 }, time, { scale: 1.35, noFlicker: true });
      } else {
        drawCompanion({ x: flyer.x, y: mothY + bob, color: flyer.kind, flap: time * 10 }, time);
      }
    }
    // Speech bubble: portrait left, name + wrapped text right.
    const bubbleX = 190;
    const bubbleY = 420;
    const bubbleW = 900;
    const bubbleH = 160;
    ctx.save();
    roundedRect(ctx, bubbleX, bubbleY, bubbleW, bubbleH, 22);
    ctx.fillStyle = C.panel;
    ctx.fill();
    ctx.strokeStyle = speaker.color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    const portraitX = bubbleX + 78;
    const portraitY = bubbleY + bubbleH / 2;
    if (portraitReady(speaker.img)) {
      drawPortrait(speaker.img, portraitX, portraitY, 110, speaker.glow, speaker.color);
    } else {
      ctx.save();
      const glow = ctx.createRadialGradient(portraitX, portraitY, 10, portraitX, portraitY, 80);
      glow.addColorStop(0, speaker.glow);
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(portraitX, portraitY, 80, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(portraitX, portraitY, 55, 0, Math.PI * 2);
      ctx.fillStyle = speaker.color;
      ctx.fill();
      ctx.restore();
      label(ctx, speaker.name[0], portraitX, portraitY + 16, { font: `700 44px ${TITLE_FONT}`, color: C.ink, align: 'center' });
    }
    label(ctx, speaker.name.split('').join(' '), bubbleX + 158, bubbleY + 42, { font: `700 18px ${MONO_FONT}`, color: speaker.color, spacing: 3 });
    const textLines = wrapLines(line.text, 660, `italic 500 21px ${TITLE_FONT}`);
    let textY = bubbleY + 82;
    for (const textLine of textLines) {
      label(ctx, textLine, bubbleX + 158, textY, { font: `italic 500 21px ${TITLE_FONT}`, color: 'rgba(247, 241, 220, 0.95)' });
      textY += 30;
    }
    // Beat dots + tap hint.
    for (let index = 0; index < beats.length; index += 1) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(W / 2 + (index - (beats.length - 1) / 2) * 28, 622, index === beat ? 7 : 5, 0, Math.PI * 2);
      ctx.fillStyle = index === beat ? C.amber : 'rgba(169, 183, 201, 0.5)';
      ctx.fill();
      ctx.restore();
    }
    label(ctx, 'KETUK UNTUK LANJUT', W / 2, 662, { font: `600 13px ${MONO_FONT}`, color: C.textDim, align: 'center', spacing: 3 });
    void time;
  }

  // ANDROID BUILD ONLY (v1.4.5) — prologue: the story of Luminaria, shown
  // once before the first run, in two pages: the world, then Dark Pekat's
  // tragedy. Epilogue: the dawn of victory, shown once when the boss
  // first falls.
  function drawPrologueScreen(state, page, time) {
    const pages = STRINGS.prologue;
    const pageIndex = Math.max(0, Math.min(page ?? 0, pages.length - 1));
    const isLast = pageIndex >= pages.length - 1;
    const title = pageIndex === 0 ? STRINGS.prologueTitle : 'DARK PEKAT';
    const titleColor = pageIndex === 0 ? C.amber : '#a98bff';
    const titleGlow = pageIndex === 0 ? 'rgba(255, 207, 107, 0.5)' : 'rgba(169, 139, 255, 0.5)';
    overlay(0.58);
    label(ctx, 'PROLOG', W / 2, 92, { font: `700 18px ${MONO_FONT}`, color: C.textDim, align: 'center', spacing: 6 });
    const titleLines = wrapLines(title, 1080, `700 44px ${TITLE_FONT}`);
    let titleY = 140;
    for (const line of titleLines) {
      label(ctx, line, W / 2, titleY, { font: `700 44px ${TITLE_FONT}`, color: titleColor, align: 'center', spacing: 4, glow: 22, glowColor: titleGlow });
      titleY += 54;
    }
    // Story panel: the long text sits on a dark panel so the lanterns
    // behind it never strike through the lines.
    ctx.save();
    roundedRect(ctx, 140, 190, 1000, 390, 22);
    ctx.fillStyle = C.panel;
    ctx.fill();
    ctx.restore();
    let y = 222;
    for (const paragraph of pages[pageIndex]) {
      const lines = wrapLines(paragraph, 920, `italic 500 19px ${TITLE_FONT}`);
      for (const line of lines) {
        label(ctx, line, W / 2, y, { font: `italic 500 19px ${TITLE_FONT}`, color: 'rgba(247, 241, 220, 0.92)', align: 'center' });
        y += 27;
      }
      y += 14;
    }
    for (let index = 0; index < pages.length; index += 1) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(W / 2 + (index - (pages.length - 1) / 2) * 28, 600, index === pageIndex ? 7 : 5, 0, Math.PI * 2);
      ctx.fillStyle = index === pageIndex ? C.amber : 'rgba(169, 183, 201, 0.5)';
      ctx.fill();
      ctx.restore();
    }
    drawButton(isLast ? STRINGS.prologueBegin : STRINGS.prologueNext, 650);
    void state;
    void time;
  }

  function drawEpilogueScreen(state, page, time, card = false) {
    // ANDROID BUILD ONLY (v1.6.0) — the ending illustration comes first:
    // the user's own dawn scene, with its own text baked in.
    if (card) {
      const cardImg = portraits.cardEnding;
      if (portraitReady(cardImg)) {
        ctx.drawImage(cardImg, 0, 0, W, H);
      } else {
        overlay(0.58);
        label(ctx, STRINGS.epilogueTitle, W / 2, 300, { font: `700 54px ${TITLE_FONT}`, color: C.amber, align: 'center', spacing: 6 });
      }
      // ANDROID BUILD ONLY (v1.6.0) — same chip as the cutscene cards:
      // the hint sat on the dialogue-box edge (y 690) and read as cut off.
      ctx.save();
      roundedRect(ctx, W / 2 - 120, 656, 240, 28, 14);
      ctx.fillStyle = 'rgba(7, 14, 27, 0.6)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(247, 241, 220, 0.25)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
      label(ctx, 'KETUK UNTUK LANJUT', W / 2, 672, { font: `700 14px ${MONO_FONT}`, color: 'rgba(247, 241, 220, 0.85)', align: 'center', spacing: 2 });
      return;
    }
    const pages = [STRINGS.epilogue.slice(0, 2), STRINGS.epilogue.slice(2)];
    const pageIndex = Math.max(0, Math.min(page ?? 0, pages.length - 1));
    const isLast = pageIndex >= pages.length - 1;
    overlay(0.58);
    label(ctx, STRINGS.epilogueTitle, W / 2, 132, { font: `700 54px ${TITLE_FONT}`, color: C.amber, align: 'center', spacing: 6, glow: 26, glowColor: 'rgba(255, 207, 107, 0.5)' });
    // Story panel, same as the prologue: the long text never collides with
    // the lanterns behind it.
    ctx.save();
    roundedRect(ctx, 140, 190, 1000, 390, 22);
    ctx.fillStyle = C.panel;
    ctx.fill();
    ctx.restore();
    let y = 222;
    for (const paragraph of pages[pageIndex]) {
      const lines = wrapLines(paragraph, 920, `italic 500 19px ${TITLE_FONT}`);
      for (const line of lines) {
        label(ctx, line, W / 2, y, { font: `italic 500 19px ${TITLE_FONT}`, color: 'rgba(247, 241, 220, 0.92)', align: 'center' });
        y += 27;
      }
      y += 14;
    }
    if (isLast) {
      label(ctx, `SCORE  ${state.score.toLocaleString('en-US')}`, W / 2, y + 20, { font: `700 18px ${MONO_FONT}`, color: C.cream, align: 'center', spacing: 1.5 });
    }
    for (let index = 0; index < pages.length; index += 1) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(W / 2 + (index - (pages.length - 1) / 2) * 28, 600, index === pageIndex ? 7 : 5, 0, Math.PI * 2);
      ctx.fillStyle = index === pageIndex ? C.amber : 'rgba(169, 183, 201, 0.5)';
      ctx.fill();
      ctx.restore();
    }
    drawButton(isLast ? STRINGS.next : STRINGS.prologueNext, 650);
    void time;
  }

  function drawDawnScreen(state, time, demo = false) {
    overlay(0.58);
    // ANDROID BUILD ONLY (v1.3.1) — on the nights Lumi (3) and Lulu (6) join,
    // their portrait takes centre stage, like the approved preview.
    const join = state.night === 3
      ? { img: portraits.lumi, name: 'LUMI', glow: 'rgba(143, 240, 208, 0.30)' }
      : state.night === 6
        ? { img: portraits.lulu, name: 'LULU', glow: 'rgba(142, 203, 255, 0.30)' }
        : state.night === 9
          ? { img: portraits.companionKoko, name: 'KOKO', glow: 'rgba(251, 146, 60, 0.30)' }
          : state.night === 12
            ? { img: portraits.companionZephyr, name: 'ZEPHYR', glow: 'rgba(192, 132, 252, 0.30)' }
            : null;
    if (join !== null && portraitReady(join.img)) {
      const dawnStory = STRINGS.dawnStory[state.night - 1];
      label(ctx, STRINGS.dawn, W / 2, 132, { font: `700 54px ${TITLE_FONT}`, color: C.amber, align: 'center', spacing: 6, glow: 26, glowColor: 'rgba(255, 207, 107, 0.5)' });
      drawPortrait(join.img, W / 2, 268, 150, join.glow);
      label(ctx, join.name.split('').join(' '), W / 2, 362, { font: `700 18px ${MONO_FONT}`, color: C.amber, align: 'center', spacing: 3 });
      const storyLines = wrapLines(dawnStory, 920, `italic 500 21px ${TITLE_FONT}`);
      let storyY = 402;
      for (const line of storyLines) {
        label(ctx, line, W / 2, storyY, { font: `italic 500 21px ${TITLE_FONT}`, color: 'rgba(247, 241, 220, 0.9)', align: 'center' });
        storyY += 30;
      }
      label(ctx, `NIGHT ${state.night} COMPLETE`, W / 2, 470, { font: `600 13px ${MONO_FONT}`, color: C.textDim, align: 'center', spacing: 4 });
      label(ctx, `+${state.bonus.toLocaleString('en-US')}`, W / 2, 512, { font: `700 44px ${MONO_FONT}`, color: C.mint, align: 'center', glow: 16, glowColor: 'rgba(143, 240, 208, 0.5)' });
      label(ctx, 'NIGHT BONUS', W / 2, 540, { font: `600 12px ${MONO_FONT}`, color: C.textDim, align: 'center', spacing: 3 });
      label(ctx, `SCORE  ${state.score.toLocaleString('en-US')}`, W / 2, 572, { font: `700 18px ${MONO_FONT}`, color: C.cream, align: 'center', spacing: 1.5 });
      // ANDROID BUILD ONLY (v1.6.0) — Koko joins on night 9, the night
      // before a boss night, so the warning must show here too: the join
      // branch returns early and the boss-warning branch below never runs.
      // The boss portrait rides small beside the warning line.
      const warnsBoss = (state.night + 1) % BOSS.every === 0;
      if (warnsBoss) {
        const warnKind = bossKind(state.night + 1);
        const warnImg = warnKind === 'ratu' ? portraits.bossRatu : portraits.darkPekat;
        if (portraitReady(warnImg)) {
          drawPortrait(warnImg, W / 2 - 250, 598, 30, warnKind === 'ratu' ? 'rgba(192, 132, 252, 0.30)' : 'rgba(128, 60, 220, 0.30)', warnKind === 'ratu' ? 'rgba(216, 180, 254, 0.95)' : 'rgba(169, 139, 255, 0.95)');
        }
        label(ctx, `MALAM ${state.night + 1} — ${BOSS_KINDS[warnKind].name} MENANTI`, W / 2, 600, { font: `700 16px ${MONO_FONT}`, color: C.coral, align: 'center', spacing: 3 });
      }
      drawButton(demo ? 'THE MOTH FLIES ON…' : STRINGS.next, warnsBoss ? 662 : 632);
      void time;
      return;
    }
    // ANDROID BUILD ONLY (v1.4.2) — the night before a boss night, Dark
    // Pekat's portrait warns the player, like the approved preview.
    const nextNight = state.night + 1;
    // ANDROID BUILD ONLY (v1.6.0) — the warning wears the next boss's face:
    // Dark Pekat, or the Spider Queen on nights 20, 40, ...
    const nextKind = bossKind(nextNight);
    const nextBossImg = nextKind === 'ratu' ? portraits.bossRatu : portraits.darkPekat;
    const nextBossName = BOSS_KINDS[nextKind].name;
    if (nextNight % BOSS.every === 0 && portraitReady(nextBossImg)) {
      label(ctx, `MALAM ${nextNight}`, W / 2, 96, { font: `700 54px ${TITLE_FONT}`, color: C.cream, align: 'center', spacing: 6, glow: 26, glowColor: 'rgba(169, 139, 255, 0.5)' });
      drawPortrait(nextBossImg, W / 2, 232, 150, nextKind === 'ratu' ? 'rgba(192, 132, 252, 0.30)' : 'rgba(128, 60, 220, 0.30)', nextKind === 'ratu' ? 'rgba(216, 180, 254, 0.95)' : 'rgba(169, 139, 255, 0.95)');
      label(ctx, nextBossName.split('').join(' '), W / 2, 322, { font: `700 18px ${MONO_FONT}`, color: nextKind === 'ratu' ? '#c084fc' : '#a98bff', align: 'center', spacing: 3 });
      // v1.4.6: the night's own story line, not the generic hint — the hint
      // is already in the boss cutscene (Lumi's last beat), and without this
      // the night-9 Kronik line never appeared anywhere.
      const bossStory = state.night <= STRINGS.dawnStory.length
        ? STRINGS.dawnStory[state.night - 1]
        : nextKind === 'ratu'
          ? 'Jaring bayangan menutupi langit. Nyalakan keempat lampion — setiap cahaya yang menyala membakar jaring sang Ratu.'
          : 'Kegelapan pekat turun dari langit. Nyalakan keempat lampion — setiap cahaya yang menyala melukai Dark Pekat.';
      const bossLines = wrapLines(bossStory, 920, `italic 500 21px ${TITLE_FONT}`);
      let bossY = 356;
      for (const line of bossLines) {
        label(ctx, line, W / 2, bossY, { font: `italic 500 21px ${TITLE_FONT}`, color: 'rgba(247, 241, 220, 0.9)', align: 'center' });
        bossY += 30;
      }
      label(ctx, `MALAM ${nextNight} — ${nextBossName} MENANTI`, W / 2, bossY + 14, { font: `700 16px ${MONO_FONT}`, color: C.coral, align: 'center', spacing: 3 });
      label(ctx, `NIGHT ${state.night} COMPLETE`, W / 2, bossY + 48, { font: `600 13px ${MONO_FONT}`, color: C.textDim, align: 'center', spacing: 4 });
      label(ctx, `+${state.bonus.toLocaleString('en-US')}`, W / 2, bossY + 90, { font: `700 44px ${MONO_FONT}`, color: C.mint, align: 'center', glow: 16, glowColor: 'rgba(143, 240, 208, 0.5)' });
      label(ctx, 'NIGHT BONUS', W / 2, bossY + 118, { font: `600 12px ${MONO_FONT}`, color: C.textDim, align: 'center', spacing: 3 });
      label(ctx, `SCORE  ${state.score.toLocaleString('en-US')}`, W / 2, bossY + 150, { font: `700 18px ${MONO_FONT}`, color: C.cream, align: 'center', spacing: 1.5 });
      drawButton(demo ? 'THE MOTH FLIES ON…' : STRINGS.next, bossY + 210);
      void time;
      return;
    }
    label(ctx, STRINGS.dawn, W / 2, 208, { font: `700 62px ${TITLE_FONT}`, color: C.amber, align: 'center', spacing: 6, glow: 26, glowColor: 'rgba(255, 207, 107, 0.5)' });
    // ANDROID BUILD ONLY — story line for the night just survived. After night 3
    // (endless mode) Lumi and Lulu are free and guard the garden with Luma.
    // v1.4.6: the line is WRAPPED — the Kronik lines are long, and a single
    // unwrapped line ran off both edges of the screen (reported 18 Nov).
    // Everything below the story shifts down with the line count.
    const dawnStory = state.night <= STRINGS.dawnStory.length
      ? STRINGS.dawnStory[state.night - 1]
      : `Malam ${state.night} berlalu. Luma, Lumi, dan Lulu menjaga taman bersama.`;
    const storyLines = wrapLines(dawnStory, 920, `italic 500 22px ${TITLE_FONT}`);
    let storyY = 260;
    for (const line of storyLines) {
      label(ctx, line, W / 2, storyY, { font: `italic 500 22px ${TITLE_FONT}`, color: 'rgba(247, 241, 220, 0.9)', align: 'center' });
      storyY += 30;
    }
    const shift = (storyLines.length - 1) * 30;
    if ((state.night + 1) % BOSS.every === 0) {
      label(ctx, `MALAM ${state.night + 1} — ${BOSS_KINDS[bossKind(state.night + 1)].name} MENANTI`, W / 2, 296 + shift, { font: `700 16px ${MONO_FONT}`, color: C.coral, align: 'center', spacing: 3 });
    }
    label(ctx, `NIGHT ${state.night} COMPLETE`, W / 2, 330 + shift, { font: `600 13px ${MONO_FONT}`, color: C.textDim, align: 'center', spacing: 4 });
    label(ctx, `+${state.bonus.toLocaleString('en-US')}`, W / 2, 390 + shift, { font: `700 52px ${MONO_FONT}`, color: C.mint, align: 'center', glow: 16, glowColor: 'rgba(143, 240, 208, 0.5)' });
    label(ctx, 'NIGHT BONUS', W / 2, 420 + shift, { font: `600 12px ${MONO_FONT}`, color: C.textDim, align: 'center', spacing: 3 });
    label(ctx, `SCORE  ${state.score.toLocaleString('en-US')}`, W / 2, 478 + shift, { font: `700 20px ${MONO_FONT}`, color: C.cream, align: 'center', spacing: 1.5 });
    drawButton(demo ? 'THE MOTH FLIES ON…' : STRINGS.next, 558 + shift);
    void time;
  }

  function drawPaused(state) {
    overlay(0.66);
    label(ctx, 'PAUSED', W / 2, 300, { font: `700 58px ${TITLE_FONT}`, color: C.mint, align: 'center', spacing: 8 });
    label(ctx, 'The meadow holds its breath.', W / 2, 346, { font: `italic 500 22px ${TITLE_FONT}`, color: 'rgba(247, 241, 220, 0.85)', align: 'center' });
    label(ctx, 'PRESS P OR ENTER TO CONTINUE', W / 2, 420, { font: `600 15px ${MONO_FONT}`, color: C.amber, align: 'center', spacing: 2 });
    void state;
  }

  function draw(state, screen, best, extra = {}) {
    begin();
    skin = extra.skin ?? 'luma';
    const time = state.time + (extra.timeOffset ?? 0);
    const shake = state.shake;
    ctx.save();
    if (shake > 0.1) {
      ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    }
    drawField(state, time, screen !== SCREEN_PLAY && screen !== SCREEN_PAUSED, screen !== SCREEN_PLAY && screen !== SCREEN_PAUSED);
    ctx.restore();
    if (screen === SCREEN_TITLE) drawTitle(state, best, time, extra.demo === true);
    else if (screen === SCREEN_SKILLS) drawSkills(state, extra.badges ?? {}, time);
    else if (screen === SCREEN_SKINS) drawSkinScreen(state, extra.skin ?? 'luma', time);
    else if (screen === SCREEN_PROLOGUE) drawPrologueScreen(state, extra.prologuePage ?? 0, time);
    else if (screen === SCREEN_EPILOGUE) drawEpilogueScreen(state, extra.epiloguePage ?? 0, time, extra.epilogueCard === true);
    else if (screen === SCREEN_CUTSCENE) {
      if (extra.cutscene) drawCutsceneScreen(state, extra.cutscene, time);
      else drawDawnScreen(state, time, extra.demo === true);
    } else if (screen === SCREEN_DAWN) {
      drawDawnScreen(state, time, extra.demo === true);
    } else if (screen === SCREEN_OVER || screen === SCREEN_VICTORY) {
      drawEndScreen(state, screen, best, time);
    } else {
      drawHud(state, time);
      if (screen === SCREEN_PAUSED) drawPaused(state);
    }
    if (state.whiteFlash > 0) {
      // A two-frame white kiss on the flare: the meadow blinks, then the ring expands.
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.5, state.whiteFlash * 7).toFixed(3)})`;
      ctx.fillRect(0, 0, W, H);
    }
    if (state.flash > 0) {
      ctx.fillStyle = `rgba(255, 111, 138, ${(state.flash * 0.3).toFixed(3)})`;
      ctx.fillRect(0, 0, W, H);
    }
    end();
  }

  return { draw };
}
