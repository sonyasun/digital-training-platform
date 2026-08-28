<script setup lang="ts">
import AdaptivePathSignatureModal from './business/AdaptivePathSignatureModal.vue'
</script>

<template>
  <AdaptivePathSignatureModal :open="true" embedded presentation-only />
</template>

<style scoped>
:deep(.signature-overlay) {
  display: flex;
  align-items: stretch;
  width: 100%;
  height: 100%;
}

:deep(.signature-card) {
  height: 100%;
  border-radius: inherit;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:deep(.signature-overlay.is-presentation-only .signature-body) {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: minmax(0, 1fr) auto;
  flex: 1;
  min-height: 0;
  height: 100%;
}

:deep(.signature-overlay.is-presentation-only .map-stage) {
  position: relative;
  min-height: 0;
  border-right: 0;
  background:
    linear-gradient(160deg, rgba(255, 255, 255, 0.58) 0%, rgba(237, 244, 255, 0.34) 46%, rgba(236, 253, 245, 0.22) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px 4px;
}

:deep(.map-stage::after) {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse at center, transparent 52%, rgba(15, 23, 42, 0.06) 100%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 18%, transparent 82%, rgba(241, 245, 255, 0.22));
  z-index: 3;
}

:deep(.map-mountains) {
  opacity: 0.64 !important;
  filter: saturate(0.95) contrast(1.02) brightness(1.02);
}

:deep(.map-wash) {
  opacity: 0.88;
}

:deep(.map-grid) {
  opacity: 0.16;
  mask-image: linear-gradient(to right, #000 0%, #000 78%, transparent 100%);
}

:deep(.learning-map) {
  position: relative;
  inset: auto;
  transform: none;
  width: min(100%, 860px);
  max-height: calc(100% - 8px);
  margin: auto;
  filter: drop-shadow(0 14px 28px rgba(15, 23, 42, 0.06));
  will-change: transform, opacity;
}

:deep(.path-signal),
:deep(.expand-main-signal),
:deep(.assistant-path) {
  filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.32));
}

:deep(.mastery-badge rect),
:deep(.extension-score rect) {
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

:deep(.reinforce-badge) {
  filter: drop-shadow(0 6px 16px rgba(239, 68, 68, 0.1));
}

:deep(.expand-badge) {
  filter: drop-shadow(0 6px 16px rgba(16, 185, 129, 0.1));
}

:deep(.extension-score) {
  filter: drop-shadow(0 6px 16px rgba(59, 130, 246, 0.1));
}

:deep(.data-pulse.is-live) {
  animation: pulse-glow 1.6s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow:
      0 0 0 6px rgba(52, 211, 153, 0.14),
      0 0 22px rgba(16, 185, 129, 0.35);
  }

  50% {
    box-shadow:
      0 0 0 10px rgba(52, 211, 153, 0.08),
      0 0 28px rgba(16, 185, 129, 0.48);
  }
}

:deep(.data-pulse) {
  box-shadow:
    0 0 0 6px rgba(52, 211, 153, 0.14),
    0 0 22px rgba(16, 185, 129, 0.35);
}

:deep(.scatter-a .scatter-halo) {
  fill: rgba(16, 185, 129, 0.16);
  stroke: rgba(16, 185, 129, 0.52);
}

:deep(.scatter-a .scatter-core) {
  filter: drop-shadow(0 6px 14px rgba(16, 185, 129, 0.28)) drop-shadow(0 2px 6px rgba(15, 23, 42, 0.12));
}

:deep(.scatter-a .planned-label) {
  fill: #047857 !important;
  font-weight: 700;
  stroke: rgba(255, 255, 255, 0.96);
  stroke-width: 4px;
}

:deep(.reinforce-node .node-name) {
  fill: #b45309 !important;
}

:deep(.extension-node .node-name) {
  fill: #1d4ed8 !important;
}

:deep(.map-node-core) {
  filter: drop-shadow(0 4px 10px rgba(15, 23, 42, 0.1));
}

:deep(.assistant-node.map-node--focus-lite .map-node-core) {
  filter: drop-shadow(0 6px 14px rgba(16, 185, 129, 0.24)) drop-shadow(0 2px 6px rgba(15, 23, 42, 0.1));
}

:deep(.insert-path) {
  filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.35));
}

:deep(.branch-line) {
  filter: drop-shadow(0 0 6px rgba(37, 99, 235, 0.3));
}

:deep(.planning-scene .graph-edges path) {
  stroke: rgba(100, 116, 139, 0.42);
  stroke-width: 1.2;
}

:deep(.planning-path) {
  filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.35));
}

:deep(.signature-overlay.is-presentation-only .demo-panel) {
  padding: 12px 18px 14px;
  border-top: 1px solid rgba(208, 218, 240, 0.55);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(248, 250, 255, 0.72));
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

:deep(.demo-panel__tabs) {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
  padding: 5px;
  height: auto;
  border-radius: 14px;
  border: 1px solid rgba(221, 227, 240, 0.75);
  background: rgba(241, 245, 255, 0.72);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

:deep(.demo-tab) {
  position: relative;
  display: grid;
  grid-template-columns: 16px 1fr;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 9px 12px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #94a3b8;
  text-align: left;
  cursor: pointer;
  font: inherit;
  transition: background 0.28s ease, color 0.28s ease, box-shadow 0.28s ease, transform 0.28s ease;
}

:deep(.demo-tab__dot) {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #cbd5e1;
  transition: background 0.28s ease, box-shadow 0.28s ease, transform 0.28s ease;
}

:deep(.signature-overlay.is-presentation-only) {
  font-family: var(--font-sans);
  font-size: var(--font-14);
  line-height: var(--lh-14);
}

:deep(.signature-overlay.is-presentation-only .demo-tab strong) {
  font-size: var(--font-14);
  font-weight: var(--font-weight-medium);
  line-height: var(--lh-14);
}

:deep(.demo-tab.active) {
  color: #5b3fd4;
  background: rgba(255, 255, 255, 0.96);
  box-shadow:
    0 4px 14px rgba(87, 90, 255, 0.1),
    0 1px 2px rgba(15, 23, 42, 0.05);
  transform: translateY(-1px);
}

:deep(.demo-tab.active:before) {
  display: none;
}

:deep(.demo-tab.active .demo-tab__dot) {
  width: 8px;
  height: 8px;
  background: linear-gradient(135deg, #7656d8, #575aff);
  box-shadow: 0 0 0 4px rgba(118, 86, 216, 0.12), 0 0 14px rgba(87, 90, 255, 0.28);
}

:deep(.demo-tab.complete) {
  color: #475569;
}

:deep(.demo-tab.complete.active) {
  color: #047857;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(236, 253, 245, 0.92));
  box-shadow:
    0 4px 14px rgba(16, 185, 129, 0.12),
    0 1px 2px rgba(15, 23, 42, 0.04);
}

:deep(.demo-tab.complete .demo-tab__dot) {
  width: 16px;
  height: 16px;
  background: linear-gradient(135deg, #34d399, #10b981);
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
}

:deep(.demo-tab.complete.active .demo-tab__dot) {
  background: linear-gradient(135deg, #34d399, #059669);
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.14), 0 0 12px rgba(16, 185, 129, 0.22);
}

:deep(.demo-tab:focus-visible) {
  outline: 3px solid rgba(22, 119, 255, 0.25);
  outline-offset: 2px;
}

:deep(.assistant-performance) {
  right: clamp(16px, 3vw, 36px);
  bottom: clamp(12px, 2vw, 28px);
  width: min(380px, 52%);
}

:deep(.assistant-bubble) {
  box-shadow:
    0 22px 50px rgba(87, 90, 255, 0.14),
    0 10px 28px rgba(15, 23, 42, 0.07),
    inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

:deep(.assistant-bubble__badge) {
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

:deep(.assistant-bubble__text) {
  color: #303133;
}

:deep(.robot-face) {
  box-shadow:
    0 12px 32px rgba(49, 46, 129, 0.22),
    0 0 36px rgba(25, 182, 200, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.14);
}

@media (max-width: 768px) {
  :deep(.signature-overlay.is-presentation-only .demo-panel) {
    padding: 10px 12px 12px;
  }

  :deep(.demo-panel__tabs) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
  }

  :deep(.demo-tab) {
    min-height: 40px;
    padding: 8px 10px;
  }

  :deep(.signature-overlay.is-presentation-only .demo-tab strong) {
    font-size: var(--font-min);
    white-space: normal;
  }

  .saistudy-map :deep(.demo-tab strong) {
    font-size: var(--font-min);
  }
}

@media (max-width: 480px) {
  :deep(.map-stage) {
    padding: 6px 8px 2px;
  }

  :deep(.learning-map) {
    width: 100%;
  }
}
</style>
