// The things in the meadow: the moth, golden motes, dew drops, lanterns and the two kinds of
// shadow. Each factory returns the plain object the world advances and the renderer paints.

import { BOSS, FIELD, HAZARD, LANTERN, MOTE } from './config.js';

export function createMoth() {
  return {
    x: FIELD.width / 2,
    y: 380,
    vx: 0,
    vy: 0,
    invuln: 1.4,
    flap: 0,
    trailTimer: 0,
    face: -Math.PI / 2,
  };
}

// ANDROID BUILD ONLY (v1.3.0) — companions trail the moth; the boss is a giant
// shadow that drifts across the sky and fires darts.
export function createCompanion(x, y, color) {
  return { x, y, color, phase: Math.random() * Math.PI * 2, flap: 0 };
}

export function updateCompanion(companion, targetX, targetY, dt) {
  const rate = Math.min(1, dt * 5);
  companion.x += (targetX - companion.x) * rate;
  companion.y += (targetY - companion.y) * rate;
  companion.flap += dt * 14;
}

export function createBoss(kind = 'pekat') {
  return {
    kind,
    x: FIELD.width / 2,
    y: 168,
    r: BOSS.radius,
    phase: 0,
    flash: 0,
    stun: 0,
    vx: 0,
    vy: 0,
  };
}

export function spawnBossDart(state, boss, rand) {
  const angle = Math.atan2(state.player.y - boss.y, state.player.x - boss.x);
  state.hazards.push({
    kind: 'dart',
    x: boss.x,
    y: boss.y + 30,
    vx: 0,
    vy: 0,
    r: HAZARD.dart.radius,
    speed: HAZARD.dart.speed + state.night * HAZARD.dart.speedPerNight,
    phase: rand.angle(),
    age: 0,
    stun: 0,
    mode: 'aim',
    aim: HAZARD.dart.aimTime * 0.8,
    angle,
    targetAngle: angle,
  });
}

export function resetLanterns() {
  return LANTERN.positions.map(() => ({ lit: false, glow: 0, pulse: 0 }));
}

export function spawnMote(state, rand) {
  let x = 0;
  let y = 0;
  for (let attempt = 0; attempt < 14; attempt += 1) {
    x = rand.range(90, FIELD.width - 90);
    y = rand.range(90, FIELD.groundY - 40);
    if (Math.hypot(x - state.player.x, y - state.player.y) > 150) break;
  }
  const mote = {
    x,
    y,
    vx: 0,
    vy: 0,
    phase: rand.angle(),
    age: 0,
    life: MOTE.life,
    r: MOTE.radius,
    alive: true,
  };
  state.motes.push(mote);
  return mote;
}

export function spawnDew(state, rand) {
  let x = 0;
  let y = 0;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    x = rand.range(120, FIELD.width - 120);
    y = rand.range(110, FIELD.groundY - 50);
    if (Math.hypot(x - state.player.x, y - state.player.y) > 180) break;
  }
  state.dew = { x, y, phase: rand.angle(), age: 0, life: 15, r: 17 };
}

function edgePoint(rand) {
  const side = rand.int(0, 3);
  if (side === 0) return { x: rand.range(40, FIELD.width - 40), y: -50 };
  if (side === 1) return { x: FIELD.width + 50, y: rand.range(50, FIELD.groundY - 40) };
  if (side === 2) return { x: rand.range(40, FIELD.width - 40), y: FIELD.groundY + 50 };
  return { x: -50, y: rand.range(50, FIELD.groundY - 40) };
}

export function spawnShade(state, rand) {
  const point = edgePoint(rand);
  const speed = HAZARD.shade.speed + state.night * HAZARD.shade.speedPerNight + rand.range(-8, 14);
  state.hazards.push({
    kind: 'shade',
    x: point.x,
    y: point.y,
    vx: 0,
    vy: 0,
    r: HAZARD.shade.radius,
    speed,
    phase: rand.angle(),
    age: 0,
    stun: 0,
    mode: 'hunt',
    angle: 0,
  });
}

export function spawnDart(state, rand) {
  const point = edgePoint(rand);
  const angle = Math.atan2(state.player.y - point.y, state.player.x - point.x);
  state.hazards.push({
    kind: 'dart',
    x: point.x,
    y: point.y,
    vx: 0,
    vy: 0,
    r: HAZARD.dart.radius,
    speed: HAZARD.dart.speed + state.night * HAZARD.dart.speedPerNight,
    phase: rand.angle(),
    age: 0,
    stun: 0,
    mode: 'aim',
    aim: HAZARD.dart.aimTime,
    angle,
    targetAngle: angle,
  });
}

// ANDROID BUILD ONLY (v1.6.0) — the Void Scorpion: a ground crawler that
// walks the meadow floor toward the moth and lunges when it gets close.
export function spawnScorpion(state, rand) {
  const fromLeft = rand.next() < 0.5;
  state.hazards.push({
    kind: 'scorpion',
    x: fromLeft ? -50 : FIELD.width + 50,
    y: FIELD.groundY - 24,
    vx: 0,
    vy: 0,
    r: HAZARD.scorpion.radius,
    speed: HAZARD.scorpion.speed + state.night * HAZARD.scorpion.speedPerNight,
    phase: rand.angle(),
    age: 0,
    stun: 0,
    mode: 'hunt',
    lungeTimer: 0,
    lungeStart: 0,
    angle: 0,
  });
}

export function updateScorpion(hazard, player, dt) {
  hazard.age += dt;
  hazard.lungeTimer = Math.max(0, hazard.lungeTimer - dt);
  if (hazard.stun > 0) {
    hazard.stun -= dt;
    hazard.vx *= Math.max(0, 1 - 3 * dt);
  } else if (hazard.mode === 'lunge') {
    hazard.x += hazard.vx * dt;
    if (hazard.age - hazard.lungeStart > 0.45) hazard.mode = 'hunt';
  } else {
    const distance = Math.hypot(player.x - hazard.x, player.y - hazard.y);
    const direction = player.x >= hazard.x ? 1 : -1;
    if (distance < HAZARD.scorpion.lungeRange && hazard.lungeTimer <= 0) {
      hazard.mode = 'lunge';
      hazard.lungeStart = hazard.age;
      hazard.lungeTimer = HAZARD.scorpion.lungeCooldown;
      hazard.vx = direction * HAZARD.scorpion.lungeSpeed;
    } else {
      hazard.vx = direction * hazard.speed;
    }
    hazard.x += hazard.vx * dt;
  }
  hazard.y = FIELD.groundY - 24;
}

export function updateMote(mote, dt) {
  mote.age += dt;
  mote.vx = Math.sin(mote.age * 0.9 + mote.phase) * MOTE.drift;
  mote.vy = Math.cos(mote.age * 0.65 + mote.phase * 1.7) * MOTE.drift * 0.65 - 3;
  mote.x += mote.vx * dt;
  mote.y += mote.vy * dt;
  if (mote.x < 60 || mote.x > FIELD.width - 60) mote.vx *= -1;
  if (mote.y < 60 || mote.y > FIELD.groundY - 20) mote.vy *= -1;
}

export function updateShade(hazard, player, dt) {
  hazard.age += dt;
  if (hazard.stun > 0) {
    hazard.stun -= dt;
    hazard.vx *= Math.max(0, 1 - 3 * dt);
    hazard.vy *= Math.max(0, 1 - 3 * dt);
  } else {
    const wobble = Math.sin(hazard.age * 1.7 + hazard.phase) * 0.5;
    const angle = Math.atan2(player.y - hazard.y, player.x - hazard.x) + wobble;
    const wantedX = Math.cos(angle) * hazard.speed;
    const wantedY = Math.sin(angle) * hazard.speed;
    const steer = HAZARD.shade.steer * dt;
    hazard.vx += (wantedX - hazard.vx) * steer;
    hazard.vy += (wantedY - hazard.vy) * steer;
  }
  hazard.x += hazard.vx * dt;
  hazard.y += hazard.vy * dt;
}

export function updateDart(hazard, player, dt) {
  hazard.age += dt;
  if (hazard.mode === 'aim') {
    hazard.aim -= dt;
    hazard.angle = hazard.targetAngle + Math.sin(hazard.age * 18) * 0.06;
    if (hazard.aim <= 0) {
      hazard.mode = 'dash';
      hazard.vx = Math.cos(hazard.angle) * hazard.speed;
      hazard.vy = Math.sin(hazard.angle) * hazard.speed;
    }
    return;
  }
  hazard.x += hazard.vx * dt;
  hazard.y += hazard.vy * dt;
}
