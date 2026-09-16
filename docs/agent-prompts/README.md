# Agent 提示词

这里存放发给 AI 的任务提示词，也是需求存档。改代码前先有对应文件。

产品说明以 [docs/requirements/v1.md](../requirements/v1.md) 为准。改需求先改 PRD，再改对应提示词。

## 怎么用

1. 复制 `_templates/` 里对应类型的模板，保存到下面某个目录，文件名用 `YYYY-MM-DD-short-slug.md`。
2. 把背景、目标、约束、验收标准写完整，把 `status` 改成 `ready`。
3. 在 Cursor 里 `@` 该文件，或把正文发给 AI。
4. 需求有变就改 PRD 和这份文件，不要只在聊天里改。
5. 做完后 `status: done`，把文件移到 `archive/`。

## 目录

| 目录 | 用途 |
|---|---|
| `features/` | 新需求 |
| `optimizations/` | 优化 |
| `architecture/` | 架构更新 |
| `fixes/` | 缺陷修复 |
| `archive/` | 已完成 |
| `_templates/` | 模板（不要当任务文件改） |

## status

`draft` → `ready` → `in-progress` → `done`

## 第一版发送顺序

产品需求：[个人博客第一版 PRD](../requirements/v1.md)  
执行清单：[TODO](../todo-v1.md)

1. [从零搭建工程骨架与部署配置](./archive/2026-08-27-nextjs-personal-blog-v1.md)（已完成）
2. [公开阅读](./archive/2026-08-27-public-reading.md)（已完成）
3. [搜索、SEO、暗色模式与访问统计](./archive/2026-08-27-search-seo-stats.md)（已完成）
4. [后台文章编辑与图片上传](./archive/2026-08-27-admin-posts.md)（已完成）
5. [第一版上线清单](./archive/2026-09-11-go-live.md)（文档已完成；VPS 执行见 [vps-go-live](../vps-go-live.md)）
6. [Docker 构建打入站点环境变量](./archive/2026-09-11-docker-site-env-build.md)（已完成）
7. [编辑器 slug 序号、封面与插图 alt](./archive/2026-09-14-editor-slug-cover.md)（已完成）
8. [https 封面显示与编辑器预览](./archive/2026-09-14-https-cover-display.md)（已完成）
9. [GHCR 自动部署](./archive/2026-09-14-ghcr-auto-deploy.md)（已完成；生产部署只跟 `main`）
10. [test 验证后再合 main](./archive/2026-09-15-test-then-main-workflow.md)（已完成；功能 PR 先合 `test`。复盘：[GHCR 首次启用](../2026-09-15-ghcr-go-live-retrospective.md)）
11. [文章删除与存档](./features/2026-09-15-post-delete-archive.md)
