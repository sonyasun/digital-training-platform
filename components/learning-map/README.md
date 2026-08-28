# Learning Map · 学习路径地图

可独立拷贝的 SVG 交互式学习路径地图组件（原 `LearningPathMapLuJin`）。

**零外部 UI 依赖**：样式全部内联在组件内，不依赖 `tokens.css`、Element Plus 或 AntV G6。

---

## 目录结构

```
learning-map/
├── LearningMap.vue      # 主组件（~3800 行，自包含样式）
├── types.ts             # PathNodeLike 等类型定义
├── index.ts             # 统一导出
├── assets/
│   └── map-background-texture.png   # 地图背景纹理（需放到 public）
├── demo/
│   ├── LearningMapDemo.vue          # 可运行的示例页
│   └── samplePathNodes.ts           # 示例数据
└── README.md
```

---

## 拷贝到其他项目

### 方式一：直接复制文件夹

```bash
cp -r integration/learning-map /path/to/your-project/src/components/learning-map
```

### 方式二：集成脚本

```bash
npm run integration:copy -- learning-map /path/to/your-project
```

---

## 接入步骤

### 1. 安装依赖

仅需 Vue 3（无额外 npm 包）：

```bash
# 目标项目需已有 vue ^3.3
```

### 2. 拷贝背景图

将 `assets/map-background-texture.png` 复制到目标项目的静态资源目录：

```bash
cp src/components/learning-map/assets/map-background-texture.png \
   /path/to/your-project/public/assets/map-background-texture.png
```

组件内引用路径为 `/assets/map-background-texture.png`（Vite 默认 public 目录）。

### 3. 在页面中使用

```vue
<script setup lang="ts">
import { ref } from 'vue'
import LearningMap from '@/components/learning-map/LearningMap.vue'
import type { PathNodeLike } from '@/components/learning-map/types'

const pathNodes = ref<PathNodeLike[]>([
  {
    id: 'node-1',
    name: '第一章 · 基础概念',
    shortName: '基础概念',
    order: 1,
    shapeType: 'theory',
    level: 'basic',
    nodeType: '理论',
    x: 80,
    y: 400,
    chapterId: 'ch1',
    resources: '视频1｜PPT1',
    duration: '20min',
    description: '...',
    status: 'completed',
    mastery: 90
  }
  // ...更多节点
])

const currentNodeIndex = ref(0)
const selectedChapter = ref('ch1')

function onNodeClick(nodeId: string, node: PathNodeLike) {
  console.log('点击节点', nodeId, node)
}
</script>

<template>
  <div style="width:100%;height:100vh">
    <LearningMap
      :path-nodes="pathNodes"
      :current-node-index="currentNodeIndex"
      chapter-name="我的课程 · 学习路径"
      :selected-chapter="selectedChapter"
      mode="student"
      @node-click="onNodeClick"
      @chapter-change="(id) => selectedChapter = id"
    />
  </div>
</template>
```

### 4. 快速预览 Demo

在路由中挂载 `demo/LearningMapDemo.vue`：

```typescript
{
  path: '/learning-map-demo',
  component: () => import('@/components/learning-map/demo/LearningMapDemo.vue')
}
```

---

## Props

| Prop | 类型 | 默认 | 说明 |
|------|------|------|------|
| `pathNodes` | `PathNodeLike[]` | 必填 | 当前章节的路径节点列表 |
| `mode` | `'teacher' \| 'student'` | `'student'` | 教师/学生视图模式 |
| `chapterName` | `string` | `'BIM技术及应用 · 学习路径'` | 顶部章节标题 |
| `currentNodeIndex` | `number` | `-1` | 当前学习节点下标 |
| `recommendedNodeIds` | `string[]` | `[]` | AI 推荐节点 ID |
| `weakNodeIds` | `string[]` | `[]` | 薄弱节点 ID |
| `chapterList` | `ChapterNavigationItem[]` | `[]` | 左侧导航章节列表 |
| `selectedChapter` | `string` | `''` | 当前选中章节 ID |
| `peekNodes` | `PathNodeLike[]` | `[]` | 前序章节预览节点 |
| `nextPeekNodes` | `PathNodeLike[]` | `[]` | 后续章节预览节点 |
| `hideBirdView` | `boolean` | `false` | 隐藏左侧路径导航 |
| `sectionSegments` | `unknown[]` | `[]` | 区段分段（高级） |
| `zoneAreas` | `unknown[]` | `[]` | 区域标注（高级） |
| `nodeHierarchyMap` | `Record<string,string>` | `{}` | 节点层级映射 |

## Events

| 事件 | 参数 | 说明 |
|------|------|------|
| `node-click` | `(nodeId, node)` | 点击路径节点 |
| `chapter-change` | `(chapterId)` | 切换章节 |
| `node-hover` | `(nodeId \| null, node \| null)` | 节点悬停 |

---

## PathNodeLike 数据结构

```typescript
interface PathNodeLike {
  id: string
  name: string
  shortName: string
  order: number
  shapeType: 'theory' | 'practice' | 'integrated' | 'reinforce'
  level: 'basic' | 'advanced' | 'extended' | 'reinforce'
  nodeType: string          // 显示用：理论 / 实操 / 理实一体 / 补强
  x: number                 // SVG 画布坐标
  y: number
  chapterId: string
  zoneId?: string
  resources: string         // 如 "视频2｜PPT1｜练习2"
  duration: string          // 如 "25min"
  description: string
  cardOffsetX?: number
  cardOffsetY?: number
  status?: 'not-started' | 'in-progress' | 'completed'
  isCurrent?: boolean
  isRecommended?: boolean
  isWeak?: boolean
  mastery?: number          // 0-100，决定节点颜色
  branch?: { name: string; side?: 'left' | 'right' }
}
```

节点坐标 `x/y` 建议范围：x 60–900，y 100–450（参考 `demo/samplePathNodes.ts`）。

---

## 与 g6-learning-path 包的区别

| | `learning-map`（本包） | `g6-learning-path` |
|--|--|--|
| 渲染 | 纯 SVG，无 G6 | AntV G6 图引擎 |
| 依赖 | 仅 Vue 3 | `@antv/g6` + sass |
| 体积 | 单文件 ~3800 行 | 多文件子系统 |
| 场景 | 快速集成、静态部署 | 需要 G6 生态能力 |

本包即生产环境使用的 `LearningPathMapLuJin`，已从 G6 依赖中解耦。
