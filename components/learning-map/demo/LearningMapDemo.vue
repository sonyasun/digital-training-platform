<script setup lang="ts">
import { ref } from 'vue'
import LearningMap from '../LearningMap.vue'
import {
  samplePathNodes,
  sampleChapterList,
  sampleChapterName
} from './samplePathNodes'

const selectedChapter = ref('ch1')
const currentNodeIndex = ref(3)

function onNodeClick(nodeId: string) {
  console.log('[LearningMap] node-click:', nodeId)
}

function onChapterChange(chapterId: string) {
  selectedChapter.value = chapterId
  console.log('[LearningMap] chapter-change:', chapterId)
}

function onNodeHover(nodeId: string | null) {
  console.log('[LearningMap] node-hover:', nodeId)
}
</script>

<template>
  <div class="learning-map-demo">
    <LearningMap
      :path-nodes="samplePathNodes"
      :current-node-index="currentNodeIndex"
      :chapter-name="sampleChapterName"
      :chapter-list="sampleChapterList"
      :selected-chapter="selectedChapter"
      mode="student"
      @node-click="onNodeClick"
      @chapter-change="onChapterChange"
      @node-hover="onNodeHover"
    />
  </div>
</template>

<style scoped>
.learning-map-demo {
  width: 100%;
  height: 100vh;
  min-height: 640px;
  overflow: hidden;
}
</style>
