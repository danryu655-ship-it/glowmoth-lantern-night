// The ?demo=1 autopilot: a small, readable pilot for the recording. It flies at the nearest
// golden mote (or a dew drop when a life is missing), keeps clear of the shadows, and spends a
// flare only when something is close enough to hurt. It reads the same world state a player
// sees, so the demo is the real game played by a bot, not a scripted cutscene.

import { FIELD, RUN } from './config.js';

function nearestMote(state) {
  let best = null;
  let bestDistance = Infinity;
  for (const mote of state.motes) {
    const distance = Math.hypot(mote.x - state.player.x, mote.y - state.player.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = mote;
    }
  }
  return { mote: best, distance: bestDistance };
}

function dartLane(hazard, player, along, spread) {
  const dx = Math.cos(hazard.angle);
  const dy = Math.sin(hazard.angle);
  const relX = player.x - hazard.x;
  const relY = player.y - hazard.y;
  const forward = relX * dx + relY * dy;
  const perp = Math.abs(relX * dy - relY * dx);
  return forward > -20 && forward < along && perp < spread ? 1 - perp / spread : 0;
}

/** Unit steering vector for one frame. */
export function autopilotDirection(state) {
  const player = state.player;
  const steer = { x: 0, y: 0 };

  const { mote } = nearestMote(state);
  const dew = state.dew;
  const wantDew = dew !== null && state.lives < RUN.lives
    && Math.hypot(dew.x - player.x, dew.y - player.y) < 430;
  let targetX = FIELD.width / 2;
  let targetY = 360;
  if (wantDew) {
    targetX = dew.x;
    targetY = dew.y;
  } else if (mote) {
    targetX = mote.x;
    targetY = mote.y;
  }

  const toX = targetX - player.x;
  const toY = targetY - player.y;
  const distance = Math.hypot(toX, toY) || 1;
  // Ease off close to the target so the moth does not orbit it.
  const pull = distance > 85 ? 1 : Math.max(0.4, distance / 85);
  steer.x += (toX / distance) * pull;
  steer.y += (toY / distance) * pull;

  for (const hazard of state.hazards) {
    const awayX = player.x - hazard.x;
    const awayY = player.y - hazard.y;
    const away = Math.hypot(awayX, awayY) || 1;
    let radius = hazard.kind === 'dart' ? 150 : 168;
    if (hazard.kind === 'dart' && hazard.mode === 'aim') radius = 96;
    if (away < radius) {
      const weight = (1 - away / radius) * 2.1;
      steer.x += (awayX / away) * weight;
      steer.y += (awayY / away) * weight;
    }
    // Sidestep a dart's dash lane.
    if (hazard.kind === 'dart' && hazard.mode === 'dash') {
      const lane = dartLane(hazard, player, 300, 64);
      if (lane > 0) {
        const dx = Math.cos(hazard.angle);
        const dy = Math.sin(hazard.angle);
        const side = (player.x - hazard.x) * dy - (player.y - hazard.y) * dx >= 0 ? 1 : -1;
        steer.x += -dy * side * lane * 2.6;
        steer.y += dx * side * lane * 2.6;
      }
    }
  }

  // Soft walls: the meadow's edges push back before the hard clamp does.
  const marginX = 100;
  const top = 118;
  const bottom = FIELD.groundY - 56;
  if (player.x < marginX) steer.x += ((marginX - player.x) / marginX) * 1.5;
  if (player.x > FIELD.width - marginX) steer.x -= ((player.x - (FIELD.width - marginX)) / marginX) * 1.5;
  if (player.y < top) steer.y += ((top - player.y) / top) * 1.4;
  if (player.y > bottom) steer.y -= ((player.y - bottom) / (FIELD.height - bottom)) * 1.4;

  const length = Math.hypot(steer.x, steer.y);
  if (length < 0.001) return { x: 0, y: 0 };
  return { x: steer.x / length, y: steer.y / length };
}

/** True when a flare now would save the moth a hit. */
export function autopilotFlare(state) {
  if (state.sparks <= 0) return false;
  const player = state.player;
  for (const hazard of state.hazards) {
    if (hazard.kind === 'shade') {
      if (hazard.stun <= 0 && Math.hypot(hazard.x - player.x, hazard.y - player.y) < 118) return true;
    } else if (hazard.mode === 'dash') {
      if (dartLane(hazard, player, 150, 56) > 0) return true;
    } else if (hazard.mode === 'aim' && hazard.aim < 0.32) {
      if (dartLane(hazard, player, 420, 58) > 0) return true;
    }
  }
  return false;
}
