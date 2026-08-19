# 数字实训平台

独立静态项目，首期落地「课程中心」页。

## 设计还原（Cursor）

设计侧 Prompt、模型选型、工作流速查 → **[设计还原手册.md](./设计还原手册.md)**

## 本地预览

```bash
cd ~/Desktop/数字实训平台
python3 -m http.server 5174
```

浏览器访问 http://127.0.0.1:5174/

## 目录

| 路径 | 说明 |
|------|------|
| `设计还原手册.md` | **设计侧 Cursor Prompt / 模型选型速查** |
| `index.html` | 课程中心 |
| `css/tokens.css` | 设计令牌 |
| `css/app.css` | 页面样式 |
| `js/app.js` | 筛选 / 搜索 / 卡片反馈 |
| `assets/brand/` | Logo、侧栏装饰 |
| `assets/course/` | 课程封面 |
| `assets/tools/` | 软件图标、智能助手 |
