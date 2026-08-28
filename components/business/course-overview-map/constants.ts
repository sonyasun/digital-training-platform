import type { OverviewModule, OverviewSkin, OverviewStatus } from './types'

/** 本地静态资源：assets/course-overview/ */
export const OCEAN_ART_SRC = 'assets/course-overview/course-map-ocean.png'
/** 未来城市背景：本地 course-map-future-city.png */
export const CITY_ART_SRC = 'assets/course-overview/course-map-future-city.png'
/** 章节下钻 · 未来城市学习路径背景 */
export const CHAPTER_PATH_CITY_BG_SRC = 'assets/course-overview/course-map-chapter-path-city.png'
/** 章节下钻 · 岛屿探险学习路径背景 */
export const CHAPTER_PATH_ISLAND_BG_SRC = 'assets/course-overview/course-map-chapter-path-island.png'

/** 解析为绝对资源 URL（兼容 clean URL 与本地 file://） */
export function resolveAssetUrl(relativePath: string): string {
  const rootPath = relativePath.startsWith('/')
    ? relativePath
    : `/${relativePath.replace(/^\//, '')}`
  if (typeof window === 'undefined') return rootPath
  if (/^(https?:|data:|blob:)/.test(relativePath)) return relativePath
  if (window.location.protocol === 'file:') {
    const base = window.location.href.replace(/[#?].*$/, '').replace(/[^/]*$/, '')
    return base + relativePath.replace(/^\//, '')
  }
  return `${window.location.origin}${rootPath}`
}
export const ISLAND_ECO_SRC = 'assets/course-overview/course-island-eco-alpha.png'
export const ISLAND_TECH_SRC = 'assets/course-overview/course-island-tech-alpha.png'
export const CITY_ISLAND_ECO_SRC = 'assets/course-overview/course-city-island-eco-alpha.png'
export const CITY_ISLAND_TECH_SRC = 'assets/course-overview/course-city-island-tech-alpha.png'
export const CITY_ISLAND_LIFE_SRC = 'assets/course-overview/course-city-island-life-alpha.png'
export const CITY_ISLAND_MGMT_SRC = 'assets/course-overview/course-city-island-mgmt-alpha.png'
export const ISLAND_MGMT_SRC = 'assets/course-overview/course-island-mgmt-alpha.png'

export function statusLabel(status: OverviewStatus) {
  if (status === 'completed') return '已完成'
  if (status === 'active') return '进行中'
  return '未解锁'
}

export function resolveIslandAsset(mod: OverviewModule, skin: OverviewSkin) {
  if (skin === 'city') {
    if (mod.islandAsset?.includes('mgmt')) {
      return CITY_ISLAND_MGMT_SRC
    }
    if (mod.islandAsset?.includes('life')) {
      return CITY_ISLAND_LIFE_SRC
    }
    return mod.islandType === 'tech' || mod.status === 'active'
      ? CITY_ISLAND_TECH_SRC
      : CITY_ISLAND_ECO_SRC
  }
  return mod.islandAsset
    ?? (mod.islandType === 'tech' || mod.status === 'active'
      ? ISLAND_TECH_SRC
      : ISLAND_ECO_SRC)
}
