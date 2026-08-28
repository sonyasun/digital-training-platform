# fonts

- **Noto Sans SC**（与稿面 Source Han Sans SC / 思源黑体同族）：正文中文与拉丁字母
- **OPPO Sans**（OPPO 官方免费商用）：全站数字与常用数值符号（`0-9`、`.`、`%`、`:` 等），通过 `css/fonts.css` 的 `unicode-range` 自动覆盖

文件：

| 文件 | 用途 |
|------|------|
| `noto-sans-sc-*-normal.woff2` | 正文 400 / 500 |
| `oppo-sans-regular.woff2` | 数字 400 |
| `oppo-sans-medium.woff2` | 数字 500 |

令牌：`--font-sans`（正文）、`--font-num`（显式数字字体，如 SVG 大号指标）
