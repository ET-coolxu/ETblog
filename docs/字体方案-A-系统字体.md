# 字体方案 A：系统字体

本文件按当前仓库写，只改字体从哪来。`docs/coolxu-blog-font-typography-plan.md` 是通用稿，其中的 `.article` 类名、色值和 720px 栏宽不要套用。

与方案 B 互斥。选了本方案就不要再引入网页字体文件。

## 现状

全站只有两个字体角色，组件都写 `var(--font-sans)` 或 `var(--font-serif)`：

- 无衬线：正文、导航、日期、标签、后台表单。`app/styles/base.css` 的 `body` 用它。
- 衬线：文章标题、正文 H2/H3、引用、列表标题、顶栏站名、关于页和后台的大标题。

定义在 `app/styles/tokens.css` 的 `body` 上，因为 `next/font` 的变量挂在 `body` class 上，写在 `:root` 里解析不到：

```css
--font-sans: var(--font-inter), var(--font-noto-sans), "PingFang SC",
  "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif;
--font-serif: var(--font-newsreader), var(--font-noto-serif), "Songti SC",
  "Noto Serif SC", serif;
```

前面四项来自 `app/fonts/index.ts`：216 次 `localFont`，把 Inter、Newsreader、Noto Sans SC、Noto Serif SC 按 unicode-range 拆进仓库。`app/fonts/variables.css` 再把切片变量拼回这四个名字。`app/layout.tsx` 用 `fontVariableClassName` 挂到 `body`。`app/globals.css` 引入 `fonts/variables.css`。生成脚本是 `scripts/vendor-local-fonts.py`。

这套切片是为了绕过 Docker 里 `next/font/google` 的 Turbopack 构建失败，不是页面需要两百多种字体。

文章排印在 `app/styles/markdown.css`，类名是 `.markdown`。代码块是 `font-family: inherit`，跟正文同一套无衬线。引用使用衬线、`font-style: italic`、`font-synthesis: none`、`font-weight: 300`。文章标题和正文标题有 `font-optical-sizing`，那是给 Newsreader 的光学尺寸轴用的。

字号、颜色、栏宽已经在 `tokens.css`：正文 `--text-prose`（1.125rem）、行高 `--leading-prose`（1.95rem），阅读宽 `--reading`（760px），栏宽 `--column`（48rem）。深色在 `.dark` 里覆盖 `--ink`、`--paper` 等，不要另起一套颜色变量。

## 目标

- 不下载任何网页字体，构建期不访问 Google Fonts。
- 删掉切片、生成脚本和 `next/font` 加载。
- `--font-sans`、`--font-serif` 这两个名字保留，组件样式文件不改。
- 字号、字重、行高、字距、颜色、栏宽、深色主题、代码的无衬线保持不动。

外观会变：Windows 上中文无衬线是微软雅黑、衬线是宋体；macOS 上是苹方和宋体。不再有统一的 Inter、Newsreader 和思源。雅黑没有 500/600 字重文件，这些字重由系统决定落到常规或粗体。这是本方案接受的结果。

## 字体栈

`next/font` 去掉之后，字体栈移回 `:root`。下面只是字体名，没有 `@font-face` 就不会发字体请求。

```css
--font-sans: "Segoe UI", "PingFang SC", "Hiragino Sans GB",
  "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
--font-serif: "Songti SC", "SimSun", "Noto Serif CJK SC", serif;
```

顺序的含义：

- Windows 上拉丁先用 Segoe UI，汉字在 Segoe UI 里没有字形，落到微软雅黑。
- macOS 上没有 Segoe UI 和雅黑，无衬线用苹方，衬线用宋体。
- `"Noto Sans CJK SC"` 这类名字只匹配设备上已经安装的字体，不要为此添加字体文件。

不要写成只有 `"Segoe UI", "Microsoft YaHei"`。这两项在 macOS 上都不存在。

## 改动

1. `app/styles/tokens.css`：用上一节的两条栈替换现有 `--font-sans`、`--font-serif`，并移到 `:root`。删掉「字体栈必须写在 body 上」那段注释。
2. `app/layout.tsx`：去掉 `fontVariableClassName` 的 import 和 `body` 上的 class。保留 `generateMetadata` 和 `ThemeProvider`。
3. `app/globals.css`：去掉 `@import "./fonts/variables.css"`。
4. 删除整个 `app/fonts/`（`index.ts`、`variables.css`、`files/` 下的 woff2、许可证）。
5. 删除 `scripts/vendor-local-fonts.py`。确认没有别的脚本或 CI 步骤再调用它。

组件里的 `font-family: var(--font-sans)`、`var(--font-serif)`、`font-optical-sizing`、`font-synthesis` 不动。系统字体没有光学尺寸轴时，浏览器忽略 `font-optical-sizing`。

## 不要改

- `app/styles/markdown.css`、`base.css`、`shared.css`、`utilities.css` 的字号、颜色和选择器。
- `base.css` 里已有的 `-webkit-font-smoothing: antialiased`。不要为了 Windows 清晰度再加，也不要顺手删。
- 代码块继续 `font-family: inherit`。不要改成 Cascadia Code、Consolas 或 JetBrains Mono。
- 深色主题、`--reading`、`--column`、各页的 module CSS。
- 文章 Markdown、后台路由、鉴权。

## 文档

同一轮改掉仍把字体描述成 Google 切片的句子，避免和代码矛盾：

- `docs/requirements/v2-admin.md`：后台色板和字体仍跟访客站、仍用 `tokens.css`。删掉「现有 `next/font`」。继续不要引入另一套色值或 Source Sans 3。
- `docs/项目说明/01-阶段一-Next.js骨架.md` 第 6.2 节：改成系统字体栈，不再写 `next/font` 向 Google 拉字体。
- `docs/vps-go-live.md`：构建需要出网拉镜像，字体不再访问 `fonts.googleapis.com`。

## 验收

- 仓库里没有 woff2，产物和页面请求里没有字体文件。
- `rg "next/font|localFont|vendor-local-fonts" --glob "!docs/存档/**"` 除了历史存档和第三方 skill 示例，业务代码没有命中。
- 公开页、文章正文、列表、关于、标签、后台登录和文章列表仍分别使用无衬线和衬线，只是变成系统字体。
- 深色主题、代码块无衬线、栏宽和字号与改前一致。
- `npm run build` 通过，构建日志里没有访问 Google Fonts。

在 Windows Chrome、缩放 100% 下看一篇含标题、正文、中英混排、引用和代码的文章。确认没有横向溢出（代码块自身滚动除外），标题和正文能区分。各系统字形不同是预期结果，不要为此再加字体文件。
