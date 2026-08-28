<script setup lang="ts">
import OverviewStatusIcon from './OverviewStatusIcon.vue'
</script>

<template>
  <div class="map-legend city-legend" aria-label="状态图例">
    <span class="leg-item is-completed">
      <OverviewStatusIcon status="completed" variant="legend" />
      已完成
    </span>
    <span class="leg-item is-active">
      <OverviewStatusIcon status="active" variant="legend" />
      进行中
    </span>
    <span class="leg-item is-locked">
      <OverviewStatusIcon status="locked" variant="legend" />
      未解锁
    </span>
  </div>
</template>

<style scoped>
.map-legend {
  position: absolute;
  left: 50%;
  bottom: 16px;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 9px 18px;
  transform: translateX(-50%);
  border: 1px solid rgba(255, 255, 255, 0.82);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  color: var(--color-text-2);
  box-shadow:
    var(--shadow-sm),
    inset 0 1px 0 rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(var(--glass-blur, 16px));
  -webkit-backdrop-filter: blur(var(--glass-blur, 16px));
  animation:
    legend-enter 720ms var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1)) 0.5s both,
    legend-float 7s ease-in-out 1.2s infinite;
}

.leg-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--color-text-2);
  font-size: var(--font-min, 12px);
  line-height: var(--lh-12, 20px);
  white-space: nowrap;
}

.leg-item.is-locked { color: var(--color-text-3); }

.leg-item :deep(svg) {
  flex-shrink: 0;
}

@keyframes legend-enter {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes legend-float {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-2px); }
}

@media (prefers-reduced-motion: reduce) {
  .map-legend {
    animation: none;
  }
}

@media (max-width: 767px) {
  .map-legend {
    gap: 10px;
    padding: 6px 10px;
  }
}
</style>
