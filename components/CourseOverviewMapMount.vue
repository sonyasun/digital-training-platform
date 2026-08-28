<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import CourseOverviewMap from './business/CourseOverviewMap.vue'
import type { OverviewModule, OverviewSkin } from './business/CourseOverviewMap.vue'

const STORAGE_KEY = 'slpath-map-skin'

const modules: OverviewModule[] = [
  { id: 'ch1', name: '智能建造概论', done: 7, total: 7, status: 'completed', islandType: 'eco' },
  { id: 'ch2', name: '智能建造关键技术', done: 12, total: 29, status: 'active', islandType: 'tech' },
  { id: 'ch3', name: '智能建造全寿命周期应用', done: 0, total: 16, status: 'locked', islandType: 'eco', islandAsset: 'assets/course-overview/course-island-life-alpha.png' },
  { id: 'ch4', name: '智能建造项目管理', done: 0, total: 12, status: 'locked', islandType: 'tech', islandAsset: 'assets/course-overview/course-island-mgmt-alpha.png' },
]

function readSkin(): OverviewSkin {
  try {
    const params = new URLSearchParams(window.location.search)
    const fromUrl = params.get('skin')
    if (fromUrl === 'island' || fromUrl === 'city') {
      localStorage.setItem(STORAGE_KEY, fromUrl)
      return fromUrl
    }
  } catch {
    /* ignore */
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'island' || saved === 'city') return saved
  } catch {
    /* ignore */
  }
  return 'city'
}

const skin = ref<OverviewSkin>(readSkin())

function applySkin(next: OverviewSkin) {
  skin.value = next
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    /* ignore */
  }
  document.dispatchEvent(new CustomEvent('slpath-map-skin', { detail: next }))
}

function onSetSkin(event: Event) {
  const detail = (event as CustomEvent<OverviewSkin>).detail
  if (detail === 'island' || detail === 'city') applySkin(detail)
}

onMounted(() => {
  document.addEventListener('slpath-map-set-skin', onSetSkin)
  document.dispatchEvent(new CustomEvent('slpath-map-skin', { detail: skin.value }))
})

onBeforeUnmount(() => {
  document.removeEventListener('slpath-map-set-skin', onSetSkin)
})
</script>

<template>
  <CourseOverviewMap :skin="skin" :modules="modules" />
</template>

<style scoped>
:deep(.overview-map) {
  height: 100%;
  min-height: 0;
  border-radius: var(--radius-2xl);
  background:
    radial-gradient(ellipse at 24% 14%, rgba(167, 139, 250, 0.14), transparent 44%),
    radial-gradient(ellipse at 82% 78%, rgba(56, 189, 248, 0.12), transparent 40%),
    linear-gradient(168deg, #e8f3fa 0%, #d4e8f4 42%, #c8e0ef 100%);
}

:deep(.overview-map.skin-city) {
  background: transparent;
}

:deep(.ocean-art) {
  opacity: 0.96;
  filter: saturate(0.96) brightness(1.06) contrast(0.94) hue-rotate(-2deg);
}

:deep(.edge-fade) {
  background:
    linear-gradient(90deg, rgba(248, 250, 252, 0.38) 0%, transparent 12%, transparent 88%, rgba(248, 250, 252, 0.38) 100%),
    linear-gradient(180deg, rgba(248, 250, 252, 0.28) 0%, transparent 14%, transparent 86%, rgba(248, 250, 252, 0.32) 100%);
}
</style>
