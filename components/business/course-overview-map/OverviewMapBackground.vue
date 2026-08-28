<script setup lang="ts">
import type { OverviewSkin } from './types'
import { CITY_ART_SRC, OCEAN_ART_SRC, resolveAssetUrl } from './constants'

defineProps<{
  skin: OverviewSkin
}>()
</script>

<template>
  <div class="map-background" :class="`is-${skin}`" aria-hidden="true">
    <img
      v-if="skin === 'island'"
      class="map-bg ocean-art"
      :src="resolveAssetUrl(OCEAN_ART_SRC)"
      alt=""
    />
    <img
      v-else
      class="map-bg city-art"
      :src="resolveAssetUrl(CITY_ART_SRC)"
      alt=""
    />

    <template v-if="skin === 'island'">
      <div class="wave-sheen"></div>
      <div class="caustics"></div>
      <div class="background-wash"></div>
      <div class="edge-fade"></div>
    </template>
  </div>
</template>

<style scoped>
.map-background {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.map-bg {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  min-height: 100%;
  object-fit: cover;
  pointer-events: none;
  user-select: none;
}

.map-background.is-island .ocean-art {
  animation: none;
}

.ocean-art {
  object-position: center 40%;
  filter: saturate(0.88) brightness(1.08) contrast(0.92) hue-rotate(-4deg);
}

.city-art {
  object-position: center 38%;
  opacity: 1;
}

.wave-sheen,
.caustics,
.background-wash,
.edge-fade {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.wave-sheen {
  z-index: 1;
  background:
    repeating-linear-gradient(
      102deg,
      transparent 0 22px,
      rgba(255, 255, 255, 0.055) 23px,
      transparent 34px
    );
  animation: wave-drift 22s linear infinite;
  mix-blend-mode: soft-light;
  opacity: 0.36;
}

.caustics {
  z-index: 1;
  background:
    radial-gradient(ellipse at 18% 68%, rgba(255, 255, 255, 0.16), transparent 44%),
    radial-gradient(ellipse at 72% 28%, color-mix(in srgb, var(--color-primary) 10%, transparent), transparent 40%),
    radial-gradient(ellipse at 52% 82%, rgba(186, 230, 253, 0.18), transparent 36%);
  animation: caustic-shift 14s ease-in-out infinite alternate;
}

.background-wash {
  z-index: 2;
  background:
    radial-gradient(ellipse at 50% 42%, transparent 28%, color-mix(in srgb, var(--color-bg-page) 28%, transparent) 78%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, transparent 28%, rgba(244, 247, 251, 0.22) 100%);
}

.edge-fade {
  z-index: 2;
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--color-bg-page) 55%, transparent) 0%, transparent 8%, transparent 92%, color-mix(in srgb, var(--color-bg-page) 55%, transparent) 100%),
    linear-gradient(180deg, color-mix(in srgb, var(--color-bg-page) 42%, transparent) 0%, transparent 16%, transparent 84%, color-mix(in srgb, var(--color-bg-page) 48%, transparent) 100%);
}

@keyframes wave-drift {
  from { background-position: 0 0; }
  to { background-position: 220px 18px; }
}

@keyframes caustic-shift {
  from { opacity: 0.55; transform: translate3d(0, 0, 0); }
  to { opacity: 0.9; transform: translate3d(-12px, 8px, 0); }
}

@media (prefers-reduced-motion: reduce) {
  .wave-sheen,
  .caustics {
    animation: none;
  }
}
</style>
