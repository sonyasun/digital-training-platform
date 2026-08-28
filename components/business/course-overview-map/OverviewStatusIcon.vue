<script setup lang="ts">
import type { OverviewStatus } from './types'

export type StatusIconVariant = 'badge-city' | 'card' | 'legend'

const props = defineProps<{
  status: OverviewStatus
  variant: StatusIconVariant
}>()

/** 24×24 实心锁：外轮廓 + 锁梁内孔，比例均衡 */
const LOCK_SOLID_24 =
  'M12 3.5c-2.48 0-4.5 2.02-4.5 4.5V10H6.75A2.25 2.25 0 0 0 4.5 12.25v7.5A2.25 2.25 0 0 0 6.75 22h10.5a2.25 2.25 0 0 0 2.25-2.25v-7.5A2.25 2.25 0 0 0 17.25 10H16.5V8c0-2.48-2.02-4.5-4.5-4.5Zm0 2c1.38 0 2.5 1.12 2.5 2.5V10h-5V8c0-1.38 1.12-2.5 2.5-2.5Z'

/** 16×16 实心锁：与 24 版同构缩放 */
const LOCK_SOLID_16 =
  'M8 2.5c-1.65 0-3 1.35-3 3V6.667H4.5A1.5 1.5 0 0 0 3 8.167v5.666A1.5 1.5 0 0 0 4.5 15.333h7A1.5 1.5 0 0 0 13 13.833V8.167A1.5 1.5 0 0 0 11.5 6.667H11V5.5c0-1.65-1.35-3-3-3Zm0 1.333c.92 0 1.667.746 1.667 1.667V6.667H6.333V5.5c0-.92.746-1.667 1.667-1.667Z'

/** 统一定位针外形 */
const PIN_PATH =
  'M20 1.5C12.13 1.5 5.75 7.88 5.75 15.75c0 9.92 12.02 26.58 13.42 28.58a1.2 1.2 0 0 0 2.06 0c1.4-2 13.42-18.66 13.42-28.58C34.25 7.88 27.87 1.5 20 1.5Z'

const PIN_SIZE: Record<StatusIconVariant, { w: number; h: number }> = {
  'badge-city': { w: 40, h: 52 },
  card: { w: 14, h: 18 },
  legend: { w: 14, h: 18 },
}

const pinSize = PIN_SIZE[props.variant]
const pinWithShadow = props.variant === 'badge-city'
</script>

<template>
  <svg
    v-if="variant === 'badge-city' && status === 'completed'"
    viewBox="0 0 24 24"
    width="22"
    height="22"
    fill="none"
    stroke="#fff"
    stroke-width="2.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  ><path d="M5 12.5 9.2 17 19 7" /></svg>

  <svg
    v-else-if="variant === 'badge-city' && status === 'locked'"
    viewBox="0 0 24 24"
    width="20"
    height="20"
    aria-hidden="true"
  ><path fill="#fff" fill-rule="evenodd" :d="LOCK_SOLID_24" /></svg>

  <svg
    v-else-if="status === 'active'"
    class="pin-icon"
    :class="[`pin-icon--${variant}`]"
    viewBox="0 0 40 52"
    :width="pinSize.w"
    :height="pinSize.h"
    aria-hidden="true"
  >
    <defs v-if="pinWithShadow">
      <filter id="city-pin-shadow" x="-20%" y="-10%" width="140%" height="130%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#1677ff" flood-opacity="0.28" />
      </filter>
    </defs>
    <path
      :d="PIN_PATH"
      :fill="pinWithShadow ? 'currentColor' : '#1677ff'"
      :filter="pinWithShadow ? 'url(#city-pin-shadow)' : undefined"
    />
    <circle cx="20" cy="15.5" r="6" fill="#fff" />
    <circle
      v-if="pinWithShadow"
      cx="20"
      cy="15.5"
      r="6"
      fill="none"
      stroke="currentColor"
      stroke-opacity="0.12"
      stroke-width="1.2"
    />
  </svg>

  <svg
    v-else-if="variant === 'card' && status === 'completed'"
    viewBox="0 0 16 16"
    width="14"
    height="14"
    aria-hidden="true"
  ><circle cx="8" cy="8" r="7" fill="currentColor" /><path d="M5 8.1 7.1 10.2 11.2 6" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>

  <svg
    v-else-if="variant === 'card' && status === 'locked'"
    viewBox="0 0 16 16"
    width="14"
    height="14"
    aria-hidden="true"
  ><path fill="currentColor" fill-rule="evenodd" :d="LOCK_SOLID_16" /></svg>

  <svg
    v-else-if="variant === 'legend' && status === 'completed'"
    viewBox="0 0 16 16"
    width="14"
    height="14"
    aria-hidden="true"
  ><circle cx="8" cy="8" r="7" fill="#22c55e" /><path d="M5 8.1 7.1 10.2 11.2 6" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>

  <svg
    v-else-if="variant === 'legend' && status === 'locked'"
    viewBox="0 0 16 16"
    width="12"
    height="12"
    aria-hidden="true"
  ><path fill="currentColor" fill-rule="evenodd" :d="LOCK_SOLID_16" /></svg>
</template>

<style scoped>
.pin-icon {
  display: block;
  overflow: visible;
  flex-shrink: 0;
}

.pin-icon--badge-city,
.pin-icon--card,
.pin-icon--legend {
  color: #1677ff;
}
</style>
