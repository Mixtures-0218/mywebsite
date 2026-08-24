# 网站改版资源说明

本子文件夹（`assets/`）存放 2026-08 网站升级的全部新增共享资源。

## 目录结构

```
assets/
├── css/
│   └── main.css          全站统一样式（深蓝渐变 + 毛玻璃卡片风格）
├── js/
│   ├── wind-field.js     风场流体背景动效（Perlin curl noise 流场 + Rankine 台风涡旋）
│   ├── lang.js           双语切换（默认英文，localStorage 记忆用户选择）
│   └── articles-data.js  博客文章数据（中英双语富文本）
├── pdf/
│   └── Yiding Luo CV.pdf 个人简历（主页"Resume / CV"卡片新标签页打开）
└── archive/              旧版页面归档（不再被主站引用，仅存档）
    ├── Home_old.html     旧版主页
    ├── 视频.html         旧版视频页
    ├── 文章.html         旧版文章页
    ├── About.html        旧版关于页
    ├── 关于.html         旧版关于页
    ├── 活动.html         旧版活动页
    ├── 气象网站.html     旧版气象网站推荐页（外部推荐入口已删除）
    ├── Seattle_Energy.html  旧版西雅图电力文章页（内容已迁入 article.html）
    ├── 大气河.html       旧版大气河文章页（内容已迁入 article.html）
    ├── 谣言.html         旧版谣言文章页（内容已迁入 article.html）
    ├── 逆温层.html       旧版逆温层文章页（内容已迁入 article.html）
    └── 风袋.html         旧版风向袋文章页（内容已迁入 article.html）
```

## 改版要点

1. **风场流体背景**：所有页面背景改为 Perlin curl noise 流场（无散度、流线平滑）；鼠标悬停区域以光标为中心产生 Rankine 涡旋（北半球逆时针旋向、眼壁结构、外围 1/r 衰减），模拟台风风场。粒子透明度 ≤0.5，不遮挡内容。
2. **双语系统**：默认 English；切换中文后 localStorage 记忆，跨页面保持。
3. **文章页**：6 篇文章（Seattle 电力信息图页内展示、ENSO 论文新标签页 PDF、大气河/天气谣言/逆温层/风向袋 4 篇中英双语全文），替换原 4 篇占位文章。
4. **视频页**：YouTube 风格选择页（16:9 缩略图 + 时长徽章 + 双语标题 + 悬停播放效果），15 个视频条目（含 Earth Null School 推荐视频，保留但不再链接推荐入口）；15 个详情页统一新风格。
5. **主页**：删除"推荐工具网站软件"卡片（外部气象网站推荐），新增"Resume / CV"卡片；个人介绍按最新简历更新；页脚 Qwen AI 改为 DeepSeek（并修正 funtions→functions 拼写）。
6. **英文修正**：全部可达页面英文拼写/语法已修正（storng、percipitation、herf、Jun 25→Jan 25、OLYMEPEX、Colorado Canyon、Frozen Rain→Freezing Rain、solar column→sun pillar 等）。

## 备注

- `atg_live.html`（UW ATG 屋顶观测页）按用户要求未做任何修改。
- 现有资源目录（image/、视频/、文章/、New/、style/）未移动、未重命名，全部原位引用。
