---
title: 后台 V2 登录分栏
type: optimization
status: ready
created: 2026-09-29
updated: 2026-09-29
related:
  - docs/requirements/v2-admin.md
  - docs/agent-prompts/architecture/2026-09-29-admin-v2-shell.md
---

# 后台 V2 登录分栏

请按本提示词改登录页版式。先读 `docs/requirements/v2-admin.md` 的「`/admin/login`」与现有 `app/admin/login/`。不要扩大范围。依赖侧栏壳的页面本篇不动。

## 背景

登录页现在是居中窄栏：站名链到首页、标题、短说明、表单。原型是全视口左右分栏，和登录后的侧栏工作台是一套，而不是访客阅读页的缩小版。

## 目标

- 桌面：左约 45% 品牌区，右白底表单。
- 文案与原型一致：左栏「写作后台」「安静写字，清晰管理。」「单管理员工作台」；右栏「登录后台」「使用管理员账号进入工作台」；按钮「登录」；「← 返回前台」。
- 站名仍来自 `getSiteConfig()`。左栏底部可用站点配置里已有的名字或主机信息，没有单独域名配置就不要编一个 `coolxu.com`。
- 窄于 768px 只显示表单。

## 非目标

- 不改登录校验、cookie、错误文案的含义（仍是笼统失败，不透露用户是否存在）。
- 不改已登录访问 `/admin/login` 时重定向到 `/admin`。
- 不给登录页套侧栏。

## 约束

- 优化后鉴权行为与 v1 一致。
- 颜色用令牌，左栏淡 pine 可用极低透明度的 `var(--pine)` 渐变，不要写死原型色值。
- 标题衬线，表单无衬线。样式放 `page.module.css` / `login-form.module.css`。
- 错误显示在密码字段下，短中文。提交中按钮不可重复提交（沿用现有 pending）。

## 验收标准

- [ ] 桌面登录页是左右分栏，左栏无大图
- [ ] 错误密码仍出现笼统中文错误，成功后进入 `/admin`
- [ ] 已有 session 打开登录页会到 `/admin`
- [ ] 「← 返回前台」回到首页
- [ ] 宽度 &lt;768px 左栏隐藏，表单仍可登录

## 涉及范围

- 文件/模块：`app/admin/login/page.tsx`、`page.module.css`、`login-form.tsx`、`login-form.module.css`
- 不影响：`lib/auth.ts`、登出路由、侧栏

## 实现要点

- 页面负责分栏和品牌区；表单组件继续提交现有 `loginAction`。
- 左栏 `hidden` 的断点与 v2 文档一致（768px）。

## 验证

- 浏览器：登出后打开 `/admin/login`，错误密码、正确密码、返回前台、已登录再进登录页。
- 窄屏看表单是否独占视口。
