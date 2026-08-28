<script setup lang="ts">
import { ref } from 'vue'
import LearningMap from './LearningMap.vue'
import {
  samplePathNodes,
  sampleChapterList,
  sampleChapterName
} from './demo/samplePathNodes.ts'

const selectedChapter = ref('ch1')
const currentNodeIndex = ref(3)

function onChapterChange(chapterId: string) {
  selectedChapter.value = chapterId
}
</script>

<template>
  <LearningMap
    :path-nodes="samplePathNodes"
    :current-node-index="currentNodeIndex"
    :chapter-name="sampleChapterName"
    :chapter-list="sampleChapterList"
    :selected-chapter="selectedChapter"
    mode="student"
    :hide-bird-view="true"
    @chapter-change="onChapterChange"
  />
</template>

<style scoped>
:deep(.lplj-root) {
  width: 100%;
  height: 100%;
}
</style>
