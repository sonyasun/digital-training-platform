import type { PathNodeLike, ChapterNavigationItem } from '../types'
import { pickPresentationNodes } from '../presentationPathLayout'
import type { PathNodeBuildingVariant } from '../pathNodeMarkers'
import { PATH_NODE_BUILDING_VARIANTS } from '../pathNodeMarkers'
import { samplePathNodes } from './samplePathNodes'

type ExtraNodeSpec = Pick<PathNodeLike, 'name' | 'shortName' | 'shapeType' | 'nodeType' | 'level'>

function extendPathNodesToTwenty(
  nodes: PathNodeLike[],
  chapterId: string,
  extras: ExtraNodeSpec[],
): PathNodeLike[] {
  const mainNodes = nodes.filter(node => node.shapeType !== 'reinforce')
  if (mainNodes.length >= 20) return nodes

  const reinforceNodes = nodes.filter(node => node.shapeType === 'reinforce')
  const result = [...mainNodes]
  const startOrder = mainNodes.length + 1

  for (let i = 0; i < 20 - mainNodes.length; i++) {
    const spec = extras[i]
    if (!spec) break
    result.push({
      id: `${chapterId}-node-${startOrder + i}`,
      name: spec.name,
      shortName: spec.shortName,
      order: startOrder + i,
      shapeType: spec.shapeType,
      level: spec.level,
      nodeType: spec.nodeType,
      x: 0,
      y: 0,
      chapterId,
      resources: '资料1｜练习1',
      duration: '25min',
      description: `${spec.name}学习模块。`,
      status: 'not-started',
      mastery: 0,
    })
  }

  return [...result, ...reinforceNodes]
}

const CH1_EXTRA_NODES: ExtraNodeSpec[] = [
  { name: '装配式建筑基础', shortName: '装配式', shapeType: 'theory', level: 'extended', nodeType: '理论' },
  { name: '预制构件设计', shortName: '预制设计', shapeType: 'integrated', level: 'extended', nodeType: '理实一体' },
  { name: '智慧物流调度', shortName: '智慧物流', shapeType: 'practice', level: 'extended', nodeType: '实操' },
  { name: '施工机器人入门', shortName: '施工机器人', shapeType: 'integrated', level: 'extended', nodeType: '理实一体' },
  { name: '无人机巡检', shortName: '无人机', shapeType: 'practice', level: 'extended', nodeType: '实操' },
  { name: 'AR/VR 施工模拟', shortName: 'AR/VR', shapeType: 'integrated', level: 'extended', nodeType: '理实一体' },
  { name: '建筑工业化评价', shortName: '工业化', shapeType: 'theory', level: 'extended', nodeType: '理论' },
  { name: '智能装备运维', shortName: '装备运维', shapeType: 'practice', level: 'extended', nodeType: '实操' },
  { name: '综合项目实训', shortName: '项目实训', shapeType: 'practice', level: 'extended', nodeType: '实操' },
  { name: '章节结业考核', shortName: '结业考核', shapeType: 'practice', level: 'extended', nodeType: '实操' },
]

const CH2_EXTRA_NODES: ExtraNodeSpec[] = [
  { name: 'AI 质量检测', shortName: 'AI质检', shapeType: 'integrated', level: 'extended', nodeType: '理实一体' },
  { name: '智慧梁场应用', shortName: '智慧梁场', shapeType: 'practice', level: 'extended', nodeType: '实操' },
  { name: '预制拼装工艺', shortName: '预制拼装', shapeType: 'integrated', level: 'extended', nodeType: '理实一体' },
  { name: '智能测量机器人', shortName: '测量机器人', shapeType: 'practice', level: 'extended', nodeType: '实操' },
  { name: '施工安全监测', shortName: '安全监测', shapeType: 'theory', level: 'extended', nodeType: '理论' },
  { name: '绿色施工管理', shortName: '绿色施工', shapeType: 'theory', level: 'extended', nodeType: '理论' },
  { name: '智慧运维平台', shortName: '智慧运维', shapeType: 'integrated', level: 'extended', nodeType: '理实一体' },
  { name: 'BIM+GIS 融合', shortName: 'BIM+GIS', shapeType: 'integrated', level: 'extended', nodeType: '理实一体' },
  { name: '数字交付标准', shortName: '数字交付', shapeType: 'theory', level: 'extended', nodeType: '理论' },
  { name: '章节结业考核', shortName: '结业考核', shapeType: 'practice', level: 'extended', nodeType: '实操' },
]

/** 章节 ch2 · 智能建造关键技术（示例路径节点） */
const ch2PathNodesBase: PathNodeLike[] = [
  {
    id: 'ch2-node-1',
    name: 'BIM 协同基础',
    shortName: 'BIM协同',
    order: 1,
    shapeType: 'theory',
    level: 'basic',
    nodeType: '理论',
    x: 0,
    y: 0,
    chapterId: 'ch2',
    resources: '视频2｜PPT1｜练习2',
    duration: '25min',
    description: '理解 BIM 协同工作流程与多专业模型整合方法。',
    status: 'completed',
    mastery: 88,
  },
  {
    id: 'ch2-node-2',
    name: '结构模型创建',
    shortName: '结构建模',
    order: 2,
    shapeType: 'integrated',
    level: 'basic',
    nodeType: '理实一体',
    x: 0,
    y: 0,
    chapterId: 'ch2',
    resources: '视频2｜练习3',
    duration: '35min',
    description: '掌握结构构件建模与模型精度控制要点。',
    status: 'completed',
    mastery: 82,
  },
  {
    id: 'ch2-node-3',
    name: '机电模型整合',
    shortName: '机电整合',
    order: 3,
    shapeType: 'integrated',
    level: 'advanced',
    nodeType: '理实一体',
    x: 0,
    y: 0,
    chapterId: 'ch2',
    resources: '视频1｜资料2｜练习2',
    duration: '40min',
    description: '完成机电管线与结构模型的整合与碰撞检查。',
    status: 'completed',
    mastery: 76,
  },
  {
    id: 'ch2-node-4',
    name: '碰撞检测应用',
    shortName: '碰撞检测',
    order: 4,
    shapeType: 'practice',
    level: 'advanced',
    nodeType: '实操',
    x: 0,
    y: 0,
    chapterId: 'ch2',
    resources: '练习4｜案例1',
    duration: '30min',
    description: '运用碰撞检测工具定位并解决模型冲突。',
    status: 'completed',
    mastery: 90,
  },
  {
    id: 'ch2-node-5',
    name: '工程量清单提取',
    shortName: '清单提取',
    order: 5,
    shapeType: 'practice',
    level: 'advanced',
    nodeType: '实操',
    x: 0,
    y: 0,
    chapterId: 'ch2',
    resources: '练习2｜资料1',
    duration: '28min',
    description: '基于 BIM 模型快速提取工程量清单。',
    status: 'completed',
    mastery: 68,
    branch: {
      id: 'ch2-node-5-branch',
      name: '清单模板应用',
      shortName: '清单模板',
      nodeType: '实操',
      status: 'not-started',
      progress: 18,
    },
  },
  {
    id: 'ch2-reinforce-1',
    name: '补强：4D 模拟规范',
    shortName: '4D规范',
    order: 5.5,
    shapeType: 'reinforce',
    level: 'reinforce',
    nodeType: '补强',
    x: 0,
    y: 0,
    chapterId: 'ch2',
    resources: '视频1｜练习1',
    duration: '15min',
    description: '针对 4D 施工模拟关键规范进行巩固。',
    status: 'not-started',
    mastery: 0,
    isRecommended: true,
  },
  {
    id: 'ch2-node-6',
    name: '4D 施工模拟',
    shortName: '4D模拟',
    order: 6,
    shapeType: 'integrated',
    level: 'extended',
    nodeType: '理实一体',
    x: 0,
    y: 0,
    chapterId: 'ch2',
    resources: '视频2｜项目1',
    duration: '45min',
    description: '将进度计划与 BIM 模型关联，完成 4D 模拟。',
    status: 'in-progress',
    mastery: 48,
    isCurrent: true,
    isWeak: true,
  },
  {
    id: 'ch2-node-7',
    name: '5D 成本管控',
    shortName: '5D成本',
    order: 7,
    shapeType: 'theory',
    level: 'extended',
    nodeType: '理论',
    x: 0,
    y: 0,
    chapterId: 'ch2',
    resources: 'PPT1｜练习2',
    duration: '30min',
    description: '了解 5D BIM 成本管控思路与方法。',
    status: 'completed',
    mastery: 42,
    isWeak: true,
  },
  {
    id: 'ch2-node-8',
    name: '智慧工地集成',
    shortName: '智慧工地',
    order: 8,
    shapeType: 'practice',
    level: 'extended',
    nodeType: '实操',
    x: 0,
    y: 0,
    chapterId: 'ch2',
    resources: '案例2｜练习1',
    duration: '35min',
    description: '探索 BIM 与智慧工地系统的集成应用。',
    status: 'not-started',
    mastery: 0,
    lockType: 'confirm-unlock',
  },
  {
    id: 'ch2-node-9',
    name: 'IoT 传感应用',
    shortName: 'IoT传感',
    order: 9,
    shapeType: 'theory',
    level: 'extended',
    nodeType: '理论',
    x: 0,
    y: 0,
    chapterId: 'ch2',
    resources: '资料2｜练习1',
    duration: '25min',
    description: '了解物联网传感在施工监测中的应用。',
    status: 'not-started',
    mastery: 0,
    lockType: 'prerequisite',
  },
  {
    id: 'ch2-node-10',
    name: '数字孪生实践',
    shortName: '数字孪生',
    order: 10,
    shapeType: 'practice',
    level: 'extended',
    nodeType: '实操',
    x: 0,
    y: 0,
    chapterId: 'ch2',
    resources: '项目挑战1',
    duration: '50min',
    description: '完成数字孪生场景搭建与数据联动演示。',
    status: 'not-started',
    mastery: 0,
    lockType: 'prerequisite',
    branch: {
      id: 'ch2-node-10-branch',
      name: 'LOD 实战挑战',
      shortName: 'LOD 实战挑战',
      nodeType: '拓展',
      status: 'locked',
      progress: 0,
      lockType: 'prerequisite',
    },
  },
]

const ch1PathNodes = extendPathNodesToTwenty(samplePathNodes, 'ch1', CH1_EXTRA_NODES)
const ch2PathNodes = extendPathNodesToTwenty(ch2PathNodesBase, 'ch2', CH2_EXTRA_NODES)

const chapterNodeMap: Record<string, PathNodeLike[]> = {
  ch1: ch1PathNodes,
  ch2: ch2PathNodes,
}

export interface ChapterTopicDef {
  id: string
  name: string
  orderFrom: number
  orderTo: number
}

const DEFAULT_TOPIC_DEFS: ChapterTopicDef[] = [
  { id: 'default-topic-1', name: '核心主题', orderFrom: 1, orderTo: 5 },
  { id: 'default-topic-2', name: '深化主题', orderFrom: 6, orderTo: 10 },
  { id: 'default-topic-3', name: '拓展主题', orderFrom: 11, orderTo: 15 },
  { id: 'default-topic-4', name: '综合应用', orderFrom: 16, orderTo: 20 },
]

const CHAPTER_TOPIC_DEFS: Record<string, ChapterTopicDef[]> = {
  ch1: [
    { id: 'ch1-topic-1', name: '智能建造概论', orderFrom: 1, orderTo: 5 },
    { id: 'ch1-topic-2', name: '体系与标准', orderFrom: 6, orderTo: 10 },
    { id: 'ch1-topic-3', name: '装配式建造', orderFrom: 11, orderTo: 15 },
    { id: 'ch1-topic-4', name: '智能装备应用', orderFrom: 16, orderTo: 20 },
  ],
  ch2: [
    { id: 'ch2-topic-1', name: 'BIM 协同建模', orderFrom: 1, orderTo: 5 },
    { id: 'ch2-topic-2', name: '碰撞检测与工程量', orderFrom: 6, orderTo: 10 },
    { id: 'ch2-topic-3', name: '智慧工地与 IoT', orderFrom: 11, orderTo: 15 },
    { id: 'ch2-topic-4', name: '数字孪生与交付', orderFrom: 16, orderTo: 20 },
  ],
  ch3: [
    { id: 'ch3-topic-1', name: '全寿命周期基础', orderFrom: 1, orderTo: 5 },
    { id: 'ch3-topic-2', name: '运维与更新', orderFrom: 6, orderTo: 10 },
    { id: 'ch3-topic-3', name: '拆除与再利用', orderFrom: 11, orderTo: 16 },
  ],
  ch4: [
    { id: 'ch4-topic-1', name: '项目组织与策划', orderFrom: 1, orderTo: 4 },
    { id: 'ch4-topic-2', name: '进度与成本管控', orderFrom: 5, orderTo: 8 },
    { id: 'ch4-topic-3', name: '质量与风险管理', orderFrom: 9, orderTo: 12 },
  ],
}

export function getChapterTopicDefs(chapterId: string): ChapterTopicDef[] {
  return CHAPTER_TOPIC_DEFS[chapterId] ?? DEFAULT_TOPIC_DEFS.map(def => ({
    ...def,
    id: `${chapterId}-${def.id}`,
  }))
}

/** 主题点位造型：第 1 组双体楼，其余三组为圆柱 / 复合 / 群楼 */
export const TOPIC_MARKER_VARIANTS = PATH_NODE_BUILDING_VARIANTS

export function resolveTopicMarkerVariantForNode(
  node: Pick<PathNodeLike, 'chapterId' | 'order'>,
  nodeIndex = -1,
): PathNodeBuildingVariant {
  const order = Math.floor(node.order)
  if (Number.isFinite(order) && order >= 1) {
    const groupIndex = Math.min(
      TOPIC_MARKER_VARIANTS.length - 1,
      Math.floor((order - 1) / 5),
    )
    return TOPIC_MARKER_VARIANTS[groupIndex] ?? TOPIC_MARKER_VARIANTS[0]
  }

  if (nodeIndex >= 0) {
    const groupIndex = Math.min(
      TOPIC_MARKER_VARIANTS.length - 1,
      Math.floor(nodeIndex / 5),
    )
    return TOPIC_MARKER_VARIANTS[groupIndex] ?? TOPIC_MARKER_VARIANTS[0]
  }

  const topicDefs = getChapterTopicDefs(node.chapterId)
  const topicIndex = topicDefs.findIndex(
    def => order >= def.orderFrom && order <= def.orderTo,
  )
  return TOPIC_MARKER_VARIANTS[topicIndex >= 0 ? topicIndex : 0] ?? TOPIC_MARKER_VARIANTS[0]
}

export function getPathNodesForChapter(chapterId: string): PathNodeLike[] {
  return chapterNodeMap[chapterId] ? [...chapterNodeMap[chapterId]] : []
}

export function getChapterPathTitle(chapterId: string, chapterName: string): string {
  return `${chapterName} · 学习路径`
}

export function getCurrentNodeIndex(chapterId: string): number {
  const nodes = pickPresentationNodes(getPathNodesForChapter(chapterId))
  const currentIdx = nodes.findIndex(n => n.isCurrent)
  if (currentIdx >= 0) return currentIdx
  const inProgressIdx = nodes.findIndex(n => n.status === 'in-progress')
  return inProgressIdx >= 0 ? inProgressIdx : 0
}

export function buildChapterNavigationList(
  modules: Array<{ id: string; name: string; status: string; total: number }>,
): ChapterNavigationItem[] {
  return modules.map(mod => ({
    id: mod.id,
    name: mod.name,
    status: mod.status === 'completed'
      ? 'completed'
      : mod.status === 'active'
        ? 'in-progress'
        : 'not-started',
    nodeCount: pickPresentationNodes(getPathNodesForChapter(mod.id)).length || mod.total,
  }))
}

export function chapterHasPathData(chapterId: string): boolean {
  return getPathNodesForChapter(chapterId).length > 0
}
