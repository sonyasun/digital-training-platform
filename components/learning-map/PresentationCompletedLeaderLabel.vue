<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  /** 建筑贴图顶部 y（节点局部坐标） */
  buildingTopY: number
}>(), {})

const pinCenterY = computed(() => props.buildingTopY - 22)
const haloR = 15
const badgeR = 10
const lineEndY = computed(() => props.buildingTopY + 6)
</script>

<template>
  <g class="presentation-completed-leader" aria-label="已完成">
    <circle
      class="presentation-completed-leader__halo"
      cx="0"
      :cy="pinCenterY"
      :r="haloR"
    />
    <g class="presentation-completed-leader__pin">
      <circle
        class="presentation-completed-leader__badge"
        cx="0"
        :cy="pinCenterY"
        :r="badgeR"
      />
      <polyline
        class="presentation-completed-leader__check"
        :transform="`translate(0, ${pinCenterY})`"
        points="-3.2,0.5 -1.1,2.6 3.6,-3.2"
      />
    </g>
    <line
      class="presentation-completed-leader__line"
      x1="0"
      :y1="pinCenterY + badgeR"
      x2="0"
      :y2="lineEndY"
    />
    <circle
      class="presentation-completed-leader__anchor"
      cx="0"
      :cy="lineEndY"
      r="2.2"
    />
  </g>
</template>

<style scoped>
.presentation-completed-leader {
  pointer-events: none;
}

.presentation-completed-leader__halo {
  fill: url(#presentationCompletedHaloGrad);
  filter: url(#presentationCompletedHaloGlow);
  animation: presentation-completed-halo 4.5s ease-in-out infinite;
}

.presentation-completed-leader__pin {
  animation: presentation-completed-float 4.8s ease-in-out infinite;
}

.presentation-completed-leader__badge {
  fill: url(#presentationCompletedBadgeGrad);
  stroke: rgba(255, 255, 255, 0.98);
  stroke-width: 1.2;
  filter: url(#presentationCompletedBadgeShadow);
}

.presentation-completed-leader__check {
  fill: none;
  stroke: #fff;
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-linejoin: round;
  pointer-events: none;
}

.presentation-completed-leader__line {
  stroke: #52c41a;
  stroke-width: 1.5;
  stroke-dasharray: 2 3;
  stroke-linecap: round;
  opacity: 0.68;
  animation: presentation-completed-line-breathe 4.2s ease-in-out infinite;
}

.presentation-completed-leader__anchor {
  fill: #52c41a;
  stroke: rgba(255, 255, 255, 0.94);
  stroke-width: 0.9;
  filter: drop-shadow(0 1px 2px rgba(82, 196, 26, 0.28));
}

@keyframes presentation-completed-halo {
  0%, 100% { opacity: 0.68; }
  50% { opacity: 0.92; }
}

@keyframes presentation-completed-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-1px); }
}

@keyframes presentation-completed-line-breathe {
  0%, 100% { opacity: 0.42; }
  50% { opacity: 0.62; }
}

@media (prefers-reduced-motion: reduce) {
  .presentation-completed-leader__halo,
  .presentation-completed-leader__pin,
  .presentation-completed-leader__line {
    animation: none;
  }
}
</style>
