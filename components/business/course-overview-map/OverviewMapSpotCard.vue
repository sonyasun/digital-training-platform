<script setup lang="ts">
import type { OverviewStatus } from './types'
import OverviewStatusIcon from './OverviewStatusIcon.vue'

defineProps<{
  status: OverviewStatus
  order: number
  name: string
  done: number
  total: number
  statusText: string
  enterDelay?: number
}>()
</script>

<template>
  <article
    class="island-card city-card"
    :class="`is-${status}`"
    :style="enterDelay != null ? { animationDelay: `${enterDelay}s` } : undefined"
  >
    <div class="city-card-head">
      <span class="city-order" :class="`is-${status}`">{{ order }}</span>
      <strong>{{ name }}</strong>
    </div>
    <span class="island-count">{{ done }}/{{ total }}</span>
    <em>
      <OverviewStatusIcon :status="status" variant="card" />
      {{ statusText }}
    </em>
  </article>
</template>

<style scoped>
.island-card {
  position: relative;
  z-index: 3;
  text-align: center;
  animation: card-float 5.2s ease-in-out infinite;
  transition:
    border-color 220ms ease,
    box-shadow 220ms ease,
    transform 220ms ease;
}

.island-card.city-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 148px;
  max-width: 92%;
  padding: 10px 14px 11px;
  border: 1px solid rgba(255, 255, 255, 0.88);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow:
    0 10px 28px rgba(71, 85, 105, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.98);
}

.island-card.city-card.is-completed::before {
  content: "";
  position: absolute;
  inset: -5px;
  z-index: -1;
  border-radius: 18px;
  background: radial-gradient(
    ellipse at 50% 42%,
    rgba(82, 196, 26, 0.16) 0%,
    rgba(82, 196, 26, 0.05) 54%,
    transparent 76%
  );
  animation: card-halo-pulse 4.8s ease-in-out infinite;
  pointer-events: none;
}

.island-card.city-card.is-completed {
  gap: 2px;
  min-width: 148px;
  padding: 10px 14px 11px;
  border: 1px solid rgba(82, 196, 26, 0.22);
  border-radius: 14px;
  background: linear-gradient(180deg, #ffffff 0%, #f6fff4 100%);
  box-shadow:
    0 10px 28px rgba(71, 85, 105, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(var(--glass-blur, 16px)) saturate(var(--glass-saturate, 1.08));
  -webkit-backdrop-filter: blur(var(--glass-blur, 16px)) saturate(var(--glass-saturate, 1.08));
}

.city-card-head {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  max-width: 100%;
}

.city-order {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  color: #fff;
  font-size: var(--font-min, 12px);
  line-height: 1;
  font-weight: 700;
  font-family: var(--font-num, Inter, "SF Pro Display", sans-serif);
}

.city-order.is-completed { background: #52c41a; }
.city-order.is-active { background: #1677ff; }
.city-order.is-locked { background: #94a3b8; }

.island-card.city-card strong {
  font-size: var(--font-16, 16px);
  line-height: var(--lh-16, 24px);
  font-weight: 700;
  color: #1a2332;
}

.island-count {
  display: block;
  margin-top: 0;
  color: #64748b;
  font-size: var(--font-14, 14px);
  line-height: var(--lh-14, 22px);
  font-variant-numeric: tabular-nums;
  font-family: var(--font-num, Inter, "SF Pro Display", sans-serif);
}

.island-card.city-card.is-completed .island-count {
  color: #52c41a;
  font-style: italic;
  font-weight: 500;
}

.island-card.city-card em {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  margin-top: 2px;
  padding: 0;
  border-radius: 0;
  background: transparent;
  color: var(--color-text-3);
  font-size: var(--font-min, 12px);
  line-height: var(--lh-12, 20px);
  font-style: normal;
}

.island-card.city-card.is-completed em { color: #52c41a; font-weight: 500; }
.island-card.city-card.is-active em { color: #1677ff; }
.island-card.city-card.is-locked em { color: #94a3b8; }

.island-card.city-card.is-active {
  border-color: rgba(22, 119, 255, 0.24);
  background: linear-gradient(180deg, #ffffff 0%, #f0f7ff 100%);
  box-shadow:
    0 10px 28px rgba(71, 85, 105, 0.1),
    0 0 0 1px rgba(22, 119, 255, 0.1),
    0 0 24px rgba(22, 119, 255, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.98);
}

.island-card.city-card.is-active::before {
  content: "";
  position: absolute;
  inset: -5px;
  z-index: -1;
  border-radius: 18px;
  background: radial-gradient(
    ellipse at 50% 42%,
    rgba(22, 119, 255, 0.18) 0%,
    rgba(22, 119, 255, 0.06) 52%,
    transparent 76%
  );
  animation: card-halo-pulse 3.2s ease-in-out infinite;
  pointer-events: none;
}

.island-card.city-card.is-active strong { color: #1677ff; }

.island-card.city-card.is-locked {
  width: max-content;
  min-width: auto;
  max-width: none;
  background: rgba(248, 250, 252, 0.92);
  border-color: rgba(148, 163, 184, 0.28);
  box-shadow:
    0 10px 28px rgba(71, 85, 105, 0.08),
    0 0 0 1px rgba(148, 163, 184, 0.12),
    0 0 20px rgba(148, 163, 184, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.96);
}

.island-card.city-card.is-locked::before {
  content: "";
  position: absolute;
  inset: -5px;
  z-index: -1;
  border-radius: 18px;
  background: radial-gradient(
    ellipse at 50% 42%,
    rgba(148, 163, 184, 0.16) 0%,
    rgba(148, 163, 184, 0.05) 54%,
    transparent 76%
  );
  animation: card-halo-pulse 5.6s ease-in-out infinite;
  pointer-events: none;
}

.island-card.city-card.is-locked .city-card-head {
  max-width: none;
  white-space: nowrap;
}

.island-card.city-card.is-locked strong {
  display: inline;
  white-space: nowrap;
  color: #64748b;
}

.island-card.city-card.is-locked .island-count,
.island-card.city-card.is-locked em {
  white-space: nowrap;
}

@keyframes card-halo-pulse {
  0%, 100% {
    opacity: 0.62;
    scale: 0.97;
  }
  50% {
    opacity: 1;
    scale: 1.03;
  }
}

@keyframes card-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

@media (prefers-reduced-motion: reduce) {
  .island-card {
    animation: none;
    transition: none;
  }

  .island-card.city-card.is-completed::before,
  .island-card.city-card.is-active::before,
  .island-card.city-card.is-locked::before {
    animation: none;
  }
}

@media (max-width: 767px) {
  .island-card.city-card {
    min-width: 132px;
    padding: 8px 10px 9px;
  }

  .island-card.city-card.is-locked {
    min-width: auto;
    width: max-content;
  }

  .island-card.city-card.is-completed strong {
    font-size: var(--font-14, 14px);
    line-height: var(--lh-14, 22px);
  }

  .city-order {
    width: 20px;
    height: 20px;
    font-size: var(--font-min, 12px);
  }
}
</style>
