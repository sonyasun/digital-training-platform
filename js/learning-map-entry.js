import { createApp } from 'vue'
import LearningMapV2PresentationMount from '../components/LearningMapV2PresentationMount.vue'

function mountLearningMap() {
  const el = document.getElementById('learning-map-root')
  if (!el) return
  createApp(LearningMapV2PresentationMount).mount(el)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountLearningMap)
} else {
  mountLearningMap()
}
