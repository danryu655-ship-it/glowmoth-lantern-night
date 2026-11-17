// Boot and the one loop. The world advances in fixed 1/60 s steps, the renderer paints what is
// there, and one small state machine moves between title, play, paused, dawn, game over and
// victory. ?shot=title|play|dawn|victory|over stages a screenshot frame instead of starting the
// loop; ?seed=N makes a run's patterns repeatable.

import { BEST_KEY, RUN, STEP } from './config.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { createRenderer, SCREEN_DAWN, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_VICTORY } from './render.js';
import {
  createWorld, EVENT_DEW, EVENT_HIT, EVENT_LANTERN, EVENT_NIGHT, EVENT_OVER, EVENT_SPARK,
} from './world.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(seed);
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Private windows keep the best for this visit only.
  }
}

function runShot(name) {
  const best = readBest();
  const scene = stageShot(name, world, best);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else {
      window.__shotScene = name;
      window.__shotReady = true;
    }
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let ambientClock = 0;
  let last = performance.now();

  if (params.has('debug')) {
    window.__glowmoth = {
      get screen() { return screen; },
      get state() { return world.state; },
      world,
    };
  }

  function announce(message) {
    status.textContent = message;
  }

  function startRun() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    audio.unlock();
    audio.play('start');
    announce(`Night 1 of ${RUN.nightsToWin}. ${RUN.lives} lives. Collect golden motes to light four lanterns.`);
  }

  function finishRun(victory) {
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    screen = victory ? SCREEN_VICTORY : SCREEN_OVER;
    audio.play(victory ? 'victory' : 'over');
    announce(victory
      ? `Dawn breaks. Final score ${world.state.score}. Best ${best}. Press Enter to fly again.`
      : `The night takes you. Final score ${world.state.score}. Best ${best}. Press Enter to fly again.`);
  }

  function handleActions() {
    if (input.consume('mute')) {
      const muted = audio.toggleMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
    }
    const confirm = input.consume('confirm');
    const pointer = input.consume('pointer');
    const pause = input.consume('pause');

    if (screen === SCREEN_TITLE) {
      if (confirm || pointer) startRun();
      return;
    }
    if (screen === SCREEN_OVER || screen === SCREEN_VICTORY) {
      if (confirm || pointer) startRun();
      return;
    }
    if (screen === SCREEN_DAWN) {
      if (confirm || pointer) {
        world.nextNight();
        accumulator = 0;
        screen = SCREEN_PLAY;
        audio.play('start');
        announce(`Night ${world.state.night} of ${RUN.nightsToWin}.`);
      }
      return;
    }
    if (pause) {
      if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      } else if (screen === SCREEN_PLAY) {
        screen = SCREEN_PAUSED;
        announce('Paused.');
      }
      return;
    }
    if (screen === SCREEN_PAUSED) {
      if (confirm || pointer) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      }
      return;
    }
    if (screen === SCREEN_PLAY) {
      if (input.consume('flare') || pointer) {
        audio.unlock();
        if (world.flare()) audio.play('flare');
      }
    }
  }

  function handleEvents(events) {
    if (events & EVENT_HIT) {
      audio.play('hit');
      announce(world.state.lives === 1 ? 'Hit. One life left.' : `Hit. ${world.state.lives} lives left.`);
    }
    if (events & EVENT_LANTERN) audio.play('lantern');
    if (events & EVENT_DEW) {
      audio.play('dew');
      announce('Dew drop. One life restored.');
    }
    if (events & EVENT_SPARK) audio.play('mote', 4);
    if (events & EVENT_NIGHT) {
      if (world.state.night >= RUN.nightsToWin) finishRun(true);
      else {
        screen = SCREEN_DAWN;
        audio.play('clear');
        announce(`Night ${world.state.night} survived. Bonus ${world.state.bonus}. Press Enter for the next night.`);
      }
    }
    if (events & EVENT_OVER) finishRun(false);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const delta = Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    ambientClock += delta;
    handleActions();
    if (screen === SCREEN_TITLE) {
      accumulator += delta;
      while (accumulator >= STEP) {
        world.step(STEP, { x: 0, y: 0 }, true);
        accumulator -= STEP;
      }
    } else if (screen === SCREEN_PLAY) {
      accumulator += delta;
      while (accumulator >= STEP && screen === SCREEN_PLAY) {
        const events = world.step(STEP, input.direction(world.state.player), false);
        accumulator -= STEP;
        if (events !== 0) handleEvents(events);
        if (screen !== SCREEN_PLAY) accumulator = 0;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best, { timeOffset: screen === SCREEN_DAWN || screen === SCREEN_OVER || screen === SCREEN_VICTORY ? ambientClock : 0 });
    input.endFrame();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  window.addEventListener('keydown', () => audio.unlock(), { once: true });
  canvas.addEventListener('mousedown', () => audio.unlock(), { once: true });

  announce('Glowmoth: Lantern Night. Press Enter or click to fly.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
