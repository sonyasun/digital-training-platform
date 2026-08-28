<script setup lang="ts">
import AdaptivePathSignatureModalV2 from './business/AdaptivePathSignatureModalV2.vue'
</script>

<template>
  <AdaptivePathSignatureModalV2 :open="true" presentation-only />
</template>

<style scoped>
:deep(.v2-shell) {
  height: 100%;
}

:deep(.v2-stage) {
  min-height: 0;
}

:deep(.v2-map) {
  width: min(100%, 860px);
  margin: 10px auto;
  font-size: 14px;
}

:deep(.v2-stepper) {
  flex-shrink: 0;
  padding: 0 10px 10px;
  border-top: 1px solid rgba(226, 232, 240, 0.65);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(248, 250, 255, 0.78) 100%);
}

@media (max-width: 768px) {
  :deep(.v2-map) {
    margin: 8px auto;
  }

  :deep(.v2-stepper) {
    padding: 0 6px 8px;
  }
}
</style>
