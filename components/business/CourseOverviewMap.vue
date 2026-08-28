<!--
  课程总览地图（第一层）
  岛屿 / 未来城市皮肤：共用布局与交互，背景与标记样式由 skin 切换。
-->
<template>
  <div class="overview-map" :class="`skin-${skin}`">
    <OverviewMapBackground :skin="skin" />

    <div class="map-stage" @mousemove="onParallax" @mouseleave="resetParallax">
      <div class="world" :style="worldStyle">
        <OverviewMapBridgeLayer :skin="skin" :bridges="bridges" />

        <OverviewMapSpot
          v-for="island in islands"
          :key="island.id"
          :island="island"
          :hovered="hoveredId === island.id"
          @enter="enterModule"
          @hover="hoveredId = $event"
          @leave="hoveredId = ''"
        />
      </div>

      <OverviewMapLegend />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import OverviewMapBackground from './course-overview-map/OverviewMapBackground.vue'
import OverviewMapBridgeLayer from './course-overview-map/OverviewMapBridgeLayer.vue'
import OverviewMapLegend from './course-overview-map/OverviewMapLegend.vue'
import OverviewMapSpot from './course-overview-map/OverviewMapSpot.vue'
import { buildBridges, buildIslandSpots } from './course-overview-map/layout'
import { statusLabel } from './course-overview-map/constants'
import type { OverviewModule, OverviewSkin } from './course-overview-map/types'

export type { OverviewModule, OverviewSkin, OverviewStatus } from './course-overview-map/types'

type SlpathMapModuleState = {
  id: string
  name: string
  done: number
  total: number
  status: OverviewModule['status']
  order: number
  statusLabel: string
}

type SlpathMapStateDetail = {
  skin: OverviewSkin
  skinLabel: string
  modules: SlpathMapModuleState[]
  hoveredId: string
  selectedId: string
  revealedIds: string[]
  focusModule: SlpathMapModuleState | null
  activeModule: SlpathMapModuleState | null
  courseProgress: { done: number; total: number; percent: number }
  aiSuggestion: string
  progress: number
}

const props = withDefaults(defineProps<{
  modules: OverviewModule[]
  skin?: OverviewSkin
}>(), {
  skin: 'city',
})

const emit = defineEmits<{
  (e: 'enter-module', id: string): void
}>()

const hoveredId = ref('')
const selectedId = ref('')
const revealedIds = ref<string[]>([])
const parallax = reactive({ x: 0, y: 0 })

let revealTimers: ReturnType<typeof setTimeout>[] = []

const worldStyle = computed(() => ({
  transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0) scale(1.01)`,
}))

const islands = computed(() => buildIslandSpots(props.modules, props.skin))
const bridges = computed(() => buildBridges(islands.value))

const moduleStates = computed<SlpathMapModuleState[]>(() =>
  islands.value.map(island => ({
    id: island.id,
    name: island.name,
    done: island.done,
    total: island.total,
    status: island.status,
    order: island.order,
    statusLabel: statusLabel(island.status),
  })),
)

const activeModule = computed(() => moduleStates.value.find(m => m.status === 'active') ?? null)

const courseProgress = computed(() => {
  const done = props.modules.reduce((sum, mod) => sum + mod.done, 0)
  const total = props.modules.reduce((sum, mod) => sum + mod.total, 0)
  return {
    done,
    total,
    percent: total ? Math.round((done / total) * 100) : 0,
  }
})

const focusModule = computed(() => {
  if (hoveredId.value) {
    return moduleStates.value.find(m => m.id === hoveredId.value) ?? null
  }
  if (selectedId.value) {
    return moduleStates.value.find(m => m.id === selectedId.value) ?? null
  }
  return activeModule.value
})

function buildAiSuggestion(focus: SlpathMapModuleState | null) {
  if (!focus) return '正在读取课程地图数据…'
  if (focus.status === 'locked') {
    return `「${focus.name}」尚未解锁，请先完成前置章节。`
  }
  if (focus.status === 'completed') {
    return `「${focus.name}」已全部完成，可进入下一章节或复习已学内容。`
  }
  const remaining = focus.total - focus.done
  const pct = focus.total ? Math.round((focus.done / focus.total) * 100) : 0
  return `建议优先完成「${focus.name}」剩余 ${remaining} 个知识点，当前进度 ${pct}%。`
}

function emitMapState() {
  if (typeof document === 'undefined') return
  const skinLabel = props.skin === 'city' ? '未来城市' : '岛屿探险'
  const revealProgress = moduleStates.value.length
    ? Math.round((revealedIds.value.length / moduleStates.value.length) * 100)
    : 0
  const detail: SlpathMapStateDetail = {
    skin: props.skin,
    skinLabel,
    modules: moduleStates.value,
    hoveredId: hoveredId.value,
    selectedId: selectedId.value,
    revealedIds: [...revealedIds.value],
    focusModule: focusModule.value,
    activeModule: activeModule.value,
    courseProgress: courseProgress.value,
    aiSuggestion: buildAiSuggestion(focusModule.value),
    progress: Math.max(courseProgress.value.percent, revealProgress),
  }
  document.dispatchEvent(new CustomEvent('slpath-map-state', { detail }))
  ;(window as Window & { __slpathMapState?: SlpathMapStateDetail }).__slpathMapState = detail
}

function scheduleModuleReveal() {
  revealTimers.forEach(clearTimeout)
  revealTimers = []
  revealedIds.value = []

  const reducedMotion = typeof matchMedia !== 'undefined'
    && matchMedia('(prefers-reduced-motion: reduce)').matches

  if (reducedMotion) {
    revealedIds.value = props.modules.map(mod => mod.id)
    emitMapState()
    return
  }

  props.modules.forEach((mod, index) => {
    const timer = window.setTimeout(() => {
      if (!revealedIds.value.includes(mod.id)) {
        revealedIds.value = [...revealedIds.value, mod.id]
        emitMapState()
      }
    }, index * 420 + 480)
    revealTimers.push(timer)
  })
}

function onParallax(event: MouseEvent) {
  const box = (event.currentTarget as HTMLElement)?.getBoundingClientRect()
  if (!box) return
  parallax.x = ((event.clientX - box.left) / box.width - 0.5) * 18
  parallax.y = ((event.clientY - box.top) / box.height - 0.5) * 12
}

function resetParallax() {
  parallax.x = 0
  parallax.y = 0
}

function enterModule(id: string) {
  selectedId.value = id
  emit('enter-module', id)
  emitMapState()
}

watch(
  [() => props.modules, () => props.skin, hoveredId, selectedId, revealedIds, moduleStates, courseProgress, focusModule],
  () => emitMapState(),
  { deep: true, flush: 'post' },
)

watch(
  () => props.modules,
  () => scheduleModuleReveal(),
  { deep: true },
)

onMounted(() => {
  scheduleModuleReveal()
  emitMapState()
})

onBeforeUnmount(() => {
  revealTimers.forEach(clearTimeout)
  revealTimers = []
})
</script>

<style scoped>
.overview-map {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  border-radius: 0 0 var(--radius-lg, 16px) var(--radius-lg, 16px);
  background:
    radial-gradient(ellipse at 28% 18%, color-mix(in srgb, var(--color-primary-soft) 72%, transparent), transparent 46%),
    radial-gradient(ellipse at 78% 72%, color-mix(in srgb, var(--color-signal) 16%, transparent), transparent 42%),
    linear-gradient(168deg, #d8e8f4 0%, #c5dbec 42%, #b7d2e8 100%);
}

.map-stage {
  position: absolute;
  inset: 0;
  z-index: 1;
  animation: map-stage-enter 560ms var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1)) both;
}

.skin-city {
  background: transparent;
}

.skin-island :deep(.bridge-layer) {
  filter: drop-shadow(0 3px 8px rgba(7, 47, 73, 0.18));
}

.skin-city :deep(.bridge-layer) {
  filter: drop-shadow(0 2px 5px rgba(22, 119, 255, 0.12));
}

.world {
  position: absolute;
  inset: -2%;
  transform-origin: center;
  transition: transform 420ms var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1));
  will-change: transform;
}

@keyframes map-stage-enter {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .map-stage {
    animation: none;
  }

  .world {
    animation: none;
    transition: none;
  }
}
</style>
