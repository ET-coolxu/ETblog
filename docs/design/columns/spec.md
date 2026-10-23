# 专栏设计稿（v2）

- 状态：原型已确认（2026-10-23，ETblog-prototypes `0269bf4`，columns-r2）
- 需求：[`docs/requirements/v2.md`](../../requirements/v2.md)。本文只管「长什么样、用哪些变量和组件」，行为以 v2 为准
- 原型评审：ETblog-prototypes `columns/review.md`
- 局部对比图：本目录 `shots/`（改前 / 改后，桌面 1440、手机 390）

本文里的变量名、类名、组件名都按 `main` 当前代码写。新增的会标「新增」。所有示例数据都是假的。

## 0. 总原则

- 不引入 Tailwind，不写行内样式。页面用 CSS Modules（`page.module.css`），全局只动 `app/styles/tokens.css` 加一个 token。
- 页面宽度只用 `measure` 或 `PostReadingFrame`，模块里不写 `max-width` / `padding-inline` 控制栏宽（`docs/架构/栏宽.md`）。
- 颜色、字号、间距只用 `tokens.css` 里的变量。本文没列到的值，照 `/posts`、文章页现有写法。
- 深色模式靠 `.dark` 下的 token 重定义，页面模块里不写 `.dark` 分支。

## 1. 路由与文件

| 页面 | 路由 | 文件（新增） |
|---|---|---|
| 专栏 | `/columns` | `app/(site)/columns/page.tsx`、`app/(site)/columns/page.module.css` |
| 舰队 | `/fleet` | `app/(site)/fleet/page.tsx`、`app/(site)/fleet/page.module.css` |

- **路由不一致**：原型预览路径是 `/columns/fleet/`，v2 定的是 `/fleet`。**以 v2 为准用 `/fleet`**，原型目录结构只是为了预览。不做 `/columns/fleet` 跳转。
- 两页和 `app/(site)/page.tsx`、`/posts` 一样 `export const dynamic = "force-dynamic"`（文章在运行时 content 卷里）。`lib/revalidate-posts.ts` 里要失效的路径加上 `/columns`、`/fleet`。
- `app/sitemap.ts` 加 `/columns`、`/fleet` 两条。
- 访问统计：`trackPageVisit` 的 `TrackedPage` 只有 `home` / `posts` / `about` / `post`。这两页**不调用** `trackPageVisit`，也不加新 kind（v2「不计 PV」，v3-visits 的访问记录范围也不含这两页）。尤其 `/fleet` 不能复用 `{ kind: "post", slug }`，否则舰队文章会被重复计数。

## 2. 新增 token

在 `app/styles/tokens.css` 里加：

```css
:root {
  /* 紧跟 --list-line 之后 */
  --card-line: #d6d2c9; /* 栏目卡片边框，比 --list-line #e2dfd8 深一档 */
}

.dark {
  /* 紧跟 --list-line 之后 */
  --card-line: var(--list-line); /* 深色不变，即 #3a3f3c */
}
```

- 现有线色从浅到深是 `--rule` #e8e5df、`--list-line` #e2dfd8、`--tag-pill-border` #e2e7e0（偏绿），再往下就跳到文字色 `--list-dim` #a3a09a。没有可用的「深一档」，所以新增。
- `--card-line` 只给 `/columns` 卡片外框用。卡片内列表行之间的分隔线仍是 `--list-line`。

## 3. 顶栏导航

文件：`components/site-nav.tsx`、`components/site-nav.module.css`、`components/site-header.module.css`。

### 3.1 顺序与选中态

```ts
const navItems = [
  { href: "/posts", label: "文章" },
  { href: "/columns", label: "专栏", also: ["/fleet"] },
  { href: "/tags", label: "标签" },
  { href: "/about", label: "关于" },
];
```

- 选中判断：`isActive(pathname, item.href) || item.also?.some((p) => isActive(pathname, p))`。`/columns`、`/fleet` 上「专栏」选中，`/posts/[slug]` 上仍是「文章」选中（即使是舰队文章）。
- 选中样式用现有 `styles.active`（`--pine`、600），未选中 `styles.item`（`--muted`、500，hover `--ink`）。不新增样式。
- 建议选中项加 `aria-current="page"`（四项统一加，非必须）。
- 无下拉，无图标，竖线 `styles.rule` 和搜索、主题不动。

### 3.2 窄屏间距

线上现状：`site-header .bar` gap `--space-4`；`site-nav .bar` gap `--space-3`（≥640 `--space-4`）；`site-nav .nav` gap `--space-4`（≥768 `--space-7`）。多一项「专栏」后：

```css
/* site-header.module.css */
@media (max-width: 419px) { .bar { gap: var(--space-3); } }
@media (max-width: 379px) { .brand { font-size: var(--text-lg); } }

/* site-nav.module.css */
@media (max-width: 419px) { .nav { gap: var(--space-3); } }            /* 12px，原型已确认 */
@media (max-width: 379px) { .nav { gap: var(--space-2-5); } .bar { gap: var(--space-2); } }
```

- < 420px 导航间距 12px 是原型确认值。
- < 380px 这一档是评审新增：原型在 360 宽实测工具区右缘到 364.7px，溢出约 25px，主题按钮被裁；375 宽溢出约 10px。加了这档之后，360、375 宽工具区右缘正好落在内容区右边界，品牌名和导航之间还有约 12px。见 `shots/d-nav-360.png`。
- 不做汉堡菜单，不隐藏任何一项。

## 4. `/columns`

### 4.1 数据

- `listPublishedPosts()` 一次取全量，按标签在内存里分组：`post.tags.includes("折腾记录")` 等。只含已发布，按 `date` 降序（沿用 `listPublishedPosts` 的顺序）。
- 栏目配置写成页面内常量，标签名精确匹配：

```ts
const COLUMNS = [
  { tag: "折腾记录", title: "折腾记录", intro: "从零搭东西的完整过程，踩坑和结论都写。" },
  { tag: "舰队", title: "AI 助手舰队", intro: "这支 bot 舰队里谁负责什么、彼此怎么接力，每月更新一次。", fleet: true },
  { tag: "Bot周报", title: "Bot 周报", intro: "每周五一篇，从一周的 bot 使用经验里挑 3–5 条结论。" },
] as const;
const NEWS = { tag: "资讯", title: "资讯", intro: "AI 资讯速览，每几天一辑。" };
const COLUMN_LIMIT = 3;
```

- 舰队卡片要的「N 个 bot」：取舰队最新一篇，用 `getPublishedPost(slug)` 拿正文，`extractToc(post.body).filter((i) => i.depth === 2).length`。和 `/fleet` 共用一个函数（建议放 `lib/posts.ts`：`getLatestFleetPost()`，返回 `{ post, botCount } | null`）。
- 「全部 →」/「往期 →」链接一律用 `tagHref(tag)`，不手拼。
- `metadata.title`：`专栏`（站点模板已经拼 ` · {SITE_NAME}` 的话就只写「专栏」，以 `app/layout.tsx` 现有 title template 为准）。

### 4.2 结构

```
main.measure.page
  header.head
    h1.title            专栏
    p.lead              舰队产出、作者审过的三类内容。
  div.cols
    section.card ×3     （aria-labelledby 指向卡片 h2）
      div.cardHead
        h2.cardTitle    折腾记录<span.count> · 12 篇</span>
        Link.more       全部 →          （舰队卡片：往期 →）
      p.intro
      ol.list > li.item ×≤3            （舰队卡片没有列表，换成 div.fleetRow）
        time
        h3 > Link（stretched）
        p                摘要，一行省略
      p.empty           （无文章时替代 ol）
  section.news
    div.newsHead > h2.newsTitle + p.newsIntro
    ul.newsList > li > Link ×≤3
    Link.more           全部 →
```

### 4.3 样式

| 元素 | 规格 |
|---|---|
| `main` | `className={`measure ${styles.page}`}`；`.page { padding-block: var(--space-10) var(--space-16); }`，<640 `var(--space-8) var(--space-12)` |
| `.head` | `padding-bottom: var(--space-10)`（<640 `--space-8`） |
| `.title` | `--font-serif`、`--text-page`、`line-height: var(--leading-page)`、`letter-spacing: var(--tracking-snug)`、`--list-ink`。和 `post-index .pageTitle` 同档，能直接复用就复用 |
| `.lead` | `margin-top: var(--space-1)`、`--text-md`、`--leading-record`、`--list-muted` |
| `.cols` | `display: flex; flex-direction: column; gap: var(--space-10)`（<640 `--space-8`） |
| `.card` | `padding: var(--space-6) var(--space-8) var(--space-4)`（<640 `var(--space-5) var(--space-5) var(--space-3)`）；`background: var(--panel)`；`border: 1px solid var(--card-line)`；`border-radius: var(--radius-lg)`。不加阴影 |
| `.cardHead` | `display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-4)` |
| `.cardTitle` | `--font-serif`、`--text-2xl`（<640 `--text-xl`）、`line-height: var(--leading-snug)`、`--tracking-title`、`--list-ink`、400 |
| `.count` | `margin-left: var(--space-1)`、`--font-sans`、`--text-sm`、`letter-spacing: 0`、`--list-muted`、`font-variant-numeric: tabular-nums`、`white-space: nowrap`。文案 `· {n} 篇`，n 为该标签已发布总数（不是 3） |
| `.more` | `flex-shrink: 0`、`--text-xs`、600、`--tracking-back`、`--pine`、`white-space: nowrap`；hover `--ink`；`transition: color var(--ease)` |
| `.intro` | `margin-top: var(--space-1)`、`--text-md`、`--leading-record`、`--list-muted` |
| `.list` | `margin-top: var(--space-2)` |
| `.item` | `position: relative`、`padding-block: var(--space-5)`、`border-bottom: 1px solid var(--list-line)`；最后一项无底线 |
| `.item time` | `--text-xs`、tabular-nums、`--list-muted`；内容用 `formatPostDate(post.date)` |
| `.item h3` | `margin-top: var(--space-1)`、`--font-serif`、`--text-xl`、`--leading-7`、`--tracking-tight`、`--list-ink`；`.item:hover h3` 变 `--list-accent` |
| stretched link | `.item h3 a::after { content: ""; position: absolute; inset: 0; }`（同 `post-index .stretch`） |
| `.item p` | `margin-top: var(--space-1)`、`--text-xs`、`--leading-relaxed`、`--list-muted`；**一行省略**：`white-space: nowrap; overflow: hidden; text-overflow: ellipsis`。无摘要不渲染 |
| `.empty` | `padding-block: var(--space-6) var(--space-4)`、`--text-md`、`--list-muted` |

舰队卡片：

| 元素 | 规格 |
|---|---|
| `.fleetRow` | `padding-block: var(--space-5) var(--space-4)`；`display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: var(--space-2) var(--space-6)` |
| `.fleetMeta` | `--text-xs`、tabular-nums、`--list-muted`；日期和数字用 `<b>`，600、`--list-ink`。文案：`更新于 <b>2026-11-01</b> · <b>8</b> 个 bot`（示例值） |
| `.go` | `Link href="/fleet"`，文案「查看舰队 →」；`--text-md`、600、`--pine`，hover `--ink` |
| 右上 `.more` | 文案 **「往期 →」**，`href={tagHref("舰队")}`。另两张卡片和资讯仍是「全部 →」。见 `shots/c-fleet-link-1440.png`、`shots/c-fleet-link-390.png` |

资讯（弱化，不是卡片）：

| 元素 | 规格 |
|---|---|
| `.news` | `margin-top: var(--space-12)`、`padding-inline: var(--space-1)`。无底色、无边框 |
| `.newsHead` | `display: flex; align-items: baseline; flex-wrap: wrap; gap: var(--space-3)` |
| `.newsTitle` | `--font-sans`、`--text-sm`、600、`--tracking-wider`、`--list-muted` |
| `.newsIntro` | `--text-xs`、`--list-dim` |
| `.newsList` | `margin-top: var(--space-3)`；`display: flex; flex-direction: column; gap: var(--space-2)` |
| `.newsList a` | `--text-sm`、`--leading-5`、`--list-muted`；hover `--list-accent`。只列标题，无日期、无摘要 |
| `.news .more` | `display: inline-flex; margin-top: var(--space-3)`；颜色 `--list-muted`，hover `--list-ink`（不用 pine） |

### 4.4 空状态

| 情况 | 显示 |
|---|---|
| 折腾记录 / Bot 周报无已发布 | 标题后「· 0 篇」；不渲染右上「全部 →」；列表位置显示 `.empty`「还没有文章，第一篇在路上。」（`shots/columns-empty-1440.png`，原型仓库） |
| 舰队无已发布 | 「· 0 篇」；不渲染「往期 →」和 `.fleetRow`；显示 `.empty`「舰队介绍还在整理中。」（和 `/fleet` 同一句） |
| 资讯无已发布 | 整块照常显示标题和简介；列表位置 `.empty` 同句；不渲染「全部 →」 |
| 全站一篇都没有 | 三张卡片 + 资讯都走空状态，页面不报错 |

## 5. `/fleet`

### 5.1 数据

- `getLatestFleetPost()`：`listPublishedPosts()` 里第一篇 `tags.includes("舰队")` 的，`getPublishedPost(slug)` 取正文。
- 正文 `renderMarkdown(post.body)`，目录 `extractToc(post.body)`，和 `app/(site)/posts/[slug]/page.tsx` 一样。
- 不调用 `trackPageVisit`（见 1）。
- `metadata.title`：「AI 助手舰队」。description 用该文 `summary`。

### 5.2 结构（照文章页）

```tsx
<main className={styles.main}>
  <PostReadingFrame items={toc}>
    <article>
      <header>
        <Link href="/columns" className={styles.back}>← 专栏</Link>
        <p className={styles.meta}>
          <time dateTime={post.date}>更新于 {formatPostDate(post.date)}</time>
          <span className="quiet" aria-hidden="true">·</span>
          <span>{botCount} 个 bot</span>
          <Link href={tagHref("舰队")} className={styles.tag}>舰队</Link>
        </p>
        <h1 className={styles.title}>AI 助手舰队</h1>
      </header>
      <TocDetails items={toc} />
      <div className={`markdown ${styles.body}`}>{content}</div>
      <footer className={styles.foot}>
        <p className={styles.hint}>每月更新一次，旧版本留在往期里。</p>
        <Link href={tagHref("舰队")} className={styles.more}>往期 →</Link>
      </footer>
    </article>
  </PostReadingFrame>
</main>
```

- **栏宽 832px**：直接用 `PostReadingFrame`，中间栏就是 `min(var(--measure), 100% - var(--gutter) * 2)` = 52rem，和文章页同宽。不要照抄原型的 `--reading` 760px。见 `shots/a-fleet-width-1440.png`（改前 760 / 改后 832）、`shots/a-fleet-width-390.png`（手机无变化）。
- 目录：≥80rem 左侧 rail（`--toc` 12rem，sticky `top: var(--space-28)`），以下是 `TocDetails` 折叠。都是现成组件，不改。目录只有 h2，一项一个 bot。
- 标题固定写「AI 助手舰队」，不用文章自己的 `title`。
- 不显示阅读时长、封面、上一篇 / 下一篇。

### 5.3 样式（`app/(site)/fleet/page.module.css`）

| 元素 | 规格 |
|---|---|
| `.main` | 同文章页 `main.main`：`padding-block: var(--space-12)` |
| `.back` | `display: inline-flex`、`--text-xs`、600、`--tracking-back`、`--leading-back`、`--muted`；hover `--pine` |
| `.meta` | `margin-top: var(--space-6)`；`display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2)`；`--text-xs`、500、`--leading-5`、`--tracking-chip`、`--muted`、tabular-nums。能复用文章页 `.meta` 就复用 |
| `.tag` | 同文章页标签：`--radius-xs`、`background: var(--tag-bg)`、`padding: var(--space-0-5) var(--space-2-5)`、`--text-2xs`、600、`--leading-4`、`--tracking-tag`、`color: var(--tag)` |
| `.title` | 同文章页 `.title`：`margin-top: var(--space-2)`、`--font-serif`、`--text-h2`，≥768 `--text-display` |
| `.body` | `margin-top: var(--space-10)`；排印全部继承全局 `.markdown` |
| `.foot` | `margin-top: var(--space-16)`、`padding-top: var(--space-6)`、`border-top: 1px solid var(--rule)`；`display: flex; justify-content: space-between; align-items: center; gap: var(--space-4)` |
| `.hint` | `--text-xs`、`--quiet` |
| `.more` | `--text-xs`、600、`--tracking-back`、`--pine`、`white-space: nowrap`；hover `--ink` |
| `.empty` | `margin-top: var(--space-10)`、`padding-block: var(--space-8)`、`border-block: 1px solid var(--rule)`、`--text-md`、`--muted` |
| 手机 <640 | 正文 h2 降到 `--text-h3` / `--leading-h3`（只在舰队页：`.body h2`） |

### 5.4 流程图

- 舰队文章正文里只放这一张图，放在开头一段说明之后。Markdown 写 `![协作流程：作者 → 示例助手 A → …](/uploads/示例-fleet-flow.webp)`，线上渲染为 `<p><img></p>`（`MarkdownImage`），**没有 figure / figcaption**，原型里的图注不做，说明写进 alt。
- 图本身：竖版单张，webp 或 png（v1 禁 svg）。**中性浅灰底 + 1px 细边框 + 圆角直接画进图里**，建议导出参数：底色 #f3f2ef，边框 #dcd9d2，圆角 12px，2× 分辨率，宽 800px（显示 400–440px）。深色模式下也保持这块浅色图，不另出深色版。
- 舰队页 CSS 只管尺寸和居中：

```css
.body > p > img:only-child {
  display: block;
  width: 100%;
  max-width: 27.5rem; /* 440px */
  margin-inline: auto;
}
```

- 全局 `.markdown img` 的 `max-width: 100%`、`border-radius: var(--radius-lg)` 照旧。

### 5.5 bot 段落

Markdown 写法（示例）：

```md
## 示例助手 A

- **角色**：总管，负责派发和汇总
- **协作对象**：示例助手 B、示例助手 C

一到三句说明。
```

- 渲染出来是 `h2` + `ul`，原型里的 `ul.kv` 类正式站拿不到，改用结构选择器，只作用于舰队页：

```css
.body h2 + ul {
  font-size: var(--text-md);
  line-height: var(--leading-record);
  color: var(--muted);
}
.body h2 + ul > li + li { margin-top: var(--space-0-5); }
.body h2 + ul > li::before { background: var(--quiet); opacity: 1; top: 0.625rem; }
.body h2 + ul strong { font-weight: 600; color: var(--ink-soft); }
.body h2 + ul + p { margin-top: var(--space-3); }
```

- 圆点沿用全局 `.markdown ul > li::before` 的结构，只把颜色从 pine 改成 `--quiet`，`top` 按 `--leading-record`（1.625rem）重新居中：(1.625 − 0.375) / 2 = 0.625rem。原型是 `list-style: disc`，视觉差别可以接受，不要为了这个改全局列表。
- 不改 `app/styles/markdown.css`。

### 5.6 空状态

无已发布舰队文章：`PostReadingFrame items={[]}`（无目录），保留 `.back`、`.title`，`.meta` 不渲染，正文位置显示 `.empty`「舰队介绍还在整理中。」，`.foot` 不渲染。HTTP 200，不 404。原型仓库 `shots/fleet-empty-390.png`。

## 6. 首页「最新」排除

文件：`lib/site.ts`、`app/(site)/page.tsx`、`components/home-feed.tsx`。

- `lib/site.ts` 新增：

```ts
const DEFAULT_HOME_EXCLUDE_TAGS = ["Bot周报", "资讯", "舰队"];

export function getHomeExcludeTags(): string[] {
  const raw = process.env.HOME_EXCLUDE_TAGS;
  if (raw === undefined) return DEFAULT_HOME_EXCLUDE_TAGS;
  return raw.split(",").map((t) => t.trim()).filter(Boolean); // 显式留空 = 不排除
}
```

- `app/(site)/page.tsx` 传 `<HomeFeed posts={posts} excludeTags={getHomeExcludeTags()} />`。
- `HomeFeed` 里排除放在 `slice` 之前，这样会往后补足到 `LATEST_LIMIT`（6）：

```ts
const excluded = new Set(excludeTags);
const latest = posts
  .filter((post) => !featuredSlugs.has(post.slug))
  .filter((post) => !post.tags.some((tag) => excluded.has(tag)))
  .slice(0, LATEST_LIMIT);
```

- 精选不受排除影响（带 `舰队` 标签的精选文章仍在精选区）。
- 计数文案：`/ 全部 ${posts.length} 篇` 和「当前显示 {latest.length} / {posts.length} 篇」里的总数**仍是全部已发布**（含被排除的），因为「查看全部文章」去的 `/posts` 不排除。不改文案。
- `.env.example`（如有）加 `HOME_EXCLUDE_TAGS=Bot周报,资讯,舰队` 和一行注释。

## 7. 状态

### 7.1 hover / focus

- focus 一律用全局 `:focus-visible`（2px `--pine` outline，offset 2px），模块里不写 `outline: none`。
- stretched link 的 focus：outline 画在 `<a>` 上即可（标题文字外框），不用给整行画框。
- hover 只改颜色，`transition: color var(--ease)`。不加位移、阴影、卡片底色变化。
- `prefers-reduced-motion` 走全局，不另写。

| 元素 | 默认 | hover |
|---|---|---|
| 导航项 | `--muted` 500 | `--ink` |
| 导航选中 | `--pine` 600 | 不变 |
| 卡片「全部 →」「往期 →」、`/fleet` 页尾「往期 →」 | `--pine` | `--ink` |
| 「查看舰队 →」 | `--pine` | `--ink` |
| 列表行标题 | `--list-ink` | `--list-accent`（整行 hover 触发） |
| 资讯标题 | `--list-muted` | `--list-accent` |
| 资讯「全部 →」 | `--list-muted` | `--list-ink` |
| `/fleet`「← 专栏」 | `--muted` | `--pine` |

### 7.2 深色模式

不写任何 `.dark` 规则，全靠 token：`--panel` #2c312e、`--card-line` = `--list-line` = #3a3f3c、`--list-*` 映射到 `--ink` / `--muted` / `--quiet`、`--pine` #a4d0b8。流程图保持浅色图。参考原型仓库 `shots/columns-dark-1440.png`、`shots/fleet-dark-1440.png`，以及本目录 `shots/b-card-border-dark-1440.png`（深色前后一致）。

### 7.3 手机

| 宽度 | 要求 |
|---|---|
| < 640 | 卡片内边距、卡片间距、页面上下留白、卡片标题字号按 4.3 的窄屏值；舰队页正文 h2 降一档 |
| < 420 | 导航间距 12px，`site-header .bar` gap 12px |
| < 380 | 品牌名 `--text-lg`，导航间距 10px，`site-nav .bar` gap 8px |
| 360 | 必须通过：无横向滚动，顶栏四项 + 搜索 + 主题完整可见可点 |

卡片右上链接和标题在窄屏同一行，链接 `flex-shrink: 0` 不换行；栏目名长时折行的是标题。

## 8. 不做

- 不做导航下拉、汉堡菜单、隐藏导航项。
- 不做卡片阴影、hover 抬起、卡片底色变化、渐变。
- 不给栏目做封面、图标、颜色区分。
- 不改全局 `.markdown`、`post-index`、文章页、`/posts`、标签页样式。
- 不做交互式流程图、正文 mermaid、流程图深色版。
- 不在 `/columns` 显示标签 pill、阅读时长、精选标记。
- 不给 `/columns`、`/fleet` 加访问统计。
- 不新增 frontmatter 字段，不做 `/columns/fleet` 路由。
- 不用原型 `tokens.css` 里的 `--reading`、`--toc-w`（旧快照）。

## 9. PR 视觉验收清单

PR 描述附截图：`/columns`、`/fleet` 各 1440 浅色、1440 深色、390、360，外加 `/columns` 一张空状态（本地无数据即可）。截图用示例数据，不露真实内容以外的信息。

### 导航

- [ ] 顺序：文章、专栏、标签、关于，竖线后搜索、主题
- [ ] `/columns`、`/fleet` 上「专栏」是 pine 600；`/posts/[slug]` 上不是
- [ ] 390 宽导航间距 12px；360 宽主题按钮完整可见，`document.documentElement.scrollWidth === 360`
- [ ] 1440 宽导航间距仍是 `--space-7`，和改前一致

### `/columns`

- [ ] 内容栏宽 832px（1440 下左右各 304px），和 `/posts` 对齐
- [ ] 三张卡片顺序：折腾记录、AI 助手舰队、Bot 周报；资讯在最后，没有卡片框
- [ ] 卡片浅色边框是 #d6d2c9（`--card-line`），底色白 `--panel`；深色边框 #3a3f3c
- [ ] 卡片内行分隔线仍是 `--list-line`，最后一行无线
- [ ] 卡片间距桌面 40px、手机 32px
- [ ] 「· N 篇」是该标签已发布总数
- [ ] 折腾记录、周报右上「全部 →」；舰队右上「往期 →」，指向 `/tags/舰队`
- [ ] 舰队卡片显示「更新于 日期 · N 个 bot」，N 等于该文 h2 个数；「查看舰队 →」指向 `/fleet`
- [ ] 每栏最多 3 条，日期降序，摘要一行省略，整行可点
- [ ] 资讯只列标题，「全部 →」灰色
- [ ] 某栏无文章：「· 0 篇」+「还没有文章，第一篇在路上。」、无右上链接；舰队无文章：「舰队介绍还在整理中。」
- [ ] 草稿、存档不出现

### `/fleet`

- [ ] 正文栏宽 832px，和同一篇在 `/posts/[slug]` 下完全一样宽
- [ ] ≥1280 左侧目录 rail，项为各 bot 名；<1280 为折叠目录
- [ ] 页首：「← 专栏」→「更新于 日期 · N 个 bot」+ 舰队标签 →「AI 助手舰队」
- [ ] 流程图居中，最宽 440px，手机占满栏宽；浅灰底和细边框来自图片本身；深色模式下仍是浅色图
- [ ] 每个 bot 下「角色」「协作对象」是小一号的灰色列表，字段名加粗深一点，圆点为 `--quiet`
- [ ] 其他文章的列表样式没变（随便打开一篇带列表的文章对比）
- [ ] 页尾「每月更新一次，旧版本留在往期里。」+「往期 →」
- [ ] 无舰队文章：200，显示「舰队介绍还在整理中。」，无目录、无页尾
- [ ] 访问 `/fleet` 后后台访问记录和 PV 不增加

### 首页

- [ ] 带 `Bot周报`、`资讯`、`舰队` 的文章不在「最新」，「最新」仍补满 6 篇（文章够的话）
- [ ] 精选区不受影响
- [ ] 「/ 全部 N 篇」「当前显示 x / N 篇」的 N 仍是全部已发布数
- [ ] `HOME_EXCLUDE_TAGS=` 显式留空时不排除

### 通用

- [ ] Tab 键能依次走到每个链接，焦点有 2px pine 外框
- [ ] 没有新增 `max-width` / `padding-inline` 栏宽写法，没有 `.dark` 分支，没有硬编码色值（`--card-line` 定义除外）
- [ ] `sitemap.xml` 含 `/columns`、`/fleet`

## 10. 截图索引（本目录 `shots/`）

| 文件 | 内容 |
|---|---|
| `a-fleet-width-1440.png` | `/fleet` 首屏，改前 760px / 改后 832px，红色虚线标正文栏边界 |
| `a-fleet-width-390.png` | `/fleet` 手机，改前改后一致 |
| `b-card-border-1440.png` | `/columns` 前两张卡片，边框 `--list-line` → `--card-line` |
| `b-card-border-zoom-1440.png` | 卡片左边框放大对比 |
| `b-card-border-390.png` | 手机卡片边框对比 |
| `b-card-border-dark-1440.png` | 深色卡片，前后一致 |
| `c-fleet-link-1440.png` | 舰队卡片标题行，「全部 →」→「往期 →」 |
| `c-fleet-link-390.png` | 同上，手机 |
| `d-nav-360.png` | 360 顶栏改前溢出 / 改后、深色、390 对照 |

截图基于原型 `0269bf4` 本地改出的对比版，品牌名是真站名，其余文字都是示例数据。
