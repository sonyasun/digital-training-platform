<script setup lang="ts">
import type { OverviewStatus } from './types'
import OverviewStatusIcon from './OverviewStatusIcon.vue'

withDefaults(defineProps<{
  status: OverviewStatus
  layer?: 'guide' | 'pin'
}>(), {
  layer: undefined,
})
</script>

<template>
  <span
    v-if="layer !== 'pin'"
    class="city-marker-line"
    :class="`is-${status}`"
    aria-hidden="true"
  ></span>

  <span
    v-if="layer !== 'guide'"
    class="city-marker-pin"
    :class="`is-${status}`"
    aria-hidden="true"
  >
    <span class="city-pin" :class="`is-${status}`">
      <OverviewStatusIcon :status="status" variant="badge-city" />
    </span>
  </span>
</template>

<style scoped>
.city-marker-line {
  position: absolute;
  top: 48px;
  bottom: 14%;
  left: 50%;
  z-index: 0;
  width: 0;
  border-left: 2px dotted #94a3b8;
  transform: translateX(-50%);
  opacity: 0.55;
  pointer-events: none;
  animation: guide-line-breathe 4.2s ease-in-out infinite;
}

.city-marker-line.is-completed {
  border-left-color: #52c41a;
}

.city-marker-line.is-active {
  border-left-color: #1677ff;
}

.city-marker-line.is-locked {
  border-left-color: #94a3b8;
}

.city-marker-pin {
  position: absolute;
  top: 0;
  left: 50%;
  z-index: 4;
  display: flex;
  justify-content: center;
  width: 48px;
  transform: translateX(-50%);
  pointer-events: none;
}

.city-marker-pin.is-completed::before,
.city-marker-pin.is-active::before,
.city-marker-pin.is-locked::before {
  content: "";
  position: absolute;
  z-index: -1;
  pointer-events: none;
}

.city-marker-pin.is-completed::before {
  top: 50%;
  left: 50%;
  width: 56px;
  height: 56px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(82, 196, 26, 0.34) 0%,
    rgba(82, 196, 26, 0.12) 52%,
    transparent 74%
  );
  box-shadow: 0 0 20px rgba(82, 196, 26, 0.28);
  animation: marker-halo-pulse 4.5s ease-in-out infinite;
}

.city-marker-pin.is-active::before {
  top: 2px;
  left: 50%;
  width: 54px;
  height: 66px;
  transform: translateX(-50%);
  border-radius: 50%;
  background: radial-gradient(
    ellipse,
    rgba(22, 119, 255, 0.32) 0%,
    rgba(22, 119, 255, 0.12) 46%,
    transparent 72%
  );
  animation: marker-halo-pulse 3.2s ease-in-out infinite;
}

.city-marker-pin.is-locked::before {
  top: 50%;
  left: 50%;
  width: 54px;
  height: 54px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(148, 163, 184, 0.34) 0%,
    rgba(148, 163, 184, 0.12) 52%,
    transparent 74%
  );
  box-shadow: 0 0 20px rgba(148, 163, 184, 0.28);
  animation: marker-halo-pulse 5.2s ease-in-out infinite;
}

.city-pin {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.city-pin.is-completed {
  width: 40px;
  height: 40px;
  border: 2px solid rgba(255, 255, 255, 0.98);
  border-radius: 50%;
  background: linear-gradient(180deg, #5fd646 0%, #52c41a 100%);
  box-shadow:
    0 6px 14px rgba(82, 196, 26, 0.28),
    0 0 0 3px rgba(82, 196, 26, 0.1),
    0 0 14px rgba(82, 196, 26, 0.24);
  animation: city-pin-float 4.8s ease-in-out infinite;
}

.city-pin.is-active {
  width: auto;
  height: auto;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  color: #1677ff;
  filter: none;
  animation: city-pin-float 3.2s ease-in-out infinite;
}

.city-pin.is-locked {
  width: 38px;
  height: 38px;
  border: 2px solid rgba(255, 255, 255, 0.92);
  border-radius: 50%;
  background: linear-gradient(180deg, #a8b4c4 0%, #94a3b8 100%);
  box-shadow:
    0 5px 12px rgba(100, 116, 139, 0.2),
    0 0 0 2px rgba(148, 163, 184, 0.12),
    0 0 14px rgba(148, 163, 184, 0.22);
}

@keyframes guide-line-breathe {
  0%, 100% { opacity: 0.42; }
  50% { opacity: 0.62; }
}

@keyframes marker-halo-pulse {
  0%, 100% {
    opacity: 0.72;
    scale: 0.96;
  }
  50% {
    opacity: 1;
    scale: 1.04;
  }
}

@keyframes city-pin-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

@media (prefers-reduced-motion: reduce) {
  .city-marker-line,
  .city-pin.is-completed,
  .city-pin.is-active,
  .city-marker-pin.is-completed::before,
  .city-marker-pin.is-active::before,
  .city-marker-pin.is-locked::before {
    animation: none;
  }
}

@media (max-width: 767px) {
  .city-marker-line {
    top: 44px;
  }
}
</style>
