/**
 * Learning Map — 独立类型定义
 * 从 pathGraphAdapter 提取，无 G6 / 业务 store 依赖
 */

export type PathNodeShapeType = 'theory' | 'practice' | 'integrated' | 'reinforce'
export type PathNodeLevel = 'basic' | 'advanced' | 'extended' | 'reinforce'
export type PathNodeStatus = 'not-started' | 'in-progress' | 'completed'
/** 未解锁节点的交互方式：确认解锁 / 需完成前置 */
export type PathNodeLockType = 'confirm-unlock' | 'prerequisite'

export interface PathNodeLike {
  id: string
  name: string
  shortName: string
  order: number
  shapeType: PathNodeShapeType
  level: PathNodeLevel
  nodeType: string
  x: number
  y: number
  zoneId?: string
  chapterId: string
  resources: string
  duration: string
  description: string
  cardOffsetX?: number
  cardOffsetY?: number
  status?: PathNodeStatus
  isCurrent?: boolean
  isRecommended?: boolean
  isWeak?: boolean
  /** 掌握度 0-100，学生端用此值决定节点颜色 */
  mastery?: number
  /** 未解锁时：confirm-unlock 可确认解锁，prerequisite 需完成前置 */
  lockType?: PathNodeLockType
  /** 前置节点 id（可选，用于展示或服务端校验） */
  prerequisiteNodeIds?: string[]
  /** 主路径节点旁的拓展分支（单点） */
  branch?: {
    id?: string
    name: string
    shortName?: string
    nodeType?: string
    status?: PathNodeStatus | string
    progress?: number
    side?: 'left' | 'right'
    lockType?: PathNodeLockType
  }
}

export interface ChapterNavigationItem {
  id: string
  name: string
  status?: string
  nodeCount?: number
  nodes?: number
  videos?: number
  ppt?: number
  exercises?: number
}
