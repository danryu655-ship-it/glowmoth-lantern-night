// Short-lived sparks, dust and petals. Particles are plain objects advanced by world.step and
// painted by render.js; they carry their own colour and fade so effects add no game state.

const MAX_PARTICLES = 420;

export function addParticle(state, particle) {
  if (state.particles.length >= MAX_PARTICLES) state.particles.shift();
  state.particles.push({
    vx: 0,
    vy: 0,
    drag: 2.2,
    gravity: 0,
    size: 3,
    life: 0.6,
    maxLife: 0.6,
    color: '#ffcf6b',
    glow: true,
    shape: 'dot',
    spin: 0,
    angle: 0,
    ...particle,
    maxLife: particle.life ?? 0.6,
  });
}

export function burst(state, rand, x, y, options = {}) {
  const {
    count = 14,
    colors = ['#ffcf6b', '#fff3c9', '#8ff0d0'],
    speed = 180,
    spread = Math.PI * 2,
    direction = 0,
    life = 0.7,
    size = 3.4,
    gravity = 60,
    shape = 'dot',
  } = options;
  for (let index = 0; index < count; index += 1) {
    const angle = direction + rand.range(-spread / 2, spread / 2);
    const velocity = rand.range(speed * 0.35, speed);
    addParticle(state, {
      x,
      y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      life: rand.range(life * 0.55, life),
      size: rand.range(size * 0.45, size),
      color: colors[index % colors.length],
      gravity,
      shape,
      angle: rand.angle(),
      spin: rand.range(-8, 8),
    });
  }
}

export function dust(state, rand, x, y, color = 'rgba(143, 240, 208, 0.75)') {
  addParticle(state, {
    x: x + rand.range(-4, 4),
    y: y + rand.range(-4, 4),
    vx: rand.range(-14, 14),
    vy: rand.range(-8, 22),
    life: rand.range(0.35, 0.7),
    size: rand.range(1.4, 3.2),
    color,
    gravity: -6,
    drag: 1.1,
    glow: true,
  });
}

export function flareRing(state, rand, x, y) {
  burst(state, rand, x, y, {
    count: 26,
    colors: ['#8ff0d0', '#d8fff3', '#ffcf6b'],
    speed: 430,
    life: 0.55,
    size: 3,
    gravity: 0,
  });
}

export function updateParticles(state, dt) {
  const particles = state.particles;
  for (let index = particles.length - 1; index >= 0; index -= 1) {
    const particle = particles[index];
    particle.life -= dt;
    if (particle.life <= 0) {
      particles.splice(index, 1);
      continue;
    }
    const drag = Math.max(0, 1 - particle.drag * dt);
    particle.vx *= drag;
    particle.vy = particle.vy * drag + particle.gravity * dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.angle += particle.spin * dt;
  }
}
