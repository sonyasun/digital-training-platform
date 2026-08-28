<script setup lang="ts">
import type { OverviewIslandSpot } from './types'
import { resolveAssetUrl, statusLabel } from './constants'
import OverviewMapSpotCard from './OverviewMapSpotCard.vue'
import OverviewMapSpotMarker from './OverviewMapSpotMarker.vue'

const props = defineProps<{
  island: OverviewIslandSpot
  hovered: boolean
}>()

const emit = defineEmits<{
  (e: 'enter', id: string): void
  (e: 'hover', id: string): void
  (e: 'leave'): void
}>()

function onEnter() {
  emit('hover', props.island.id)
}

function onLeave() {
  emit('leave')
}
</script>

<template>
  <button
    type="button"
    class="island-spot"
    :class="[`is-${island.status}`, { 'is-hover': hovered }]"
    :style="{ ...island.style, '--spot-enter-delay': `${(island.order - 1) * 0.14}s` }"
    :aria-label="`${island.name}，${island.done}/${island.total} 知识点，${statusLabel(island.status)}`"
    @click="emit('enter', island.id)"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
    @focus="onEnter"
    @blur="onLeave"
  >
    <span class="island-bob" :style="{ animationDelay: island.bobDelay }">
      <OverviewMapSpotMarker :status="island.status" layer="guide" />
      <img
        class="island-art"
        :src="resolveAssetUrl(island.asset)"
        alt=""
        aria-hidden="true"
      />
      <OverviewMapSpotMarker :status="island.status" layer="pin" />
    </span>

    <OverviewMapSpotCard
      :status="island.status"
      :order="island.order"
      :name="island.name"
      :done="island.done"
      :total="island.total"
      :status-text="statusLabel(island.status)"
      :enter-delay="(island.order - 1) * 0.35"
    />
  </button>
</template>

<style scoped>
.island-spot {
  position: absolute;
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  animation: spot-enter 680ms var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1)) both;
  animation-delay: var(--spot-enter-delay, 0s);
  transition:
    transform 280ms var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1)),
    filter 280ms ease;
}

.island-spot.is-hover,
.island-spot:focus-visible {
  transform: translateY(-3px);
}

.island-spot.is-active {
  z-index: 5;
}

.island-spot:focus-visible {
  outline: none;
}

.island-bob {
  position: relative;
  isolation: isolate;
  display: block;
  width: 100%;
  flex: 1 1 auto;
  min-height: 0;
  transform-origin: center bottom;
  scale: 0.82;
  animation: island-float 5.6s ease-in-out infinite;
  transition: scale 280ms var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1));
}

.island-spot.is-active .island-bob::before {
  content: "";
  position: absolute;
  z-index: 0;
  left: 50%;
  bottom: 6%;
  width: 124%;
  height: 58%;
  transform: translateX(-50%);
  border-radius: 50%;
  background: radial-gradient(
    ellipse,
    color-mix(in srgb, var(--color-primary) 28%, transparent) 0%,
    color-mix(in srgb, var(--color-primary) 10%, transparent) 52%,
    transparent 74%
  );
  animation: active-halo 3.2s ease-in-out infinite;
  pointer-events: none;
}

.island-spot.is-hover .island-bob,
.island-spot:focus-visible .island-bob {
  scale: 0.86;
  animation-play-state: paused;
}

.island-spot.is-hover :deep(.island-card),
.island-spot:focus-visible :deep(.island-card) {
  animation-play-state: paused;
}

.island-art {
  position: absolute;
  left: 50%;
  bottom: -2%;
  z-index: 2;
  display: block;
  width: 118%;
  max-width: none;
  height: auto;
  transform: translateX(-50%);
  transform-origin: center bottom;
  filter: drop-shadow(0 10px 16px rgba(15, 45, 78, 0.22));
  pointer-events: none;
  user-select: none;
}

.island-spot.is-completed .island-art {
  filter:
    saturate(1.08)
    brightness(1.04)
    drop-shadow(0 14px 18px rgba(15, 45, 78, 0.26));
}

.island-spot.is-active .island-art {
  filter:
    saturate(1.18)
    brightness(1.07)
    contrast(1.05)
    drop-shadow(0 0 18px color-mix(in srgb, var(--color-primary) 42%, transparent))
    drop-shadow(0 16px 20px rgba(15, 45, 78, 0.3));
}

.island-spot.is-locked .island-art {
  opacity: 0.78;
  filter:
    grayscale(0.55)
    saturate(0.45)
    brightness(1.06)
    contrast(0.82)
    drop-shadow(0 10px 14px rgba(71, 85, 105, 0.16));
}

.island-spot.is-hover :deep(.island-card),
.island-spot:focus-visible :deep(.island-card) {
  border-color: color-mix(in srgb, var(--color-primary) 28%, white);
  box-shadow:
    var(--shadow-lg),
    0 0 0 1px color-mix(in srgb, var(--color-primary) 10%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
}

@keyframes spot-enter {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.94);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes island-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

@keyframes active-halo {
  0%, 100% {
    opacity: 0.55;
    scale: 0.97;
  }
  50% {
    opacity: 0.92;
    scale: 1.03;
  }
}

@media (prefers-reduced-motion: reduce) {
  .island-spot {
    animation: none;
    transition: none;
  }

  .island-bob,
  .island-spot.is-active .island-bob::before {
    animation: none;
    transition: none;
  }
}
</style>
