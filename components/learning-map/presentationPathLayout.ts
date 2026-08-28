/** 章节地图 presentation 模式：世界地图背景上的路径布局（最多 20 点，视口展示 6 点） */

export const NODE_MARKER_WIDTH = 80
export const NODE_MARKER_HEIGHT = 98
/** 贴图底部透明留白：路径锚点对齐到建筑可视底座 */
export const NODE_FOOT_TRIM = 14
/** @deprecated use NODE_MARKER_WIDTH */
export const NODE_MARKER_SIZE = NODE_MARKER_WIDTH

export const MAX_PRESENTATION_NODES = 20
export const PRESENTATION_VISIBLE_NODES = 6
export const PATH_NODE_STEP = 118

const PATH_VIEWPORT_EDGE_PAD = 72
const MARKER_HALF = NODE_MARKER_WIDTH / 2

export const PATH_VIEWPORT = {
  /** 6 点窗口宽：5 段间距 + 1 个完整 marker + 单侧边距（避免 scroll=0 时挤出第 7 点） */
  w: (PRESENTATION_VISIBLE_NODES - 1) * PATH_NODE_STEP + NODE_MARKER_WIDTH + PATH_VIEWPORT_EDGE_PAD,
  h: 700,
}
/** @deprecated use PATH_VIEWPORT */
export const PATH_VIEWBOX = PATH_VIEWPORT

/** @deprecated use buildPathGuidePoints(nodeCount) */
export const PATH_GUIDE_POINTS = buildPathGuidePoints(MAX_PRESENTATION_NODES)

export function getPresentationContentWidth(nodeCount: number): number {
  const n = Math.max(2, Math.min(nodeCount, MAX_PRESENTATION_NODES))
  return 80 + (n - 1) * PATH_NODE_STEP + 80
}

/**
 * 路径引导控制点（样条经过这些点，节点再沿路径等距采样）
 */
export function buildPathGuidePoints(nodeCount: number = MAX_PRESENTATION_NODES): Array<{ x: number; y: number }> {
  const contentW = getPresentationContentWidth(nodeCount)
  const startX = 80
  const endX = contentW - 80
  const span = endX - startX

  return [
    { x: startX, y: 530 },
    { x: startX + span * 0.16, y: 498 },
    { x: startX + span * 0.32, y: 420 },
    { x: startX + span * 0.48, y: 396 },
    { x: startX + span * 0.64, y: 340 },
    { x: startX + span * 0.8, y: 268 },
    { x: endX, y: 210 },
  ]
}

/** 曲线张力：越小越顺滑 */
const PATH_TENSION = 0.32

export function buildPresentationPath(points: Array<{ x: number; y: number }>): string {
  if (points.length < 2) {
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
    return ''
  }

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(i + 2, points.length - 1)]

    const cp1x = p1.x + (p2.x - p0.x) * PATH_TENSION
    const cp1y = p1.y + (p2.y - p0.y) * PATH_TENSION
    const cp2x = p2.x - (p3.x - p1.x) * PATH_TENSION
    const cp2y = p2.y - (p3.y - p1.y) * PATH_TENSION

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }

  return d
}

/** 沿 SVG 路径等距采样，保证节点精确落在路径线上 */
export function samplePointsOnPath(
  pathEl: SVGPathElement,
  count: number,
): Array<{ x: number; y: number }> {
  if (count <= 0) return []
  if (count === 1) {
    const pt = pathEl.getPointAtLength(0)
    return [{ x: pt.x, y: pt.y }]
  }

  const total = pathEl.getTotalLength()
  const points: Array<{ x: number; y: number }> = []

  for (let i = 0; i < count; i++) {
    const length = (total * i) / (count - 1)
    const pt = pathEl.getPointAtLength(length)
    points.push({ x: pt.x, y: pt.y })
  }

  return points
}

export function pickPresentationNodes<T extends { shapeType: string }>(nodes: T[]): T[] {
  return nodes.filter(node => node.shapeType !== 'reinforce').slice(0, MAX_PRESENTATION_NODES)
}

export function getPresentationScrollBounds(
  slots: Array<{ x: number; y: number }>,
  viewportWidth: number = PATH_VIEWPORT.w,
): { minScroll: number; maxScroll: number } {
  if (slots.length === 0) {
    const fallbackMax = Math.max(0, getPresentationContentWidth(0) - viewportWidth)
    return { minScroll: 0, maxScroll: fallbackMax }
  }

  const minScroll = slots[0].x - MARKER_HALF - PATH_VIEWPORT_EDGE_PAD
  const maxScroll = slots[slots.length - 1].x + MARKER_HALF + PATH_VIEWPORT_EDGE_PAD - viewportWidth
  return { minScroll, maxScroll: Math.max(minScroll, maxScroll) }
}

/** 计算视口横向滚动量，使当前可学节点落在可视区域内（6 点窗口） */
export function computeFocusScrollX(
  slots: Array<{ x: number; y: number }>,
  focusIndex: number,
  viewportWidth: number = PATH_VIEWPORT.w,
  visibleNodeCount: number = PRESENTATION_VISIBLE_NODES,
): number {
  if (slots.length === 0) return 0

  const { minScroll, maxScroll } = getPresentationScrollBounds(slots, viewportWidth)
  if (maxScroll <= minScroll) return minScroll

  const safeFocus = Math.max(0, Math.min(focusIndex, slots.length - 1))
  const visibleCount = Math.min(visibleNodeCount, slots.length)

  let startIdx = Math.max(
    0,
    Math.min(
      safeFocus - Math.floor((visibleCount - 1) / 2),
      slots.length - visibleCount,
    ),
  )
  const endIdx = startIdx + visibleCount - 1

  const windowStart = slots[startIdx].x - MARKER_HALF
  const windowEnd = slots[endIdx].x + MARKER_HALF
  const windowSpan = windowEnd - windowStart

  let scrollX = windowStart
  if (windowSpan < viewportWidth) {
    scrollX = windowStart - (viewportWidth - windowSpan) / 2
  }

  return Math.max(minScroll, Math.min(maxScroll, scrollX))
}

/** 估算节点处主路径切线方向（单位向量） */
export function estimatePathTangentAtIndex(
  slots: Array<{ x: number; y: number }>,
  index: number,
): { x: number; y: number } {
  if (slots.length < 2) return { x: 1, y: 0 }
  const prev = slots[Math.max(0, index - 1)]
  const next = slots[Math.min(slots.length - 1, index + 1)]
  const dx = next.x - prev.x
  const dy = next.y - prev.y
  const len = Math.hypot(dx, dy) || 1
  return { x: dx / len, y: dy / len }
}

/** 沿主路径 SVG 精确采样节点切线；不可用时回退到 slot 估算 */
export function getPathTangentAtNodeIndex(
  pathEl: SVGPathElement | null | undefined,
  slots: Array<{ x: number; y: number }>,
  index: number,
): { x: number; y: number } {
  if (pathEl && slots.length > 1) {
    const total = pathEl.getTotalLength()
    const len = (total * index) / (slots.length - 1)
    const eps = Math.min(6, total * 0.006)
    const a = pathEl.getPointAtLength(Math.max(0, len - eps))
    const b = pathEl.getPointAtLength(Math.min(total, len + eps))
    const dx = b.x - a.x
    const dy = b.y - a.y
    const mag = Math.hypot(dx, dy) || 1
    return { x: dx / mag, y: dy / mag }
  }
  return estimatePathTangentAtIndex(slots, index)
}

/**
 * 分支岔路：从主路径 junction 沿切线引出，再弯向分支节点
 * cp1 贴合主路方向，形成自然岔口
 */
export function buildBranchForkPath(
  start: { x: number; y: number },
  end: { x: number; y: number },
  tangent: { x: number; y: number },
): string {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const span = Math.hypot(dx, dy)
  const lead = Math.min(44, Math.max(30, span * 0.34))
  const cp1x = start.x + tangent.x * lead
  const cp1y = start.y + tangent.y * lead
  const cp2x = end.x - dx * 0.14 - tangent.x * lead * 0.28
  const cp2y = end.y - dy * 0.28 - tangent.y * lead * 0.28
  return `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${end.x.toFixed(1)} ${end.y.toFixed(1)}`
}

/** 岔口过渡段长度：与主路衔接的固定填充段 */
export function branchConnectorLength(pathLength: number): number {
  return Math.min(Math.max(22, pathLength * 0.22), 38)
}

let cachedMeasureSvg: SVGSVGElement | null = null
let cachedMeasurePath: SVGPathElement | null = null

/** 测量 SVG path d 的弧长（用于分支曲线进度） */
export function measureSvgPathLength(d: string): number {
  if (typeof document === 'undefined' || !d) return 0
  if (!cachedMeasureSvg) {
    cachedMeasureSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    cachedMeasurePath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    cachedMeasureSvg.setAttribute('aria-hidden', 'true')
    cachedMeasureSvg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;visibility:hidden'
    cachedMeasureSvg.appendChild(cachedMeasurePath)
    document.body.appendChild(cachedMeasureSvg)
  }
  cachedMeasurePath!.setAttribute('d', d)
  return cachedMeasurePath!.getTotalLength()
}
