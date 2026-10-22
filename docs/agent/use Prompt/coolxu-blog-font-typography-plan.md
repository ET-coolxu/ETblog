# CoolXu Blog 字体与排版改造方案（A / B）

> 这是通用稿，不是本仓库的实施方案。类名、色值和栏宽都不要直接套到代码上。  
> 按当前项目写的两份方案：`docs/字体方案-A-系统字体.md`、`docs/字体方案-B-自托管精简.md`。二者互斥，选定一份再改代码。

> 项目：`coolxu.com`  
> 技术栈：Next.js + TypeScript  
> 目标：先实现 A 方案（系统字体、低维护成本），确认视觉基准后，再切换到 B 方案（杂志风格、多字体组合）。  
> 原则：不要一次性大改页面。先选择一篇包含标题、日期、中文正文、英文术语、引用和代码块的文章作为测试页；两套方案尽量保持字号、颜色、宽度和间距一致，以便比较字体本身的差异。

---

## 1. 实施要求

请先检查项目现有结构和样式，尤其是：

- 全局 CSS 文件的位置（例如 `app/globals.css`）。
- 文章详情页实际使用的 DOM / React 组件与 CSS 类名。
- 是否已经配置 `next/font`、本地字体、Tailwind 或其他设计变量。
- 是否存在重复或冲突的 `font-family`、`font-weight`、`line-height` 规则。

**不要直接假设项目使用 `.article`、`.article-title` 或 `.article-content` 这些类名。** 实施前应先定位实际选择器；如果项目没有对应的语义类，请创建合理的类名或 CSS 变量，并确保真正应用到页面。

先实现方案 A，不要同时引入方案 B 的字体文件。确认 A 方案效果后，再按本文第 4 节切换到 B 方案。

## 2. 方案 A：系统字体优先

### 设计目标

- 不额外下载中文 Web Font。
- 维护简单、字体请求少。
- 视觉方向：现代、简洁、克制。
- 作为后续比较 B 方案的基准。

### 字体组合

| 用途 | 字体栈 |
|---|---|
| 正文、标题、常规界面 | `"Segoe UI", "Microsoft YaHei", sans-serif` |
| 代码块、行内代码 | `"Cascadia Code", Consolas, monospace` |

说明：

- CSS 字体列表是回退列表，不保证所有设备都会安装或使用同一字体。
- Windows 上可能优先使用 Segoe UI；缺少对应中文字形时，浏览器会回退到可用的中文字体。
- 本方案不应添加额外字体文件，也不应为此引入新的字体依赖。

### CSS 初始值

以下作为样式基准。应根据项目现有类名调整选择器，不要为了套用示例而破坏已有组件结构。

```css
:root {
  --font-body:
    "Segoe UI",
    "Microsoft YaHei",
    sans-serif;

  --font-heading:
    "Segoe UI",
    "Microsoft YaHei",
    sans-serif;

  --font-code:
    "Cascadia Code",
    Consolas,
    monospace;

  --color-text: #292929;
  --color-muted: #77736e;
  --color-border: #e8e4df;
  --color-paper: #fffefa;

  --content-width: 720px;
}

body {
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.8;
  color: var(--color-text);
  background: var(--color-paper);
}

.article {
  width: min(var(--content-width), calc(100% - 48px));
  margin-inline: auto;
}

.article-title {
  margin: 0 0 20px;
  font-family: var(--font-heading);
  font-size: clamp(28px, 3.2vw, 36px);
  font-weight: 600;
  line-height: 1.4;
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  color: var(--color-muted);
  font-family: var(--font-body);
  font-size: 13px;
  line-height: 1.6;
}

.article-content {
  font-family: var(--font-body);
  font-size: 17px;
  font-weight: 400;
  line-height: 1.9;
  overflow-wrap: anywhere;
}

.article-content p {
  margin: 0 0 1.4em;
}

.article-content h2 {
  margin: 2.2em 0 0.8em;
  font-size: 25px;
  font-weight: 600;
  line-height: 1.55;
}

.article-content h3 {
  margin: 1.8em 0 0.6em;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.6;
}

.article-content blockquote {
  margin: 1.8em 0;
  padding: 0.2em 0 0.2em 1.2em;
  border-left: 2px solid var(--color-border);
  color: #625e59;
}

.article-content pre,
.article-content code {
  font-family: var(--font-code);
  font-size: 0.85em;
}

.article-content pre {
  overflow-x: auto;
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  line-height: 1.7;
}

@media (max-width: 640px) {
  .article {
    width: calc(100% - 36px);
  }

  .article-content {
    font-size: 16px;
    line-height: 1.9;
  }

  .article-title {
    font-size: 28px;
  }

  .article-content h2 {
    font-size: 23px;
  }
}
```

### A 方案验收标准

- 没有引入新的 Web Font 文件或字体依赖。
- 正文、标题、元信息和代码块具有清晰的层级。
- Windows Chrome 上，正文没有明显发虚、过细或过粗的问题。
- 桌面端正文宽度舒适；窄屏没有横向溢出（代码块允许自身横向滚动）。
- 不破坏现有响应式布局、主题或 Markdown 渲染。

---

## 3. 两套方案共用的排版基准

为公平比较 A / B 方案，尽可能共用以下数值，除非真实页面测试显示有必要调整。

| 元素 | 桌面端初始值 | 字重 | 行高 |
|---|---:|---:|---:|
| 文章 H1 | `clamp(28px, 3.2vw, 36px)` | 600（需检查实际效果） | 1.4 |
| 正文 | 17px | 400 | 1.9 |
| H2 | 25px | 600 | 1.55 |
| H3 | 20px | 600 | 1.6 |
| 日期、分类、元信息 | 13px | 400–500 | 1.6 |
| 代码 | 约 14.45px（正文的 0.85 倍） | 400 | 1.7 |
| 文章正文最大宽度 | 720px | — | — |

补充原则：

1. 字体文件若只包含 Regular 400，不要假设 `font-weight: 600` 会自动调用真实的 600 字重；浏览器可能合成粗体。
2. 不要通过添加 `-webkit-font-smoothing: antialiased` 来试图通用修复 Windows 字体清晰度。应先检查实际渲染字体、字号、字重、颜色和浏览器缩放。
3. 正文颜色建议先用 `#292929`，避免浅灰色正文导致对比度不足。
4. 不要随意对所有中文文字设置负 `letter-spacing`；中文标题如需调整，应单独测试。
5. 不要为了“杂志感”牺牲可读性。

---

## 4. 方案 B：杂志风格，多字体组合

### 设计目标

- 视觉方向：精致、优雅、接近独立杂志或编辑型个人博客。
- 中文正文使用衬线字体，界面文字使用无衬线字体，代码使用等宽字体。
- 仅在确认 A 方案后实施。
- 字体加载应自托管，并考虑中文字体的文件体积和首屏性能。

### 字体组合

| 用途 | 推荐字体 |
|---|---|
| 中文文章正文 | Noto Serif SC（简体中文衬线字体） |
| 中文文章标题 | 先测试 Noto Serif SC；若标题清晰度或字重不理想，改用 Noto Sans SC |
| 导航、日期、分类、按钮、界面信息 | Noto Sans SC |
| 英文与数字 | Georgia（由 CSS 字体回退处理；注意实际混排效果） |
| 代码块、行内代码 | JetBrains Mono；若不加载该字体则回退到 Consolas |

Noto Sans SC / Noto Serif SC 与 Source Han Sans SC（思源黑体）/ Source Han Serif SC（思源宋体）有共同的设计基础，但具体发行版本、文件、字重与浏览器回退不一定完全一致。**项目只选择并使用一套发行来源，不要同时加载 Noto 与 Source Han 两套同类字体。**

### 字体资源与许可

优先查看官方资源：

- Noto Sans SC：<https://github.com/google/fonts/tree/main/ofl/notosanssc>
- Noto Serif SC：<https://github.com/google/fonts/tree/main/ofl/notoserifsc>
- Source Han Sans：<https://github.com/adobe-fonts/source-han-sans>
- Source Han Serif：<https://github.com/adobe-fonts/source-han-serif>
- JetBrains Mono：<https://www.jetbrains.com/lp/mono/>
- Next.js 字体文档：<https://nextjs.org/docs/app/getting-started/fonts>

下载字体前检查许可证、实际包含的字重、字符覆盖范围和文件体积。不要将完整的大型中文字体文件未经检查就直接加入项目。优先使用合法的 WOFF2 子集文件；如果采用多个静态字重文件，应为每个文件正确声明 `font-weight`。不要假设网上任意下载的文件名与实际字重、字符集一致。

### Next.js 本地字体配置示例

先将经过确认的字体文件放在 `app/fonts/`。以下文件名仅为示例，必须替换成项目里真实存在的文件。

`app/fonts.ts`：

```ts
import localFont from "next/font/local";

export const notoSansSC = localFont({
  src: "./fonts/noto-sans-sc-400.woff2",
  display: "swap",
  variable: "--font-noto-sans-sc",
  weight: "400",
  preload: false,
});

export const notoSerifSC = localFont({
  src: "./fonts/noto-serif-sc-400.woff2",
  display: "swap",
  variable: "--font-noto-serif-sc",
  weight: "400",
  preload: false,
});

export const jetBrainsMono = localFont({
  src: "./fonts/jetbrains-mono-400.woff2",
  display: "swap",
  variable: "--font-jetbrains-mono",
  weight: "400",
  preload: false,
});
```

注意：

- 如果实际下载的是可变字体，应按文件真实支持的字重范围配置；如果是静态字体，按文件真实字重声明。
- 如果项目已经使用 `next/font`，应尽量扩展现有配置，不要重复创建字体加载器。
- `preload: false` 是谨慎的初始选择，不代表最终必须保持关闭。确认性能与首屏效果后，再决定是否预加载关键字体。
- 若选择 Google Fonts 托管加载而非自托管，应单独评估隐私、可用性、网络访问和性能，不要把远程字体加载与 `next/font/local` 混为一谈。

在 `app/layout.tsx` 中（按项目实际结构调整）：

```tsx
import type { Metadata } from "next";
import "./globals.css";
import {
  notoSansSC,
  notoSerifSC,
  jetBrainsMono,
} from "./fonts";

export const metadata: Metadata = {
  title: "CoolXu's Blog",
  description: "这里是公开笔记，按日期写下正在想的事情。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={[
          notoSansSC.variable,
          notoSerifSC.variable,
          jetBrainsMono.variable,
        ].join(" ")}
      >
        {children}
      </body>
    </html>
  );
}
```

如果项目的 metadata 已经存在，请保留原配置，不要覆盖 SEO 元信息。

### B 方案 CSS 字体变量

把方案 A 中的字体变量替换为以下配置，并保留共用的字号、行高、颜色、宽度与间距设置：

```css
:root {
  --font-body:
    Georgia,
    var(--font-noto-serif-sc),
    "Noto Serif CJK SC",
    "Songti SC",
    SimSun,
    serif;

  --font-heading:
    var(--font-noto-serif-sc),
    "Noto Serif CJK SC",
    "Songti SC",
    SimSun,
    serif;

  --font-ui:
    var(--font-noto-sans-sc),
    "Noto Sans CJK SC",
    "Microsoft YaHei",
    sans-serif;

  --font-code-stack:
    var(--font-jetbrains-mono),
    "Cascadia Code",
    Consolas,
    monospace;
}

body {
  font-family: var(--font-ui);
}

.article-title,
.article-content {
  font-family: var(--font-body);
}

.article-meta {
  font-family: var(--font-ui);
}

.article-content pre,
.article-content code {
  font-family: var(--font-code-stack);
}
```

说明：

- CSS 字体栈会逐个尝试字体，但浏览器可以针对不同字符选择不同字体；必须通过 DevTools 检查实际渲染结果。
- `Georgia` 放在正文栈前面，是为了让英文优先使用 Georgia；中文字符会回退到后面的字体。若混排观感不佳，可以把 `Georgia` 移到中文字体后面，或分别为英文标题设计单独的类。
- 字体变量名与字体栈名称必须分开，避免 CSS 自定义属性形成循环引用。
- 示例中的回退字体名称不代表这些字体一定安装在每台设备上。
- 若标题需要 600/700 字重，应加载并正确声明真实字重文件，或改用无衬线字体承担标题，不要依赖未验证的合成粗体。

---

## 5. 对比验证流程

请在同一篇测试文章上按以下流程进行，不要在 A / B 之间同时更改大量排版参数。

### 测试内容

选取一篇包含以下元素的文章：

- 中文 H1、H2、H3 标题。
- 多段中文正文。
- 中英文混排、英文缩写和数字。
- 行内代码与代码块。
- 引用、列表、链接和日期元信息。

### 测试环境

- Windows 电脑。
- Chrome，浏览器缩放 100%。
- 桌面端和窄屏响应式视图都检查。
- 测试时等待字体加载完成，并在 DevTools 中检查字体请求和实际渲染字体。

### 对比步骤

1. **A 方案基线：** 记录当前字号、字重、行高、正文宽度和实际渲染字体。
2. **B 方案字体对比：** 尽量保持相同字号、颜色、行高和宽度，只改变字体组合。
3. **字重测试：** 对比实际可用的 Regular 400 与真实粗体文件；不要仅靠 CSS 数值推断字形粗细。
4. **行高测试：** 正文可比较 `1.8`、`1.9`、`1.95`，选取长文阅读最舒适的值。
5. **性能检查：** 在 Network 中检查字体请求、状态码、文件大小、缓存和首屏字体切换。
6. **回归检查：** 确认文章列表、归档页、导航、代码、移动端布局、主题和 Markdown 样式没有回归问题。

### 重点验收标准

- 正文清晰、笔画不过细，长文阅读舒适。
- H1/H2/H3 层级明显，但标题不会显得过重。
- 中文与英文、数字混排协调。
- 日期和分类等元信息足够清晰，不喧宾夺主。
- 代码字体易于辨认。
- 没有字体加载错误、明显布局跳动或不必要的大体积字体请求。
- 页面在 Windows Chrome 和窄屏视图下都正常。

---

## 6. 给 AI 开发工具的执行指令

请按以下顺序修改项目：

1. 检查现有项目结构、全局样式、文章组件和字体加载方式。
2. 先实现方案 A。复用现有类名和设计变量；必要时创建语义明确的类名，但不要大范围重构。
3. 确保方案 A 不新增字体文件、字体依赖或外部字体请求。
4. 运行项目已有的 lint、typecheck、test 和 build 命令（只执行项目实际配置的脚本），修复本次修改引入的问题。
5. 汇报修改的文件、实际使用的选择器、测试结果，以及需要人工确认的视觉问题。
6. **暂停，不要自动实施 B 方案。** 等用户在浏览器中确认 A 方案效果后，再继续 B 方案。
7. 用户确认继续后，再检查并获取合法的字体文件，核对字符覆盖、字重和体积，然后实施 B 方案。
8. B 方案完成后，按第 5 节进行对比与回归验证。

不要声称已在浏览器中验证视觉效果，除非确实运行了浏览器检查。若无法查看实际渲染，请明确说明需要用户人工确认。
