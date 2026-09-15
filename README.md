# 数字实训平台

静态前端（HTML / CSS / JS）。

## 给前端：规范入口（必看）

以下文件**均已进 GitHub**，按此顺序读即可：

| 顺序 | 路径 | 说明 |
|------|------|------|
| 1 | [设计规范.md](./设计规范.md) | 设计系统：令牌用法、壳层、命名、组件契约 |
| 2 | [css/tokens.css](./css/tokens.css) | 色 / 字 / 间距 / 圆角 / 阴影 / z-index **真源** |
| 3 | [设计还原手册.md](./设计还原手册.md) | MasterGo 还原 Prompt、模型选型 |
| 4 | [.cursor/README.md](./.cursor/README.md) | Cursor rules / skills / prompts 索引 |
| 5 | [.cursor/rules/design-restore.mdc](./.cursor/rules/design-restore.mdc) | 改页面时的硬约束（Cursor 自动带上） |
| 6 | [.cursor/skills/mastergo-frontend/SKILL.md](./.cursor/skills/mastergo-frontend/SKILL.md) | 按稿落地步骤 |
| 7 | [COURSEWARE-STYLE.md](./assets/student/courseware/COURSEWARE-STYLE.md) | 节点学习 iframe 课件视觉 |

用 Cursor 打开本仓库后，项目内 `.cursor/rules` 与 `.cursor/skills` 会参与 Agent；不要依赖个人机上的全局 skills。

## 预览

```bash
python3 -m http.server 5174
```

http://127.0.0.1:5174/

## 页面

| 路径 | 说明 |
|------|------|
| `index.html` | 课程中心 |
| `prepare.html` | 备课中心 |
| `prepare-edit.html` | 课程编辑 |
| `classes.html` | 我的班课 |
| `login.html` | 登录 |
| `student-courses.html` | 学生 · 我的课程 |
| `student-course.html` | 学生 · 课程详情 |
| `student-learning-path.html` | 学生 · 学习路径 |
| `student-node-study.html` | 学生 · 节点学习 |
| `student-ai-study.html` | 学生 · AI 学习 |

## 部署

生产：https://digital-training-platform.pages.dev/

```bash
npm run predeploy && npm run deploy
```

## 关键目录

| 路径 | 说明 |
|------|------|
| `css/tokens.css` | 设计令牌 |
| `css/app.css` | 教师壳层 |
| `js/` | 页面逻辑 |
| `assets/` | 品牌 / 图标 / 封面 / 课件 |
| `.cursor/` | 团队 Cursor 规范（rules / skills / prompts） |
| `components/` | 学习地图 Vue（需 `npm run build:learning-map`） |
