<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CourseCatalog } from './presentationCourseCatalog'
import { findCatalogLocation } from './presentationCourseCatalog'

const props = defineProps<{
  catalog: CourseCatalog
  activeChapterId?: string
  activeNodeId?: string | null
}>()

const emit = defineEmits<{
  (e: 'select-lesson', payload: { chapterId: string; nodeId: string; status?: string }): void
}>()

const panelOpen = ref(false)
const openTopics = ref<Set<string>>(new Set())

function expandToActive() {
  const nextTopics = new Set<string>()
  const location = findCatalogLocation(
    props.catalog,
    props.activeChapterId ?? '',
    props.activeNodeId,
  )
  if (location?.topicId) nextTopics.add(location.topicId)
  openTopics.value = nextTopics
}

function togglePanel() {
  panelOpen.value = !panelOpen.value
  if (panelOpen.value) expandToActive()
}

function toggleTopic(topicId: string) {
  const next = new Set(openTopics.value)
  if (next.has(topicId)) next.delete(topicId)
  else next.add(topicId)
  openTopics.value = next
}

function onSelectKnowledgePoint(chapterId: string, nodeId: string, status: string) {
  emit('select-lesson', { chapterId, nodeId, status })
}

watch(
  () => [props.activeChapterId, props.activeNodeId] as const,
  () => {
    if (panelOpen.value) expandToActive()
  },
)
</script>

<template>
  <div class="presentation-catalog" :class="{ 'is-open': panelOpen }">
    <button
      type="button"
      class="presentation-catalog__trigger"
      :aria-expanded="panelOpen"
      aria-controls="presentation-catalog-panel"
      aria-label="路径导航"
      @click="togglePanel"
    >
      <span class="presentation-catalog__trigger-label">路径导航</span>
      <svg
        class="presentation-catalog__trigger-caret"
        viewBox="0 0 12 12"
        width="12"
        height="12"
        aria-hidden="true"
      >
        <path d="M1.2 3.1 6 7.4l4.8-4.3" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>

    <div
      v-show="panelOpen"
      id="presentation-catalog-panel"
      class="presentation-catalog__panel"
      role="region"
      aria-label="路径导航"
    >
      <div v-if="catalog.chapter" class="presentation-catalog__tree">
        <section
          v-for="topic in catalog.chapter.topics"
          :key="topic.id"
          class="catalog-topic"
          :class="{ 'is-expanded': openTopics.has(topic.id) }"
        >
          <div class="catalog-row catalog-row--l2">
            <button
              type="button"
              class="catalog-row__caret"
              :aria-expanded="openTopics.has(topic.id)"
              @click="toggleTopic(topic.id)"
            >
              <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
                <path d="M1.2 3.1 6 7.4l4.8-4.3" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
            <button type="button" class="catalog-row__main" @click="toggleTopic(topic.id)">
              <span class="catalog-row__title">{{ topic.name }}</span>
              <span class="catalog-row__meta">{{ topic.knowledgePoints.length }} 项</span>
            </button>
          </div>

          <ul v-show="openTopics.has(topic.id)" class="catalog-points">
            <li
              v-for="point in topic.knowledgePoints"
              :key="point.id"
              class="catalog-point"
              :class="[
                `is-${point.status}`,
                {
                  'is-current': point.isCurrent || (point.id === activeNodeId && catalog.chapter?.id === activeChapterId),
                },
              ]"
            >
              <button
                type="button"
                class="catalog-point__btn"
                :disabled="point.status === 'locked'"
                @click="onSelectKnowledgePoint(point.chapterId, point.id, point.status)"
              >
                <span class="catalog-point__dot" aria-hidden="true" />
                <span class="catalog-point__name">{{ point.name }}</span>
                <span v-if="point.nodeType" class="catalog-point__type">{{ point.nodeType }}</span>
              </button>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.presentation-catalog {
  position: absolute;
  /* slpath-map__head: top 16px + row ~34px + gap 16px */
  top: 66px;
  left: 18px;
  z-index: 6;
  pointer-events: auto;
  max-width: min(320px, calc(100% - 36px));
  font-family: var(--font-sans);
  font-variant-numeric: tabular-nums;
  -webkit-font-smoothing: antialiased;
}

.presentation-catalog__trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 6px 14px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(14px) saturate(1.1);
  -webkit-backdrop-filter: blur(14px) saturate(1.1);
  box-shadow:
    0 6px 18px rgba(71, 85, 105, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
  color: var(--text-primary);
  font-size: var(--font-14);
  line-height: var(--lh-14);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition:
    background var(--duration) var(--ease),
    box-shadow var(--duration) var(--ease),
    color var(--duration) var(--ease);
}

.presentation-catalog__trigger:hover {
  background: rgba(255, 255, 255, 0.92);
  color: var(--color-primary);
}

.presentation-catalog__trigger:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring), inset 0 1px 0 rgba(255, 255, 255, 0.95);
}

.presentation-catalog__trigger-caret {
  color: var(--text-muted);
  transition: transform var(--duration) var(--ease);
}

.presentation-catalog.is-open .presentation-catalog__trigger-caret {
  transform: rotate(180deg);
}

.presentation-catalog__panel {
  margin-top: 8px;
  width: 300px;
  max-height: min(400px, calc(100% - 88px));
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: var(--radius-xl);
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(18px) saturate(1.12);
  -webkit-backdrop-filter: blur(18px) saturate(1.12);
  box-shadow:
    0 10px 28px rgba(71, 85, 105, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.98);
}

.presentation-catalog__tree {
  overflow: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.catalog-row {
  display: flex;
  align-items: stretch;
  gap: 4px;
  min-height: 0;
}

.catalog-row--l2 {
  min-height: 36px;
}

.catalog-row__caret {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  flex-shrink: 0;
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: var(--radius-md);
}

.catalog-row__caret:hover {
  background: rgba(22, 119, 255, 0.06);
  color: var(--color-primary);
}

.catalog-row__caret:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.catalog-row__caret svg {
  transform: rotate(-90deg);
  transition: transform var(--duration) var(--ease);
}

.catalog-topic.is-expanded > .catalog-row--l2 .catalog-row__caret svg {
  transform: rotate(0deg);
}

.catalog-row__main {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px 8px 0;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
  border-radius: var(--radius-lg);
}

.catalog-row__main:disabled {
  cursor: not-allowed;
  opacity: 0.68;
}

.catalog-row__main:hover:not(:disabled) {
  background: rgba(22, 119, 255, 0.05);
}

.catalog-row__main:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.catalog-row__title {
  flex: 1;
  min-width: 0;
  font-size: var(--font-14);
  line-height: var(--lh-14);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.catalog-row__meta {
  flex-shrink: 0;
  font-size: var(--font-14);
  line-height: var(--lh-14);
  font-weight: var(--font-weight-regular);
  color: var(--text-muted);
}

.catalog-topic {
  margin-top: 0;
}

.catalog-row--l2 .catalog-row__title {
  font-size: var(--font-14);
  line-height: var(--lh-14);
  font-weight: var(--font-weight-regular);
  color: var(--text-secondary);
}

.catalog-points {
  list-style: none;
  margin: 0;
  padding: 0 0 4px 24px;
}

.catalog-point__btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  padding: 6px 10px;
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.catalog-point__btn:disabled {
  cursor: not-allowed;
  opacity: 0.56;
}

.catalog-point__btn:hover:not(:disabled) {
  background: rgba(22, 119, 255, 0.06);
}

.catalog-point__btn:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.catalog-point.is-current .catalog-point__btn {
  background: rgba(22, 119, 255, 0.08);
}

.catalog-point__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--border-base);
  flex-shrink: 0;
}

.catalog-point.is-completed .catalog-point__dot {
  background: var(--color-success);
}

.catalog-point.is-in-progress .catalog-point__dot,
.catalog-point.is-current .catalog-point__dot {
  background: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.14);
}

.catalog-point.is-locked .catalog-point__dot {
  background: var(--color-locked);
}

.catalog-point__name {
  flex: 1;
  min-width: 0;
  font-size: var(--font-14);
  line-height: var(--lh-14);
  font-weight: var(--font-weight-regular);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.catalog-point__type {
  flex-shrink: 0;
  font-size: var(--font-14);
  line-height: var(--lh-14);
  color: var(--text-muted);
}

.catalog-point.is-current .catalog-point__name {
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
}
</style>
