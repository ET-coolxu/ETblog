# 字体方案 B：自托管精简

本文件按当前仓库写。`docs/coolxu-blog-font-typography-plan.md` 是通用稿，其中的 `.article` 类名、Georgia、JetBrains Mono、新颜色变量和 720px 栏宽不要套用。

与方案 A 互斥。本方案仍要各系统看起来同一套字，但用「每套字体一个文件」替换现在的切片，不在现有 216 次 `localFont` 上追加。

只有在看过系统字体之后，仍想要统一字形时才做。不要和方案 A 的删除工作拆成两次互相覆盖的提交；选定 B 时，直接从现状改到下面的结构。

## 现状

角色和方案 A 相同，全站只用 `--font-sans` 和 `--font-serif`：

- 无衬线：正文、导航、日期、标签、后台表单。
- 衬线：文章标题、正文 H2/H3、引用、列表标题、顶栏站名、关于页和后台大标题。

现在由四套网页字体拼成，定义在 `app/styles/tokens.css` 的 `body` 上：

- 无衬线拉丁：Inter（400–600）
- 无衬线汉字：Noto Sans SC
- 衬线拉丁：Newsreader（含斜体和光学尺寸）
- 衬线汉字：Noto Serif SC

`app/fonts/index.ts` 为了复刻 Google 的 unicode-range，写了 216 次 `localFont`。`variables.css` 把切片拼回 `--font-inter` 等四个名字。根因是 Docker 构建时 `next/font/google` 的 URL 带 `&`，Turbopack 解析失败。自托管本身要保留，切片方式不要保留。

实际用到的字重：

| 角色 | 字重 | 位置 |
| --- | --- | --- |
| 无衬线 | 400、500、600 | 正文、日期元信息、标签 |
| 衬线 | 300、400、600 | 引用 300，文章标题和正文标题 400，`.doc-title` 等大标题 600 |

引用在 `app/styles/markdown.css`：衬线、斜体、`font-synthesis: none`、`font-weight: 300`。`font-synthesis: none` 是为了避免中文被合成斜体。列表标题有 `font-optical-sizing: none`，文章标题是 `auto`，这是为了阻止 Newsreader 在大约 32px 时换成更尖的展示切。代码块是 `font-family: inherit`。

`next/font` 生成的变量挂在 `body` 的 class 上。字体栈若写在 `:root`，这些变量是空的。

## 目标

- 构建期不访问 Google Fonts，继续用 `next/font/local`。
- 无衬线、衬线各一个 woff2、各一次 `localFont`。默认不再单独托管 Inter 和 Newsreader，拉丁字形用这两套中文字体自带的拉丁。
- 保留 `--font-sans`、`--font-serif` 的名字和现有字号、颜色、栏宽、深色主题。
- 单文件体积不合格就该角色退回方案 A 的系统栈，不要再按 unicode-range 拆片。

## 字体文件

只用一套发行来源。Noto Sans SC / Noto Serif SC 与思源黑体 / 思源宋体不要同时入库。

每个文件：

- 格式 woff2，许可证允许随仓库分发（OFL 即可）。
- 覆盖简体中文常用字和拉丁，一个文件，不要拆成几十个 unicode-range。
- 优先可变字体，字重轴至少覆盖 300–600。文件若从 400 起，无衬线用 400–600，引用的 300 会落到该文件最细字重，要在页面上确认。
- 静态字体则只收站点真正用到的字重，并按文件真实字重声明。不要假设文件名里的数字就是字重。
- 单个 woff2 超过 2MB 不入库。该角色改用方案 A 对应的系统字体栈。

下载后核对字符覆盖、字重轴和体积，再放进 `app/fonts/files/`。不要把未检查的完整 CJK 直接提交。

## 加载

删掉现有 `index.ts` 和 `variables.css`，不要在旧的 216 次调用上扩展。新的 `app/fonts/index.ts` 只保留两次 `localFont`，形状如下（路径和字重范围换成真实文件）：

```ts
import localFont from "next/font/local";

const notoSans = localFont({
  src: "./files/noto-sans-sc.woff2",
  weight: "300 600",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  variable: "--font-noto-sans",
});

const notoSerif = localFont({
  src: "./files/noto-serif-sc.woff2",
  weight: "300 600",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  variable: "--font-noto-serif",
});

export const fontVariableClassName = [notoSans, notoSerif]
  .map((font) => font.variable)
  .join(" ");
```

`adjustFontFallback` 必须是 `false`。打开后 Next 会把 Arial 或 Times 插进字体栈，汉字会被挡住。中文文件 `preload: false`，避免首屏把整包拉下来。不要使用 `next/font/google`。

`app/layout.tsx` 仍把 `fontVariableClassName` 挂在 `body` 上。保留 `generateMetadata` 和 `ThemeProvider`，不要换成写死的标题和描述。

字体栈继续写在 `body`，与这两个变量同一元素：

```css
--font-sans: var(--font-noto-sans), "PingFang SC", "Hiragino Sans GB",
  "Microsoft YaHei", sans-serif;
--font-serif: var(--font-noto-serif), "Songti SC", "SimSun", serif;
```

网页字体写在系统字体前面。写反了的话，Windows 雅黑会截住后面的网页字体。

不再使用 Newsreader 时，`font-optical-sizing` 没有对应轴线。列表标题上的 `none` 和文章标题上的 `auto` 可以删掉，避免以后误以为还在调光学尺寸。引用的 `font-synthesis: none` 保留。

若对比后拉丁标题明显不合适，再单独加一个 Newsreader 可变字体：一个 woff2，含 normal 与 italic，一次 `localFont`，放在 `--font-serif` 的中文网页字体前面。不要恢复切片，也不要为此加 Inter。代码块仍然继承正文，不加 JetBrains Mono。

## 改动

1. 按上一节替换 `app/fonts/`：只留新的 `index.ts`、两个 woff2 和许可证。删除全部旧切片和 `variables.css`。
2. `app/globals.css`：去掉 `@import "./fonts/variables.css"`。
3. `app/styles/tokens.css`：`--font-sans`、`--font-serif` 改成上一节的栈，仍放在 `body`。
4. `app/layout.tsx`：继续挂 `fontVariableClassName`，class 来自新的两次 `localFont`。
5. 删除 `scripts/vendor-local-fonts.py`。
6. 去掉只为 Newsreader 服务的 `font-optical-sizing`（`components/post-index.module.css`、`app/(site)/posts/[slug]/page.module.css`、`app/styles/markdown.css`）。

## 不要改

- 字号、行高、字距、颜色、`--reading`、`--column`、深色主题。
- `markdown.css` 的选择器和代码块 `font-family: inherit`。
- `base.css` 已有的 `-webkit-font-smoothing: antialiased`。
- 各组件的 `var(--font-sans)` / `var(--font-serif)` 分工。
- 文章 Markdown、后台路由、鉴权。

## 文档

- `docs/requirements/v2-admin.md`：后台仍跟访客站的 `tokens.css`。把「现有 `next/font`」改成「`next/font/local` 的两套自托管字体」。不要引入另一套色值或 Source Sans 3。
- `docs/项目说明/01-阶段一-Next.js骨架.md` 第 6.2 节：改成两个本地 woff2，不要再写 Google 切片或 216 次加载。
- `docs/vps-go-live.md`：构建出网只为拉镜像，字体文件在仓库内，不访问 `fonts.googleapis.com`。

## 验收

- `app/fonts/index.ts` 里只有两次 `localFont`，都是 `adjustFontFallback: false`、`preload: false`。
- 仓库里的 woff2 只有这两个字体文件（若按上文追加了 Newsreader，则三个），每个不超过 2MB。
- 没有 `variables.css`，没有 `vendor-local-fonts.py`，构建日志不访问 Google Fonts。
- 公开页和后台仍通过 `--font-sans`、`--font-serif` 取字。DevTools 里汉字用到所选网页字体，缺字才落到苹方、雅黑或宋体。
- 标题 600、正文 400、引用 300 用的是字体文件里的真实字重，不是合成粗体。引用的中文不是合成斜体。
- 深色主题、代码块无衬线、栏宽和字号与改前一致。
- `npm run build` 通过。

在 Windows Chrome、缩放 100% 下看一篇含标题、正文、中英混排、引用和代码的文章，并看首页列表和后台文章列表。Network 里字体请求应是这两个文件，状态正常，没有几十个切片。
