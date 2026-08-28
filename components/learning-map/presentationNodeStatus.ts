import type { PathNodeLike } from './types'

export type PresentationNodeStatus =
  | 'mastered'
  | 'attention'
  | 'weak'
  | 'locked'

export const PRESENTATION_STATUS_LABELS: Record<PresentationNodeStatus, string> = {
  mastered: '已完成',
  attention: '需关注',
  weak: '待补强',
  locked: '未解锁',
}

export const PRESENTATION_STATUS_COLORS: Record<PresentationNodeStatus, string> = {
  mastered: '#10B981',
  attention: '#F59E0B',
  weak: '#EF4444',
  locked: '#94A3B8',
}

/** 底部图例：四色状态说明 */
export const PRESENTATION_LEGEND_ITEMS: Array<{
  status: PresentationNodeStatus
  label: string
  color: string
}> = [
  { status: 'mastered', label: '已完成', color: '#10B981' },
  { status: 'attention', label: '需关注', color: '#F59E0B' },
  { status: 'weak', label: '待补强', color: '#EF4444' },
  { status: 'locked', label: '未解锁', color: '#94A3B8' },
]

type ResolveOptions = {
  nodeIndex?: number
  currentNodeIndex?: number
  weakNodeIds?: string[]
}

/** 读取节点掌握率（0–100） */
export function resolveDisplayMastery(
  node: PathNodeLike,
  _options: ResolveOptions = {},
): number {
  if (node.mastery !== undefined) {
    return Math.round(Math.max(0, Math.min(100, node.mastery)))
  }
  if (node.status === 'completed') return 85
  return 0
}

/**
 * 按掌握率划分状态：
 * ≥80% 已完成 | 60–79% 需关注 | 10–59% 待补强 | <10% 未解锁
 */
export function resolveStatusFromMastery(mastery: number): PresentationNodeStatus {
  if (mastery >= 80) return 'mastered'
  if (mastery >= 60) return 'attention'
  if (mastery >= 10) return 'weak'
  return 'locked'
}

export function resolvePresentationNodeStatus(
  node: PathNodeLike,
  options: ResolveOptions = {},
): PresentationNodeStatus {
  const mastery = resolveDisplayMastery(node, options)
  return resolveStatusFromMastery(mastery)
}

/** 路径节点徽章文案：未解锁显示「未解锁」，其余显示「已掌握 XX%」 */
export function formatNodeMasteryLabel(
  node: PathNodeLike,
  options: ResolveOptions = {},
): string {
  const mastery = resolveDisplayMastery(node, options)
  if (resolveStatusFromMastery(mastery) === 'locked') {
    return PRESENTATION_STATUS_LABELS.locked
  }
  return `已掌握 ${mastery}%`
}
