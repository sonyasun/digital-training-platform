import { resolveIslandAsset } from './constants'
import type { OverviewBridge, OverviewIslandSpot, OverviewModule, OverviewSkin } from './types'

export function parseBox(style: { left: string; top: string; width: string; height: string }) {
  return {
    left: Number.parseFloat(style.left),
    top: Number.parseFloat(style.top),
    width: Number.parseFloat(style.width),
    height: Number.parseFloat(style.height),
  }
}

export function buildIslandSpots(modules: OverviewModule[], skin: OverviewSkin): OverviewIslandSpot[] {
  const list = modules
  const maxTotal = Math.max(...list.map(m => m.total), 1)
  const sideInset = 5
  const gap = 1.4
  const rawWidths = list.map(mod => 17.2 + (mod.total / maxTotal) * 13.8)
  const rawUsed = rawWidths.reduce((sum, w) => sum + w, 0) + gap * Math.max(list.length - 1, 0)
  const scale = (100 - sideInset * 2) / rawUsed

  let cursor = sideInset

  return list.map((mod, index) => {
    const weight = mod.total / maxTotal
    const width = (rawWidths[index] ?? 20) * scale
    const height = 48 + weight * 14
    const left = cursor
    cursor += width + gap * scale
    const top = 20 + (1 - weight) * 5 + (index % 2 === 1 ? 3.6 : 0)
    return {
      ...mod,
      order: index + 1,
      asset: resolveIslandAsset(mod, skin),
      bobDelay: `${index * 0.4}s`,
      style: {
        left: `${left}%`,
        top: `${top}%`,
        width: `${width}%`,
        height: `${height}%`,
      },
    }
  })
}

export function buildBridges(islands: OverviewIslandSpot[]): OverviewBridge[] {
  return islands.slice(0, -1).map((from, i) => {
    const to = islands[i + 1]!
    const fromBox = parseBox(from.style)
    const toBox = parseBox(to.style)
    const x1 = fromBox.left + fromBox.width * 0.78
    const y1 = fromBox.top + fromBox.height * 0.54
    const x2 = toBox.left + toBox.width * 0.22
    const y2 = toBox.top + toBox.height * 0.54
    const span = x2 - x1
    const arcLift = Math.max(6.5, span * 0.28)
    const c1x = x1 + span * 0.3
    const c1y = y1 - arcLift * 0.45
    const c2x = x2 - span * 0.3
    const c2y = y2 - arcLift * 0.92
    const sx = 10
    const sy = 6.2
    const locked = from.status === 'locked' || to.status === 'locked'
    const progress = !locked && from.status === 'completed' && to.status !== 'completed'
    const tone = locked ? 'locked' : progress ? 'progress' : 'completed'
    return {
      d: `M ${x1 * sx} ${y1 * sy} C ${c1x * sx} ${c1y * sy}, ${c2x * sx} ${c2y * sy}, ${x2 * sx} ${y2 * sy}`,
      tone,
      dashed: locked,
      start: { x: x1 * sx, y: y1 * sy },
      end: { x: x2 * sx, y: y2 * sy },
    }
  })
}
