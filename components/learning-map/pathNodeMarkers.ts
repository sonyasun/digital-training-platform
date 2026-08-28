import type { PresentationNodeStatus } from './presentationNodeStatus'

/** 主题建筑造型：4 组主题各对应一种 */
export type PathNodeBuildingVariant = 'building' | 'cylindrical' | 'compound' | 'cluster'

/** 点位图配色：蓝=默认/未解锁，橙=需关注/待补强，青=已完成 */
export type PathNodeMarkerTone = 'default' | 'attention' | 'mastered'

const BASE = 'assets/student/path-node'

/** 12 张主路径建筑图：4 造型 × 3 状态色 */
export const PATH_NODE_BUILDING_MARKERS: Record<
  PathNodeBuildingVariant,
  Record<PathNodeMarkerTone, string>
> = {
  building: {
    default: `${BASE}/building-default.png`,
    attention: `${BASE}/building-attention.png`,
    mastered: `${BASE}/building-mastered.png`,
  },
  cylindrical: {
    default: `${BASE}/cylindrical-default.png`,
    attention: `${BASE}/cylindrical-attention.png`,
    mastered: `${BASE}/cylindrical-mastered.png`,
  },
  compound: {
    default: `${BASE}/compound-default.png`,
    attention: `${BASE}/compound-attention.png`,
    mastered: `${BASE}/compound-mastered.png`,
  },
  cluster: {
    default: `${BASE}/cluster-default.png`,
    attention: `${BASE}/cluster-attention.png`,
    mastered: `${BASE}/cluster-mastered.png`,
  },
}

/** 3 张分支拓展图（未来城市）：蓝/橙/青塔吊 */
export const PATH_NODE_BRANCH_MARKERS: Record<PathNodeMarkerTone, string> = {
  default: `${BASE}/branch-default.png`,
  attention: `${BASE}/branch-attention.png`,
  mastered: `${BASE}/branch-mastered.png`,
}

/** 3 张分支拓展图（岛屿探险）：浮岛花朵 */
export const PATH_NODE_BRANCH_ISLAND_MARKERS: Record<PathNodeMarkerTone, string> = {
  default: `${BASE}/branch-island-default.png`,
  attention: `${BASE}/branch-island-attention.png`,
  mastered: `${BASE}/branch-island-mastered.png`,
}

/** 岛屿主题 · 主路径各组浮岛造型（按 topic 分组） */
export const PATH_NODE_BUILDING_ISLAND_MARKERS_BY_VARIANT: Partial<
  Record<PathNodeBuildingVariant, Record<PathNodeMarkerTone, string>>
> = {
  building: {
    mastered: `${BASE}/building-island-mastered.png`,
    default: `${BASE}/building-island-default.png`,
    attention: `${BASE}/building-island-attention.png`,
  },
  cylindrical: {
    mastered: `${BASE}/cylindrical-island-mastered.png`,
    default: `${BASE}/cylindrical-island-default.png`,
    attention: `${BASE}/cylindrical-island-attention.png`,
  },
  compound: {
    mastered: `${BASE}/compound-island-mastered.png`,
    default: `${BASE}/compound-island-default.png`,
    attention: `${BASE}/compound-island-attention.png`,
  },
  cluster: {
    mastered: `${BASE}/cluster-island-mastered.png`,
    default: `${BASE}/cluster-island-default.png`,
    attention: `${BASE}/cluster-island-attention.png`,
  },
}

/** @deprecated 使用 PATH_NODE_BUILDING_ISLAND_MARKERS_BY_VARIANT.building */
export const PATH_NODE_BUILDING_ISLAND_MARKERS: Record<PathNodeMarkerTone, string> =
  PATH_NODE_BUILDING_ISLAND_MARKERS_BY_VARIANT.building!

export type PathNodeMapSkin = 'city' | 'island'

export const PATH_NODE_BUILDING_VARIANTS: readonly PathNodeBuildingVariant[] = [
  'building',
  'cylindrical',
  'compound',
  'cluster',
]

/** 掌握率状态 → 点位图配色 */
export function resolvePathNodeMarkerTone(
  status: PresentationNodeStatus,
): PathNodeMarkerTone {
  if (status === 'mastered') return 'mastered'
  if (status === 'attention' || status === 'weak') return 'attention'
  return 'default'
}

/** 岛屿主路径：已完成 / 默认 / 掌握率低于 50% */
function resolveIslandBuildingMarkerTone(
  status: PresentationNodeStatus,
  mastery: number,
): PathNodeMarkerTone {
  if (status === 'mastered' || mastery >= 80) return 'mastered'
  if (status === 'locked' || mastery < 1) return 'default'
  if (mastery < 50) return 'attention'
  return 'default'
}

/** 主路径：造型 + 状态 → 点位图路径 */
export function resolvePathNodeBuildingMarkerSrc(
  variant: PathNodeBuildingVariant,
  status: PresentationNodeStatus,
  mapSkin: PathNodeMapSkin = 'city',
  mastery = 0,
): string {
  if (mapSkin === 'island') {
    const islandMarkers = PATH_NODE_BUILDING_ISLAND_MARKERS_BY_VARIANT[variant]
    if (islandMarkers) {
      const tone = resolveIslandBuildingMarkerTone(status, mastery)
      return islandMarkers[tone]
    }
  }

  const tone = resolvePathNodeMarkerTone(status)
  return PATH_NODE_BUILDING_MARKERS[variant][tone]
}

/** 分支拓展：皮肤 + 状态 → 点位图路径 */
export function resolvePathNodeBranchMarkerSrc(
  status: PresentationNodeStatus,
  mapSkin: PathNodeMapSkin = 'city',
): string {
  const tone = resolvePathNodeMarkerTone(status)
  const markers = mapSkin === 'island'
    ? PATH_NODE_BRANCH_ISLAND_MARKERS
    : PATH_NODE_BRANCH_MARKERS
  return markers[tone]
}

/** 是否为非默认配色（用于样式：跳过错锁灰化等） */
export function isPathNodeStatusColoredMarker(
  status: PresentationNodeStatus,
): boolean {
  return resolvePathNodeMarkerTone(status) !== 'default'
}
