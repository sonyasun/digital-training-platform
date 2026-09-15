# 数字实训平台

静态前端（HTML / CSS / JS）。设计与开发约定见下方规范。

## 相关

| 文档 | 用途 |
|------|------|
| [设计规范.md](./设计规范.md) | 设计系统（令牌真源 `css/tokens.css`） |
| [设计还原手册.md](./设计还原手册.md) | MasterGo Prompt / 模型 |
| [COURSEWARE-STYLE.md](./assets/student/courseware/COURSEWARE-STYLE.md) | 课件视觉 |

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
| `components/` | 学习地图 Vue（需 `npm run build:learning-map`） |
