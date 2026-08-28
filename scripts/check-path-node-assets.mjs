import fs from 'fs'
import path from 'path'

const root = path.resolve(import.meta.dirname, '..')
const markersFile = path.join(root, 'components/learning-map/pathNodeMarkers.ts')
const assetDir = path.join(root, 'assets/student/path-node')

const text = fs.readFileSync(markersFile, 'utf8')
const refs = [...text.matchAll(/`\$\{BASE\}\/([^`]+)`/g)].map(m => `assets/student/path-node/${m[1]}`)
const files = fs.readdirSync(assetDir).filter(f => f.endsWith('.png')).map(f => `assets/student/path-node/${f}`)

const used = new Set(refs)
const islandUsed = refs.filter(r => r.includes('-island-'))
const cityUsed = refs.filter(r => !r.includes('-island-'))
const unused = files.filter(f => !used.has(f))

const VARIANTS = ['building', 'cylindrical', 'compound', 'cluster']
const TONES = ['mastered', 'default', 'attention']

console.log('=== 节点 order → 造型组 (ch2) ===')
for (let order = 1; order <= 20; order++) {
  const groupIndex = Math.min(3, Math.floor((order - 1) / 5))
  console.log(`order ${String(order).padStart(2)} → ${VARIANTS[groupIndex]}`)
}

console.log('\n=== 岛屿主题各组应用素材 ===')
for (const variant of VARIANTS) {
  for (const tone of TONES) {
    const file = `assets/student/path-node/${variant}-island-${tone}.png`
    console.log(`${variant.padEnd(11)} ${tone.padEnd(9)} → ${file}`)
  }
}

console.log('\n=== 未被 pathNodeMarkers.ts 引用的本地图 ===')
if (unused.length === 0) console.log('(无)')
else unused.forEach(f => console.log(f))

console.log('\n=== 岛屿主题下不会显示的本地图 (城市素材) ===')
files.filter(f => !f.includes('-island-')).forEach(f => console.log(f))

console.log('\n=== 第4组(cluster) 若未替换成功时的表现 ===')
console.log('应显示:', islandUsed.filter(r => r.includes('cluster-island')).join('\n         '))
console.log('误显示:', cityUsed.filter(r => r.includes('/cluster-')).join('\n         '))
