<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ChapterSceneDefinition, MilestoneKind, SceneMilestone } from './types'

const props = defineProps<{
  scene: ChapterSceneDefinition
  hoveredId?: string | null
  selectedId?: string | null
}>()

const emit = defineEmits<{
  (e: 'node-hover', id: string | null, node: SceneMilestone | null): void
  (e: 'node-click', id: string, node: SceneMilestone): void
}>()

const localHover = ref<string | null>(null)

const activeHoverId = computed(() => props.hoveredId ?? localHover.value)

const mainMilestones = computed(() =>
  props.scene.milestones.filter(m => m.kind !== 'reinforce'),
)

const reinforceMilestones = computed(() =>
  props.scene.milestones.filter(m => m.kind === 'reinforce'),
)

const progress = computed(() => {
  const main = mainMilestones.value
  const done = main.filter(m => m.status === 'completed').length
  return {
    done,
    total: main.length,
    percent: main.length ? Math.round((done / main.length) * 100) : 0,
  }
})

const kindLabel: Record<MilestoneKind, string> = {
  concept: '概念',
  skill: '技能',
  practice: '实操',
  reinforce: '补强',
  challenge: '挑战',
  capstone: '综合',
}

function spotStyle(m: SceneMilestone) {
  return {
    left: `${m.x}%`,
    top: `${m.y}%`,
  }
}

function onEnter(id: string) {
  localHover.value = id
  const node = props.scene.milestones.find(m => m.id === id) ?? null
  emit('node-hover', id, node)
}

function onLeave() {
  localHover.value = null
  emit('node-hover', null, null)
}

function onClick(m: SceneMilestone) {
  if (m.status === 'locked') return
  emit('node-click', m.id, m)
}
</script>

<template>
  <div
    class="cscene"
    :class="`cscene--${scene.theme}`"
    role="application"
    :aria-label="`${scene.chapterName}学习场景地图`"
  >
    <!-- 固定底图：不可拖拽/缩放 -->
    <div class="cscene__canvas" aria-hidden="true">
      <svg class="cscene__bg" viewBox="0 0 960 540" preserveAspectRatio="xMidYMid slice">
        <!-- origin-bay · 启航湾 -->
        <g v-if="scene.theme === 'origin-bay'">
          <defs>
            <linearGradient id="baySky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#dbeafe" />
              <stop offset="55%" stop-color="#ecfdf5" />
              <stop offset="100%" stop-color="#d1fae5" />
            </linearGradient>
            <linearGradient id="baySea" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#7dd3fc" stop-opacity="0.55" />
              <stop offset="100%" stop-color="#34d399" stop-opacity="0.35" />
            </linearGradient>
          </defs>
          <rect width="960" height="540" fill="url(#baySky)" />
          <ellipse cx="820" cy="480" rx="280" ry="90" fill="url(#baySea)" />
          <path d="M0 420 Q240 380 480 400 T960 380 L960 540 L0 540Z" fill="#86efac" opacity="0.45" />
          <path d="M0 440 Q300 400 520 420 T960 400 L960 540 L0 540Z" fill="#4ade80" opacity="0.35" />
          <circle cx="120" cy="100" r="48" fill="#fde68a" opacity="0.85" />
          <path d="M680 180 L720 120 L760 180 L720 200Z" fill="#94a3b8" opacity="0.35" />
          <path d="M780 200 L820 140 L860 200 L820 220Z" fill="#64748b" opacity="0.3" />
        </g>

        <!-- smart-yard · 数智工地 -->
        <g v-else-if="scene.theme === 'smart-yard'">
          <defs>
            <linearGradient id="yardSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#e0e7ff" />
              <stop offset="100%" stop-color="#f1f5f9" />
            </linearGradient>
            <pattern id="yardGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0 L0 0 0 40" fill="none" stroke="#cbd5e1" stroke-width="0.6" opacity="0.35" />
            </pattern>
          </defs>
          <rect width="960" height="540" fill="url(#yardSky)" />
          <rect width="960" height="540" fill="url(#yardGrid)" />
          <rect x="0" y="380" width="960" height="160" fill="#94a3b8" opacity="0.25" />
          <rect x="60" y="300" width="120" height="80" rx="4" fill="#64748b" opacity="0.35" />
          <rect x="200" y="260" width="160" height="120" rx="4" fill="#475569" opacity="0.3" />
          <path d="M720 340 L760 180 L800 340Z" fill="#f59e0b" opacity="0.55" />
          <line x1="760" y1="180" x2="760" y2="120" stroke="#64748b" stroke-width="4" />
          <line x1="720" y1="120" x2="800" y2="120" stroke="#64748b" stroke-width="3" />
        </g>

        <!-- fallback -->
        <g v-else>
          <rect width="960" height="540" fill="#f8fafc" />
        </g>

        <!-- 区域标识 -->
        <g class="cscene__zones">
          <g v-for="(zone, i) in scene.zones" :key="zone.id">
            <text
              :x="80 + i * 220"
              y="36"
              class="cscene__zone-text"
            >{{ zone.label }}</text>
          </g>
        </g>

        <!-- 主路径 -->
        <path
          class="cscene__trail cscene__trail--base"
          :d="scene.trailPath"
        />
        <path
          class="cscene__trail cscene__trail--active"
          :d="scene.trailPath"
          :style="{ strokeDashoffset: `${100 - progress.percent}%` }"
        />
        <path
          v-for="(branch, i) in scene.branchPaths"
          :key="'b' + i"
          class="cscene__trail cscene__trail--branch"
          :d="branch"
        />
      </svg>
    </div>

    <!-- 场景信息 -->
    <header class="cscene__head">
      <div class="cscene__head-copy">
        <span class="cscene__tag">建造旅程</span>
        <strong class="cscene__title">{{ scene.chapterName }}</strong>
        <p class="cscene__tagline">{{ scene.tagline }}</p>
      </div>
      <div class="cscene__progress" aria-label="章节进度">
        <span class="cscene__progress-text">{{ progress.done }}/{{ progress.total }}</span>
        <div class="cscene__progress-bar">
          <span class="cscene__progress-fill" :style="{ width: progress.percent + '%' }" />
        </div>
      </div>
    </header>

    <!-- 里程碑点位 -->
    <div class="cscene__spots">
      <button
        v-for="m in scene.milestones"
        :key="m.id"
        type="button"
        class="cscene-spot"
        :class="[
          `cscene-spot--${m.kind}`,
          `cscene-spot--${m.status}`,
          {
            'is-hover': activeHoverId === m.id,
            'is-selected': selectedId === m.id,
            'is-adaptive': m.isAdaptive,
          },
        ]"
        :style="spotStyle(m)"
        :disabled="m.status === 'locked'"
        :aria-label="`${m.title}，${kindLabel[m.kind]}，${m.status}`"
        @mouseenter="onEnter(m.id)"
        @mouseleave="onLeave"
        @focus="onEnter(m.id)"
        @blur="onLeave"
        @click="onClick(m)"
      >
        <span class="cscene-spot__pulse" v-if="m.status === 'current'" aria-hidden="true" />
        <span class="cscene-spot__core">
          <span class="cscene-spot__order">{{ m.order }}</span>
        </span>
        <span class="cscene-spot__card">
          <strong>{{ m.shortTitle }}</strong>
          <em>{{ kindLabel[m.kind] }} · {{ m.duration }}</em>
          <span v-if="m.mastery != null && m.mastery > 0" class="cscene-spot__mastery">{{ m.mastery }}%</span>
        </span>
      </button>
    </div>

    <!-- 图例 -->
    <footer class="cscene__legend" aria-label="图例">
      <span><i class="dot completed" />已完成</span>
      <span><i class="dot current" />学习中</span>
      <span><i class="dot reinforce" />动态补强</span>
      <span><i class="dot locked" />未解锁</span>
    </footer>
  </div>
</template>

<style scoped>
.cscene {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  border-radius: inherit;
  font-family: var(--font-sans);
  font-size: var(--font-14);
  color: #334155;
  user-select: none;
  touch-action: none;
}

.cscene__canvas {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.cscene__bg {
  display: block;
  width: 100%;
  height: 100%;
}

.cscene__zone-text {
  fill: #64748b;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
}

.cscene__trail {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.cscene__trail--base {
  stroke: rgba(148, 163, 184, 0.35);
  stroke-width: 10;
}

.cscene__trail--active {
  stroke: url(#trailGrad);
  stroke-width: 5;
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  filter: drop-shadow(0 0 6px rgba(87, 90, 255, 0.25));
  animation: trail-flow 2.4s linear infinite;
}

.cscene--origin-bay .cscene__trail--active {
  stroke: #10b981;
}

.cscene--smart-yard .cscene__trail--active {
  stroke: #575aff;
}

.cscene__trail--branch {
  stroke: rgba(245, 158, 11, 0.55);
  stroke-width: 3;
  stroke-dasharray: 6 6;
}

.cscene__head {
  position: relative;
  z-index: 3;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px 0;
  pointer-events: none;
}

.cscene__head-copy {
  min-width: 0;
}

.cscene__tag {
  display: inline-block;
  margin-bottom: 4px;
  padding: 2px 10px;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.82);
  color: #575aff;
  font-size: var(--font-min);
  font-weight: 600;
  letter-spacing: 0.04em;
  box-shadow: 0 4px 12px rgba(87, 90, 255, 0.08);
}

.cscene__title {
  display: block;
  font-size: var(--font-16);
  line-height: var(--lh-16);
  font-weight: 600;
  color: #1e293b;
}

.cscene__tagline {
  margin: 2px 0 0;
  font-size: var(--font-min);
  line-height: var(--lh-12);
  color: #64748b;
}

.cscene__progress {
  flex-shrink: 0;
  min-width: 88px;
  padding: 8px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 6px 18px rgba(71, 85, 105, 0.06);
  text-align: right;
}

.cscene__progress-text {
  display: block;
  font-family: var(--font-num, var(--font-sans));
  font-size: var(--font-min);
  font-weight: 600;
  color: #475569;
}

.cscene__progress-bar {
  height: 4px;
  margin-top: 6px;
  border-radius: 100px;
  background: #e2e8f0;
  overflow: hidden;
}

.cscene__progress-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #6366f1, #34d399);
  transition: width 0.45s ease;
}

.cscene__spots {
  position: absolute;
  inset: 0;
  z-index: 2;
}

.cscene-spot {
  position: absolute;
  transform: translate(-50%, -50%);
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  text-align: center;
}

.cscene-spot:disabled {
  cursor: not-allowed;
}

.cscene-spot__pulse {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 56px;
  height: 56px;
  margin: -28px 0 0 -28px;
  border-radius: 50%;
  background: rgba(87, 90, 255, 0.15);
  animation: spot-pulse 2s ease-in-out infinite;
}

.cscene-spot__core {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  margin: 0 auto;
  border: 2px solid rgba(255, 255, 255, 0.95);
  border-radius: 50%;
  background: linear-gradient(145deg, #fff, #f1f5f9);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.12);
  transition: transform 0.22s ease, box-shadow 0.22s ease;
}

.cscene-spot--concept .cscene-spot__core { border-radius: 50%; }
.cscene-spot--skill .cscene-spot__core { border-radius: 10px; transform: rotate(0deg); }
.cscene-spot--practice .cscene-spot__core { clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%); border-radius: 0; }
.cscene-spot--reinforce .cscene-spot__core {
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
  border-radius: 0;
  background: linear-gradient(145deg, #fef3c7, #fde68a);
}
.cscene-spot--capstone .cscene-spot__core,
.cscene-spot--challenge .cscene-spot__core {
  border-radius: 8px;
  width: 40px;
  height: 40px;
}

.cscene-spot--completed .cscene-spot__core {
  background: linear-gradient(145deg, #ecfdf5, #6ee7b7);
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.25), 0 6px 16px rgba(16, 185, 129, 0.2);
}

.cscene-spot--current .cscene-spot__core {
  background: linear-gradient(145deg, #eef2ff, #a5b4fc);
  box-shadow: 0 0 0 3px rgba(87, 90, 255, 0.28), 0 8px 20px rgba(87, 90, 255, 0.22);
}

.cscene-spot--reinforce .cscene-spot__core,
.cscene-spot--reinforce.is-adaptive .cscene-spot__core {
  background: linear-gradient(145deg, #fffbeb, #fcd34d);
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.35), 0 6px 16px rgba(245, 158, 11, 0.18);
}

.cscene-spot--locked .cscene-spot__core {
  background: linear-gradient(145deg, #f8fafc, #e2e8f0);
  opacity: 0.72;
  filter: grayscale(0.4);
}

.cscene-spot__order {
  font-family: var(--font-num, var(--font-sans));
  font-size: var(--font-min);
  font-weight: 700;
  color: #334155;
}

.cscene-spot--completed .cscene-spot__order { color: #047857; }
.cscene-spot--current .cscene-spot__order { color: #4338ca; }

.cscene-spot__card {
  position: absolute;
  left: 50%;
  top: calc(100% + 8px);
  transform: translateX(-50%);
  display: grid;
  gap: 1px;
  min-width: 108px;
  padding: 8px 10px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 8px 22px rgba(71, 85, 105, 0.08);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s;
  pointer-events: none;
}

.cscene-spot__card strong {
  font-size: var(--font-min);
  line-height: var(--lh-12);
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
}

.cscene-spot__card em {
  font-size: var(--font-min);
  line-height: var(--lh-12);
  font-style: normal;
  color: #94a3b8;
}

.cscene-spot__mastery {
  font-family: var(--font-num, var(--font-sans));
  font-size: var(--font-min);
  font-weight: 700;
  color: #575aff;
}

.cscene-spot.is-hover .cscene-spot__core,
.cscene-spot:focus-visible .cscene-spot__core {
  transform: scale(1.08);
}

.cscene-spot.is-hover .cscene-spot__card,
.cscene-spot:focus-visible .cscene-spot__card,
.cscene-spot.is-selected .cscene-spot__card,
.cscene-spot--current .cscene-spot__card {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(2px);
}

.cscene__legend {
  position: absolute;
  z-index: 3;
  left: 14px;
  bottom: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.88);
  font-size: var(--font-min);
  color: #64748b;
  box-shadow: 0 6px 18px rgba(71, 85, 105, 0.06);
  pointer-events: none;
}

.cscene__legend span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.cscene__legend .dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.cscene__legend .dot.completed { background: #10b981; }
.cscene__legend .dot.current { background: #575aff; }
.cscene__legend .dot.reinforce { background: #f59e0b; }
.cscene__legend .dot.locked { background: #cbd5e1; }

@keyframes trail-flow {
  to { stroke-dashoffset: 0; }
}

@keyframes spot-pulse {
  0%, 100% { transform: scale(0.92); opacity: 0.55; }
  50% { transform: scale(1.08); opacity: 0.2; }
}

@media (prefers-reduced-motion: reduce) {
  .cscene__trail--active,
  .cscene-spot__pulse {
    animation: none;
  }
}
</style>
