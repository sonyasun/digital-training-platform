<template>
  <div ref="modalRef" class="v2-shell" :class="{ 'is-presentation-only': presentationOnly }">
    <div class="v2-stage">
      <div class="v2-stage__bg" :style="mapMountainsStyle"></div>
      <div class="v2-stage__wash"></div>

      <div class="v2-progress" aria-hidden="true">
        <div class="v2-progress__fill" :style="{ width: progress + '%' }"></div>
      </div>

      <div class="v2-map-frame">
      <svg class="v2-map" viewBox="0 0 820 420" role="img" aria-label="新版个性化学习路径演示">
        <defs>
          <linearGradient id="v2PathGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#6366f1" />
            <stop offset="45%" stop-color="#575aff" />
            <stop offset="72%" stop-color="#19b6c8" />
            <stop offset="100%" stop-color="#34d399" />
          </linearGradient>
          <radialGradient id="v2Green" cx="32%" cy="26%" r="78%"><stop offset="0" stop-color="#ecfdf5"/><stop offset=".45" stop-color="#6ee7b7"/><stop offset="1" stop-color="#059669"/></radialGradient>
          <radialGradient id="v2Red" cx="32%" cy="26%" r="78%"><stop offset="0" stop-color="#fef2f2"/><stop offset=".45" stop-color="#fca5a5"/><stop offset="1" stop-color="#e11d48"/></radialGradient>
          <radialGradient id="v2Blue" cx="32%" cy="26%" r="78%"><stop offset="0" stop-color="#eff6ff"/><stop offset=".45" stop-color="#93c5fd"/><stop offset="1" stop-color="#2563eb"/></radialGradient>
          <radialGradient id="v2Amber" cx="32%" cy="26%" r="78%"><stop offset="0" stop-color="#fffbeb"/><stop offset=".45" stop-color="#fcd34d"/><stop offset="1" stop-color="#d97706"/></radialGradient>
          <radialGradient id="v2Gray" cx="32%" cy="26%" r="78%"><stop offset="0" stop-color="#f8fafc"/><stop offset=".5" stop-color="#e2e8f0"/><stop offset="1" stop-color="#94a3b8"/></radialGradient>
          <filter id="v2Glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="v2Shadow"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#64748b" flood-opacity=".18"/></filter>
          <filter id="v2LabelShadow"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0f172a" flood-opacity=".08"/></filter>
        </defs>

        <!-- 统一地图：路径与节点一次加载，后续场景逐层叠加 -->
        <g class="v2-map-world">
          <g class="v2-graph-edges"><path d="M126 110L270 72L402 126L548 82L692 134M126 110L220 276L402 126M270 72L220 276M548 82L466 286"/></g>
          <path class="v2-path v2-main-path" :d="MAIN_PATH" />
          <path class="v2-path v2-insert-path-base v2-layer-reinforce-done" :d="INSERT_PATH" />
          <path class="v2-path v2-insert-path v2-layer-reinforce-done" :d="INSERT_PATH" />
          <path class="v2-path v2-branch-base v2-layer-expand" :d="BRANCH_PATH" />
          <path class="v2-path v2-branch-line v2-layer-expand" :d="BRANCH_PATH" />

          <g
            v-for="(node, i) in pathNodes"
            :key="node.id"
            :class="['v2-node', `v2-node--${node.tone}`, `v2-path-node`, `v2-path-node-${node.id}`, `v2-scatter-${node.id}`]"
            :transform="`translate(${node.px} ${node.py})`"
          >
            <template v-if="node.id === 'n3'">
              <circle class="v2-focus-pulse v2-layer-reinforce-focus" r="38" />
              <circle class="v2-mastery-track v2-layer-reinforce-focus" r="32" />
              <circle class="v2-mastery-ring v2-layer-reinforce-focus" r="32" />
              <circle class="v2-focus-green v2-layer-reinforce-focus v2-node__core" r="22" fill="url(#v2Green)" filter="url(#v2Shadow)" />
              <circle class="v2-focus-red v2-layer-reinforce-focus v2-node__core" r="22" fill="url(#v2Red)" filter="url(#v2Shadow)" />
            </template>
            <template v-if="node.id === 'n4'">
              <circle class="v2-expand-glow v2-layer-expand" r="36" />
              <circle class="v2-expand-ring v2-node__ring v2-node__ring--green v2-layer-expand" :r="nodeRing('n4')" />
              <circle class="v2-expand-core v2-layer-expand v2-node__core" :r="nodeCore('n4')" fill="url(#v2Green)" filter="url(#v2Shadow)" />
            </template>
            <circle class="v2-node__ring v2-node-base" :r="node.id === 'n3' ? 26 : nodeRing(node.id)" />
            <circle class="v2-node__core v2-node-base" :r="nodeCore(node.id)" :fill="node.fill" filter="url(#v2Shadow)" />
            <path v-if="node.id === 'n4'" class="v2-check v2-layer-expand" d="M-6 0l4 4L8-6" />
            <text class="v2-node__index" :class="{ 'v2-node-base': node.id === 'n4' }" y="1">{{ i + 1 }}</text>
            <g class="v2-node__label">
              <rect
                class="v2-node__label-bg"
                :class="{
                  'v2-node__label-bg--focus': node.id === 'n3' && showReinforceMetric,
                  'v2-node__label-bg--green': node.id === 'n4' && showExpandMetric,
                }"
                v-bind="labelBox(node.label)"
                rx="11"
                filter="url(#v2LabelShadow)"
              />
              <text
                class="v2-node__label-text"
                x="0"
                :font-size="LABEL_FONT_SIZE"
                :class="{
                  'v2-node__label-text--focus': node.id === 'n3' && showReinforceMetric,
                  'v2-node__label-text--green': node.id === 'n4' && showExpandMetric,
                }"
                :y="labelBox(node.label).ty"
              >{{ node.label }}</text>
            </g>
          </g>

          <g class="v2-reinforce-insert v2-node v2-node--reinforce v2-layer-reinforce-done" :transform="`translate(${REINFORCE_INSERT.x} ${REINFORCE_INSERT.y})`">
            <circle class="v2-node__ring v2-node__ring--green" r="26" />
            <polygon class="v2-star-amber" points="0,-20 5,-7 20,-7 8,2 12,17 0,9 -12,17 -8,2 -20,-7 -5,-7" fill="url(#v2Amber)" filter="url(#v2Shadow)" />
            <polygon class="v2-star-green" points="0,-20 5,-7 20,-7 8,2 12,17 0,9 -12,17 -8,2 -20,-7 -5,-7" fill="url(#v2Green)" filter="url(#v2Shadow)" />
            <path class="v2-check" d="M-6 0l4 4L7-5" />
            <g class="v2-node__label v2-node__label--above">
              <rect class="v2-node__label-bg v2-node__label-bg--amber" v-bind="labelBoxAbove('LOD 规范补强')" rx="11" filter="url(#v2LabelShadow)" />
              <text class="v2-node__label-text v2-node__label-text--amber" x="0" :font-size="LABEL_FONT_SIZE" :y="labelBoxAbove('LOD 规范补强').ty">LOD 规范补强</text>
            </g>
          </g>

          <g class="v2-extension-node v2-node v2-node--extension v2-layer-expand" :transform="`translate(${EXTENSION_NODE.x} ${EXTENSION_NODE.y})`">
            <circle class="v2-node__ring v2-node__ring--blue" r="32" />
            <polygon class="v2-ext-blue" points="0,-22 20,-11 20,11 0,22 -20,11 -20,-11" fill="url(#v2Blue)" filter="url(#v2Shadow)" />
            <polygon class="v2-ext-green" points="0,-22 20,-11 20,11 0,22 -20,11 -20,-11" fill="url(#v2Green)" filter="url(#v2Shadow)" />
            <path class="v2-check" d="M-7 0l5 5L9-7" />
            <g class="v2-node__label v2-node__label--above">
              <rect class="v2-node__label-bg v2-node__label-bg--blue" v-bind="labelBoxAboveDual('拓展学习', 'LOD 实战挑战')" rx="11" filter="url(#v2LabelShadow)" />
              <text class="v2-node__label-text v2-node__label-text--blue" x="0" :font-size="LABEL_FONT_SIZE" :y="labelBoxAboveDual('拓展学习', 'LOD 实战挑战').ty">拓展学习</text>
              <text class="v2-node__label-sub" x="0" :font-size="LABEL_SUB_FONT_SIZE" :y="labelBoxAboveDual('拓展学习', 'LOD 实战挑战').sy">LOD 实战挑战</text>
            </g>
          </g>
        </g>
      </svg>

      <div
        v-show="showReinforceMetric"
        class="v2-metric v2-metric--warn v2-metric--near-node"
        :class="{ 'is-visible': showReinforceMetric }"
        :style="metricNearStyle('n3')"
      >
        <div class="v2-metric__accent" aria-hidden="true"></div>
        <div class="v2-metric__body">
          <span class="v2-metric__label">本次掌握率</span>
          <strong class="v2-metric__value">{{ mastery }}<small>%</small></strong>
          <span class="v2-metric__hint">低于阈值，触发补强</span>
        </div>
      </div>
      <div
        v-show="showExpandMetric"
        class="v2-metric v2-metric--ok v2-metric--near-node"
        :class="{ 'is-visible': showExpandMetric }"
        :style="metricNearStyle('n4')"
      >
        <div class="v2-metric__accent" aria-hidden="true"></div>
        <div class="v2-metric__body">
          <span class="v2-metric__label">评价掌握度</span>
          <strong class="v2-metric__value">{{ mastery }}<small>%</small></strong>
          <span class="v2-metric__hint">已解锁拓展分支</span>
        </div>
      </div>
      </div>

      <div class="v2-assistant" :class="{ 'is-visible': showAssistant }">
        <img class="v2-assistant__avatar" :src="aiMascotSrc" width="64" height="64" alt="" aria-hidden="true" />
        <div class="v2-assistant__body">
          <span class="v2-assistant__badge">AI 学习助手</span>
          <p class="v2-assistant__text">{{ assistantText }}<b v-if="assistantText" class="v2-assistant__caret"></b><span v-else class="v2-assistant__dots"><i></i><i></i><i></i></span></p>
        </div>
      </div>
    </div>

    <nav class="v2-stepper" aria-label="路径能力演示">
      <div class="v2-stepper__rail" aria-hidden="true">
        <span class="v2-stepper__rail-fill" :style="{ width: `${progress}%` }"></span>
      </div>
      <div class="v2-stepper__list">
        <button
          v-for="demo in demos"
          :key="demo.id"
          type="button"
          class="v2-step"
          :class="{ active: activeDemo === demo.id, complete: completedDemos.includes(demo.id), 'is-auto': isAutoPlaying && activeDemo === demo.id }"
          :aria-selected="activeDemo === demo.id"
          :disabled="isAutoPlaying"
          @click="selectDemo(demo.id)"
        >
          <span class="v2-step__num">
            <span v-if="completedDemos.includes(demo.id) && activeDemo !== demo.id" class="v2-step__check" aria-hidden="true">✓</span>
            <span v-else>{{ demo.step }}</span>
          </span>
          <span class="v2-step__content">
            <strong>{{ demo.title }}</strong>
            <small>{{ demo.summary }}</small>
          </span>
        </button>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { gsap } from 'gsap'
import { resolveAssetUrl } from './course-overview-map/constants'

type DemoId = 'planning' | 'reinforce' | 'expand' | 'assistant'
type PathNodeId = 'n1' | 'n2' | 'n3' | 'n4' | 'n5' | 'n6'

interface PathNode {
  id: PathNodeId
  label: string
  px: number
  py: number
  sx: number
  sy: number
  fill: string
  tone: string
}

const MAIN_PATH = 'M72 322C128 298 162 282 198 268C238 252 272 232 302 218C368 198 448 168 528 150C568 132 605 116 638 104C688 86 728 72 766 62'
const INSERT_PATH = 'M328 204 C348 186 362 174 370 177 C380 170 386 166 392 164 C400 160 410 157 418 159 C442 152 472 150 504 152'
const REINFORCE_INSERT = { x: 392, y: 164 }
const INSERT_PATH_LEN = 198
const EXTENSION_NODE = { x: 528, y: 72 }
const BRANCH_PATH = 'M528 104 L528 126'
const BRANCH_PATH_LEN = 24
const MAP_VIEW = { w: 820, h: 420 }
/** SVG 用户单位字号 */
const LABEL_FONT_SIZE = 14
const LABEL_SUB_FONT_SIZE = 15
const LABEL_CHAR_W = 14
const METRIC_NEAR: Partial<Record<PathNodeId, { dx: number; dy: number }>> = {
  n3: { dx: -156, dy: -78 },
  n4: { dx: 38, dy: -40 },
}

const props = withDefaults(defineProps<{ open?: boolean; presentationOnly?: boolean }>(), { open: true, presentationOnly: true })

const mapMountainsStyle = { backgroundImage: `url(${resolveAssetUrl('assets/student/map-background-texture.png')})` }
const aiMascotSrc = resolveAssetUrl('assets/student/ai-assistant-avatar.png')
const modalRef = ref<HTMLElement | null>(null)
const activeDemo = ref<DemoId>('planning')
const mastery = ref(0)
const assistantText = ref('')
const progress = ref(25)
const showReinforceMetric = ref(false)
const showExpandMetric = ref(false)
const showAssistant = ref(false)
const completedDemos = ref<DemoId[]>([])
const isAutoPlaying = ref(false)
const autoPlayDone = ref(false)

let timeline: gsap.core.Timeline | null = null
let runToken = 0
let pauseTimer: ReturnType<typeof setTimeout> | null = null

const demoOrder: DemoId[] = ['planning', 'reinforce', 'expand', 'assistant']
const demoIndex: Record<DemoId, number> = { planning: 0, reinforce: 1, expand: 2, assistant: 3 }

const demos = [
  { id: 'planning' as DemoId, step: 1, title: '路径规划', summary: '图谱收敛为学习路径' },
  { id: 'reinforce' as DemoId, step: 2, title: '动态补强', summary: '薄弱点插入补强' },
  { id: 'expand' as DemoId, step: 3, title: '动态拓展', summary: '解锁进阶分支' },
  { id: 'assistant' as DemoId, step: 4, title: 'AI 辅助', summary: '实时学习建议' },
]

const pathNodes: PathNode[] = [
  { id: 'n1', label: '基础概念', px: 72, py: 322, sx: 126, sy: 110, fill: 'url(#v2Green)', tone: 'green' },
  { id: 'n2', label: '模型规范', px: 198, py: 268, sx: 270, sy: 72, fill: 'url(#v2Blue)', tone: 'blue' },
  { id: 'n3', label: '精度建模', px: 302, py: 218, sx: 402, sy: 126, fill: 'url(#v2Amber)', tone: 'amber' },
  { id: 'n4', label: '参数化族', px: 528, py: 150, sx: 548, sy: 82, fill: 'url(#v2Gray)', tone: 'gray' },
  { id: 'n5', label: '模型协同', px: 638, py: 104, sx: 692, sy: 134, fill: 'url(#v2Gray)', tone: 'gray' },
  { id: 'n6', label: '数字交付', px: 766, py: 62, sx: 220, sy: 276, fill: 'url(#v2Gray)', tone: 'gray' },
]

const progressMap: Record<DemoId, number> = { planning: 25, reinforce: 50, expand: 75, assistant: 100 }
const REINFORCE_MASTERY = 52
const EXPAND_MASTERY = 92
const ASSISTANT_FULL = '我已分析你的学习情况，推荐一个拓展学习节点，领先班级 80% 的同学哦！'

type SaistudyMapStateDetail = {
  phase: DemoId
  progress: number
  mastery: number
  pathLabels: string[]
  reinforceNode: string
  reinforceInsert: string
  expandNode: string
  extensionLabel: string
  assistantText: string
  showReinforce: boolean
  showExpand: boolean
  showAssistant: boolean
  completedPhases: DemoId[]
  isAutoPlaying: boolean
}

function emitMapState() {
  if (typeof document === 'undefined') return
  const detail: SaistudyMapStateDetail = {
    phase: activeDemo.value,
    progress: progress.value,
    mastery: mastery.value,
    pathLabels: pathNodes.map(n => n.label),
    reinforceNode: pathNodes.find(n => n.id === 'n3')!.label,
    reinforceInsert: 'LOD 规范补强',
    expandNode: pathNodes.find(n => n.id === 'n4')!.label,
    extensionLabel: 'LOD 实战挑战',
    assistantText: assistantText.value,
    showReinforce: showReinforceMetric.value,
    showExpand: showExpandMetric.value,
    showAssistant: showAssistant.value,
    completedPhases: [...completedDemos.value],
    isAutoPlaying: isAutoPlaying.value,
  }
  document.dispatchEvent(new CustomEvent('saistudy-map-state', { detail }))
  ;(window as Window & { __saistudyMapState?: SaistudyMapStateDetail }).__saistudyMapState = detail
}

function labelBoxAbove(label: string) {
  const w = Math.max(84, label.length * LABEL_CHAR_W + 28)
  const h = 28
  const y = -h - 34
  return { width: w, height: h, x: -w / 2, y, ty: y + h / 2 }
}

function labelBoxAboveDual(label: string, sub: string) {
  const w = 100
  const h = 44
  const y = -h - 34
  const gap = 4
  const block = LABEL_FONT_SIZE + gap + LABEL_SUB_FONT_SIZE
  const top = y + (h - block) / 2
  return {
    width: w,
    height: h,
    x: -w / 2,
    y,
    ty: top + LABEL_FONT_SIZE / 2,
    sy: top + LABEL_FONT_SIZE + gap + LABEL_SUB_FONT_SIZE / 2,
  }
}

function labelBox(label: string, sub?: string) {
  const w = sub ? 100 : Math.max(84, label.length * LABEL_CHAR_W + 28)
  const h = sub ? 44 : 28
  const y = sub ? 26 : 28
  if (sub) {
    const gap = 4
    const block = LABEL_FONT_SIZE + gap + LABEL_SUB_FONT_SIZE
    const top = y + (h - block) / 2
    return {
      width: w,
      height: h,
      x: -w / 2,
      y,
      ty: top + LABEL_FONT_SIZE / 2,
      sy: top + LABEL_FONT_SIZE + gap + LABEL_SUB_FONT_SIZE / 2,
    }
  }
  return { width: w, height: h, x: -w / 2, y, ty: y + h / 2, sy: 0 }
}

function nodeRing(id: PathNodeId) {
  return id === 'n5' || id === 'n6' ? 22 : 24
}

function nodeCore(id: PathNodeId) {
  return id === 'n5' || id === 'n6' ? 16 : 18
}

function metricNearStyle(nodeId: PathNodeId) {
  const node = pathNodes.find(n => n.id === nodeId)!
  const offset = METRIC_NEAR[nodeId] ?? { dx: 0, dy: 0 }
  return {
    left: `${((node.px + offset.dx) / MAP_VIEW.w) * 100}%`,
    top: `${((node.py + offset.dy) / MAP_VIEW.h) * 100}%`,
  }
}

function q() { return gsap.utils.selector(modalRef.value!) }

function resetOverlays() {
  showReinforceMetric.value = false
  showExpandMetric.value = false
  showAssistant.value = false
  assistantText.value = ''
  mastery.value = 0
}

function resetFull() {
  if (!modalRef.value) return
  const s = q()
  resetOverlays()

  gsap.set(s('.v2-layer-reinforce-focus, .v2-layer-reinforce-done, .v2-layer-expand'), { autoAlpha: 0 })
  gsap.set(s('.v2-main-path'), { autoAlpha: 0, strokeDashoffset: 900 })
  gsap.set(s('.v2-path-node .v2-node__label'), { autoAlpha: 0 })
  gsap.set(s('.v2-reinforce-insert .v2-node__label, .v2-extension-node .v2-node__label'), { autoAlpha: 0 })
  gsap.set(s('.v2-path-node-n4 .v2-check, .v2-reinforce-insert .v2-check, .v2-extension-node .v2-check'), { autoAlpha: 0 })
  gsap.set(s('.v2-star-green, .v2-ext-green'), { autoAlpha: 0 })
  gsap.set(s('.v2-graph-edges'), { autoAlpha: 0.35 })
  gsap.set(s('.v2-focus-green, .v2-star-amber, .v2-ext-blue'), { autoAlpha: 1 })
  gsap.set(s('.v2-focus-red'), { autoAlpha: 0 })
  gsap.set(s('.v2-mastery-ring'), { strokeDashoffset: 200, autoAlpha: 0 })
  gsap.set(s('.v2-insert-path, .v2-insert-path-base'), { strokeDashoffset: INSERT_PATH_LEN })
  gsap.set(s('.v2-branch-base, .v2-branch-line'), { strokeDashoffset: BRANCH_PATH_LEN })
  gsap.set(s('.v2-path-node-n3 .v2-node-base, .v2-path-node-n4 .v2-node-base'), { autoAlpha: 1 })

  pathNodes.forEach(n => gsap.set(s(`.v2-scatter-${n.id}`), { attr: { transform: `translate(${n.sx} ${n.sy})` }, autoAlpha: 1 }))
}

function setPlanningInstant() {
  const s = q()
  gsap.set(s('.v2-graph-edges'), { autoAlpha: 0 })
  gsap.set(s('.v2-main-path'), { autoAlpha: 1, strokeDashoffset: 0 })
  pathNodes.forEach(n => gsap.set(s(`.v2-scatter-${n.id}`), { attr: { transform: `translate(${n.px} ${n.py})` } }))
  gsap.set(s('.v2-path-node .v2-node__label'), { autoAlpha: 1 })
}

function setReinforceInstant() {
  const s = q()
  gsap.set(s('.v2-layer-reinforce-focus, .v2-layer-reinforce-done'), { autoAlpha: 1 })
  gsap.set(s('.v2-path-node-n3 .v2-node-base'), { autoAlpha: 0 })
  gsap.set(s('.v2-focus-green'), { autoAlpha: 0 })
  gsap.set(s('.v2-focus-red, .v2-path-node-n3 .v2-focus-pulse'), { autoAlpha: 1 })
  gsap.set(s('.v2-mastery-ring'), { autoAlpha: 1, strokeDashoffset: 95 })
  gsap.set(s('.v2-insert-path, .v2-insert-path-base'), { autoAlpha: 1, strokeDashoffset: 0 })
  gsap.set(s('.v2-star-amber'), { autoAlpha: 0 })
  gsap.set(s('.v2-star-green, .v2-reinforce-insert .v2-check'), { autoAlpha: 1 })
  gsap.set(s('.v2-path-node .v2-node__label, .v2-reinforce-insert .v2-node__label'), { autoAlpha: 1 })
  showReinforceMetric.value = true
  mastery.value = REINFORCE_MASTERY
}

function setExpandInstant() {
  const s = q()
  gsap.set(s('.v2-layer-expand, .v2-layer-reinforce-done'), { autoAlpha: 1 })
  gsap.set(s('.v2-layer-reinforce-focus'), { autoAlpha: 0 })
  gsap.set(s('.v2-path-node-n3 .v2-node-base'), { autoAlpha: 1 })
  gsap.set(s('.v2-path-node-n4 .v2-node-base'), { autoAlpha: 0 })
  gsap.set(s('.v2-branch-base, .v2-branch-line'), { autoAlpha: 1, strokeDashoffset: 0 })
  gsap.set(s('.v2-ext-blue'), { autoAlpha: 0 })
  gsap.set(s('.v2-path-node-n4 .v2-expand-glow, .v2-path-node-n4 .v2-expand-ring, .v2-path-node-n4 .v2-expand-core'), { autoAlpha: 1 })
  gsap.set(s('.v2-ext-green, .v2-path-node-n4 .v2-check, .v2-extension-node .v2-check'), { autoAlpha: 1 })
  gsap.set(s('.v2-path-node .v2-node__label, .v2-reinforce-insert .v2-node__label, .v2-extension-node .v2-node__label'), { autoAlpha: 1 })
  showReinforceMetric.value = false
  showExpandMetric.value = true
  mastery.value = EXPAND_MASTERY
}

function setAssistantInstant() {
  setExpandInstant()
  showAssistant.value = true
  assistantText.value = ASSISTANT_FULL
}

function setInstantThrough(id: DemoId) {
  setPlanningInstant()
  if (demoIndex[id] >= 1) setReinforceInstant()
  if (demoIndex[id] >= 2) setExpandInstant()
  if (demoIndex[id] >= 3) setAssistantInstant()
}

function counter(value: number, duration: number) {
  return gsap.to({ v: 0 }, { v: value, duration, ease: 'power1.out', onUpdate() { mastery.value = Math.round(this.targets()[0].v) } })
}

function playPlanning(token: number) {
  return new Promise<void>(resolve => {
    if (!modalRef.value || token !== runToken) { resolve(); return }
    const s = q()
    const d = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.06 : 1
    timeline = gsap.timeline({ onComplete: resolve })
    timeline.to(s('.v2-graph-edges'), { autoAlpha: 0.5, duration: 0.4 * d })
    pathNodes.forEach((n, i) => {
      timeline!.to(s(`.v2-scatter-${n.id}`), {
        attr: { transform: `translate(${n.px} ${n.py})` },
        duration: 0.55 * d,
        ease: 'power2.inOut',
      }, i === 0 ? '>' : '<0.12')
      timeline!.to(s(`.v2-scatter-${n.id} .v2-node__ring`), {
        attr: { r: 30 },
        duration: 0.2 * d,
        yoyo: true,
        repeat: 1,
      }, '<')
    })
    timeline
      .to(s('.v2-graph-edges'), { autoAlpha: 0, duration: 0.25 * d }, '-=0.2')
      .to(s('.v2-main-path'), { autoAlpha: 1, strokeDashoffset: 0, duration: 1 * d, ease: 'power2.inOut' }, '<0.1')
      .to(s('.v2-path-node .v2-node__label'), { autoAlpha: 1, duration: 0.35 * d, stagger: 0.06 }, '-=0.5')
  })
}

function playReinforceLayer(token: number) {
  return new Promise<void>(resolve => {
    if (!modalRef.value || token !== runToken) { resolve(); return }
    const s = q()
    const d = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.06 : 1
    timeline = gsap.timeline({ onComplete: resolve })
    timeline
      .to(s('.v2-path-node-n3 .v2-node-base'), { autoAlpha: 0, duration: 0.25 * d })
      .to(s('.v2-layer-reinforce-focus, .v2-layer-reinforce-done'), { autoAlpha: 1, duration: 0.2 * d }, '<')
      .to(s('.v2-focus-green'), { autoAlpha: 0, duration: 0.3 * d })
      .to(s('.v2-focus-red, .v2-path-node-n3 .v2-focus-pulse'), { autoAlpha: 1, duration: 0.35 * d }, '<0.05')
      .add(() => { showReinforceMetric.value = true })
      .add(counter(REINFORCE_MASTERY, 0.65 * d))
      .to(s('.v2-mastery-ring'), { autoAlpha: 1, strokeDashoffset: 95, duration: 0.65 * d }, '<')
      .to(s('.v2-insert-path, .v2-insert-path-base'), { autoAlpha: 1, strokeDashoffset: 0, duration: 0.45 * d }, '-=0.3')
      .to(s('.v2-reinforce-insert'), { autoAlpha: 1, duration: 0.45 * d }, '<0.1')
      .to(s('.v2-reinforce-insert .v2-node__label'), { autoAlpha: 1, duration: 0.3 * d }, '<0.05')
      .to(s('.v2-star-amber'), { autoAlpha: 0, duration: 0.2 * d }, '>-0.1')
      .to(s('.v2-star-green, .v2-reinforce-insert .v2-check'), { autoAlpha: 1, duration: 0.3 * d }, '<0.05')
  })
}

function playExpandLayer(token: number) {
  return new Promise<void>(resolve => {
    if (!modalRef.value || token !== runToken) { resolve(); return }
    const s = q()
    const d = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.06 : 1
    timeline = gsap.timeline({ onComplete: resolve })
    timeline
      .add(() => { showReinforceMetric.value = false })
      .to(s('.v2-layer-reinforce-focus'), { autoAlpha: 0, duration: 0.3 * d })
      .to(s('.v2-path-node-n3 .v2-node-base'), { autoAlpha: 1, duration: 0.25 * d }, '<')
      .to(s('.v2-path-node-n4 .v2-node-base'), { autoAlpha: 0, duration: 0.2 * d }, '<0.05')
      .to(s('.v2-layer-expand'), { autoAlpha: 1, duration: 0.2 * d }, '<')
      .add(() => { showExpandMetric.value = true })
      .add(counter(EXPAND_MASTERY, 0.7 * d))
      .to(s('.v2-path-node-n4 .v2-expand-glow, .v2-path-node-n4 .v2-expand-ring, .v2-path-node-n4 .v2-expand-core'), { autoAlpha: 1, duration: 0.3 * d }, '<')
      .to(s('.v2-branch-base, .v2-branch-line'), { autoAlpha: 1, strokeDashoffset: 0, duration: 0.75 * d, ease: 'power2.inOut' }, '<0.1')
      .to(s('.v2-extension-node'), { autoAlpha: 1, duration: 0.5 * d }, '<0.35')
      .to(s('.v2-extension-node .v2-node__label'), { autoAlpha: 1, duration: 0.3 * d }, '<0.05')
      .to(s('.v2-ext-blue'), { autoAlpha: 0, duration: 0.22 * d }, '>0.4')
      .to(s('.v2-ext-green, .v2-path-node-n4 .v2-check, .v2-extension-node .v2-check'), { autoAlpha: 1, duration: 0.3 * d }, '<0.05')
  })
}

function playAssistantLayer(token: number) {
  return new Promise<void>(resolve => {
    if (!modalRef.value || token !== runToken) { resolve(); return }
    const d = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.06 : 1
    const typing = { v: 0 }
    timeline = gsap.timeline({ onComplete: resolve })
    timeline
      .add(() => { showAssistant.value = true })
      .to(typing, { v: ASSISTANT_FULL.length, duration: 2.4 * d, ease: 'none', onUpdate() { assistantText.value = ASSISTANT_FULL.slice(0, Math.round(typing.v)) } })
  })
}

function stopPlayback() {
  runToken++
  timeline?.kill()
  if (pauseTimer) {
    clearTimeout(pauseTimer)
    pauseTimer = null
  }
}

function pause(ms: number, token: number) {
  return new Promise<void>(resolve => {
    if (token !== runToken) { resolve(); return }
    pauseTimer = window.setTimeout(() => {
      pauseTimer = null
      resolve()
    }, ms)
  })
}

async function playAllDemos() {
  stopPlayback()
  const token = runToken
  isAutoPlaying.value = true
  autoPlayDone.value = false
  completedDemos.value = []
  const gap = matchMedia('(prefers-reduced-motion: reduce)').matches ? 60 : 300

  activeDemo.value = 'planning'
  progress.value = progressMap.planning
  await nextTick()
  resetFull()
  await playPlanning(token)
  if (token !== runToken) return
  completedDemos.value = ['planning']

  activeDemo.value = 'reinforce'
  progress.value = progressMap.reinforce
  await pause(gap, token)
  if (token !== runToken) return
  await playReinforceLayer(token)
  if (token !== runToken) return
  completedDemos.value = ['planning', 'reinforce']

  activeDemo.value = 'expand'
  progress.value = progressMap.expand
  await pause(gap, token)
  if (token !== runToken) return
  await playExpandLayer(token)
  if (token !== runToken) return
  completedDemos.value = ['planning', 'reinforce', 'expand']

  activeDemo.value = 'assistant'
  progress.value = progressMap.assistant
  await pause(gap, token)
  if (token !== runToken) return
  await playAssistantLayer(token)
  if (token !== runToken) return
  completedDemos.value = [...demoOrder]

  if (token === runToken) {
    isAutoPlaying.value = false
    autoPlayDone.value = true
  }
}

async function selectDemo(id: DemoId) {
  stopPlayback()
  const token = runToken
  isAutoPlaying.value = false
  autoPlayDone.value = true
  activeDemo.value = id
  progress.value = progressMap[id]
  await nextTick()
  resetFull()
  setInstantThrough(id)
  completedDemos.value = demoOrder.slice(0, demoIndex[id] + 1)
}

watch(
  [activeDemo, mastery, progress, showReinforceMetric, showExpandMetric, showAssistant, assistantText, completedDemos, isAutoPlaying],
  () => emitMapState(),
  { flush: 'post' },
)

watch(() => props.open, async v => {
  if (!v) {
    stopPlayback()
    isAutoPlaying.value = false
    emitMapState()
    return
  }
  await nextTick()
  emitMapState()
  await playAllDemos()
}, { immediate: true })

onMounted(() => {
  emitMapState()
})

onBeforeUnmount(() => stopPlayback())
</script>

<style scoped>
.v2-shell{display:flex;flex-direction:column;height:100%;font-family:var(--font-sans);font-size:14px;font-variant-numeric:tabular-nums;color:#334155}
.v2-stage{position:relative;flex:1;min-height:0;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(ellipse 90% 70% at 50% 100%,rgba(87,90,255,.06),transparent 55%),linear-gradient(180deg,rgba(255,255,255,.55) 0%,rgba(248,250,255,.35) 100%)}
.v2-stage__bg{position:absolute;inset:0;background-size:cover;background-position:center bottom;opacity:.38;filter:saturate(.85) brightness(1.04)}
.v2-stage__wash{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 78% 88% at 18% 100%,rgba(87,90,255,.09),transparent 52%),radial-gradient(ellipse 72% 62% at 82% 0%,rgba(25,182,200,.06),transparent 46%),radial-gradient(ellipse 100% 92% at 50% 54%,rgba(255,255,255,.38),transparent 74%)}
.v2-progress{position:absolute;z-index:5;top:10px;left:16px;right:16px;height:4px;border-radius:100px;background:rgba(226,232,240,.65);box-shadow:inset 0 1px 2px rgba(15,23,42,.04)}
.v2-progress__fill{height:100%;border-radius:inherit;background:linear-gradient(90deg,#6366f1,#575aff 35%,#19b6c8 68%,#34d399);box-shadow:0 0 12px rgba(87,90,255,.35);transition:width .55s cubic-bezier(.22,1,.36,1)}
.v2-map-frame{position:relative;z-index:2;width:min(100%,820px);max-height:calc(100% - 24px);margin:12px auto;padding:0 8px}
.v2-map{display:block;width:100%;height:auto;overflow:visible;font-size:14px}
.v2-graph-edges path{fill:none;stroke:rgba(148,163,184,.28);stroke-width:1;stroke-dasharray:3 6}
.v2-path{fill:none;stroke-linecap:round;stroke-linejoin:round}
.v2-main-path{stroke:url(#v2PathGrad);stroke-width:4.5;stroke-dasharray:900;filter:url(#v2Glow);opacity:.95}
.v2-insert-path-base{stroke:rgba(245,158,11,.14);stroke-width:8;stroke-dasharray:198;stroke-linecap:round}
.v2-insert-path{stroke:#f59e0b;stroke-width:2.75;stroke-dasharray:198;opacity:.95;stroke-linecap:round}
.v2-reinforce-insert .v2-node__label--above,.v2-extension-node .v2-node__label--above{pointer-events:none}
.v2-branch-base{stroke:rgba(37,99,235,.14);stroke-width:7;stroke-dasharray:24;stroke-linecap:round}
.v2-branch-line{stroke:#3b82f6;stroke-width:2.75;stroke-dasharray:24;stroke-linecap:round;opacity:.95}
.v2-layer-reinforce-focus,.v2-layer-reinforce-done,.v2-layer-expand{opacity:0;visibility:hidden}
.v2-node__ring{fill:rgba(255,255,255,.72);stroke:rgba(255,255,255,.95);stroke-width:1.25}
.v2-node__ring--green{fill:rgba(236,253,245,.88);stroke:rgba(52,211,153,.72)}
.v2-node--green .v2-node__ring{fill:rgba(236,253,245,.88);stroke:rgba(52,211,153,.72)}
.v2-node__ring--blue{stroke:rgba(96,165,250,.55)}
.v2-node__core{stroke:rgba(255,255,255,.75);stroke-width:1.25}
.v2-node__index{fill:#fff;font-family:var(--font-num,var(--font-sans));font-size:12px;font-weight:700;text-anchor:middle;dominant-baseline:central;text-shadow:0 1px 2px rgba(15,23,42,.15)}
.v2-node__label-bg{fill:rgba(255,255,255,.96);stroke:rgba(226,232,240,.9);stroke-width:.75}
.v2-node__label-bg--amber{fill:rgba(255,251,235,.98);stroke:rgba(251,191,36,.28)}
.v2-node__label-bg--blue{fill:rgba(239,246,255,.98);stroke:rgba(96,165,250,.28)}
.v2-node__label-bg--focus{fill:rgba(254,242,242,.98);stroke:rgba(248,113,113,.35)}
.v2-node__label-bg--green{fill:rgba(236,253,245,.98);stroke:rgba(52,211,153,.28)}
.v2-node__label-text{fill:#475569;font-size:14px;font-weight:600;text-anchor:middle;dominant-baseline:central;letter-spacing:.01em}
.v2-node__label-text--amber{fill:#b45309}
.v2-node__label-text--blue{fill:#1d4ed8}
.v2-node__label-text--focus{fill:#dc2626}
.v2-node__label-text--green{fill:#059669}
.v2-node__label-sub{fill:#64748b;font-size:15px;text-anchor:middle;dominant-baseline:central}
.v2-check{fill:none;stroke:#fff;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}
.v2-focus-pulse{fill:none;stroke:rgba(239,68,68,.28);stroke-width:2;animation:v2-pulse 1.8s ease-in-out infinite}
.v2-mastery-track{fill:none;stroke:rgba(239,68,68,.12);stroke-width:2.5}
.v2-mastery-ring{fill:none;stroke:#f87171;stroke-width:2.5;stroke-dasharray:200;stroke-linecap:round;transform:rotate(-90deg);transform-origin:center}
.v2-expand-glow{fill:rgba(16,185,129,.1);stroke:rgba(16,185,129,.28);stroke-width:1.25}
.v2-metric{position:absolute;z-index:7;display:flex;align-items:stretch;min-width:148px;border-radius:16px;background:rgba(255,255,255,.92);border:1px solid rgba(226,232,240,.75);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);box-shadow:0 10px 28px rgba(15,23,42,.07),0 1px 0 rgba(255,255,255,.8) inset;opacity:0;transform:translateY(10px) scale(.98);transition:opacity .4s ease,transform .45s cubic-bezier(.22,1,.36,1);pointer-events:none;overflow:hidden}
.v2-metric--near-node{min-width:132px;max-width:148px}
.v2-metric.is-visible{opacity:1;transform:translateY(0) scale(1)}
.v2-metric__accent{width:4px;flex-shrink:0;background:linear-gradient(180deg,#f87171,#ef4444)}
.v2-metric--ok .v2-metric__accent{background:linear-gradient(180deg,#6ee7b7,#10b981)}
.v2-metric__body{padding:12px 16px 12px 14px}
.v2-metric--warn{border-color:rgba(254,226,226,.7)}.v2-metric--warn .v2-metric__value{color:#dc2626}
.v2-metric--ok{border-color:rgba(209,250,229,.75)}.v2-metric--ok .v2-metric__value{color:#059669}
.v2-metric__label{display:block;font-size:12px;color:#64748b;letter-spacing:.02em}
.v2-metric__value{display:block;margin:3px 0 1px;font-family:var(--font-num,var(--font-sans));font-size:26px;font-weight:800;line-height:1;letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.v2-metric__value small{font-size:16px;font-weight:700;opacity:.85}
.v2-metric__hint{display:block;margin-top:1px;font-size:12px;color:#94a3b8}
.v2-assistant{position:absolute;z-index:8;right:18px;bottom:18px;width:min(400px,calc(100% - 36px));display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:start;padding:14px 16px;border-radius:18px;background:rgba(255,255,255,.94);border:1px solid rgba(226,232,240,.8);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);box-shadow:0 14px 36px rgba(87,90,255,.1),0 1px 0 rgba(255,255,255,.85) inset;opacity:0;transform:translateX(16px);transition:opacity .45s ease,transform .5s cubic-bezier(.22,1,.36,1);pointer-events:none}
.v2-assistant.is-visible{opacity:1;transform:translateX(0);pointer-events:auto}
.v2-assistant__avatar{display:block;width:64px;height:64px;object-fit:contain;border-radius:14px;filter:drop-shadow(0 6px 14px rgba(87,90,255,.16))}
.v2-assistant__badge{display:inline-block;margin-bottom:5px;padding:2px 9px;border-radius:100px;background:linear-gradient(135deg,rgba(87,90,255,.12),rgba(25,182,200,.08));color:#575aff;font-size:12px;font-weight:600;letter-spacing:.01em}
.v2-assistant__text{margin:0;font-size:14px;line-height:22px;color:#334155}
.v2-assistant__caret{display:inline-block;width:2px;height:13px;margin-left:2px;background:#575aff;animation:v2-blink .7s steps(1) infinite;vertical-align:-2px;border-radius:1px}
.v2-assistant__dots{display:inline-flex;gap:3px;margin-right:2px}.v2-assistant__dots i{width:4px;height:4px;border-radius:50%;background:#575aff;animation:v2-bounce .7s infinite alternate}.v2-assistant__dots i:nth-child(2){animation-delay:.12s}.v2-assistant__dots i:nth-child(3){animation-delay:.24s}
.v2-stepper{position:relative;padding:16px 16px 14px;background:linear-gradient(180deg,rgba(255,255,255,.78) 0%,rgba(248,250,252,.92) 100%);border-top:1px solid rgba(226,232,240,.72);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.v2-stepper__rail{position:absolute;top:41px;left:calc(12.5% + 8px);right:calc(12.5% + 8px);height:2px;border-radius:100px;background:rgba(226,232,240,.85);overflow:hidden;z-index:0}
.v2-stepper__rail-fill{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#6366f1,#575aff 35%,#19b6c8 68%,#34d399);box-shadow:0 0 10px rgba(87,90,255,.22);transition:width .55s cubic-bezier(.22,1,.36,1)}
.v2-stepper__list{position:relative;z-index:1;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding-top:10px}
.v2-step{display:flex;flex-direction:column;align-items:center;gap:8px;padding:8px 6px 10px;border:1px solid transparent;border-radius:16px;background:transparent;color:#94a3b8;text-align:center;cursor:pointer;font:inherit;transition:border-color .28s,background .28s,box-shadow .28s,transform .28s,color .28s}
.v2-step:hover:not(.active):not(:disabled){background:rgba(255,255,255,.72);border-color:rgba(226,232,240,.85);color:#64748b;transform:translateY(-1px)}
.v2-step:disabled{cursor:default}
.v2-step.is-auto .v2-step__num{animation:v2-step-pulse 1.6s ease-in-out infinite}
.v2-step__num{position:relative;display:grid;place-items:center;width:32px;height:32px;border-radius:50%;border:2px solid rgba(226,232,240,.95);background:#fff;font-family:var(--font-num,var(--font-sans));font-size:12px;font-weight:700;color:#94a3b8;box-shadow:0 1px 2px rgba(15,23,42,.04);transition:border-color .28s,background .28s,color .28s,box-shadow .28s,transform .28s}
.v2-step__check{font-size:14px;line-height:1;font-weight:800;color:#059669}
.v2-step__content{display:grid;gap:2px;min-width:0;width:100%}
.v2-step__content strong{display:block;font-size:16px;font-weight:600;line-height:24px;color:inherit;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.v2-step__content small{display:block;font-size:12px;line-height:1.4;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:color .28s}
.v2-step.active{border-color:rgba(87,90,255,.18);background:rgba(255,255,255,.94);box-shadow:0 6px 18px rgba(87,90,255,.08),0 1px 0 rgba(255,255,255,.9) inset;color:#1e293b;transform:translateY(-2px)}
.v2-step.active .v2-step__num{border-color:transparent;background:linear-gradient(135deg,#6366f1,#575aff);color:#fff;box-shadow:0 4px 14px rgba(87,90,255,.32)}
.v2-step.active .v2-step__content small{color:#64748b}
.v2-step.complete .v2-step__num{border-color:rgba(52,211,153,.45);background:rgba(236,253,245,.95);color:#059669;box-shadow:0 2px 8px rgba(16,185,129,.12)}
.v2-step.complete .v2-step__content strong{color:#334155}
.v2-step.complete.active .v2-step__num{border-color:transparent;background:linear-gradient(135deg,#34d399,#10b981);color:#fff;box-shadow:0 4px 14px rgba(16,185,129,.28)}
.v2-step.complete.active .v2-step__check{color:#fff}
.v2-step:focus-visible{outline:3px solid rgba(87,90,255,.2);outline-offset:2px}
@keyframes v2-step-pulse{0%,100%{box-shadow:0 0 0 0 rgba(87,90,255,.28)}50%{box-shadow:0 0 0 6px rgba(87,90,255,0)}}
@keyframes v2-pulse{0%,100%{r:38;opacity:.75}50%{r:44;opacity:.3}}
@keyframes v2-blink{50%{opacity:0}}
@keyframes v2-bounce{to{transform:translateY(-3px);opacity:.4}}
@media(max-width:768px){.v2-stepper{padding:12px 10px 10px}.v2-stepper__rail{top:35px;left:calc(25% + 6px);right:calc(25% + 6px)}.v2-stepper__list{grid-template-columns:repeat(2,1fr);gap:6px;padding-top:8px}.v2-step{padding:7px 4px 8px;border-radius:14px;gap:6px}.v2-step__num{width:28px;height:28px;font-size:12px}.v2-step__content small{display:none}.v2-map-frame{padding:0 4px;margin:8px auto}.v2-metric--near-node{min-width:118px;max-width:132px}.v2-metric__body{padding:10px 12px 10px 10px}.v2-metric__value{font-size:22px}.v2-assistant{right:12px;bottom:12px;width:min(340px,calc(100% - 24px));padding:12px}.v2-progress{top:8px;left:10px;right:10px}}
@media(prefers-reduced-motion:reduce){.v2-focus-pulse,.v2-assistant__dots i,.v2-assistant__caret,.v2-step.is-auto .v2-step__num{animation:none}.v2-progress__fill,.v2-metric,.v2-assistant,.v2-stepper__rail-fill{transition-duration:.01ms}}
</style>
