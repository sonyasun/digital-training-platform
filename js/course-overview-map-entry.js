import { createApp } from 'vue'
import StudentLearningPathMount from '../components/StudentLearningPathMount.vue'

function mountCourseOverviewMap() {
  const el = document.getElementById('course-overview-map-root')
  if (!el) return
  createApp(StudentLearningPathMount).mount(el)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountCourseOverviewMap)
} else {
  mountCourseOverviewMap()
}
