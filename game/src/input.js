// Keyboard and mouse read into one small state: a steering vector, and edge-triggered
// actions the screens consume once (confirm, flare, pause, mute). The canvas is scaled
// to the fixed playfield, so the pointer is mapped back into 1280 x 720 field units.

import { FIELD } from './config.js';

const STEER_KEYS = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD',
]);
const BLOCKED = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'PageUp', 'PageDown']);

export function createInput(canvas) {
  const keys = new Set();
  const pressed = { confirm: false, flare: false, pause: false, mute: false, pointer: false, skills: false };
  const pointer = { x: FIELD.width / 2, y: FIELD.height / 2, active: false, movedAt: -10000 };

  function fieldPoint(event) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return { x: pointer.x, y: pointer.y };
    // The renderer letterboxes the 16:9 field into the window with contain.
    const scale = Math.min(rect.width / FIELD.width, rect.height / FIELD.height);
    const left = rect.left + (rect.width - FIELD.width * scale) / 2;
    const top = rect.top + (rect.height - FIELD.height * scale) / 2;
    return {
      x: (event.clientX - left) / scale,
      y: (event.clientY - top) / scale,
    };
  }

  function movePointer(event) {
    const point = fieldPoint(event);
    pointer.x = point.x;
    pointer.y = point.y;
    pointer.active = true;
    pointer.movedAt = performance.now();
  }

  window.addEventListener('keydown', (event) => {
    if (event.repeat) {
      if (BLOCKED.has(event.code)) event.preventDefault();
      return;
    }
    if (BLOCKED.has(event.code)) event.preventDefault();
    keys.add(event.code);
    if (event.code === 'Enter' || event.code === 'NumpadEnter') pressed.confirm = true;
    if (event.code === 'Space') {
      pressed.flare = true;
      pressed.confirm = true;
    }
    if (event.code === 'KeyP' || event.code === 'Escape') pressed.pause = true;
    if (event.code === 'KeyM') pressed.mute = true;
    // ANDROID BUILD ONLY (v1.5.0) — K opens the Skill screen from the title.
    if (event.code === 'KeyK') pressed.skills = true;
  });

  window.addEventListener('keyup', (event) => {
    keys.delete(event.code);
  });

  window.addEventListener('blur', () => {
    keys.clear();
  });

  canvas.addEventListener('mousemove', movePointer);
  canvas.addEventListener('mousedown', (event) => {
    if (event.button !== 0) return;
    movePointer(event);
    pressed.pointer = true;
  });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  // Touch (Android): floating joystick on the left half of the screen
  // (left thumb steers, the base appears where the thumb lands), a quick tap
  // anywhere flares, and a drag on the right half steers toward the finger
  // like a mouse. Two fingers work at once: steer with the left thumb, tap
  // with the right to flare.
  const STICK_RADIUS = 56;
  const STICK_ZONE = 0.45; // left 45% of the screen width
  const stickBase = document.createElement('div');
  stickBase.style.cssText = 'position:fixed;display:none;width:112px;height:112px;margin:-56px 0 0 -56px;border:2px solid rgba(255,213,79,.55);background:rgba(255,213,79,.08);border-radius:50%;pointer-events:none;z-index:10;';
  const stickKnob = document.createElement('div');
  stickKnob.style.cssText = 'position:fixed;display:none;width:48px;height:48px;margin:-24px 0 0 -24px;background:rgba(255,255,255,.85);border-radius:50%;pointer-events:none;z-index:11;box-shadow:0 0 12px rgba(255,213,79,.6);';
  document.body.append(stickBase, stickKnob);
  let stick = null; // { id, baseX, baseY, dx, dy }
  const taps = new Map(); // touch id -> { x, y, t }

  function showStick() {
    stickBase.style.display = 'block';
    stickKnob.style.display = 'block';
    stickBase.style.left = `${stick.baseX}px`;
    stickBase.style.top = `${stick.baseY}px`;
    stickKnob.style.left = `${stick.baseX + stick.dx}px`;
    stickKnob.style.top = `${stick.baseY + stick.dy}px`;
  }

  function hideStick() {
    stickBase.style.display = 'none';
    stickKnob.style.display = 'none';
  }

  canvas.addEventListener('touchstart', (event) => {
    event.preventDefault();
    for (const touch of event.changedTouches) {
      taps.set(touch.identifier, { x: touch.clientX, y: touch.clientY, t: performance.now() });
      if (stick === null && touch.clientX < window.innerWidth * STICK_ZONE) {
        stick = { id: touch.identifier, baseX: touch.clientX, baseY: touch.clientY, dx: 0, dy: 0 };
        showStick();
      } else {
        movePointer(touch);
      }
    }
  }, { passive: false });
  canvas.addEventListener('touchmove', (event) => {
    event.preventDefault();
    for (const touch of event.changedTouches) {
      if (stick !== null && touch.identifier === stick.id) {
        let dx = touch.clientX - stick.baseX;
        let dy = touch.clientY - stick.baseY;
        const dist = Math.hypot(dx, dy);
        if (dist > STICK_RADIUS) {
          dx = (dx / dist) * STICK_RADIUS;
          dy = (dy / dist) * STICK_RADIUS;
        }
        stick.dx = dx;
        stick.dy = dy;
        showStick();
      } else {
        movePointer(touch);
      }
    }
  }, { passive: false });
  function endTouch(event) {
    event.preventDefault();
    for (const touch of event.changedTouches) {
      if (stick !== null && touch.identifier === stick.id) {
        stick = null;
        hideStick();
      }
      const start = taps.get(touch.identifier);
      if (start) {
        const moved = Math.hypot(touch.clientX - start.x, touch.clientY - start.y);
        if (performance.now() - start.t < 300 && moved < 24) {
          movePointer(touch);
          pressed.pointer = true;
        }
        taps.delete(touch.identifier);
      }
    }
  }
  canvas.addEventListener('touchend', endTouch, { passive: false });
  canvas.addEventListener('touchcancel', endTouch, { passive: false });

  function direction(player) {
    let x = 0;
    let y = 0;
    if (keys.has('ArrowLeft') || keys.has('KeyA')) x -= 1;
    if (keys.has('ArrowRight') || keys.has('KeyD')) x += 1;
    if (keys.has('ArrowUp') || keys.has('KeyW')) y -= 1;
    if (keys.has('ArrowDown') || keys.has('KeyS')) y += 1;
    if (x !== 0 || y !== 0) {
      const length = Math.hypot(x, y) || 1;
      return { x: x / length, y: y / length };
    }
    if (stick !== null) {
      const dist = Math.hypot(stick.dx, stick.dy);
      if (dist > 8) {
        const strength = Math.min(1, dist / STICK_RADIUS);
        return { x: (stick.dx / dist) * strength, y: (stick.dy / dist) * strength };
      }
      return { x: 0, y: 0 };
    }
    if (pointer.active && performance.now() - pointer.movedAt < 1400) {
      const dx = pointer.x - player.x;
      const dy = pointer.y - player.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 10) {
        const strength = Math.min(1, distance / 150);
        return { x: (dx / distance) * strength, y: (dy / distance) * strength };
      }
    }
    return { x: 0, y: 0 };
  }

  function consume(action) {
    if (!pressed[action]) return false;
    pressed[action] = false;
    return true;
  }

  function endFrame() {
    pressed.confirm = false;
    pressed.flare = false;
    pressed.pause = false;
    pressed.mute = false;
    pressed.pointer = false;
    pressed.skills = false;
  }

  // ANDROID BUILD ONLY (v1.5.0) — the last pointer position in field units,
  // so the title screen can tell a tap on the SKILL button from a tap
  // anywhere else (which starts the run).
  function pointerPos() {
    return { x: pointer.x, y: pointer.y };
  }

  return { direction, consume, endFrame, pointerPos };
}
