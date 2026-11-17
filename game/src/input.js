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
  const pressed = { confirm: false, flare: false, pause: false, mute: false, pointer: false };
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
  }

  return { direction, consume, endFrame };
}
