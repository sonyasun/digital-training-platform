<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { PathNodeLike, PathNodeShapeType } from './types'
import {
  PATH_VIEWPORT,
  NODE_MARKER_WIDTH,
  NODE_MARKER_HEIGHT,
  NODE_FOOT_TRIM,
  PRESENTATION_VISIBLE_NODES,
  buildPathGuidePoints,
  buildPresentationPath,
  computeFocusScrollX,
  getPresentationContentWidth,
  getPresentationScrollBounds,
  pickPresentationNodes,
  samplePointsOnPath,
  getPathTangentAtNodeIndex,
  buildBranchForkPath,
  branchConnectorLength,
  measureSvgPathLength,
} from './presentationPathLayout'
import {
  PRESENTATION_LEGEND_ITEMS,
  formatNodeMasteryLabel,
  resolveDisplayMastery,
  resolvePresentationNodeStatus,
  type PresentationNodeStatus,
} from './presentationNodeStatus'
import PresentationCompletedLeaderLabel from './PresentationCompletedLeaderLabel.vue'
import { resolveTopicMarkerVariantForNode } from './demo/chapterPathNodes'
import {
  isPathNodeStatusColoredMarker,
  resolvePathNodeBranchMarkerSrc,
  resolvePathNodeBuildingMarkerSrc,
  type PathNodeMapSkin,
} from './pathNodeMarkers'
import { resolveAssetUrl } from '../business/course-overview-map/constants'

const NODE_TYPE_LABELS: Record<'theory' | 'practice' | 'integrated', string> = {
  theory: '理论',
  practice: '实操',
  integrated: '理实一体',
}

function resolveNodeTypeLabel(node: PathNodeLike): string {
  if (node.nodeType && NODE_TYPE_LABELS[node.shapeType as keyof typeof NODE_TYPE_LABELS] === node.nodeType) {
    return node.nodeType
  }
  if (node.shapeType in NODE_TYPE_LABELS) {
    return NODE_TYPE_LABELS[node.shapeType as keyof typeof NODE_TYPE_LABELS]
  }
  return node.nodeType || ''
}

function resolveNodeTypeKind(node: PathNodeLike): PathNodeShapeType | null {
  if (node.shapeType === 'theory' || node.shapeType === 'practice' || node.shapeType === 'integrated') {
    return node.shapeType
  }
  return null
}

const props = withDefaults(defineProps<{
  nodes: PathNodeLike[]
  currentNodeIndex?: number
  weakNodeIds?: string[]
  hoveredNodeId?: string | null
  selectedNodeId?: string | null
  mapSkin?: PathNodeMapSkin
}>(), {
  currentNodeIndex: -1,
  weakNodeIds: () => [],
  hoveredNodeId: null,
  selectedNodeId: null,
  mapSkin: 'city',
})

const emit = defineEmits<{
  (e: 'node-hover', nodeId: string | null, node: PathNodeLike | null): void
  (e: 'node-click', nodeId: string, node: PathNodeLike): void
}>()

const viewportRef = ref<HTMLElement | null>(null)
const svgRef = ref<SVGSVGElement | null>(null)
const pathRef = ref<SVGPathElement | null>(null)
const viewportLayout = ref({ scale: 1, offsetX: 0, offsetY: 0 })
let viewportResizeObserver: ResizeObserver | null = null
const nodeSlots = ref<Array<{ x: number; y: number }>>([])
const pathLength = ref(0)
const scrollX = ref(0)
const isPanning = ref(false)
const panStartClientX = ref(0)
const panStartScrollX = ref(0)
const userHasPanned = ref(false)
const hoveredLocalId = ref<string | null>(null)

const mainNodes = computed(() => pickPresentationNodes(props.nodes))
const nodeCount = computed(() => mainNodes.value.length)
const pathGuidePoints = computed(() => buildPathGuidePoints(nodeCount.value || PRESENTATION_VISIBLE_NODES))
const pathD = computed(() => buildPresentationPath(pathGuidePoints.value))
const contentWidth = computed(() => getPresentationContentWidth(nodeCount.value || PRESENTATION_VISIBLE_NODES))
const scrollBounds = computed(() => getPresentationScrollBounds(nodeSlots.value))
const minScrollX = computed(() => scrollBounds.value.minScroll)
const maxScrollX = computed(() => scrollBounds.value.maxScroll)
const canPan = computed(() => maxScrollX.value > minScrollX.value)

const svgViewBox = computed(
  () => `${scrollX.value.toFixed(1)} 0 ${PATH_VIEWPORT.w} ${PATH_VIEWPORT.h}`,
)

const pathGradCoords = computed(() => {
  const pts = pathGuidePoints.value
  const first = pts[0] ?? { x: 0, y: PATH_VIEWPORT.h }
  const last = pts[pts.length - 1] ?? { x: contentWidth.value, y: 0 }
  return { x1: first.x, y1: first.y, x2: last.x, y2: last.y }
})

const canScrollLeft = computed(() => scrollX.value > minScrollX.value + 4)
const canScrollRight = computed(() => scrollX.value < maxScrollX.value - 4)

const displayNodes = computed(() => {
  return mainNodes.value.map((node, index) => {
    const resolveOpts = {
      nodeIndex: index,
      currentNodeIndex: props.currentNodeIndex,
      weakNodeIds: props.weakNodeIds,
    }
    const status = resolvePresentationNodeStatus(node, resolveOpts)
    const slot = nodeSlots.value[index] ?? pathGuidePoints.value[0]
    const name = node.shortName || node.name
    return {
      node,
      slot,
      order: index + 1,
      status,
      masteryPercent: resolveDisplayMastery(node, resolveOpts),
      metaLabel: formatNodeMasteryLabel(node, resolveOpts),
      nameLabel: name,
      markerSrc: resolveAssetUrl(resolvePathNodeBuildingMarkerSrc(
        resolveTopicMarkerVariantForNode(node, index),
        status,
        props.mapSkin,
        resolveDisplayMastery(node, resolveOpts),
      )),
      typeLabel: resolveNodeTypeLabel(node),
      typeKind: resolveNodeTypeKind(node),
    }
  })
})

const currentIndex = computed(() => {
  const focusIdx = displayNodes.value.findIndex(
    item => item.node.isCurrent || item.node.status === 'in-progress',
  )
  if (focusIdx >= 0) return focusIdx
  for (let i = displayNodes.value.length - 1; i >= 0; i--) {
    if (displayNodes.value[i].status !== 'locked') return i
  }
  return -1
})

const branchDisplayItems = computed((): BranchDisplayItem[] => {
  if (nodeSlots.value.length === 0) return []

  return displayNodes.value.flatMap((item, parentIndex) => {
    const branchDef = item.node.branch
    if (!branchDef) return []

    const branchNode = buildBranchNode(item.node, branchDef)
    const tangent = getPathTangentAtNodeIndex(pathRef.value, nodeSlots.value, parentIndex)
    const branchSlot = computeBranchSlot(item.slot, tangent, parentIndex)
    const resolveOpts = {
      nodeIndex: -1,
      currentNodeIndex: props.currentNodeIndex,
      weakNodeIds: props.weakNodeIds,
    }
    const status = branchDef.status === 'locked'
      ? 'locked' as PresentationNodeStatus
      : resolvePresentationNodeStatus(branchNode, resolveOpts)
    const masteryPercent = resolveDisplayMastery(branchNode, resolveOpts)

    return [{
      id: branchNode.id,
      node: branchNode,
      parentNode: item.node,
      parentIndex,
      parentSlot: item.slot,
      branchSlot,
      status,
      nameLabel: branchNode.shortName || branchNode.name,
      typeLabel: resolveNodeTypeLabel(branchNode),
      typeKind: resolveNodeTypeKind(branchNode),
      markerSrc: resolveAssetUrl(resolvePathNodeBranchMarkerSrc(status, props.mapSkin)),
      masteryPercent,
      metaLabel: formatNodeMasteryLabel(branchNode, resolveOpts),
      ...buildBranchPathStyles({
        parentSlot: item.slot,
        branchSlot,
        status,
        masteryPercent,
        parentIndex,
        mainCurrentIndex: currentIndex.value,
        parentStatus: item.status,
        tangent,
      }),
    }]
  })
})

const progressRatio = computed(() => {
  const count = mainNodes.value.length
  if (count <= 1) return 0
  let idx = currentIndex.value
  if (idx < 0) {
    const allLocked = displayNodes.value.every(item => item.status === 'locked')
    idx = allLocked ? -1 : count - 1
  }
  return Math.max(0, Math.min(1, idx / (count - 1)))
})

const progressLen = computed(() => pathLength.value * progressRatio.value)

const progressDashStyle = computed(() => {
  if (!pathLength.value) return undefined
  const len = pathLength.value
  const done = progressLen.value
  return {
    strokeDasharray: `${done} ${len}`,
    strokeDashoffset: '0',
  }
})

const futureDashStyle = computed(() => {
  if (!pathLength.value) return undefined
  const len = pathLength.value
  const done = progressLen.value
  return {
    strokeDasharray: `${len - done} ${len}`,
    strokeDashoffset: `${-done}`,
    '--path-future-base': `${-done}`,
  }
})

const showProgressShine = computed(() => pathLength.value > 0 && progressLen.value > 0)

const progressHeadStyle = computed(() => {
  if (!pathLength.value) return undefined
  const len = pathLength.value
  const done = progressLen.value
  if (done <= 4) return undefined
  return {
    strokeDasharray: `4 ${len}`,
    strokeDashoffset: `${-(done - 4)}`,
  }
})

const markerHalfW = NODE_MARKER_WIDTH / 2
const markerHeight = NODE_MARKER_HEIGHT
const markerImageY = -markerHeight + NODE_FOOT_TRIM
const cardW = 112
/** 路径锚点 = 建筑可视底座，卡片紧贴其下 */
const CARD_GAP_BELOW_MARKER_PX = 4
/** 分支建筑底座与主建筑顶部的垂直间距（SVG 坐标，y 向上为负） */
const BRANCH_VERTICAL_GAP = 32

type BranchDisplayItem = {
  id: string
  node: PathNodeLike
  parentNode: PathNodeLike
  parentIndex: number
  parentSlot: { x: number; y: number }
  branchSlot: { x: number; y: number }
  status: PresentationNodeStatus
  nameLabel: string
  typeLabel: string
  typeKind: PathNodeShapeType | null
  markerSrc: string
  masteryPercent: number
  metaLabel: string
  pathD: string
  pathLength: number
  progressDashStyle?: Record<string, string>
  futureDashStyle?: Record<string, string | number>
  progressHeadStyle?: Record<string, string>
  showProgressShine: boolean
  connectorDone: number
  parentReached: boolean
}

function buildBranchNode(
  parent: PathNodeLike,
  branch: NonNullable<PathNodeLike['branch']>,
): PathNodeLike {
  return {
    id: branch.id || `${parent.id}-branch`,
    name: branch.name,
    shortName: branch.shortName || branch.name,
    order: parent.order + 0.05,
    shapeType: 'practice',
    level: parent.level,
    nodeType: branch.nodeType || '拓展',
    x: 0,
    y: 0,
    chapterId: parent.chapterId,
    resources: '资料1｜练习1',
    duration: '20min',
    description: `${branch.name}拓展学习。`,
    status: branch.status === 'completed' || branch.status === 'in-progress' || branch.status === 'not-started'
      ? branch.status
      : 'not-started',
    mastery: branch.progress ?? 0,
    lockType: branch.lockType,
  }
}

function parentBuildingTopY(slot: { x: number; y: number }) {
  return slot.y + markerImageY
}

function computeBranchSlot(
  parentSlot: { x: number; y: number },
  tangent: { x: number; y: number },
  parentIndex: number,
) {
  const perpX = -tangent.y
  const lateral = 16 * (parentIndex % 2 === 0 ? 1 : -1)
  return {
    x: parentSlot.x + perpX * lateral,
    y: parentBuildingTopY(parentSlot) - BRANCH_VERTICAL_GAP,
  }
}

function branchMasteryRatio(
  status: PresentationNodeStatus,
  masteryPercent: number,
): number {
  if (status === 'locked') return 0
  if (status === 'mastered') return 1
  return Math.max(0.08, Math.min(0.92, masteryPercent / 100))
}

function isBranchParentReached(
  parentIndex: number,
  mainCurrentIndex: number,
  parentStatus: PresentationNodeStatus,
): boolean {
  const parentReached = mainCurrentIndex < 0 || parentIndex <= mainCurrentIndex
  return parentReached && parentStatus !== 'locked'
}

function computeBranchProgressDone(
  pathLength: number,
  parentReached: boolean,
  branchMastery: number,
): number {
  if (!parentReached || pathLength <= 0) return 0
  const connector = branchConnectorLength(pathLength)
  if (branchMastery <= 0) return connector
  return connector + (pathLength - connector) * branchMastery
}

function buildBranchPathStyles(
  item: Pick<BranchDisplayItem, 'parentSlot' | 'branchSlot' | 'status' | 'masteryPercent'> & {
    parentIndex: number
    mainCurrentIndex: number
    parentStatus: PresentationNodeStatus
    tangent: { x: number; y: number }
  },
) {
  const pathD = buildBranchForkPath(item.parentSlot, item.branchSlot, item.tangent)
  const pathLength = measureSvgPathLength(pathD)
  const parentReached = isBranchParentReached(
    item.parentIndex,
    item.mainCurrentIndex,
    item.parentStatus,
  )
  const mastery = branchMasteryRatio(item.status, item.masteryPercent)
  const connectorDone = parentReached ? branchConnectorLength(pathLength) : 0
  const done = computeBranchProgressDone(pathLength, parentReached, mastery)
  return {
    pathD,
    pathLength,
    progressDashStyle: pathLength > 0
      ? {
          strokeDasharray: `${done} ${pathLength}`,
          strokeDashoffset: '0',
        }
      : undefined,
    futureDashStyle: pathLength > 0
      ? {
          strokeDasharray: `${pathLength - done} ${pathLength}`,
          strokeDashoffset: `${-done}`,
          '--path-future-base': `${-done}`,
        }
      : undefined,
    progressHeadStyle: done > 4
      ? {
          strokeDasharray: `4 ${pathLength}`,
          strokeDashoffset: `${-(done - 4)}`,
        }
      : undefined,
    showProgressShine: pathLength > 0 && done > connectorDone + 2,
    connectorDone,
    parentReached,
  }
}

function measureViewportLayout() {
  const svg = svgRef.value
  if (!svg || svg.clientWidth <= 0 || svg.clientHeight <= 0) return
  const scale = Math.min(
    svg.clientWidth / PATH_VIEWPORT.w,
    svg.clientHeight / PATH_VIEWPORT.h,
  )
  const renderedH = PATH_VIEWPORT.h * scale
  viewportLayout.value = {
    scale,
    // 与 preserveAspectRatio="xMinYMid meet" 一致：水平左对齐，垂直居中
    offsetX: 0,
    offsetY: (svg.clientHeight - renderedH) / 2,
  }
}

function slotToViewport(slot: { x: number; y: number }) {
  const { scale, offsetX, offsetY } = viewportLayout.value
  return {
    x: offsetX + (slot.x - scrollX.value) * scale,
    y: offsetY + slot.y * scale,
    scale,
  }
}

function markerTopScreen(pt: ReturnType<typeof slotToViewport>) {
  return pt.y + markerImageY * pt.scale
}

function cardOverlayStyle(item: (typeof displayNodes.value)[number]) {
  const pt = slotToViewport(item.slot)
  const lifted = isHighlighted(item.node)
  return {
    left: `${pt.x - cardW / 2}px`,
    top: `${pt.y + CARD_GAP_BELOW_MARKER_PX}px`,
    width: `${cardW}px`,
    zIndex: Math.round(item.slot.y),
    transform: lifted ? 'translateY(-4px)' : undefined,
  }
}

function branchCardOverlayStyle(item: BranchDisplayItem) {
  const pt = slotToViewport(item.branchSlot)
  const lifted = isHighlighted(item.node)
  const buildingTopScreen = markerTopScreen(pt)
  return {
    left: `${pt.x}px`,
    top: `${buildingTopScreen - 4}px`,
    width: `${cardW}px`,
    zIndex: 600 + Math.round(item.branchSlot.y),
    transform: lifted
      ? 'translate(-50%, calc(-100% - 4px))'
      : 'translate(-50%, -100%)',
  }
}

function isCurrentLearningNode(node: PathNodeLike) {
  return node.isCurrent || node.status === 'in-progress'
}

const currentLearningNodes = computed(() =>
  displayNodes.value.filter(item => isCurrentLearningNode(item.node)),
)

function currentLearningLabelStyle(item: (typeof displayNodes.value)[number]) {
  const pt = slotToViewport(item.slot)
  const buildingTopScreen = markerTopScreen(pt)
  return {
    left: `${pt.x}px`,
    top: `${buildingTopScreen + 4}px`,
    transform: 'translate(-50%, -100%)',
    zIndex: Math.round(item.slot.y) + 2,
  }
}

function clampScroll(value: number) {
  return Math.max(minScrollX.value, Math.min(maxScrollX.value, value))
}

function syncNodeSlots() {
  const path = pathRef.value
  const count = mainNodes.value.length
  if (!path || count === 0) return
  pathLength.value = path.getTotalLength()
  nodeSlots.value = samplePointsOnPath(path, count)
}

function scrollToFocus(force = false) {
  if (userHasPanned.value && !force) return
  const idx = currentIndex.value >= 0 ? currentIndex.value : 0
  scrollToNodeIndex(idx, force)
}

function scrollToNodeIndex(idx: number, force = false) {
  if (userHasPanned.value && !force) return
  if (idx < 0 || idx >= nodeSlots.value.length) return
  scrollX.value = computeFocusScrollX(nodeSlots.value, idx)
}

function scrollToSelectedNode(force = true) {
  if (!props.selectedNodeId) return
  const idx = mainNodes.value.findIndex(node => node.id === props.selectedNodeId)
  if (idx >= 0) scrollToNodeIndex(idx, force)
}

function pxToSvgUnits(deltaPx: number) {
  const el = viewportRef.value
  if (!el || el.clientWidth <= 0) return deltaPx
  return (deltaPx / el.clientWidth) * PATH_VIEWPORT.w
}

function onPanStart(event: PointerEvent) {
  if (!canPan.value) return
  if ((event.target as Element).closest('.presentation-path-node, .presentation-node-card.is-clickable')) return

  isPanning.value = true
  panStartClientX.value = event.clientX
  panStartScrollX.value = scrollX.value
  userHasPanned.value = true
  viewportRef.value?.setPointerCapture(event.pointerId)
}

function onPanMove(event: PointerEvent) {
  if (!isPanning.value) return
  const delta = pxToSvgUnits(event.clientX - panStartClientX.value)
  scrollX.value = clampScroll(panStartScrollX.value - delta)
}

function onPanEnd(event: PointerEvent) {
  if (!isPanning.value) return
  isPanning.value = false
  viewportRef.value?.releasePointerCapture(event.pointerId)
}

function onWheel(event: WheelEvent) {
  if (!canPan.value) return
  const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
  if (delta === 0) return
  event.preventDefault()
  userHasPanned.value = true
  scrollX.value = clampScroll(scrollX.value + pxToSvgUnits(delta))
}

function nodeStateClass(status: PresentationNodeStatus) {
  return `is-${status}`
}

function isHighlighted(node: PathNodeLike) {
  return (
    hoveredLocalId.value === node.id
    || props.hoveredNodeId === node.id
    || props.selectedNodeId === node.id
  )
}

function onEnter(node: PathNodeLike) {
  hoveredLocalId.value = node.id
  emit('node-hover', node.id, node)
}

function onLeave() {
  hoveredLocalId.value = null
  emit('node-hover', null, null)
}

function onClick(node: PathNodeLike) {
  emit('node-click', node.id, node)
}

function onCardClick(status: PresentationNodeStatus, node: PathNodeLike, event: MouseEvent) {
  event.stopPropagation()
  onClick(node)
}

onMounted(() => {
  measureViewportLayout()
  if (typeof ResizeObserver !== 'undefined') {
    viewportResizeObserver = new ResizeObserver(() => {
      measureViewportLayout()
    })
    if (viewportRef.value) viewportResizeObserver.observe(viewportRef.value)
  }

  nextTick(() => {
    measureViewportLayout()
    syncNodeSlots()
    nextTick(() => scrollToFocus(true))
  })
})

watch([pathD, mainNodes], () => {
  nextTick(() => {
    syncNodeSlots()
    nextTick(() => scrollToFocus(true))
  })
})

watch(currentIndex, () => {
  if (!userHasPanned.value) {
    nextTick(() => scrollToFocus())
  }
})

watch(
  () => props.selectedNodeId,
  (nodeId) => {
    if (!nodeId) return
    userHasPanned.value = false
    nextTick(() => {
      syncNodeSlots()
      nextTick(() => scrollToSelectedNode(true))
    })
  },
)

watch(
  () => props.nodes,
  () => {
    userHasPanned.value = false
    nextTick(() => scrollToFocus(true))
  },
)

onBeforeUnmount(() => {
  isPanning.value = false
  viewportResizeObserver?.disconnect()
  viewportResizeObserver = null
})
</script>

<template>
  <div class="presentation-path-layer" aria-label="学习路径">
    <div
      ref="viewportRef"
      class="presentation-path-viewport"
      :class="{ 'is-panning': isPanning, 'is-scrollable': canPan }"
      @pointerdown="onPanStart"
      @pointermove="onPanMove"
      @pointerup="onPanEnd"
      @pointercancel="onPanEnd"
      @wheel.prevent="onWheel"
    >
      <div
        v-if="canScrollLeft"
        class="presentation-path-edge presentation-path-edge--left"
        aria-hidden="true"
      >
        <span class="presentation-path-edge__hint">← 已完成</span>
      </div>
      <div
        v-if="canScrollRight"
        class="presentation-path-edge presentation-path-edge--right"
        aria-hidden="true"
      >
        <span class="presentation-path-edge__hint">未解锁 →</span>
      </div>

      <svg
        ref="svgRef"
        class="presentation-path-svg"
        :viewBox="svgViewBox"
        preserveAspectRatio="xMinYMid meet"
      >
        <defs>
          <linearGradient
            id="presentationPathGrad"
            gradientUnits="userSpaceOnUse"
            :x1="pathGradCoords.x1"
            :y1="pathGradCoords.y1"
            :x2="pathGradCoords.x2"
            :y2="pathGradCoords.y2"
          >
            <stop offset="0%" stop-color="#34D399" />
            <stop offset="42%" stop-color="#22A06B" />
            <stop offset="58%" stop-color="#1677FF" />
            <stop offset="100%" stop-color="#575AFF" />
          </linearGradient>
          <linearGradient id="presentationPathBedGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="rgba(255, 255, 255, 0.94)" />
            <stop offset="50%" stop-color="rgba(255, 255, 255, 0.88)" />
            <stop offset="100%" stop-color="rgba(255, 255, 255, 0.92)" />
          </linearGradient>
          <filter id="presentationPathSoftGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="presentationMarkerShadow" x="-30%" y="-15%" width="160%" height="145%">
            <feDropShadow dx="0" dy="5" stdDeviation="4.5" flood-color="#0f172a" flood-opacity="0.1" />
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#1677ff" flood-opacity="0.06" />
          </filter>
          <radialGradient id="presentationCompletedHaloGrad" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stop-color="rgba(82, 196, 26, 0.36)" />
            <stop offset="52%" stop-color="rgba(82, 196, 26, 0.14)" />
            <stop offset="100%" stop-color="rgba(82, 196, 26, 0)" />
          </radialGradient>
          <linearGradient id="presentationCompletedBadgeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#5fd646" />
            <stop offset="100%" stop-color="#52c41a" />
          </linearGradient>
          <filter id="presentationCompletedHaloGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="presentationCompletedBadgeShadow" x="-100%" y="-100%" width="300%" height="300%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#52c41a" flood-opacity="0.28" />
            <feDropShadow dx="0" dy="3" stdDeviation="3.5" flood-color="#52c41a" flood-opacity="0.14" />
          </filter>
          <mask
            id="presentationProgressMask"
            maskUnits="userSpaceOnUse"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <path
              :d="pathD"
              fill="none"
              stroke="#fff"
              stroke-width="8"
              stroke-linecap="round"
              stroke-linejoin="round"
              :style="progressDashStyle"
            />
          </mask>
        </defs>

        <path
          ref="pathRef"
          :d="pathD"
          fill="none"
          stroke="none"
          visibility="hidden"
          pointer-events="none"
        />

        <g class="presentation-path-network">
          <path class="presentation-path presentation-path--glow" :d="pathD" fill="none" />
          <path
            v-for="item in branchDisplayItems"
            :key="`branch-glow-${item.id}`"
            class="presentation-path presentation-path--glow"
            :d="item.pathD"
            fill="none"
          />

          <path class="presentation-path presentation-path--bed" :d="pathD" fill="none" />
          <path
            v-for="item in branchDisplayItems"
            :key="`branch-bed-${item.id}`"
            class="presentation-path presentation-path--bed"
            :d="item.pathD"
            fill="none"
          />

          <circle
            v-for="item in branchDisplayItems"
            :key="`branch-junction-${item.id}`"
            class="presentation-path-junction"
            :class="{ 'is-active': item.parentReached }"
            :cx="item.parentSlot.x"
            :cy="item.parentSlot.y"
            r="5.8"
          />

          <path
            class="presentation-path presentation-path--future"
            :d="pathD"
            fill="none"
            :style="futureDashStyle"
          />
          <path
            v-for="item in branchDisplayItems"
            :key="`branch-future-${item.id}`"
            class="presentation-path presentation-path--future"
            :d="item.pathD"
            fill="none"
            :style="item.futureDashStyle"
          />

          <path
            class="presentation-path presentation-path--progress"
            :d="pathD"
            fill="none"
            stroke="url(#presentationPathGrad)"
            filter="url(#presentationPathSoftGlow)"
            :style="progressDashStyle"
          />
          <path
            v-for="item in branchDisplayItems"
            :key="`branch-progress-${item.id}`"
            class="presentation-path presentation-path--progress"
            :d="item.pathD"
            fill="none"
            stroke="url(#presentationPathGrad)"
            filter="url(#presentationPathSoftGlow)"
            :style="item.progressDashStyle"
          />

          <path
            v-if="showProgressShine"
            class="presentation-path presentation-path--progress-shine"
            :d="pathD"
            fill="none"
            mask="url(#presentationProgressMask)"
          />
          <path
            v-for="item in branchDisplayItems"
            :key="`branch-shine-${item.id}`"
            v-show="item.showProgressShine"
            class="presentation-path presentation-path--progress-shine presentation-path--progress-shine-branch"
            :d="item.pathD"
            fill="none"
            :style="item.progressDashStyle"
          />

          <path
            v-if="progressHeadStyle"
            class="presentation-path presentation-path--progress-head"
            :d="pathD"
            fill="none"
            :style="progressHeadStyle"
          />
          <path
            v-for="item in branchDisplayItems"
            :key="`branch-head-${item.id}`"
            v-show="item.progressHeadStyle"
            class="presentation-path presentation-path--progress-head"
            :d="item.pathD"
            fill="none"
            :style="item.progressHeadStyle"
          />
        </g>

        <g
          v-for="item in displayNodes"
          :key="item.node.id"
          :transform="`translate(${item.slot.x.toFixed(1)}, ${item.slot.y.toFixed(1)})`"
        >
          <g
            class="presentation-path-node"
            :class="[
              nodeStateClass(item.status),
              {
                'is-highlighted': isHighlighted(item.node),
                'is-focus': isCurrentLearningNode(item.node),
              },
            ]"
            @mouseenter="onEnter(item.node)"
            @mouseleave="onLeave"
            @click="onClick(item.node)"
          >
            <circle
              class="presentation-path-node__pulse"
              cx="0"
              cy="1.4"
              r="12"
              fill="none"
              stroke-width="1.2"
            />
            <PresentationCompletedLeaderLabel
              v-if="item.status === 'mastered'"
              :building-top-y="markerImageY"
            />
            <image
              class="presentation-path-node__marker"
              :class="{ 'is-status-asset': isPathNodeStatusColoredMarker(item.status) }"
              :href="item.markerSrc"
              :x="-markerHalfW"
              :y="markerImageY"
              :width="NODE_MARKER_WIDTH"
              :height="NODE_MARKER_HEIGHT"
              filter="url(#presentationMarkerShadow)"
            />
          </g>
        </g>

        <g
          v-for="item in branchDisplayItems"
          :key="item.id"
          :transform="`translate(${item.branchSlot.x.toFixed(1)}, ${item.branchSlot.y.toFixed(1)})`"
        >
          <g
            class="presentation-path-node presentation-path-node--branch"
            :class="[
              nodeStateClass(item.status),
              {
                'is-highlighted': isHighlighted(item.node),
                'is-focus': isCurrentLearningNode(item.node),
              },
            ]"
            @mouseenter="onEnter(item.node)"
            @mouseleave="onLeave"
            @click="onClick(item.node)"
          >
            <circle
              class="presentation-path-node__pulse"
              cx="0"
              cy="1.4"
              r="12"
              fill="none"
              stroke-width="1.2"
            />
            <PresentationCompletedLeaderLabel
              v-if="item.status === 'mastered'"
              :building-top-y="markerImageY"
            />
            <image
              class="presentation-path-node__marker"
              :class="{ 'is-status-asset': isPathNodeStatusColoredMarker(item.status) }"
              :href="item.markerSrc"
              :x="-markerHalfW"
              :y="markerImageY"
              :width="NODE_MARKER_WIDTH"
              :height="NODE_MARKER_HEIGHT"
              filter="url(#presentationMarkerShadow)"
            />
          </g>
        </g>
      </svg>

      <div class="presentation-path-current-labels" aria-hidden="false">
        <div
          v-for="item in currentLearningNodes"
          :key="`current-${item.node.id}`"
          class="presentation-current-learning-label"
          :style="currentLearningLabelStyle(item)"
          aria-label="当前所学"
        >
          <span class="presentation-current-learning-label__inner">
            <span class="presentation-current-learning-label__text">当前所学</span>
            <span class="presentation-current-learning-label__tail" aria-hidden="true" />
          </span>
        </div>
      </div>

      <div class="presentation-path-cards">
        <div
          v-for="item in displayNodes"
          :key="`card-${item.node.id}`"
          class="presentation-node-card"
          :class="[
            nodeStateClass(item.status),
            {
              'has-no-type': !item.typeLabel,
              'is-highlighted': isHighlighted(item.node),
              'is-focus': isCurrentLearningNode(item.node),
              'is-clickable': true,
            },
          ]"
          :style="cardOverlayStyle(item)"
          @click="onCardClick(item.status, item.node, $event)"
        >
          <div class="presentation-node-card__body">
            <p class="presentation-node-card__name" :title="item.nameLabel">
              {{ item.nameLabel }}
            </p>
            <p
              v-if="item.typeLabel"
              class="presentation-node-card__type"
              :class="item.typeKind ? `is-${item.typeKind}` : undefined"
            >
              {{ item.typeLabel }}
            </p>
            <p class="presentation-node-card__meta">
              <span class="presentation-node-card__dot" aria-hidden="true" />
              <span v-if="item.status === 'locked'">{{ item.metaLabel }}</span>
              <span v-else>
                已掌握 <strong>{{ item.masteryPercent }}%</strong>
              </span>
            </p>
          </div>
        </div>
      </div>

      <div class="presentation-path-branch-cards">
        <div
          v-for="item in branchDisplayItems"
          :key="`branch-card-${item.id}`"
          class="presentation-node-card presentation-node-card--branch"
          :class="[
            nodeStateClass(item.status),
            {
              'has-no-type': !item.typeLabel,
              'is-highlighted': isHighlighted(item.node),
              'is-clickable': true,
            },
          ]"
          :style="branchCardOverlayStyle(item)"
          @click="onCardClick(item.status, item.node, $event)"
        >
          <div class="presentation-node-card__body">
            <p class="presentation-node-card__name presentation-node-card__name--branch" :title="item.nameLabel">
              <span
                class="presentation-node-card__branch-tag"
                :class="nodeStateClass(item.status)"
              >
                补强
              </span>
              <span class="presentation-node-card__branch-name">{{ item.nameLabel }}</span>
            </p>
            <p class="presentation-node-card__meta">
              <span class="presentation-node-card__dot" aria-hidden="true" />
              <span v-if="item.status === 'locked'">{{ item.metaLabel }}</span>
              <span v-else>
                已掌握 <strong>{{ item.masteryPercent }}%</strong>
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>

    <footer class="presentation-path-legend" aria-label="路径状态图例">
      <span
        v-for="(item, index) in PRESENTATION_LEGEND_ITEMS"
        :key="item.status"
        class="presentation-path-legend__item"
        :class="`presentation-path-legend__item--${item.status}`"
      >
        <span v-if="index > 0" class="presentation-path-legend__divider" aria-hidden="true" />
        <span class="presentation-path-legend__dot" />
        <span class="presentation-path-legend__label">{{ item.label }}</span>
      </span>
    </footer>
  </div>
</template>

<style scoped>
.presentation-path-layer {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

.presentation-path-viewport {
  position: absolute;
  inset: 0;
  overflow: hidden;
  touch-action: none;
  pointer-events: auto;
  cursor: grab;
}

.presentation-path-viewport.is-scrollable {
  cursor: grab;
}

.presentation-path-viewport.is-panning {
  cursor: grabbing;
}

.presentation-path-svg {
  width: 100%;
  height: 100%;
  display: block;
  user-select: none;
}

.presentation-path-cards {
  position: absolute;
  inset: 0;
  z-index: 3;
  overflow: hidden;
  pointer-events: none;
}

.presentation-path-current-labels {
  position: absolute;
  inset: 0;
  z-index: 4;
  overflow: hidden;
  pointer-events: none;
}

.presentation-path-branch-cards {
  position: absolute;
  inset: 0;
  z-index: 5;
  overflow: hidden;
  pointer-events: none;
}

.presentation-current-learning-label {
  position: absolute;
  pointer-events: none;
}

.presentation-current-learning-label__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: presentation-current-label-float 3.6s ease-in-out infinite;
}

.presentation-current-learning-label__text {
  padding: 3px 10px;
  border-radius: 999px;
  font-family: var(--font-sans, "Noto Sans SC", "PingFang SC", sans-serif);
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  color: #fff;
  white-space: nowrap;
  background: linear-gradient(135deg, #1677ff 0%, #575aff 100%);
  border: 1px solid rgba(255, 255, 255, 0.92);
  box-shadow:
    0 4px 14px rgba(22, 119, 255, 0.32),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
}

.presentation-current-learning-label__tail {
  width: 1.5px;
  height: 14px;
  margin-top: 2px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(22, 119, 255, 0.88) 0%, rgba(22, 119, 255, 0.42) 72%, rgba(22, 119, 255, 0.12) 100%);
}

.presentation-current-learning-label__tail::after {
  content: "";
  display: block;
  width: 5px;
  height: 5px;
  margin: 2px 0 0 -1.75px;
  border-radius: 50%;
  background: #1677ff;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.92);
}

@keyframes presentation-current-label-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

@media (prefers-reduced-motion: reduce) {
  .presentation-current-learning-label__inner {
    animation: none;
  }
}

.presentation-path-edge {
  position: absolute;
  top: 0;
  bottom: 56px;
  z-index: 2;
  width: 72px;
  pointer-events: none;
  display: flex;
  align-items: center;
}

.presentation-path-edge--left {
  left: 0;
  justify-content: flex-start;
  padding-left: 10px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.72) 0%, rgba(255, 255, 255, 0) 100%);
}

.presentation-path-edge--right {
  right: 0;
  justify-content: flex-end;
  padding-right: 10px;
  background: linear-gradient(270deg, rgba(255, 255, 255, 0.72) 0%, rgba(255, 255, 255, 0) 100%);
}

.presentation-path-edge__hint {
  font-size: 11px;
  font-weight: 600;
  color: rgba(96, 98, 102, 0.82);
  white-space: nowrap;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 12px rgba(71, 85, 105, 0.08);
  animation: presentation-edge-hint-breathe 3.8s ease-in-out infinite;
}

.presentation-path-edge--right .presentation-path-edge__hint {
  animation-delay: 1.2s;
}

@keyframes presentation-edge-hint-breathe {
  0%, 100% { opacity: 0.76; transform: translateX(0); }
  50% { opacity: 1; transform: translateX(2px); }
}

.presentation-path-edge--left .presentation-path-edge__hint {
  animation-name: presentation-edge-hint-breathe-left;
}

@keyframes presentation-edge-hint-breathe-left {
  0%, 100% { opacity: 0.76; transform: translateX(0); }
  50% { opacity: 1; transform: translateX(-2px); }
}

.presentation-path {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  pointer-events: none;
}

.presentation-path--glow {
  stroke: rgba(22, 119, 255, 0.14);
  stroke-width: 20;
  filter: blur(5px);
  animation: presentation-path-glow-breathe 5.6s ease-in-out infinite;
}

@keyframes presentation-path-glow-breathe {
  0%, 100% { opacity: 0.72; }
  50% { opacity: 1; }
}

.presentation-path--bed {
  stroke: url(#presentationPathBedGrad);
  stroke-width: 11;
  filter: drop-shadow(0 2px 6px rgba(15, 23, 42, 0.07));
}

.presentation-path-network {
  pointer-events: none;
}

.presentation-path-junction {
  fill: url(#presentationPathBedGrad);
  stroke: rgba(255, 255, 255, 0.94);
  stroke-width: 1.2;
  filter: drop-shadow(0 1px 3px rgba(15, 23, 42, 0.06));
  pointer-events: none;
}

.presentation-path-junction.is-active {
  fill: #1677ff;
  fill-opacity: 0.14;
  stroke: rgba(22, 119, 255, 0.38);
}

.presentation-path--progress-shine-branch {
  opacity: 0.42;
}

.presentation-node-card__name--branch {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.presentation-node-card__branch-tag {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 16px;
  padding: 0 5px;
  border-radius: 999px;
  border: 1px solid rgba(22, 119, 255, 0.24);
  background: rgba(239, 246, 255, 0.96);
  color: #1677ff;
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.02em;
}

.presentation-node-card__branch-tag.is-mastered {
  border-color: rgba(82, 196, 26, 0.28);
  background: rgba(246, 255, 237, 0.96);
  color: #389e0d;
}

.presentation-node-card__branch-tag.is-attention {
  border-color: rgba(245, 158, 11, 0.28);
  background: rgba(255, 251, 235, 0.96);
  color: #d97706;
}

.presentation-node-card__branch-tag.is-weak {
  border-color: rgba(22, 119, 255, 0.24);
  background: rgba(239, 246, 255, 0.96);
  color: #1677ff;
}

.presentation-node-card__branch-tag.is-locked {
  border-color: rgba(148, 163, 184, 0.28);
  background: rgba(248, 250, 252, 0.96);
  color: #94a3b8;
}

.presentation-node-card__branch-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.presentation-path--future {
  stroke: rgba(148, 163, 184, 0.62);
  stroke-width: 4;
  stroke-dasharray: 5 11;
  animation: presentation-path-future-march 22s linear infinite;
}

@keyframes presentation-path-future-march {
  from { stroke-dashoffset: var(--path-future-base, 0); }
  to { stroke-dashoffset: calc(var(--path-future-base, 0px) - 32px); }
}

.presentation-path--progress {
  stroke-width: 5.5;
  transition: stroke-dasharray 0.75s cubic-bezier(0.22, 1, 0.36, 1);
  animation: presentation-path-progress-glow 4.2s ease-in-out infinite;
}

@keyframes presentation-path-progress-glow {
  0%, 100% { opacity: 0.92; }
  50% { opacity: 1; }
}

.presentation-path--progress-shine {
  stroke: rgba(255, 255, 255, 0.52);
  stroke-width: 2;
  stroke-dasharray: 14 220;
  animation: presentation-path-shine-flow 3.6s linear infinite;
  mix-blend-mode: soft-light;
}

@keyframes presentation-path-shine-flow {
  from { stroke-dashoffset: 0; }
  to { stroke-dashoffset: -48; }
}

.presentation-path--progress-head {
  stroke: rgba(255, 255, 255, 0.92);
  stroke-width: 5;
  filter: drop-shadow(0 0 4px rgba(22, 119, 255, 0.45));
  animation: presentation-path-head-pulse 2.4s ease-in-out infinite;
}

@keyframes presentation-path-head-pulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}

.presentation-path-legend {
  position: absolute;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 0;
  padding: 9px 18px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(18px) saturate(1.1);
  -webkit-backdrop-filter: blur(18px) saturate(1.1);
  border: 1px solid rgba(255, 255, 255, 0.98);
  box-shadow:
    0 8px 24px rgba(71, 85, 105, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.98);
  pointer-events: auto;
}

.presentation-path-legend__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.presentation-path-legend__divider {
  width: 1px;
  height: 12px;
  margin: 0 14px;
  background: rgba(228, 231, 237, 0.95);
}

.presentation-path-legend__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.presentation-path-legend__item--mastered .presentation-path-legend__dot {
  background: #52c41a;
  box-shadow: 0 0 0 2px rgba(82, 196, 26, 0.18);
}

.presentation-path-legend__item--attention .presentation-path-legend__dot {
  background: #dca707;
  box-shadow: 0 0 0 2px rgba(220, 167, 7, 0.18);
}

.presentation-path-legend__item--weak .presentation-path-legend__dot {
  background: #ef4444;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.16);
}

.presentation-path-legend__item--locked .presentation-path-legend__dot {
  background: #94a3b8;
  box-shadow: 0 0 0 2px rgba(148, 163, 184, 0.16);
}

.presentation-path-legend__label {
  font-size: 12px;
  font-weight: 500;
  color: #606266;
  white-space: nowrap;
}

.presentation-path-node {
  pointer-events: all;
  cursor: pointer;
  transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
}

.presentation-path-viewport.is-panning .presentation-path-node {
  pointer-events: none;
}

.presentation-path-node.is-highlighted,
.presentation-path-node:hover {
  transform: translateY(-4px);
}

.presentation-path-node__pulse {
  opacity: 0;
  pointer-events: none;
  stroke: rgba(22, 119, 255, 0.45);
  transform-origin: center;
  transform-box: fill-box;
}

.presentation-path-node.is-focus .presentation-path-node__pulse {
  opacity: 1;
  animation: presentation-node-pulse-ring 2.6s ease-in-out infinite;
}

.presentation-path-node.is-mastered.is-focus .presentation-path-node__pulse {
  stroke: rgba(82, 196, 26, 0.5);
}

.presentation-path-node.is-attention.is-focus .presentation-path-node__pulse {
  stroke: rgba(245, 158, 11, 0.48);
}

.presentation-path-node.is-weak.is-focus .presentation-path-node__pulse {
  stroke: rgba(239, 68, 68, 0.46);
}

.presentation-path-node.is-locked.is-focus .presentation-path-node__pulse {
  stroke: rgba(148, 163, 184, 0.42);
}

.presentation-path-node__marker {
  transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1), filter 0.2s ease;
}

.presentation-path-node__marker.is-status-asset {
  filter: url(#presentationMarkerShadow);
}

.presentation-path-node.is-locked .presentation-path-node__marker {
  filter: url(#presentationMarkerShadow) grayscale(1);
}

.presentation-path-node.is-highlighted .presentation-path-node__marker,
.presentation-path-node:hover .presentation-path-node__marker {
  transform: scale(1.04);
  transform-origin: center bottom;
  transform-box: fill-box;
}

.presentation-node-card {
  position: absolute;
  box-sizing: border-box;
  padding: 6px 8px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.96);
  background: rgba(255, 255, 255, 0.94);
  box-shadow:
    0 8px 20px rgba(71, 85, 105, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.98);
  text-align: center;
  font-family: var(--font-sans, "Noto Sans SC", "PingFang SC", sans-serif);
  pointer-events: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.presentation-node-card.is-clickable {
  pointer-events: auto;
  cursor: pointer;
}

.presentation-node-card.is-locked {
  pointer-events: auto;
  cursor: pointer;
}

.presentation-node-card.is-clickable:hover {
  box-shadow:
    0 10px 24px rgba(71, 85, 105, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.98);
}

.presentation-node-card__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  min-width: 0;
}

.presentation-node-card__name {
  margin: 0;
  width: 100%;
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.presentation-node-card__type {
  margin: 2px 0 0;
  font-size: 12px;
  font-weight: 400;
  line-height: 14px;
  color: #666;
}

.presentation-node-card__type.is-theory,
.presentation-node-card__type.is-practice,
.presentation-node-card__type.is-integrated {
  color: #666;
}

.presentation-node-card__meta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin: 2px 0 0;
  font-size: 12px;
  font-weight: 500;
  line-height: 15px;
  color: #909399;
}

.presentation-node-card.has-no-type .presentation-node-card__meta {
  margin-top: 2px;
}

.presentation-node-card__meta strong {
  font-family: var(--font-num, "OPPO Sans", "Noto Sans SC", sans-serif);
  font-size: 12px;
  font-weight: 700;
}

.presentation-node-card.is-highlighted {
  box-shadow:
    0 12px 28px rgba(71, 85, 105, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.98);
}

.presentation-node-card.is-mastered {
  border-color: rgba(82, 196, 26, 0.22);
  background: linear-gradient(180deg, #ffffff 0%, #f6fff4 100%);
}

.presentation-node-card.is-attention {
  border-color: rgba(220, 167, 7, 0.24);
  background: linear-gradient(180deg, #ffffff 0%, #fffdf5 100%);
}

.presentation-node-card.is-weak {
  border-color: rgba(239, 68, 68, 0.22);
  background: linear-gradient(180deg, #ffffff 0%, #fff8f8 100%);
}

.presentation-node-card.is-locked {
  border-color: rgba(148, 163, 184, 0.28);
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.presentation-node-card.is-focus.is-mastered {
  box-shadow:
    0 8px 20px rgba(82, 196, 26, 0.14),
    0 0 0 2px rgba(82, 196, 26, 0.12);
}

.presentation-node-card.is-focus.is-attention {
  box-shadow:
    0 8px 20px rgba(220, 167, 7, 0.14),
    0 0 0 2px rgba(220, 167, 7, 0.12);
}

.presentation-node-card.is-focus.is-weak {
  box-shadow:
    0 8px 20px rgba(239, 68, 68, 0.12),
    0 0 0 2px rgba(239, 68, 68, 0.1);
}

.presentation-node-card.is-focus.is-locked {
  box-shadow:
    0 8px 20px rgba(148, 163, 184, 0.12),
    0 0 0 2px rgba(148, 163, 184, 0.1);
}

.presentation-node-card__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.presentation-node-card.is-mastered .presentation-node-card__meta {
  color: #52c41a;
  font-weight: 500;
}

.presentation-node-card.is-mastered .presentation-node-card__dot {
  background: #52c41a;
  box-shadow: 0 0 0 2px rgba(82, 196, 26, 0.16);
}

.presentation-node-card.is-attention .presentation-node-card__meta {
  color: #b8860b;
}

.presentation-node-card.is-attention .presentation-node-card__dot {
  background: #dca707;
}

.presentation-node-card.is-weak .presentation-node-card__meta {
  color: #dc2626;
}

.presentation-node-card.is-weak .presentation-node-card__dot {
  background: #ef4444;
}

.presentation-node-card.is-locked .presentation-node-card__meta {
  color: #94a3b8;
}

.presentation-node-card.is-locked .presentation-node-card__dot {
  background: #cbd5e1;
}

@keyframes presentation-node-pulse-ring {
  0%, 100% {
    transform: scale(0.88);
    opacity: 0.48;
  }
  50% {
    transform: scale(1.28);
    opacity: 0.1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .presentation-path-edge__hint,
  .presentation-path--glow,
  .presentation-path--future,
  .presentation-path--progress,
  .presentation-path--progress-shine,
  .presentation-path--progress-head,
  .presentation-current-learning-label__inner,
  .presentation-path-node.is-focus .presentation-path-node__pulse {
    animation: none !important;
  }

  .presentation-path--progress {
    opacity: 1;
  }
}
</style>
