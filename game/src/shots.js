// The four staged frames behind ?shot=title|play|dawn|victory|over. Each scene is the real world
// object filled with a hand-placed state and the real renderer, not a mock-up: the same code that
// draws a live game paints these frames, so the screenshots show the game's own art and HUD.

import { createRandom } from './random.js';
import { burst } from './particles.js';
import { SCREEN_DAWN, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_VICTORY } from './render.js';

function placeMote(x, y, phase) {
  return { x, y, vx: 0, vy: 0, phase, age: 2.2, life: 16, r: 11, alive: true };
}

function lightLanterns(state, count) {
  for (let index = 0; index < state.lanterns.length; index += 1) {
    state.lanterns[index].lit = index < count;
    state.lanterns[index].glow = index < count ? 1 : 0;
    state.lanterns[index].pulse = index === count - 1 ? 0.5 : 0;
  }
  state.litCount = count;
}

export function stageShot(name, world, best) {
  world.reset();
  const state = world.state;
  const rand = createRandom(9001);
  state.time = 12.4;
  state.player.x = 468;
  state.player.y = 342;
  state.player.vx = 145;
  state.player.vy = -38;
  state.player.face = -0.35;
  state.player.flap = 2.1;
  state.player.invuln = 0;
  state.motes = [
    placeMote(212, 224, 0.4),
    placeMote(704, 176, 1.9),
    placeMote(928, 350, 3.1),
    placeMote(596, 452, 2.4),
    placeMote(312, 468, 0.9),
    placeMote(1050, 252, 4.2),
  ];
  state.dew = { x: 948, y: 486, phase: 1.2, age: 3, life: 15, r: 17 };

  if (name === 'title') {
    state.motes = [
      placeMote(336, 236, 0.4),
      placeMote(914, 208, 1.9),
      placeMote(252, 388, 3.1),
      placeMote(996, 402, 2.4),
    ];
    lightLanterns(state, 2);
    state.lanterns[0].glow = 1;
    state.lanterns[3].lit = true;
    state.lanterns[3].glow = 1;
    state.litCount = 2;
    state.dew = null;
    state.hazards = [];
    state.particles = [];
    return { screen: SCREEN_TITLE, best };
  }

  if (name === 'play') {
    state.night = 2;
    state.score = 1480;
    state.lives = 2;
    state.sparks = 1;
    state.sparkCharge = 3;
    state.chain = 7;
    state.combo = 2;
    state.comboTimer = 2.1;
    state.progress = 4;
    state.motesCollected = 19;
    state.peakCombo = 3;
    lightLanterns(state, 2);
    state.lanterns[0].pulse = 0;
    state.lanterns[1].pulse = 0;
    state.hazards = [
      { kind: 'shade', x: 806, y: 292, vx: -18, vy: 10, r: 21, speed: 84, phase: 0.8, age: 4, stun: 0, mode: 'hunt', angle: 0 },
      { kind: 'shade', x: 250, y: 180, vx: 12, vy: 16, r: 21, speed: 84, phase: 2.4, age: 2, stun: 0, mode: 'hunt', angle: 0 },
      { kind: 'dart', x: 1148, y: 418, vx: -680, vy: 0, r: 11, speed: 680, phase: 0.2, age: 2.4, stun: 0, mode: 'dash', angle: Math.PI, targetAngle: Math.PI },
      { kind: 'dart', x: 160, y: 96, vx: 0, vy: 0, r: 11, speed: 680, phase: 1.2, age: 0.4, stun: 0, mode: 'aim', aim: 0.5, angle: 0.72, targetAngle: 0.72 },
    ];
    burst(state, rand, 596, 452, { count: 12, colors: ['#ffcf6b', '#fff3c9', '#8ff0d0'], speed: 130, life: 0.66, size: 2.6, gravity: 18 });
    burst(state, rand, 520, 340, { count: 10, colors: ['rgba(143, 240, 208, 0.8)', 'rgba(255, 243, 201, 0.7)'], speed: 80, life: 0.8, size: 2, gravity: -10 });
    return { screen: SCREEN_PLAY, best };
  }

  if (name === 'dawn') {
    state.night = 1;
    state.score = 1320;
    state.bonus = 450;
    state.lives = 2;
    state.progress = 0;
    state.motesCollected = 24;
    lightLanterns(state, 4);
    state.motes = [placeMote(368, 226, 0.8), placeMote(884, 186, 2.2), placeMote(1004, 356, 4.2)];
    state.hazards = [];
    state.dew = null;
    state.player.invuln = 1.2;
    state.particles = [];
    return { screen: SCREEN_DAWN, best };
  }

  if (name === 'victory') {
    state.night = 3;
    state.score = 4860;
    state.lives = 2;
    state.progress = 0;
    state.motesCollected = 71;
    state.peakCombo = 5;
    lightLanterns(state, 4);
    state.motes = [];
    state.hazards = [];
    state.dew = null;
    state.particles = [];
    state.player.x = 430;
    state.player.y = 322;
    state.player.face = -Math.PI / 2;
    breakNight(state, rand);
    return { screen: SCREEN_VICTORY, best: Math.max(best, 4860) };
  }

  // Game over: three lanterns lit, the fourth dark, the moth caught at the edge of the meadow.
  state.night = 2;
  state.score = 2140;
  state.lives = 0;
  state.sparks = 0;
  state.progress = 3;
  state.motesCollected = 38;
  state.peakCombo = 3;
  lightLanterns(state, 3);
  state.player.x = 424;
  state.player.y = 418;
  state.player.vx = 0;
  state.player.vy = 0;
  state.player.face = 2.15;
  state.player.invuln = 0.7;
  state.hazards = [
    { kind: 'shade', x: 480, y: 426, vx: 0, vy: 0, r: 21, speed: 84, phase: 1.1, age: 6, stun: 0, mode: 'hunt', angle: 0 },
    { kind: 'shade', x: 928, y: 452, vx: -8, vy: 12, r: 21, speed: 84, phase: 3.2, age: 3, stun: 0, mode: 'hunt', angle: 0 },
    { kind: 'dart', x: 1040, y: 330, vx: -680, vy: 60, r: 11, speed: 680, phase: 0.4, age: 2.4, stun: 0, mode: 'dash', angle: 2.9, targetAngle: 2.9 },
  ];
  state.flash = 0.12;
  state.motes = [];
  state.dew = null;
  burst(state, rand, 424, 418, { count: 22, colors: ['#ff6f8a', '#a98bff', '#f7f1dc'], speed: 230, life: 0.9, size: 3.2, gravity: 60 });
  return { screen: SCREEN_OVER, best: Math.max(best, 3240) };
}

function breakNight(state, rand) {
  for (const spot of [[330, 440], [820, 440]]) {
    burst(state, rand, spot[0], spot[1], { count: 14, colors: ['#ffcf6b', '#fff3c9'], speed: 140, life: 1, size: 2.6, gravity: -20 });
  }
}
