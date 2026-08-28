import type { PathNodeLike } from './types'
import { pickPresentationNodes } from './presentationPathLayout'
import { resolvePresentationNodeStatus } from './presentationNodeStatus'

export type PathNodeLockType = 'confirm-unlock' | 'prerequisite'

export const PREREQUISITE_LOCK_MESSAGE = '暂不支持解锁，需学习前置知识点，方可解锁！'

export function isPathNodeUnlocked(node: PathNodeLike): boolean {
  if (node.status === 'completed' || node.status === 'in-progress') return true
  if (node.isCurrent || node.isRecommended) return true
  return resolvePresentationNodeStatus(node) !== 'locked'
}

function isPriorNodeSatisfied(node: PathNodeLike): boolean {
  if (node.status === 'completed') return true
  if (node.isCurrent || node.status === 'in-progress') return true
  if ((node.mastery ?? 0) >= 10) return true
  return false
}

/** 主路径上尚未满足的前置节点（不含补强/分支） */
export function getUnmetPrerequisiteNodes(
  node: PathNodeLike,
  allNodes: PathNodeLike[],
): PathNodeLike[] {
  const mainNodes = pickPresentationNodes(allNodes).sort((a, b) => a.order - b.order)
  const nodeIndex = mainNodes.findIndex(item => item.id === node.id)
  if (nodeIndex <= 0) return []

  const unmet: PathNodeLike[] = []
  for (let i = 0; i < nodeIndex; i++) {
    const prev = mainNodes[i]
    if (!isPriorNodeSatisfied(prev)) unmet.push(prev)
  }
  return unmet
}

/**
 * 未解锁节点的交互类型：
 * - confirm-unlock：前置已满足，确认后可解锁学习
 * - prerequisite：前置未满足，暂不可解锁
 */
export function resolvePathNodeLockType(
  node: PathNodeLike,
  allNodes: PathNodeLike[],
): PathNodeLockType | null {
  if (isPathNodeUnlocked(node)) return null

  if (node.lockType === 'confirm-unlock' || node.lockType === 'prerequisite') {
    return node.lockType
  }

  const mainNodes = pickPresentationNodes(allNodes).sort((a, b) => a.order - b.order)
  const nodeIndex = mainNodes.findIndex(item => item.id === node.id)
  if (nodeIndex < 0) return 'prerequisite'

  return getUnmetPrerequisiteNodes(node, allNodes).length === 0
    ? 'confirm-unlock'
    : 'prerequisite'
}

export function formatPrerequisiteLockMessage(
  node: PathNodeLike,
  allNodes: PathNodeLike[],
): {
  nodeName: string
  message: string
  prerequisites: string[]
} {
  const unmet = getUnmetPrerequisiteNodes(node, allNodes)
  return {
    nodeName: node.shortName || node.name,
    message: PREREQUISITE_LOCK_MESSAGE,
    prerequisites: unmet.map(item => item.shortName || item.name),
  }
}
