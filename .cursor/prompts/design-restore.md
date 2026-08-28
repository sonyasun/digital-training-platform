# 设计还原 · 复制即用 Prompt

> 完整版见项目根目录 **[设计还原手册.md](../../设计还原手册.md)**（推荐从这里打开）  
> 设计系统总览见 **[设计规范.md](../../设计规范.md)**
>
> 用法：新开 Chat → 选好模型 → 整段复制粘贴 → 替换 `[...]` 占位符

---

## 1. MasterGo 整页/模块还原

**模型：Composer 2.5**

```
实现 MasterGo 设计稿到前端。

设计链接：[粘贴 mastergo.com 链接，含 fileId / pageId / layerId]
目标页面：[新建 prepare-xxx.html / 修改 prepare-edit.html / 其他]
落地范围：[整页 / 仅弹窗 / 仅某 Tab / 仅课程目录树]

要求：
1. 严格遵循 .cursor/skills/mastergo-frontend/SKILL.md 与 .cursor/rules/design-restore.mdc
2. 先 getDesignSections 拉全 section，再写代码；文案只用 allTexts / rowTexts，禁止脑补
3. 表格/列表行数 = structureSiblingCount
4. 颜色用 _color，字体/圆角/间距对齐 css/tokens.css、css/fonts.css
5. 图片下载到 assets/prepare/ 或 assets/classes/ 等语义目录，禁止 MasterGo CDN
6. 复用现有壳子（topbar / sidebar / rail），不重做已有导航
7. 完成后列出改动文件与自测步骤

若链接缺少 layerId，先告诉我缺什么，不要猜测页面结构。
```

### 变体 A：仅还原弹层/面板

```
按 MasterGo 稿还原弹层。

设计链接：[链接]
挂载位置：[prepare-edit.html 的 + 按钮弹窗 / 其他]
交互：[点击 X 打开，点空白/Esc 关闭]

遵循 mastergo-frontend skill 与 design-restore 规则。
文案闭集、图标本地化、样式对齐现有 prepare-edit.css。
```

### 变体 B：在现有页面上加新态

```
在 [prepare-edit.html] 上增加 MasterGo 稿中的 [模块名] 态。

设计链接：[链接]
不要破坏现有 Tab/树结构；无稿内容的 Tab 留空面板。
最小 diff，匹配周边命名与 CSS  convention。
```

---

## 2. 纯 CSS / 视觉精修

**模型：Claude Sonnet 5**（小改可用 Composer 2.5 Fast）

```
作为资深设计师，精修 [prepare-edit.html / css/prepare-edit.css] 中的 [模块名，如 pedit-add__agent]。

目标：
- 更美观、更精致，且符合本项目现有设计规范
- 对齐 css/tokens.css（颜色、字号、圆角、间距）
- 与弹窗整体渐变/卡片风格一致（参考 .pedit-add、.pedit-tile）

约束：
- 只改视觉，不改 HTML 结构与业务逻辑
- 最小 diff；不引入新依赖
- 保留现有 icon、文案、data-add-item 钩子
- hover/active/focus 状态要完整

请先简述问题与改法，再直接改代码。
```

### 变体 A：对照截图精修

```
[附上设计截图或标注图]

对照设计稿精修 [模块名]。
文件：[css/prepare-edit.css]、[prepare-edit.html 如需要]
列出稿面与实现的差异，再逐项修复。禁止改动无关模块。
```

### 变体 B：仅调间距/对齐

```
只优化 [模块名] 的布局与间距：
- 对齐方式、gap、padding、grid/flex
- 不改颜色与字体，除非明显违反 tokens.css

文件：css/prepare-edit.css（必要时 prepare-edit.html）
最小 diff。
```

---

## 3. 视觉验收（可选，给 Gemini）

**模型：Gemini 3.x Pro**

```
[附上设计稿截图]

对照设计验收 [页面/模块名] 的实现效果。

检查：布局、间距、颜色、字号、圆角、阴影、icon 尺寸、hover 态。
输出：不一致项清单（高/中/低优先级）+ 建议修改的文件。
先不要写代码，只出清单。
```

---

## 4. 推荐串联方式

```
Gemini（验收清单）→ Composer 2.5（按清单改）→ Sonnet 5（CSS 精修）→ Composer Fast（收尾）
```
发布地址平台：Cloudflare Pages