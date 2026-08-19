---
name: mastergo-frontend
description: >-
  Implements MasterGo screens into the 数字实训平台 frontend. Use when the user
  pastes a mastergo.com prototype/file URL, says 实现/还原/按稿/做页面, or asks to
  wire a design layer into existing HTML/CSS/JS.
---

# MasterGo → 前端落地

设计稿是唯一视觉与文案来源。先读稿，再改现有壳子，禁止脑补页面或文案。

## 何时执行

用户给出以下任一即启动本流程：

- `https://mastergo.com/file/...` 或 `https://mastergo.com/prototype/...`
- 「实现 / 还原 / 按稿做 / 把这个做成页面」
- 指定 `layerId` 的弹层、面板、新页面

## 0. 解析链接

从 URL 取出：

| 参数 | 含义 | 例子 |
|---|---|---|
| 路径中的数字 | `fileId` | `153233042436976` |
| `pageId` | 页面，需把 `%3A` 还原成 `:` | `14003:60081` |
| `layerId` | 要做的图层 | `14008:42710` |

调用 MasterGo MCP 前先 `GetMcpTools` 看 `user-mastergo-magic-mcp` 的参数。

## 1. 先拉目录，再拉 DSL

1. `mcp__getDesignSections`：只传 `fileId` + `layerId` + `format: yaml`，**不要**带 `sectionIndex`。
2. 记下 `rootMetadata.name`、`allTexts`、`rootContainer`、`splitContainers`、`totalSections`。
3. 按批（3–5 个）拉 `sectionIndex = 0 … N-1`。内容区必须拉全；顶栏/侧栏/右轨若项目里已有，可只抽文案与图标，不重做壳。

不要用 `getDsl` 和 `getDesignSections` 混打同一稿。不要为了「核对」再打一遍 `getDsl`。

## 2. 判断落地方式

| 稿面 | 做法 |
|---|---|
| 新业务页（备课中心、我的班课、课程编辑态） | 新 `*.html` + `css/*.css` + 必要 `js/*.js`，复用 `prepare.html` / `classes.html` 的 topbar / sidebar / rail |
| 已有页的另一态 | 改现有页，或新页并从列表/按钮挂链接 |
| 弹层/菜单（如「+」添加教学活动） | 做 popover/dialog，点设计指定的控件打开，点空白 / Esc 关闭 |
| 仅改样式 | 只动对应 CSS，不新建页 |

侧栏「我的教学」已是 `nav-group`：备课中心 `prepare.html`，我的班课 `classes.html`。新教学页挂到该组，并改 `js/app.js` 的 group toggle（不要 `preventDefault` 掉真实 `.html` 链接）。

## 3. 文案与结构（闭集）

- 可见文字只能来自 `rootMetadata.allTexts` 或某 section 的 `dsl.rowTexts` / `node.text`。
- `_placeholder: true` 且不在真实业务槽位的，不渲染。
- 稿里没有的标题、空状态、按钮文案，不要补。
- Tab / 列表只做稿里有内容的态；无内容的 Tab 留空面板。
- 表格/列表行数 = `structureSiblingCount`，不要按「共 N 项」注水。

## 4. 视觉

- 颜色优先用节点 `_color`；间距、圆角、字号、行高按 `layoutStyle` / `flexContainerInfo`。
- 字体走项目令牌：`css/tokens.css`、`css/fonts.css`（Noto Sans SC 400/500）。`font-weight: 500` 写成 `var(--font-weight-medium)`。
- 交互态看 `_variantProps`（如 `属性 1: 选中`），不要默认选第一项。
- 图标按稿：更多是**横向三点**；加号/编辑笔要够大（约 20–24px），不要竖向小点。
- 复杂 PATH 用 `@@SVG:{svgShortKey}@@` + `mcp__applyDesign`（仅适合整页从零生成）。接入现有多页壳时，用语义 SVG，但尺寸、方向、颜色必须对齐稿。

## 5. 图片（硬性）

MasterGo CDN **禁止**进 HTML/CSS/JS。

```bash
mkdir -p assets/mastergo
curl -fsSL -o "assets/mastergo/<hash>.<ext>" "<image-resource.mastergo.com URL>"
```

再按用途改到语义目录（如 `assets/prepare/`、`assets/classes/`），代码只引用语义路径。交付前搜 `image-resource.mastergo.com` / `mastergo.com/`，命中则先本地化。

## 6. 交互挂接

做完页面必须把入口接上，否则算没做完：

- 列表卡片整卡可点（覆盖层 `position:absolute; inset:0`），「更多」单独 `z-index` 更高。
- 编辑态「+」打开对应添加面板；面包屑回列表。
- 侧栏当前页 `is-active` / `is-open` 要正确。

## 7. 交付自检

- [ ] 文案都能在 `allTexts` / `rowTexts` 找到
- [ ] 无 MasterGo 外链
- [ ] 复用了现有壳，没有复制一套顶栏侧栏
- [ ] 入口可点到新页/弹层
- [ ] 图标方向与尺寸按稿
- [ ] 未发明稿外文案

## 项目锚点

- 壳：`index.html` / `prepare.html` / `classes.html` / `prepare-edit.html`
- 令牌：`css/tokens.css`、`css/fonts.css`、`css/app.css`
- 导航逻辑：`js/app.js`（`data-nav-group` / `data-nav-toggle`）
