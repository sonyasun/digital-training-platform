# 数字实训平台

独立静态项目，首期落地「课程中心」页。

## 设计规范

设计与开发统一参考 → **[设计规范.md](./设计规范.md)**（令牌、布局壳层、命名约定、AI 视觉语言）

设计侧 Prompt、模型选型、工作流速查 → **[设计还原手册.md](./设计还原手册.md)**

## 本地预览

```bash
cd ~/Desktop/数字实训平台
python3 -m http.server 5174
```

浏览器访问 http://127.0.0.1:5174/

## 线上预览（Cloudflare Pages）

| 地址 | 说明 |
|------|------|
| https://digital-training-platform.pages.dev/ | 生产环境（默认进入备课中心） |
| https://digital-training-platform.pages.dev/index.html | 课程中心 |
| https://digital-training-platform.pages.dev/prepare.html | 备课中心 |
- `/classes.html` — 我的班课
- `/prepare-edit.html` — 课程编辑

### 更新部署

```bash
cd ~/Desktop/数字实训平台
rsync -a --delete --exclude node_modules --exclude .git --exclude .cursor --exclude dist --exclude package.json --exclude package-lock.json --exclude .assetsignore --exclude .DS_Store ./ dist/
npm run deploy
```

## 目录

| 路径 | 说明 |
|------|------|
| `设计规范.md` | **设计系统总览（令牌、壳层、命名、资源）** |
| `设计还原手册.md` | **设计侧 Cursor Prompt / 模型选型速查** |
| `index.html` | 课程中心 |
| `css/tokens.css` | 设计令牌 |
| `css/app.css` | 页面样式 |
| `js/app.js` | 筛选 / 搜索 / 卡片反馈 |
| `assets/brand/` | Logo、侧栏装饰 |
| `assets/course/` | 课程封面 |
| `assets/tools/` | 软件图标、智能助手 |
