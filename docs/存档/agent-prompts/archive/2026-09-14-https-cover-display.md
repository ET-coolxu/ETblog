---
title: https 封面显示与编辑器预览
type: fix
status: done
created: 2026-09-14
updated: 2026-09-14
related:
  - docs/requirements/v1.md
  - docs/agent-prompts/archive/2026-09-14-editor-slug-cover.md
---

# https 封面显示与编辑器预览

请按本提示词修复，不要顺手做无关重构。实现前先读 `.cursor/rules/project-conventions.mdc`、`.cursor/rules/nextjs-app.mdc` 与相关现有代码。产品细节以 PRD 为准。

## 背景

`asCover` 已放行 `https://`，保存写入 frontmatter 也成功。本地验证：上传得到的站内封面能显示；手填 https 封面在列表/正文不行。

复现值（已写入 `content/posts/test.md`）：

`https://pixnio.com/free-images/2026/09/11/2026-09-11-04-50-51-960x540.jpg`

实测根因（不是保存被拒、不是 CSP `img-src`、不是 `next/image` 远程域名）：

- 页面 HTML 已有 `<img src="https://pixnio.com/...">`。
- 无 Referer 请求该图 → `200 image/jpeg`。
- 带 `Referer: http://localhost:3000/` → `302` 到对方防热链页。
- Next.js 还会给封面加 `<link rel="preload" as="image">`，同样带文档 Referer。

另：后台封面输入框没有预览，上传或手填后看不到图。

## 复现步骤

1. 登录后台，编辑任意文章，封面填上述 https 地址并发布。
2. 打开 `/posts/{slug}`、文章列表/首页卡片：封面应出图，实际裂图或不显示。
3. 同一编辑页：封面区只有输入框，没有预览。

对照：封面改为 `/uploads/...` 站内图时，前台能显示。

## 目标

- https 封面能保存，并在列表卡片、正文页显示（对按 Referer 防热链的图床，请求不带本站来源）。
- 后台封面区：合法站内路径或 https 时显示预览；上传或改输入后立刻可见。外链加载失败有中文说明，不要裂图空白。

## 非目标

- 不把封面改成 `next/image`，不配 `images.remotePatterns`。
- 不代理/转存外链封面到本站磁盘。
- 不新加 CSP；当前没有 `Content-Security-Policy`，不要为了本修复去加。
- 不改正文 Markdown 插图渲染、不改上传校验、不改 slug。
- 不保证所有图床都允许热链；对方连无 Referer 也拒绝时，编辑器说明失败即可。

## 约束

- 遵守 Markdown 唯一信源、中文文案、第一版不做评论/订阅/多用户。
- 封面仍用原生 `<img>`。
- 新增或改动的导出函数写中文 JSDoc。
- 客户端组件不要 import 读磁盘的 `lib/posts.ts`；封面校验若给编辑器复用，抽到无 Node/fs 的模块。
- 不要 `git commit` / `git push`；不要跑 `npm install` / `next build` / docker。

## 验收标准

- [x] `content/posts/test.md` 的 pixnio https 封面在 `/posts/test` 与列表/首页卡片能显示出图
- [x] 站内 `/uploads/...` 封面仍能显示
- [x] 保存 https 封面不被拒；`http://`、`//`、`javascript:`、`data:` 仍拒绝
- [x] 编辑器：填合法封面或上传后立刻出现预览
- [x] 编辑器：外链加载失败显示中文说明，不出现裂图
- [x] 未引入 `next/image` 远程域名配置

## 涉及范围

- `next.config.ts`（文档级 `Referrer-Policy`，让 preload 也不带跨站 Referer）
- 列表/正文封面 `<img>`：`referrerPolicy="no-referrer"`
- `components/post-editor.tsx`：封面预览
- 必要时：`lib/cover.ts`（从 `lib/posts.ts` 抽出 `asCover` 供客户端用）、`components/cover-image.tsx`
- `docs/requirements/v1.md`：编辑器封面预览

## 实现要点

- 根因是对方按 Referer 防热链，不是 `asCover` 丢掉 URL。
- `Referrer-Policy: same-origin`（或等价）+ 封面 img `referrerPolicy="no-referrer"`。不要靠配 CSP `img-src`。
- 预览用 `asCover` 判断是否展示；`onError` 隐藏裂图并改中文说明；改输入后重置失败状态。

## 验证

- 浏览器：`/posts/test`、首页/列表卡片出 pixnio 封面；后台编辑该文封面区有预览。
- 再传一张站内封面，预览与前台仍正常。
- 故意填无法加载的 https（或断网后填外链）看中文失败说明。
- 保存 `http://example.com/x.jpg` 仍报封面不合法。
