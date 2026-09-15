# 嵌入式动画课件 · 视觉规范

改课件样式 / 新建同类课件时用。上位规范：[设计规范.md](../../../设计规范.md)。冲突时：**平台 > 本文 > 单页临时样式**。

| 改什么 | 改哪里 |
|--------|--------|
| 主题色、字号、圆角、阴影 | `5g-internet-animated-lesson.css` 的 `:root` |
| 某类卡片 / 控件 | 同 CSS 对应选择器 |
| 文案 / DOM | HTML 的 `DATA[].html` |
| iframe 外圈 | `css/student-node-study.css`（`.nodestudy-viewer__embed*`） |

目标：像平台学习内容，不是独立小站；字号跟平台 12–20 阶梯；样式只出 CSS，不出 HTML 内联大段。

---

## 1. 字号

| 档位 | Token | 尺寸 | 用途 |
|------|-------|------|------|
| Caption | `--cw-font-12` | 12 | TOC、页码、角标 |
| Body | `--cw-font-14` | 14 | **默认**：列表、说明、按钮、字幕 |
| Emphasize | `--cw-font-16` | 16 | 卡片题、封面芯片 |
| Title | `--cw-font-18` | 18 | 页标题 `h3`、小结轴心 |
| Display | `--cw-font-20` | 20 | 关键数字（一页 ≤2 处） |
| Hero | 写死 24 / Bold 700 | 24 | **仅** `.cover h2` |

禁止非阶梯字号（Hero 除外）。窄屏优先减间距，Caption 不低于 12。

---

## 2. 颜色

镜像平台；课件内用 `--cw-*`（勿链全站 `tokens.css`，路径易碎）。

| 角色 | Token | 值 |
|------|-------|-----|
| 主色 | `--cw-color-primary` | `#1677ff` |
| 仿真 | `--cw-color-sim` | `#575aff` |
| 成功 | `--cw-color-success` | `#28b28b` |
| 主/次/弱字 | `--cw-text-primary` / `secondary` / `muted` | `#303133` / `#606266` / `#909399` |
| 面板 / 描边 | `--cw-bg-panel` / `--cw-border` | `#fff` / ≈`#e4e7ed` |

文字层级用色阶，不用浅灰堆三层以上。渐变仅限按钮、进度、短下划线、封面徽章。禁止整页深色播放器底。

---

## 3. 间距 / 圆角 / 阴影

对齐平台 `--space-*` / `--radius-*` / `--shadow-*`（课件内可用同值或 `--cw-space-*` 镜像）。

| 平台 | 课件建议 |
|------|----------|
| `--space-1`…`6`（4–32） | 同值；幻灯底 padding ≥ 120px，字幕 `bottom` ≥ 120px |
| `--radius-md` / `lg` / `xl` / `pill` | 控件 8；大卡 12–16；TOC/dock pill |
| `--shadow-sm` / `md` | 默认卡 / 高亮；禁止多层霓虹 |

---

## 4. 组件配方

| 组件 | 字号 | 外观 |
|------|------|------|
| `.slide-kicker` | 12 或 14 | 主色字 + 浅底胶囊 |
| `h3` | 18；`small`→12 | 底短渐变线 |
| `.cover` | h2→24；徽章→20；chip→16 | Hero 不扩散到内页 |
| `.card` / `.kcard` / `.frow` / `.arow` | 题 16；文 14 | 左色条或圆序号 |
| `.dock` | 控件 14；页码 12 | 毛玻璃白底 |

新组件先对表选型，禁止先写 `font-size:15px`。

---

## 5. 流程

1. 改视觉 → 只动 CSS `:root` 或模块选择器 → 硬刷新节点学习「学习」Tab  
2. 改某页内容 → 编辑 `DATA[].html`，保留 `.rv` / `data-at`  
3. 新课件 → 复制 html+css；阶梯与色板不变；改 `STUDY_COURSEWARE.src`；禁止大段 `<style>`

### 验收

- [ ] 内页字号仅 12/14/16/18/20，用途符合上表；仅 `.cover h2` 用 24/Bold  
- [ ] Display(20) 一页 ≤2（封面徽章可另计）  
- [ ] 色值来自 `--cw-*`  
- [ ] 底栏展开时字幕不挡主内容；≤760px 无横向撑破  
- [ ] `prefers-reduced-motion` 下可读；未误改音频 DATA  

---

## 附录 · 选择器 ↔ 档位

| 选择器 | 档位 |
|--------|------|
| `body`、`#subtitle`、列表 li、底栏按钮 | Body 14 |
| `.cover .dim`、`.chips span`、卡片题 `b` / `em` | Emphasize 16 |
| `h3`、`.trunk` | Title 18 |
| `.node b`、`.big`、`.rings b` | Display 20 |
| `.cover h2` | Hero 24 |
| TOC、页码、序号、kicker | Caption 12 |

改阶梯或色板时同步更新本文与 CSS `:root`。
