<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import CourseOverviewMap from './business/CourseOverviewMap.vue'
import LearningMap from './learning-map/LearningMap.vue'
import type { OverviewModule, OverviewSkin } from './business/CourseOverviewMap.vue'
import type { PathNodeLike } from './learning-map/types'
import {
  buildChapterNavigationList,
  chapterHasPathData,
  getChapterPathTitle,
  getCurrentNodeIndex,
  getPathNodesForChapter,
} from './learning-map/demo/chapterPathNodes'
import { buildCourseCatalog } from './learning-map/presentationCourseCatalog'
import {
  formatPrerequisiteLockMessage,
  isPathNodeUnlocked,
  resolvePathNodeLockType,
} from './learning-map/pathNodeLock'

const STORAGE_KEY = 'slpath-map-skin'

type PathView = 'overview' | 'chapter'

type ChapterNodeSnapshot = {
  id: string
  name: string
  shortName: string
  nodeType: string
  status?: string
  mastery?: number
  isCurrent?: boolean
  isRecommended?: boolean
  isWeak?: boolean
  resources: string
  duration: string
  description: string
}

export type SlpathChapterStateDetail = {
  view: 'chapter'
  chapterId: string
  chapterName: string
  chapterTitle: string
  module: OverviewModule | null
  nodes: ChapterNodeSnapshot[]
  hoveredNodeId: string | null
  selectedNodeId: string | null
  focusNode: ChapterNodeSnapshot | null
  currentNode: ChapterNodeSnapshot | null
  progress: { done: number; total: number; percent: number }
  pathSummary: string
  reinforceNodes: ChapterNodeSnapshot[]
  aiSuggestion: string
}

const modules: OverviewModule[] = [
  { id: 'ch1', name: '智能建造概论', done: 7, total: 7, status: 'completed', islandType: 'eco' },
  { id: 'ch2', name: '智能建造关键技术', done: 12, total: 29, status: 'active', islandType: 'tech' },
  { id: 'ch3', name: '智能建造全寿命周期应用', done: 0, total: 16, status: 'locked', islandType: 'eco', islandAsset: 'assets/course-overview/course-island-life-alpha.png' },
  { id: 'ch4', name: '智能建造项目管理', done: 0, total: 12, status: 'locked', islandType: 'tech', islandAsset: 'assets/course-overview/course-island-mgmt-alpha.png' },
]

const skin = ref<OverviewSkin>(readSkin())

function resolveInitialRoute(): {
  view: PathView
  chapterId: string
  nodeId: string | null
} {
  const { chapterId, nodeId } = readRouteIntent()
  if (!chapterId || !chapterHasPathData(chapterId)) {
    return { view: 'overview', chapterId: '', nodeId: null }
  }
  const mod = modules.find(item => item.id === chapterId)
  if (!mod || mod.status === 'locked') {
    return { view: 'overview', chapterId: '', nodeId: null }
  }
  return { view: 'chapter', chapterId, nodeId }
}

const initialRoute = resolveInitialRoute()
const view = ref<PathView>(initialRoute.view)
const activeChapterId = ref(initialRoute.chapterId)
const hoveredNodeId = ref<string | null>(null)
const selectedNodeId = ref<string | null>(initialRoute.nodeId)
const manuallyUnlockedNodeIds = ref<Set<string>>(new Set())

const unlockModal = ref<{ node: PathNodeLike } | null>(null)
const lockNotice = ref<{
  nodeName: string
  message: string
  prerequisites: string[]
} | null>(null)

const chapterList = computed(() => buildChapterNavigationList(modules))

const activeModule = computed(() => modules.find(mod => mod.id === activeChapterId.value) ?? null)

const chapterPathNodes = computed(() => {
  const nodes = getPathNodesForChapter(activeChapterId.value)
  if (manuallyUnlockedNodeIds.value.size === 0) return nodes

  return nodes.map(node => {
    if (!manuallyUnlockedNodeIds.value.has(node.id)) return node
    return applyManualUnlock(node)
  })
})

const chapterTitle = computed(() => {
  if (!activeModule.value) return ''
  return getChapterPathTitle(activeChapterId.value, activeModule.value.name)
})

const currentNodeIndex = computed(() => getCurrentNodeIndex(activeChapterId.value))

const courseCatalog = computed(() => buildCourseCatalog(
  'BIM装饰工程计量与计价',
  modules,
  activeChapterId.value,
  selectedNodeId.value,
))

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

function snapshotNode(node: PathNodeLike): ChapterNodeSnapshot {
  return {
    id: node.id,
    name: node.name,
    shortName: node.shortName,
    nodeType: node.nodeType,
    status: node.status,
    mastery: node.mastery,
    isCurrent: node.isCurrent,
    isRecommended: node.isRecommended,
    isWeak: node.isWeak,
    resources: node.resources,
    duration: node.duration,
    description: node.description,
  }
}

function buildPathSummary(nodes: PathNodeLike[]) {
  return nodes
    .filter(node => node.shapeType !== 'reinforce')
    .map(node => node.shortName || node.name)
    .join(' → ')
}

function buildChapterAiSuggestion(
  focus: ChapterNodeSnapshot | null,
  module: OverviewModule | null,
  nodes: PathNodeLike[],
) {
  if (focus) {
    if (focus.status === 'completed') {
      return `「${focus.name}」已完成，可复习该节点或继续学习后续内容。`
    }
    if (focus.isCurrent || focus.status === 'in-progress') {
      const mastery = focus.mastery ?? 0
      if (focus.isWeak || (mastery > 0 && mastery < 60)) {
        return `「${focus.name}」掌握率 ${mastery}% ，低于阈值，建议先完成关联补强节点。`
      }
      return `建议优先学习「${focus.name}」，预计用时 ${focus.duration}，资源：${focus.resources}。`
    }
    if (focus.isRecommended) {
      return `推荐完成补强节点「${focus.name}」，巩固当前章节薄弱知识点。`
    }
    return `「${focus.name}」尚未开始，完成前置节点后可解锁。`
  }
  if (module?.status === 'completed') {
    return `「${module.name}」章节已全部完成，可进入下一章节或复习本章路径。`
  }
  const current = nodes.find(node => node.isCurrent) ?? nodes.find(node => node.status === 'in-progress')
  if (current) {
    return `当前学习节点为「${current.name}」，继续推进即可完成本章 ${nodes.length} 个路径节点。`
  }
  return `正在查看「${module?.name ?? '章节'}」学习路径，点击节点可在右侧查看详情。`
}

function emitViewChange() {
  if (typeof document === 'undefined') return
  const module = activeModule.value
  document.dispatchEvent(new CustomEvent('slpath-view-change', {
    detail: {
      view: view.value,
      chapterId: activeChapterId.value,
      chapterName: module?.name ?? '',
      chapterTitle: chapterTitle.value,
      module,
    },
  }))
}

function emitChapterState() {
  if (typeof document === 'undefined' || view.value !== 'chapter') return

  const nodes = chapterPathNodes.value
  const module = activeModule.value
  const snapshots = nodes.map(snapshotNode)
  const currentNode = snapshots.find(node => node.isCurrent)
    ?? snapshots.find(node => node.status === 'in-progress')
    ?? null
  const focusNode = (hoveredNodeId.value
    ? snapshots.find(node => node.id === hoveredNodeId.value)
    : null)
    ?? (selectedNodeId.value
      ? snapshots.find(node => node.id === selectedNodeId.value)
      : null)
    ?? currentNode

  const mainNodes = nodes.filter(node => node.shapeType !== 'reinforce')
  const completedCount = mainNodes.filter(node => node.status === 'completed').length
  const progressPercent = mainNodes.length
    ? Math.round((completedCount / mainNodes.length) * 100)
    : 0

  const detail: SlpathChapterStateDetail = {
    view: 'chapter',
    chapterId: activeChapterId.value,
    chapterName: module?.name ?? '',
    chapterTitle: chapterTitle.value,
    module: module ?? null,
    nodes: snapshots,
    hoveredNodeId: hoveredNodeId.value,
    selectedNodeId: selectedNodeId.value,
    focusNode,
    currentNode,
    progress: {
      done: completedCount,
      total: mainNodes.length,
      percent: progressPercent,
    },
    pathSummary: buildPathSummary(nodes),
    reinforceNodes: snapshots.filter(node =>
      nodes.find(raw => raw.id === node.id)?.shapeType === 'reinforce'
      || node.isRecommended,
    ),
    aiSuggestion: buildChapterAiSuggestion(focusNode, module ?? null, nodes),
  }

  document.dispatchEvent(new CustomEvent('slpath-chapter-state', { detail }))
  ;(window as Window & { __slpathChapterState?: SlpathChapterStateDetail }).__slpathChapterState = detail
}

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

function shouldRestoreFromSession(): boolean {
  if (typeof document === 'undefined') return false
  try {
    return /student-node-study\.html/.test(document.referrer)
  } catch {
    return false
  }
}

function readRouteIntent(): { chapterId: string | null; nodeId: string | null } {
  const params = new URLSearchParams(window.location.search)
  let chapterId = params.get('chapterId')
  let nodeId = params.get('nodeId')

  if (!chapterId && shouldRestoreFromSession()) {
    try {
      const raw = sessionStorage.getItem('slpath-node-study')
      if (raw) {
        const payload = JSON.parse(raw) as { chapterId?: string; node?: { id?: string } }
        chapterId = payload.chapterId ?? null
        nodeId = nodeId || payload.node?.id || null
      }
    } catch {
      /* ignore */
    }
  }

  return { chapterId, nodeId }
}

function syncRouteToUrl() {
  if (typeof window === 'undefined') return

  const params = new URLSearchParams(window.location.search)
  params.set('skin', skin.value)

  if (view.value === 'chapter' && activeChapterId.value) {
    params.set('chapterId', activeChapterId.value)
    params.set('view', 'chapter')
    const mod = activeModule.value
    if (mod?.name) params.set('chapterName', mod.name)
    if (selectedNodeId.value) params.set('nodeId', selectedNodeId.value)
    else params.delete('nodeId')
  } else {
    params.delete('chapterId')
    params.delete('nodeId')
    params.delete('view')
    params.delete('chapterName')
  }

  const query = params.toString()
  const next = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
  if (next === current) return

  window.history.replaceState({ slpathView: view.value }, '', next)
}

async function openChapter(id: string) {
  const mod = modules.find(item => item.id === id)
  if (!mod || mod.status === 'locked' || !chapterHasPathData(id)) return

  activeChapterId.value = id
  view.value = 'chapter'
  hoveredNodeId.value = null
  selectedNodeId.value = null
  emitViewChange()
  syncRouteToUrl()
  await nextTick()
  emitChapterState()
}

function backToOverview() {
  view.value = 'overview'
  activeChapterId.value = ''
  hoveredNodeId.value = null
  selectedNodeId.value = null
  emitViewChange()
  syncRouteToUrl()
}

function onEnterModule(id: string) {
  void openChapter(id)
}

function onNodeHover(nodeId: string | null, _node: PathNodeLike | null) {
  hoveredNodeId.value = nodeId
  emitChapterState()
}

function applyManualUnlock(node: PathNodeLike): PathNodeLike {
  const mastery = Math.max(node.mastery ?? 0, 10)
  return {
    ...node,
    status: node.status === 'completed' ? node.status : 'in-progress',
    mastery,
    isCurrent: node.isCurrent ?? true,
  }
}

function emitLockNotice(
  payload: { nodeName: string; message: string; prerequisites: string[] },
  node: PathNodeLike,
  lockType: string,
) {
  if (typeof document !== 'undefined') {
    document.dispatchEvent(new CustomEvent('slpath-node-lock-notice', {
      detail: {
        ...payload,
        node: snapshotNode(node),
        lockType,
      },
    }))
  }
}

function closeLockNotice() {
  lockNotice.value = null
}

function showLockNotice(node: PathNodeLike, lockType: string) {
  const payload = formatPrerequisiteLockMessage(node, chapterPathNodes.value)
  lockNotice.value = payload
  emitLockNotice(payload, node, lockType)
}

function openUnlockModal(node: PathNodeLike) {
  unlockModal.value = { node }
}

function closeUnlockModal() {
  unlockModal.value = null
}

function confirmUnlockNode() {
  const target = unlockModal.value?.node
  if (!target) return

  manuallyUnlockedNodeIds.value = new Set([...manuallyUnlockedNodeIds.value, target.id])
  closeUnlockModal()
  emitChapterState()
  navigateToNodeStudy(applyManualUnlock(target))
}

function handleLockedNode(node: PathNodeLike) {
  const lockType = resolvePathNodeLockType(node, chapterPathNodes.value)
  if (!lockType) return

  if (lockType === 'confirm-unlock') {
    openUnlockModal(node)
    return
  }

  showLockNotice(node, lockType)
}

function navigateToNodeStudy(node: PathNodeLike) {
  selectedNodeId.value = node.id
  syncRouteToUrl()

  const payload = {
    chapterId: activeChapterId.value,
    chapterName: activeModule.value?.name ?? '',
    chapterTitle: chapterTitle.value,
    node: snapshotNode(node),
  }

  try {
    sessionStorage.setItem('slpath-node-study', JSON.stringify(payload))
  } catch {
    /* ignore */
  }

  const params = new URLSearchParams({
    chapterId: activeChapterId.value,
    nodeId: node.id,
    chapterName: activeModule.value?.name ?? '',
    skin: skin.value,
  })
  window.location.href = `student-node-study.html?${params.toString()}`
}

function selectPathNode(nodeId: string) {
  selectedNodeId.value = nodeId
  hoveredNodeId.value = nodeId
  emitChapterState()
  syncRouteToUrl()
}

function onNodeClick(nodeId: string, node: PathNodeLike) {
  selectPathNode(nodeId)
  if (isPathNodeUnlocked(node)) {
    navigateToNodeStudy(node)
    return
  }
  handleLockedNode(node)
}

function onCatalogLessonSelect(payload: { chapterId: string; nodeId: string }) {
  void (async () => {
    if (payload.chapterId !== activeChapterId.value) {
      await openChapter(payload.chapterId)
    }
    // 路径导航仅联动地图点位选中与滚动，不下钻学习页
    selectPathNode(payload.nodeId)
  })()
}

function onChapterChange(chapterId: string) {
  void openChapter(chapterId)
}

function onBackRequest() {
  backToOverview()
}

watch([activeChapterId, chapterPathNodes, currentNodeIndex], () => {
  if (view.value === 'chapter') emitChapterState()
})

async function restoreRouteFromUrl() {
  const { chapterId, nodeId } = readRouteIntent()
  if (!chapterId || !chapterHasPathData(chapterId)) {
    if (view.value !== 'overview') backToOverview()
    else emitViewChange()
    return
  }

  const mod = modules.find(item => item.id === chapterId)
  if (!mod || mod.status === 'locked') {
    backToOverview()
    return
  }

  if (view.value === 'chapter' && activeChapterId.value === chapterId) {
    if (nodeId) {
      selectedNodeId.value = nodeId
      hoveredNodeId.value = nodeId
    }
    emitViewChange()
    await nextTick()
    emitChapterState()
    return
  }

  await openChapter(chapterId)
  if (nodeId) selectPathNode(nodeId)
}

function onPageShow(event: PageTransitionEvent) {
  if (event.persisted) void restoreRouteFromUrl()
}

onMounted(() => {
  document.addEventListener('slpath-map-set-skin', onSetSkin)
  document.addEventListener('slpath-back-to-overview', onBackRequest)
  document.dispatchEvent(new CustomEvent('slpath-map-skin', { detail: skin.value }))
  ;(window as Window & { __slpathRestoreRoute?: () => Promise<void> }).__slpathRestoreRoute = restoreRouteFromUrl
  window.addEventListener('pageshow', onPageShow)
  void restoreRouteFromUrl().then(() => {
    document.dispatchEvent(new CustomEvent('slpath-mounted'))
  })
})

onBeforeUnmount(() => {
  document.removeEventListener('slpath-map-set-skin', onSetSkin)
  document.removeEventListener('slpath-back-to-overview', onBackRequest)
  window.removeEventListener('pageshow', onPageShow)
  delete (window as Window & { __slpathRestoreRoute?: () => Promise<void> }).__slpathRestoreRoute
})
</script>

<template>
  <div class="slpath-mount">
    <CourseOverviewMap
      v-if="view === 'overview'"
      :skin="skin"
      :modules="modules"
      @enter-module="onEnterModule"
    />
    <LearningMap
      v-else
      :path-nodes="chapterPathNodes"
      :current-node-index="currentNodeIndex"
      :chapter-name="chapterTitle"
      :chapter-list="chapterList"
      :selected-chapter="activeChapterId"
      :selected-node-id="selectedNodeId"
      :course-catalog="courseCatalog"
      mode="student"
      :hide-bird-view="true"
      :map-skin="skin"
      :hovered-node-id="hoveredNodeId"
      @node-hover="onNodeHover"
      @node-click="onNodeClick"
      @chapter-change="onChapterChange"
      @catalog-lesson-select="onCatalogLessonSelect"
    />
    <Teleport to="body">
      <div
        v-if="unlockModal"
        class="slpath-unlock-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="slpath-unlock-modal-title"
      >
        <button
          type="button"
          class="slpath-unlock-modal__backdrop"
          aria-label="关闭"
          @click="closeUnlockModal"
        />
        <div class="slpath-unlock-modal__panel">
          <h3 id="slpath-unlock-modal-title" class="slpath-unlock-modal__title">
            解锁知识点
          </h3>
          <p class="slpath-unlock-modal__desc">
            确定解锁并开始学习「{{ unlockModal.node.shortName || unlockModal.node.name }}」吗？
          </p>
          <div class="slpath-unlock-modal__actions">
            <button type="button" class="slpath-unlock-modal__btn slpath-unlock-modal__btn--ghost" @click="closeUnlockModal">
              取消
            </button>
            <button type="button" class="slpath-unlock-modal__btn slpath-unlock-modal__btn--primary" @click="confirmUnlockNode">
              确定解锁
            </button>
          </div>
        </div>
      </div>
      <div
        v-if="lockNotice"
        class="slpath-lock-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="slpath-lock-modal-title"
        aria-describedby="slpath-lock-modal-desc"
      >
        <button
          type="button"
          class="slpath-lock-modal__backdrop"
          aria-label="关闭"
          @click="closeLockNotice"
        />
        <div class="slpath-lock-modal__panel">
          <div class="slpath-lock-modal__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="28" height="28">
              <path
                d="M8 10V8a4 4 0 1 1 8 0v2"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
              />
              <rect
                x="5"
                y="10"
                width="14"
                height="11"
                rx="2.2"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
              />
              <circle cx="12" cy="15.2" r="1.3" fill="currentColor" />
              <path
                d="M12 16.5v2.2"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
              />
            </svg>
          </div>
          <h3 id="slpath-lock-modal-title" class="slpath-lock-modal__title">
            暂不可解锁
          </h3>
          <p class="slpath-lock-modal__node">
            「{{ lockNotice.nodeName }}」
          </p>
          <p id="slpath-lock-modal-desc" class="slpath-lock-modal__desc">
            {{ lockNotice.message }}
          </p>
          <div
            v-if="lockNotice.prerequisites.length"
            class="slpath-lock-modal__prereq"
          >
            <span class="slpath-lock-modal__prereq-label">需先完成前置知识点</span>
            <ul class="slpath-lock-modal__prereq-list">
              <li
                v-for="name in lockNotice.prerequisites"
                :key="name"
              >
                {{ name }}
              </li>
            </ul>
          </div>
          <button
            type="button"
            class="slpath-lock-modal__btn"
            @click="closeLockNotice"
          >
            我知道了
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.slpath-mount {
  width: 100%;
  height: 100%;
  min-height: 0;
}

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
  background: #f8fafc;
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

:deep(.lplj-root) {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.slpath-unlock-modal {
  position: fixed;
  inset: 0;
  z-index: 10050;
  display: grid;
  place-items: center;
  padding: 24px;
}

.slpath-unlock-modal__backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(15, 23, 42, 0.38);
  backdrop-filter: blur(2px);
}

.slpath-unlock-modal__panel {
  position: relative;
  z-index: 1;
  width: min(360px, 100%);
  padding: 20px 20px 16px;
  border-radius: 14px;
  border: 1px solid rgba(207, 215, 234, 0.88);
  background: linear-gradient(165deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96));
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.16);
}

.slpath-unlock-modal__title {
  margin: 0;
  font-size: var(--font-16);
  line-height: var(--lh-16);
  font-weight: var(--font-weight-medium);
  color: #1e293b;
}

.slpath-unlock-modal__desc {
  margin: 10px 0 0;
  font-size: var(--font-14);
  line-height: var(--lh-14);
  color: #64748b;
}

.slpath-unlock-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}

.slpath-unlock-modal__btn {
  min-width: 88px;
  min-height: 36px;
  padding: 0 14px;
  border-radius: 10px;
  font-size: var(--font-14);
  line-height: var(--lh-14);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
}

.slpath-unlock-modal__btn--ghost {
  border: 1px solid rgba(203, 213, 225, 0.95);
  background: rgba(255, 255, 255, 0.92);
  color: #475569;
}

.slpath-unlock-modal__btn--primary {
  border: 0;
  background: linear-gradient(51deg, #1677ff 8%, #575aff 100%);
  color: #fff;
}

.slpath-lock-modal {
  position: fixed;
  inset: 0;
  z-index: 10050;
  display: grid;
  place-items: center;
  padding: 24px;
}

.slpath-lock-modal__backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(15, 23, 42, 0.48);
  backdrop-filter: blur(3px);
}

.slpath-lock-modal__panel {
  position: relative;
  z-index: 1;
  width: min(400px, 100%);
  padding: 24px 22px 20px;
  border-radius: 16px;
  border: 1px solid rgba(254, 202, 202, 0.92);
  background: linear-gradient(165deg, #fff 0%, #fff7f7 100%);
  box-shadow:
    0 22px 56px rgba(185, 28, 28, 0.14),
    0 8px 24px rgba(15, 23, 42, 0.12);
  text-align: center;
  animation: slpath-lock-modal-in 0.28s cubic-bezier(0.22, 0.8, 0.24, 1);
}

@keyframes slpath-lock-modal-in {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.96);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.slpath-lock-modal__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  margin: 0 auto 12px;
  border-radius: 50%;
  background: linear-gradient(145deg, #fee2e2, #fecaca);
  color: #dc2626;
  box-shadow: inset 0 1px rgba(255, 255, 255, 0.72);
}

.slpath-lock-modal__title {
  margin: 0;
  font-size: var(--font-18, 18px);
  line-height: var(--lh-18, 26px);
  font-weight: var(--font-weight-medium);
  color: #991b1b;
}

.slpath-lock-modal__node {
  margin: 8px 0 0;
  font-size: var(--font-16);
  line-height: var(--lh-16);
  font-weight: var(--font-weight-medium);
  color: #1e293b;
}

.slpath-lock-modal__desc {
  margin: 10px 0 0;
  font-size: var(--font-14);
  line-height: var(--lh-14);
  color: #b45309;
}

.slpath-lock-modal__prereq {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(254, 242, 242, 0.88);
  border: 1px dashed rgba(252, 165, 165, 0.72);
  text-align: left;
}

.slpath-lock-modal__prereq-label {
  display: block;
  margin-bottom: 8px;
  font-size: var(--font-14);
  line-height: var(--lh-14);
  font-weight: var(--font-weight-medium);
  color: #991b1b;
}

.slpath-lock-modal__prereq-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.slpath-lock-modal__prereq-list li {
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(254, 202, 202, 0.88);
  font-size: var(--font-14);
  line-height: var(--lh-14);
  color: #7f1d1d;
}

.slpath-lock-modal__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 40px;
  margin-top: 18px;
  padding: 0 16px;
  border: 0;
  border-radius: 10px;
  background: linear-gradient(51deg, #ef4444 8%, #dc2626 100%);
  font-size: var(--font-14);
  line-height: var(--lh-14);
  font-weight: var(--font-weight-medium);
  color: #fff;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(220, 38, 38, 0.24);
}

.slpath-lock-modal__btn:hover {
  box-shadow: 0 10px 24px rgba(220, 38, 38, 0.32);
}

.slpath-lock-modal__btn:active {
  transform: translateY(1px);
}
</style>
