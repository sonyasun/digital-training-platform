import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'js',
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(process.cwd(), 'js/course-overview-map-entry.js'),
      output: {
        entryFileNames: 'course-overview-map.bundle.js',
        format: 'iife',
        inlineDynamicImports: true,
        name: 'CourseOverviewMapWidget'
      }
    }
  }
})
