<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';

interface Event {
  ts: string;
  severity: 'debug' | 'info' | 'warn' | 'error';
}

const props = defineProps<{
  latestEvent?: Event | null;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
let ctx: CanvasRenderingContext2D | null = null;
let animationId: number | null = null;
let particles: Particle[] = [];

const MAX_PARTICLES = 50;

// Design system colors - refined palette
const colors = {
  error: { r: 251, g: 113, b: 133 }, // rose-400
  warn: { r: 251, g: 191, b: 36 }, // amber-400
  info: { r: 56, g: 189, b: 248 }, // sky-400
  debug: { r: 148, g: 163, b: 184 }, // slate-400
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: { r: number; g: number; b: number };
  opacity: number;
  life: number;
  maxLife: number;
}

const createParticle = (severity: Event['severity']): Particle => {
  const canvas = canvasRef.value!;
  const color = colors[severity];

  return {
    x: 0,
    y: Math.random() * canvas.height,
    vx: 1.5 + Math.random() * 2, // Horizontal speed
    vy: (Math.random() - 0.5) * 0.5, // Slight vertical drift
    size: 3 + Math.random() * 3,
    color,
    opacity: 0.9,
    life: 0,
    maxLife: 150 + Math.random() * 50, // Frames to live
  };
};

const spawnParticle = (severity: Event['severity']) => {
  if (particles.length >= MAX_PARTICLES) {
    // Remove oldest particle
    particles.shift();
  }
  particles.push(createParticle(severity));
};

const updateParticles = () => {
  const canvas = canvasRef.value!;

  particles = particles.filter((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.life += 1;

    // Fade out as particle ages
    const lifeRatio = p.life / p.maxLife;
    p.opacity = Math.max(0, 0.9 * (1 - lifeRatio * lifeRatio));

    // Remove if off screen or dead
    return p.x < canvas.width + 20 && p.life < p.maxLife;
  });
};

const drawParticles = () => {
  if (!ctx || !canvasRef.value) return;

  const canvas = canvasRef.value;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach((p) => {
    const { r, g, b } = p.color;

    // Draw glow
    ctx!.save();
    ctx!.globalAlpha = p.opacity * 0.3;
    ctx!.shadowBlur = 20;
    ctx!.shadowColor = `rgb(${r}, ${g}, ${b})`;
    ctx!.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx!.beginPath();
    ctx!.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
    ctx!.fill();
    ctx!.restore();

    // Draw core
    ctx!.save();
    ctx!.globalAlpha = p.opacity;
    ctx!.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx!.beginPath();
    ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx!.fill();
    ctx!.restore();

    // Draw bright center
    ctx!.save();
    ctx!.globalAlpha = p.opacity * 0.8;
    ctx!.fillStyle = `rgba(255, 255, 255, 0.6)`;
    ctx!.beginPath();
    ctx!.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
    ctx!.fill();
    ctx!.restore();
  });
};

const animate = () => {
  updateParticles();
  drawParticles();
  animationId = requestAnimationFrame(animate);
};

const resizeCanvas = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const container = canvas.parentElement;
  if (!container) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = container.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;

  if (ctx) {
    ctx.scale(dpr, dpr);
  }
};

// Watch for new events
watch(
  () => props.latestEvent,
  (newEvent) => {
    if (newEvent && newEvent.severity) {
      spawnParticle(newEvent.severity);
    }
  },
);

onMounted(() => {
  if (canvasRef.value) {
    ctx = canvasRef.value.getContext('2d');
    resizeCanvas();
    animate();

    window.addEventListener('resize', resizeCanvas);

    // Spawn some initial particles for visual appeal
    const severities: Event['severity'][] = ['debug', 'info', 'warn', 'error'];
    for (let i = 0; i < 8; i++) {
      const severity = severities[Math.floor(Math.random() * severities.length)] ?? 'info';
      const particle = createParticle(severity);
      particle.x = Math.random() * (canvasRef.value?.width || 300);
      particles.push(particle);
    }
  }
});

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  window.removeEventListener('resize', resizeCanvas);
});
</script>

<template>
  <div class="flow-container">
    <canvas ref="canvasRef" class="flow-canvas"></canvas>
    <div class="flow-label">
      <span class="label-text">EVENT FLOW</span>
      <span class="particle-count">{{ particles.length }} active</span>
    </div>
  </div>
</template>

<style scoped>
.flow-container {
  position: relative;
  width: 100%;
  height: 100px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.02) 0%,
    transparent 20%,
    transparent 80%,
    rgba(255, 255, 255, 0.01) 100%
  );
  border-radius: 12px;
  overflow: hidden;
}

.flow-canvas {
  width: 100%;
  height: 100%;
}

.flow-label {
  position: absolute;
  bottom: var(--space-2);
  left: var(--space-3);
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.label-text {
  font-size: var(--text-micro);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-micro);
  letter-spacing: var(--tracking-wide);
  color: var(--color-sg-text-subtle);
}

.particle-count {
  font-size: var(--text-micro);
  font-family: var(--font-mono);
  line-height: var(--leading-micro);
  color: var(--color-sg-text-muted);
}
</style>
