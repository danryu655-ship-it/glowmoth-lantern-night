// The rules of one night in the meadow: steering, collecting, lighting lanterns, the shadows
// that hunt the moth, the flare, lives and score. world.step advances a fixed 1/60 s and returns
// a bit set of events for main.js to turn into screens, sound and announcements.

import {
  DEW, FIELD, FLARE, HAZARD, LANTERN, MOTE, MOTH, RUN,
} from './config.js';
import {
  createMoth, resetLanterns, spawnDart, spawnDew, spawnMote, spawnShade, updateDart, updateMote, updateShade,
} from './entities.js';
import { burst, dust, flareRing, updateParticles } from './particles.js';
import { createRandom } from './random.js';

export const EVENT_HIT = 1;
export const EVENT_OVER = 2;
export const EVENT_LANTERN = 4;
export const EVENT_NIGHT = 8;
export const EVENT_DEW = 16;
export const EVENT_SPARK = 32;

export function createWorld(seed) {
  let rand = createRandom(seed);
  let runs = 0;
  const state = {
    night: 1,
    score: 0,
    lives: RUN.lives,
    sparks: 1,
    sparkCharge: 0,
    chain: 0,
    combo: 1,
    comboTimer: 0,
    progress: 0,
    litCount: 0,
    lanterns: resetLanterns(),
    player: createMoth(),
    motes: [],
    hazards: [],
    dew: null,
    particles: [],
    flare: null,
    shake: 0,
    flash: 0,
    time: 0,
    moteTimer: 0,
    hazardTimer: 1.6,
    dewTimer: 15,
    bonus: 0,
    lastEvent: 0,
    nightCleared: false,
  };

  function seedRun() {
    rand = createRandom((seed + runs * 7919) >>> 0 || 1);
    runs += 1;
  }

  function reset() {
    seedRun();
    state.night = 1;
    state.score = 0;
    state.lives = RUN.lives;
    state.sparks = 1;
    state.sparkCharge = 0;
    state.chain = 0;
    state.combo = 1;
    state.comboTimer = 0;
    state.progress = 0;
    state.litCount = 0;
    state.motesCollected = 0;
    state.peakCombo = 1;
    state.lanterns = resetLanterns();
    state.player = createMoth();
    state.motes = [];
    state.hazards = [];
    state.dew = null;
    state.particles = [];
    state.flare = null;
    state.shake = 0;
    state.flash = 0;
    state.time = 0;
    state.moteTimer = 0.2;
    state.hazardTimer = 2.2;
    state.dewTimer = 15;
    state.bonus = 0;
    state.nightCleared = false;
    for (let index = 0; index < 5; index += 1) spawnMote(state, rand);
  }

  function nextNight() {
    state.night += 1;
    state.progress = 0;
    state.litCount = 0;
    state.lanterns = resetLanterns();
    state.hazards = [];
    state.dew = null;
    state.motes = [];
    state.player.x = FIELD.width / 2;
    state.player.y = 380;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.invuln = 2.2;
    state.moteTimer = 0.3;
    state.hazardTimer = 2;
    state.dewTimer = 16;
    state.chain = 0;
    state.combo = 1;
    state.comboTimer = 0;
    state.nightCleared = false;
    state.bonus = 0;
    for (let index = 0; index < 6; index += 1) spawnMote(state, rand);
  }

  function collectMote(mote) {
    mote.alive = false;
    state.chain += 1;
    state.comboTimer = RUN.comboWindow;
    state.combo = 1 + Math.min(RUN.maxCombo - 1, Math.floor(state.chain / RUN.comboStep));
    state.peakCombo = Math.max(state.peakCombo, state.combo);
    state.motesCollected += 1;
    state.score += MOTE.value * state.combo;
    state.progress += 1;
    state.sparkCharge += 1;
    burst(state, rand, mote.x, mote.y, {
      count: 9,
      colors: ['#ffcf6b', '#fff3c9', '#8ff0d0'],
      speed: 150,
      life: 0.55,
      size: 2.8,
      gravity: 20,
    });
    if (state.sparkCharge >= RUN.motesPerSpark && state.sparks < RUN.maxSparks) {
      state.sparks += 1;
      state.sparkCharge = 0;
      state.lastEvent |= EVENT_SPARK;
      burst(state, rand, state.player.x, state.player.y, {
        count: 12,
        colors: ['#8ff0d0', '#d8fff3'],
        speed: 120,
        life: 0.7,
        size: 2.4,
        gravity: -20,
      });
    }
    if (state.progress >= LANTERN.motesEach && state.litCount < LANTERN.count) {
      const lantern = state.lanterns[state.litCount];
      lantern.lit = true;
      lantern.pulse = 1;
      state.litCount += 1;
      state.progress = 0;
      state.score += LANTERN.lightScore;
      state.lastEvent |= EVENT_LANTERN;
      const spot = LANTERN.positions[state.litCount - 1];
      burst(state, rand, spot.x, spot.y - 52, {
        count: 26,
        colors: ['#ffcf6b', '#fff3c9', '#8ff0d0'],
        speed: 240,
        life: 1.1,
        size: 3.6,
        gravity: 10,
      });
      if (state.litCount >= LANTERN.count && !state.nightCleared) {
        state.nightCleared = true;
        state.bonus = 200 * state.night + state.lives * 50;
        state.score += state.bonus;
        state.lastEvent |= EVENT_NIGHT;
      }
    }
  }

  function hitBy(hazard) {
    if (state.player.invuln > 0) return 0;
    state.lives -= 1;
    state.player.invuln = MOTH.invulnerable;
    state.chain = 0;
    state.combo = 1;
    state.comboTimer = 0;
    state.flash = 0.55;
    state.shake = 16;
    hazard.stun = 1.5;
    const angle = Math.atan2(hazard.y - state.player.y, hazard.x - state.player.x);
    hazard.vx = Math.cos(angle) * 260;
    hazard.vy = Math.sin(angle) * 260;
    burst(state, rand, state.player.x, state.player.y, {
      count: 24,
      colors: ['#ff6f8a', '#a98bff', '#f7f1dc'],
      speed: 300,
      life: 0.9,
      size: 3.5,
      gravity: 80,
    });
    state.lastEvent |= EVENT_HIT;
    if (state.lives <= 0) {
      state.lives = 0;
      state.lastEvent |= EVENT_OVER;
    }
    return 1;
  }

  function steer(dt, direction) {
    const player = state.player;
    const input = Math.hypot(direction.x, direction.y);
    if (input > 0.001) {
      const scale = MOTH.accel * Math.min(1, input);
      player.vx += direction.x * scale * dt;
      player.vy += direction.y * scale * dt;
    }
    const drag = Math.max(0, 1 - MOTH.drag * dt);
    player.vx *= drag;
    player.vy *= drag;
    const speed = Math.hypot(player.vx, player.vy);
    if (speed > MOTH.maxSpeed) {
      player.vx = (player.vx / speed) * MOTH.maxSpeed;
      player.vy = (player.vy / speed) * MOTH.maxSpeed;
    }
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    const left = 44;
    const right = FIELD.width - 44;
    const top = 62;
    const bottom = FIELD.groundY - 18;
    if (player.x < left) { player.x = left; player.vx = Math.abs(player.vx) * 0.15; }
    if (player.x > right) { player.x = right; player.vx = -Math.abs(player.vx) * 0.15; }
    if (player.y < top) { player.y = top; player.vy = Math.abs(player.vy) * 0.15; }
    if (player.y > bottom) { player.y = bottom; player.vy = -Math.abs(player.vy) * 0.15; }
    if (speed > 20) player.face = Math.atan2(player.vy, player.vx);
  }

  function flare() {
    if (state.sparks <= 0) return false;
    state.sparks -= 1;
    state.flare = { x: state.player.x, y: state.player.y, age: 0 };
    flareRing(state, rand, state.player.x, state.player.y);
    for (const hazard of state.hazards) {
      const dx = hazard.x - state.player.x;
      const dy = hazard.y - state.player.y;
      const distance = Math.hypot(dx, dy);
      if (distance > FLARE.radius) continue;
      if (hazard.kind === 'dart') {
        hazard.dead = true;
        burst(state, rand, hazard.x, hazard.y, {
          count: 12,
          colors: ['#a98bff', '#8ff0d0', '#241a45'],
          speed: 190,
          life: 0.6,
          size: 2.6,
          gravity: 0,
        });
      } else {
        const nx = distance > 0 ? dx / distance : 1;
        const ny = distance > 0 ? dy / distance : 0;
        hazard.vx = nx * FLARE.push;
        hazard.vy = ny * FLARE.push;
        hazard.stun = FLARE.stun;
      }
    }
    return true;
  }

  function step(dt, direction, ambient = false) {
    state.lastEvent = 0;
    state.time += dt;
    state.shake = Math.max(0, state.shake - 34 * dt);
    state.flash = Math.max(0, state.flash - 1.8 * dt);
    const player = state.player;
    player.invuln = Math.max(0, player.invuln - dt);
    player.flap += dt * (9 + Math.hypot(player.vx, player.vy) * 0.012);

    if (ambient) {
      for (const mote of state.motes) updateMote(mote, dt);
      updateParticles(state, dt);
      return 0;
    }

    steer(dt, direction);
    for (const lantern of state.lanterns) {
      lantern.pulse = Math.max(0, lantern.pulse - dt * 1.4);
      lantern.glow += ((lantern.lit ? 1 : 0) - lantern.glow) * Math.min(1, dt * 3);
    }

    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) {
        state.chain = 0;
        state.combo = 1;
      }
    }

    state.moteTimer -= dt;
    if (state.moteTimer <= 0 && state.motes.length < MOTE.max) {
      spawnMote(state, rand);
      state.moteTimer = Math.max(MOTE.minInterval, MOTE.spawnInterval - state.night * 0.06) + rand.range(0, 0.22);
    }

    if (state.dew === null && state.lives < RUN.lives) {
      state.dewTimer -= dt;
      if (state.dewTimer <= 0) {
        spawnDew(state, rand);
        state.dewTimer = rand.range(DEW.minGap, DEW.maxGap);
      }
    }

    state.hazardTimer -= dt;
    if (state.hazardTimer <= 0 && state.hazards.length < HAZARD.max) {
      if (state.night >= 2 && rand.next() < 0.35) spawnDart(state, rand);
      else if (rand.next() < 0.46) spawnDart(state, rand);
      else spawnShade(state, rand);
      if (state.night >= 3 && rand.next() < 0.3 && state.hazards.length < HAZARD.max) spawnShade(state, rand);
      state.hazardTimer = Math.max(HAZARD.minGap, HAZARD.spawnGap - (state.night - 1) * HAZARD.gapPerNight) + rand.range(0, 0.5);
    }

    for (let index = state.motes.length - 1; index >= 0; index -= 1) {
      const mote = state.motes[index];
      updateMote(mote, dt);
      if (mote.age >= mote.life) {
        state.motes.splice(index, 1);
        continue;
      }
      if (Math.hypot(mote.x - player.x, mote.y - player.y) < mote.r + MOTH.radius + 4) {
        state.motes.splice(index, 1);
        collectMote(mote);
      }
    }

    if (state.dew !== null) {
      state.dew.age += dt;
      if (state.dew.age >= state.dew.life) {
        state.dew = null;
      } else if (Math.hypot(state.dew.x - player.x, state.dew.y - player.y) < state.dew.r + MOTH.radius + 4) {
        state.lives = Math.min(RUN.lives, state.lives + 1);
        state.score += 50;
        burst(state, rand, state.dew.x, state.dew.y, {
          count: 18,
          colors: ['#8ff0d0', '#d8fff3', '#ffcf6b'],
          speed: 200,
          life: 0.8,
          size: 3,
          gravity: -30,
        });
        state.dew = null;
        state.lastEvent |= EVENT_DEW;
      }
    }

    for (let index = state.hazards.length - 1; index >= 0; index -= 1) {
      const hazard = state.hazards[index];
      if (hazard.kind === 'dart') updateDart(hazard, player, dt);
      else updateShade(hazard, player, dt);
      if (hazard.dead || hazard.x < -110 || hazard.x > FIELD.width + 110 || hazard.y < -130 || hazard.y > FIELD.height + 130) {
        if (!hazard.dead) hazard.dead = true;
        if (hazard.age > 1.4) state.hazards.splice(index, 1);
        continue;
      }
      if (hazard.mode !== 'aim' && Math.hypot(hazard.x - player.x, hazard.y - player.y) < hazard.r + MOTH.radius) {
        hitBy(hazard);
        if (hazard.kind === 'dart') hazard.dead = true;
      }
    }

    if (state.flare !== null) {
      state.flare.age += dt;
      if (state.flare.age > FLARE.duration) state.flare = null;
    }

    if (Math.hypot(player.vx, player.vy) > 90) {
      player.trailTimer -= dt;
      if (player.trailTimer <= 0) {
        player.trailTimer = 0.04;
        dust(state, rand, player.x - Math.cos(player.face) * 12, player.y - Math.sin(player.face) * 12);
      }
    }

    updateParticles(state, dt);
    return state.lastEvent;
  }

  reset();
  return { state, reset, nextNight, step, flare };
}

