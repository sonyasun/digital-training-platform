import type { PathNodeLike } from './types'
import { pickPresentationNodes } from './presentationPathLayout'
import { getChapterTopicDefs, getPathNodesForChapter } from './demo/chapterPathNodes'

export type CatalogItemStatus = 'completed' | 'in-progress' | 'locked' | 'available'

export interface CatalogKnowledgePoint {
  id: string
  chapterId: string
  name: string
  status: CatalogItemStatus
  nodeType?: string
  isCurrent?: boolean
}

export interface CatalogTopic {
  id: string
  name: string
  knowledgePoints: CatalogKnowledgePoint[]
}

export interface CatalogChapter {
  id: string
  name: string
  status: CatalogItemStatus
  topics: CatalogTopic[]
}

export interface CourseCatalog {
  courseName: string
  chapter: CatalogChapter | null
}

function resolveModuleStatus(status: string): CatalogItemStatus {
  if (status === 'completed') return 'completed'
  if (status === 'active') return 'in-progress'
  return 'locked'
}

function resolveNodeStatus(node: PathNodeLike): CatalogItemStatus {
  if (node.status === 'completed') return 'completed'
  if (node.isCurrent || node.status === 'in-progress') return 'in-progress'
  const mastery = node.mastery ?? 0
  if (mastery < 10 && node.status !== 'completed') return 'locked'
  return 'available'
}

function resolveTopicForOrder(chapterId: string, order: number): { id: string; name: string } {
  const topicDefs = getChapterTopicDefs(chapterId)
  const matched = topicDefs.find(def => order >= def.orderFrom && order <= def.orderTo)
  if (matched) return { id: matched.id, name: matched.name }
  const fallback = topicDefs[topicDefs.length - 1]
  return fallback
    ? { id: fallback.id, name: fallback.name }
    : { id: `${chapterId}-topic-default`, name: '学习内容' }
}

function buildTopicsForChapter(chapterId: string, nodes: PathNodeLike[]): CatalogTopic[] {
  const mainNodes = pickPresentationNodes(nodes)
  if (mainNodes.length === 0) return []

  const topicMap = new Map<string, CatalogTopic>()

  for (const node of mainNodes) {
    const topic = resolveTopicForOrder(chapterId, node.order)
    if (!topicMap.has(topic.id)) {
      topicMap.set(topic.id, {
        id: topic.id,
        name: topic.name,
        knowledgePoints: [],
      })
    }

    topicMap.get(topic.id)!.knowledgePoints.push({
      id: node.id,
      chapterId,
      name: node.name,
      status: resolveNodeStatus(node),
      nodeType: node.nodeType,
      isCurrent: node.isCurrent,
    })
  }

  const topicOrder = getChapterTopicDefs(chapterId).map(def => def.id)
  return topicOrder
    .map(id => topicMap.get(id))
    .filter((topic): topic is CatalogTopic => Boolean(topic))
}

function buildLockedChapterTopics(chapterId: string, total: number): CatalogTopic[] {
  const pointCount = Math.max(1, Math.min(3, total))
  return [{
    id: `${chapterId}-topic-locked`,
    name: '待解锁主题',
    knowledgePoints: Array.from({ length: pointCount }, (_, index) => ({
      id: `${chapterId}-locked-${index + 1}`,
      chapterId,
      name: index === 0 ? '知识点待解锁' : `知识点 ${index + 1}`,
      status: 'locked' as const,
    })),
  }]
}

export function buildCourseCatalog(
  courseName: string,
  modules: Array<{ id: string; name: string; status: string; total: number }>,
  activeChapterId = '',
  activeNodeId: string | null = null,
): CourseCatalog {
  const mod = modules.find(item => item.id === activeChapterId)
  if (!mod) return { courseName, chapter: null }

  const nodes = getPathNodesForChapter(mod.id)
  const topics = nodes.length > 0
    ? buildTopicsForChapter(mod.id, nodes)
    : buildLockedChapterTopics(mod.id, mod.total)

  const chapter: CatalogChapter = {
    id: mod.id,
    name: mod.name,
    status: resolveModuleStatus(mod.status),
    topics,
  }

  if (activeNodeId) {
    for (const topic of chapter.topics) {
      for (const point of topic.knowledgePoints) {
        if (point.id === activeNodeId) {
          point.isCurrent = true
          if (point.status === 'available') point.status = 'in-progress'
        }
      }
    }
  }

  return { courseName, chapter }
}

export function findCatalogLocation(
  catalog: CourseCatalog,
  chapterId: string,
  nodeId?: string | null,
) {
  const chapter = catalog.chapter
  if (!chapter || chapter.id !== chapterId) return null

  if (!nodeId) {
    return { chapterId: chapter.id, topicId: chapter.topics[0]?.id ?? null }
  }

  for (const topic of chapter.topics) {
    if (topic.knowledgePoints.some(point => point.id === nodeId)) {
      return { chapterId: chapter.id, topicId: topic.id }
    }
  }

  return { chapterId: chapter.id, topicId: chapter.topics[0]?.id ?? null }
}
