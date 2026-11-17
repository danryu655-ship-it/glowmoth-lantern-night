// The painter: a cached night meadow, the living things, the HUD and the four screens. It knows
// nothing about the rules; it reads a world state and draws it. All art is vector and gradient
// work on one canvas, with no image or font file anywhere.

import { FIELD, LANTERN, PALETTE as C, RUN, STRINGS } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_DAWN = 'dawn';
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

  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, C.skyTop);
  sky.addColorStop(0.45, C.skyMid);
  sky.addColorStop(0.78, C.skyLow);
  sky.addColorStop(1, C.meadowLow);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Stars: a fixed scatter with three sizes, brightest high in the sky.
  let seed = 20261117;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let index = 0; index < 150; index += 1) {
    const x = random() * W;
    const y = random() * 520;
    const size = random() < 0.14 ? 1.9 : random() < 0.5 ? 1.15 : 0.7;
    const alpha = 0.18 + random() * 0.55 * (1 - y / 640);
    ctx.fillStyle = `rgba(223, 234, 255, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    if (size > 1.7 && random() < 0.5) {
      ctx.strokeStyle = `rgba(223, 234, 255, ${(alpha * 0.5).toFixed(3)})`;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(x - 3.5, y);
      ctx.lineTo(x + 3.5, y);
      ctx.moveTo(x, y - 3.5);
      ctx.lineTo(x, y + 3.5);
      ctx.stroke();
    }
  }

  // A soft moon with a few pale craters and a wide halo.
  const moonX = 1136;
  const moonY = 170;
  const halo = ctx.createRadialGradient(moonX, moonY, 26, moonX, moonY, 178);
  halo.addColorStop(0, 'rgba(255, 231, 176, 0.20)');
  halo.addColorStop(0.45, 'rgba(255, 220, 150, 0.07)');
  halo.addColorStop(1, 'rgba(255, 220, 150, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(moonX, moonY, 178, 0, Math.PI * 2);
  ctx.fill();
  const moon = ctx.createRadialGradient(moonX - 14, moonY - 16, 7, moonX, moonY, 49);
  moon.addColorStop(0, '#fffbe9');
  moon.addColorStop(0.72, C.moon);
  moon.addColorStop(1, '#e6c789');
  ctx.fillStyle = moon;
  ctx.beginPath();
  ctx.arc(moonX, moonY, 48, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(146, 112, 52, 0.13)';
  for (const [dx, dy, r] of [[-18, -10, 9], [14, 6, 12], [2, -26, 5], [-6, 24, 7]]) {
    ctx.beginPath();
    ctx.arc(moonX + dx, moonY + dy, r, 0, Math.PI * 2);
    ctx.fill();
  }

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

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const base = backgroundLayer();

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
        const halo = ctx.createRadialGradient(0, 0, 8, 0, 0, 190 + pulse * 45);
        halo.addColorStop(0, `rgba(255, 226, 158, ${(0.32 * glow).toFixed(3)})`);
        halo.addColorStop(0.4, `rgba(255, 196, 96, ${(0.13 * glow).toFixed(3)})`);
        halo.addColorStop(1, 'rgba(255, 196, 96, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, 0, 210 + pulse * 45, 0, Math.PI * 2);
        ctx.fill();
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

  function drawMoth(player, time, options = {}) {
    const { scale = 1, alpha = 1, noFlicker = false } = options;
    const flicker = noFlicker ? 1 : player.invuln > 0 ? 0.45 + 0.55 * Math.abs(Math.sin(time * 18)) : 1;
    const flap = Math.sin(player.flap);
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.face + Math.PI / 2);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha * flicker;

    const aura = ctx.createRadialGradient(0, 0, 2, 0, 0, 54);
    aura.addColorStop(0, 'rgba(255, 243, 201, 0.35)');
    aura.addColorStop(0.45, 'rgba(200, 255, 235, 0.12)');
    aura.addColorStop(1, 'rgba(143, 240, 208, 0)');
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
      upper.addColorStop(0, 'rgba(255, 246, 223, 0.92)');
      upper.addColorStop(0.55, 'rgba(201, 245, 227, 0.72)');
      upper.addColorStop(1, 'rgba(143, 240, 208, 0.18)');
      ctx.fillStyle = upper;
      ctx.beginPath();
      ctx.moveTo(2, -7);
      ctx.bezierCurveTo(13 * spread, -31, 35 * spread, -30, 30 * spread, -7);
      ctx.bezierCurveTo(27 * spread, 4, 12, 4, 2, -2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 249, 228, 0.42)';
      ctx.lineWidth = 0.9;
      ctx.stroke();
      // Lower wing.
      const lower = ctx.createLinearGradient(2, 2, 24, 24);
      lower.addColorStop(0, 'rgba(255, 243, 201, 0.72)');
      lower.addColorStop(1, 'rgba(255, 207, 107, 0.12)');
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
    body.addColorStop(0, '#fff8e4');
    body.addColorStop(0.55, '#ffe4a3');
    body.addColorStop(1, '#c98d45');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(0, 3, 5.2, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff3c9';
    ctx.beginPath();
    ctx.arc(0, -12, 5.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 243, 201, 0.8)';
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

  function drawParticles(state) {
    ctx.save();
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

  function drawField(state, time, hideMoth = false, sparse = false) {
    ctx.drawImage(base, 0, 0);
    drawFireflies(state, time);
    drawLanterns(state, time, sparse);
    drawDew(state, time);
    drawMotes(state, time);
    for (const hazard of state.hazards) {
      if (hazard.kind === 'shade') drawShade(hazard, time);
      else drawDart(hazard, time);
    }
    drawFlare(state);
    if (!hideMoth) drawMoth(state.player, time, { scale: 1.1 });
    drawParticles(state);
    const vignette = ctx.createRadialGradient(W / 2, H / 2, 240, W / 2, H / 2, 760);
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(0.72, 'rgba(0, 0, 0, 0.18)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);
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
    panel.addColorStop(0, 'rgba(7, 14, 27, 0.78)');
    panel.addColorStop(1, 'rgba(7, 14, 27, 0.38)');
    ctx.fillStyle = panel;
    ctx.fill();
    ctx.strokeStyle = 'rgba(143, 240, 208, 0.13)';
    ctx.lineWidth = 1;
    ctx.stroke();

    label(ctx, 'SCORE', 44, 38, { font: `600 12px ${MONO_FONT}`, color: C.textDim, spacing: 3 });
    label(ctx, state.score.toLocaleString('en-US'), 44, 74, { font: `700 36px ${MONO_FONT}`, color: C.cream, glow: 10, glowColor: 'rgba(255, 207, 107, 0.45)' });
    if (state.combo > 1) {
      const pulse = 0.8 + 0.2 * Math.sin(time * 8);
      label(ctx, `x${state.combo}`, 232, 72, { font: `700 25px ${MONO_FONT}`, color: C.amber, alpha: pulse, glow: 12, glowColor: C.amber });
      label(ctx, 'COMBO', 232, 87, { font: `600 10px ${MONO_FONT}`, color: C.textDim, spacing: 2 });
    }

    label(ctx, `NIGHT ${state.night} / ${RUN.nightsToWin}`, W / 2, 40, { font: `700 15px ${MONO_FONT}`, color: C.mint, align: 'center', spacing: 3 });
    for (let index = 0; index < LANTERN.count; index += 1) {
      const x = W / 2 - (LANTERN.count - 1) * 24 + index * 48;
      const lit = state.lanterns[index]?.lit ?? false;
      const progress = index === state.litCount && !lit ? state.progress / LANTERN.motesEach : 0;
      ctx.save();
      ctx.translate(x, 66);
      ctx.strokeStyle = lit ? 'rgba(255, 207, 107, 0.95)' : 'rgba(255, 207, 107, 0.28)';
      ctx.fillStyle = lit ? 'rgba(255, 207, 107, 0.9)' : 'rgba(255, 207, 107, 0.08)';
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
        ctx.fillStyle = '#fff3c9';
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

    for (let index = 0; index < RUN.lives; index += 1) {
      drawWingIcon(W - 196 + index * 34, 50, index < state.lives);
    }
    label(ctx, 'LIVES', W - 196, 84, { font: `600 10px ${MONO_FONT}`, color: C.textDim, spacing: 2 });
    for (let index = 0; index < RUN.maxSparks; index += 1) {
      drawSparkIcon(W - 84 + index * 24, 50, index < state.sparks);
    }
    label(ctx, 'FLARE', W - 90, 84, { font: `600 10px ${MONO_FONT}`, color: C.textDim, spacing: 2 });

    label(ctx, 'WASD / ARROWS / MOUSE TO FLY   ·   SPACE / CLICK TO FLARE   ·   P PAUSE   ·   M MUTE', W / 2, H - 14, {
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

  function drawTitle(state, best, time) {
    overlay(0.48);
    // Two lit lanterns frame the title; the world's decorative moth hovers below it.
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
      drawMoth({ ...state.player, x: W / 2, y: 418, face: -Math.PI / 2, invuln: 0, flap: time * 10 }, time, { scale: 1.55, noFlicker: true });
    }

    const buttonY = 528;
    const glow = 0.55 + 0.45 * Math.sin(time * 2.6);
    roundedRect(ctx, W / 2 - 224, buttonY - 30, 448, 58, 29);
    ctx.fillStyle = `rgba(255, 207, 107, ${0.08 + 0.05 * glow})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 207, 107, ${0.45 + 0.3 * glow})`;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    label(ctx, STRINGS.begin, W / 2, buttonY + 7, { font: `700 17px ${MONO_FONT}`, color: C.cream, align: 'center', spacing: 2, glow: 10, glowColor: 'rgba(255, 207, 107, 0.5)' });

    label(ctx, STRINGS.goal, W / 2, 604, { font: `500 17px ${BODY_FONT}`, color: 'rgba(247, 241, 220, 0.78)', align: 'center' });
    label(ctx, STRINGS.controls, W / 2, 662, { font: `500 12px ${MONO_FONT}`, color: 'rgba(169, 183, 201, 0.72)', align: 'center', spacing: 0.5 });
    label(ctx, best > 0 ? `BEST  ${best.toLocaleString('en-US')}` : 'AN ORIGINAL ARCADE GAME', 36, H - 26, { font: `600 12px ${MONO_FONT}`, color: 'rgba(255, 207, 107, 0.75)', spacing: 2 });
    label(ctx, 'THREE NIGHTS · THREE LIVES · FOUR LANTERNS', W - 36, H - 26, { font: `600 12px ${MONO_FONT}`, color: 'rgba(169, 183, 201, 0.6)', align: 'right', spacing: 2 });
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

  function drawDawnScreen(state, time) {
    overlay(0.58);
    label(ctx, STRINGS.dawn, W / 2, 208, { font: `700 62px ${TITLE_FONT}`, color: C.amber, align: 'center', spacing: 6, glow: 26, glowColor: 'rgba(255, 207, 107, 0.5)' });
    label(ctx, `${STRINGS.dawnSub}  Night ${state.night + 1} waits beyond the trees.`, W / 2, 260, { font: `italic 500 22px ${TITLE_FONT}`, color: 'rgba(247, 241, 220, 0.9)', align: 'center' });
    label(ctx, `NIGHT ${state.night} COMPLETE`, W / 2, 330, { font: `600 13px ${MONO_FONT}`, color: C.textDim, align: 'center', spacing: 4 });
    label(ctx, `+${state.bonus.toLocaleString('en-US')}`, W / 2, 390, { font: `700 52px ${MONO_FONT}`, color: C.mint, align: 'center', glow: 16, glowColor: 'rgba(143, 240, 208, 0.5)' });
    label(ctx, 'NIGHT BONUS', W / 2, 420, { font: `600 12px ${MONO_FONT}`, color: C.textDim, align: 'center', spacing: 3 });
    label(ctx, `SCORE  ${state.score.toLocaleString('en-US')}`, W / 2, 478, { font: `700 20px ${MONO_FONT}`, color: C.cream, align: 'center', spacing: 1.5 });
    drawButton(STRINGS.next, 558);
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
    const time = state.time + (extra.timeOffset ?? 0);
    const shake = state.shake;
    ctx.save();
    if (shake > 0.1) {
      ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    }
    drawField(state, time, screen !== SCREEN_PLAY && screen !== SCREEN_PAUSED, screen !== SCREEN_PLAY && screen !== SCREEN_PAUSED);
    ctx.restore();
    if (screen === SCREEN_TITLE) drawTitle(state, best, time);
    else if (screen === SCREEN_DAWN) {
      drawDawnScreen(state, time);
    } else if (screen === SCREEN_OVER || screen === SCREEN_VICTORY) {
      drawEndScreen(state, screen, best, time);
    } else {
      drawHud(state, time);
      if (screen === SCREEN_PAUSED) drawPaused(state);
    }
    if (state.flash > 0) {
      ctx.fillStyle = `rgba(255, 111, 138, ${(state.flash * 0.3).toFixed(3)})`;
      ctx.fillRect(0, 0, W, H);
    }
    end();
  }

  return { draw };
}
