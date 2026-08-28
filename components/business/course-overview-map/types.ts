export type OverviewStatus = 'completed' | 'active' | 'locked'
export type OverviewSkin = 'island' | 'city'

export interface OverviewModule {
  id: string
  name: string
  done: number
  total: number
  status: OverviewStatus
  islandType?: 'eco' | 'tech'
  islandAsset?: string
}

export interface OverviewIslandSpot extends OverviewModule {
  order: number
  asset: string
  bobDelay: string
  style: {
    left: string
    top: string
    width: string
    height: string
  }
}

export interface OverviewBridge {
  d: string
  tone: 'completed' | 'progress' | 'locked'
  dashed: boolean
  start: { x: number; y: number }
  end: { x: number; y: number }
}
