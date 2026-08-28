<script setup lang="ts">
import type { OverviewBridge, OverviewSkin } from './types'

defineProps<{
  bridges: OverviewBridge[]
  skin: OverviewSkin
}>()
</script>

<template>
  <svg class="bridge-layer" :class="`skin-${skin}`" viewBox="0 0 1000 620" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <!-- 岛屿：绳桥 / 航路渐变 -->
      <linearGradient id="bridge-island-completed" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#fde68a" />
        <stop offset="40%" stop-color="#86efac" />
        <stop offset="100%" stop-color="#16a34a" />
      </linearGradient>
      <linearGradient id="bridge-island-progress" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#bae6fd" />
        <stop offset="45%" stop-color="#38bdf8" />
        <stop offset="100%" stop-color="#0284c7" />
      </linearGradient>
      <linearGradient id="bridge-island-locked" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#e2e8f0" />
        <stop offset="100%" stop-color="#94a3b8" />
      </linearGradient>
      <!-- 城市：简洁引导线 -->
      <linearGradient id="bridge-city-completed" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#86efac" />
        <stop offset="100%" stop-color="#22c55e" />
      </linearGradient>
      <linearGradient id="bridge-city-progress" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#93c5fd" />
        <stop offset="100%" stop-color="#1677ff" />
      </linearGradient>
      <filter id="bridge-island-glow" x="-35%" y="-55%" width="170%" height="210%">
        <feGaussianBlur stdDeviation="2.8" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="bridge-wake-blur" x="-50%" y="-70%" width="200%" height="240%">
        <feGaussianBlur stdDeviation="5" />
      </filter>
      <filter id="bridge-soft-glow" x="-30%" y="-50%" width="160%" height="200%">
        <feGaussianBlur stdDeviation="2.2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <g
      v-for="(bridge, i) in bridges"
      :key="`bridge-${i}`"
      class="bridge-group"
      :class="[`is-${bridge.tone}`, { 'is-dashed': bridge.dashed }]"
    >
      <!-- 岛屿：海面航迹底光 -->
      <path v-if="skin === 'island'" class="bridge-wake" :d="bridge.d" />
      <path class="bridge-shadow" :d="bridge.d" />
      <path class="bridge-main" :d="bridge.d" />
      <path v-if="!bridge.dashed" class="bridge-shine" :d="bridge.d" />
    </g>
  </svg>
</template>

<style scoped>
.bridge-layer {
  position: absolute;
  inset: 0;
  z-index: 3;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
}

.bridge-group {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* ── 岛屿探险：绳桥航路 ── */
.skin-island .bridge-wake {
  stroke: rgba(255, 255, 255, 0.72);
  stroke-width: 18;
  opacity: 0.38;
  filter: url(#bridge-wake-blur);
  animation: bridge-wake-pulse 6s ease-in-out infinite;
}

.skin-island .bridge-shadow {
  stroke: rgba(7, 47, 73, 0.28);
  stroke-width: 9;
}

.skin-island .bridge-main {
  stroke-width: 5.2;
  stroke-dasharray: 14 5 4 5;
}

.skin-island .is-completed .bridge-main {
  stroke: url(#bridge-island-completed);
  opacity: 0.96;
  filter: url(#bridge-island-glow);
}

.skin-island .is-progress .bridge-main {
  stroke: url(#bridge-island-progress);
  stroke-width: 5.8;
  stroke-dasharray: 16 5 5 5;
  opacity: 1;
  filter: url(#bridge-island-glow);
  animation: island-bridge-flow 16s linear infinite;
}

.skin-island .is-locked .bridge-main {
  stroke: url(#bridge-island-locked);
  stroke-width: 4.2;
  stroke-dasharray: 4 10;
  opacity: 0.58;
}

.skin-island .bridge-shine {
  stroke: rgba(255, 255, 255, 0.78);
  stroke-width: 1.8;
  stroke-dasharray: 8 16;
  opacity: 0.82;
}

.skin-island .is-completed .bridge-shine {
  animation: island-bridge-shine 22s linear infinite;
}

.skin-island .is-progress .bridge-shine {
  animation: island-bridge-flow 16s linear infinite;
}

/* ── 未来城市：简洁引导线 ── */
.skin-city .bridge-shadow {
  stroke: rgba(255, 255, 255, 0.35);
  stroke-width: 6;
}

.skin-city .bridge-main {
  stroke-width: 3.6;
  stroke-dasharray: 2 10;
}

.skin-city .is-completed .bridge-main {
  stroke: url(#bridge-city-completed);
  opacity: 0.82;
  filter: url(#bridge-soft-glow);
}

.skin-city .is-completed .bridge-shine {
  animation: city-bridge-shine 24s linear infinite;
}

.skin-city .is-progress .bridge-main {
  stroke: url(#bridge-city-progress);
  stroke-width: 4;
  stroke-dasharray: 2 8;
  opacity: 0.88;
  filter: url(#bridge-soft-glow);
  animation: city-bridge-flow 18s linear infinite;
}

.skin-city .is-progress .bridge-shine {
  animation: city-bridge-flow 18s linear infinite;
}

.skin-city .is-locked .bridge-main {
  stroke: #94a3b8;
  stroke-width: 3.2;
  stroke-dasharray: 2 12;
  opacity: 0.42;
}

.skin-city .bridge-shine {
  stroke: rgba(255, 255, 255, 0.5);
  stroke-width: 1;
  stroke-dasharray: 1 14;
  opacity: 0.55;
}

@keyframes island-bridge-flow {
  from { stroke-dashoffset: 0; }
  to { stroke-dashoffset: -140; }
}

@keyframes island-bridge-shine {
  from { stroke-dashoffset: 0; }
  to { stroke-dashoffset: -96; }
}

@keyframes city-bridge-flow {
  from { stroke-dashoffset: 0; }
  to { stroke-dashoffset: -80; }
}

@keyframes city-bridge-shine {
  from { stroke-dashoffset: 0; }
  to { stroke-dashoffset: -60; }
}

@keyframes bridge-wake-pulse {
  0%, 100% { opacity: 0.28; }
  50% { opacity: 0.46; }
}

@media (prefers-reduced-motion: reduce) {
  .skin-island .bridge-wake,
  .skin-island .is-progress .bridge-main,
  .skin-island .is-progress .bridge-shine,
  .skin-island .is-completed .bridge-shine,
  .skin-city .is-progress .bridge-main,
  .skin-city .is-progress .bridge-shine,
  .skin-city .is-completed .bridge-shine {
    animation: none;
  }
}
</style>
