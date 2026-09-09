# 阶段一：对着本仓库学 Next.js

本文只讲**已经落地的骨架**。读的时候请把仓库在编辑器里打开，跟着路径点进去。官方文档可以当词典，但先把这个项目看懂更快。

建议顺序：先看目录图 → 打开 `http://localhost:3000` → 对照「一次请求怎么拼出页面」→ 做文末小实验。

阶段 2 已完成后，公开阅读页已经存在。骨架概念仍以本文为准；读 Markdown、动态路由见 [02-阶段二-公开阅读.md](./02-阶段二-公开阅读.md)。

---

## 1. Next.js 在这个项目里干什么

Next.js 是套在 React 外面的**全栈框架**：既负责页面，也负责在服务器上跑逻辑。

和常见写法的差别：

| 你可能熟悉的 | 本项目（Next.js App Router） |
|---|---|
| 自己配 React + 路由 + 打包 | 框架按文件夹约定好路由和打包 |
| 浏览器里先下载空白页，再请求数据 | 默认在**服务器**上把 HTML 拼好再发给浏览器 |
| `index.html` 是入口 | 入口是 `app/layout.tsx` + 各个 `page.tsx` |
| Express 里手写 `/posts` | 有 `app/.../page.tsx` 就会变成对应网址 |

本仓库用的是 **App Router**（`app/` 目录），不是旧的 Pages Router（`pages/`）。阶段 1 的版本在 `package.json` 里：Next 16、React 19。

阶段 1 刚完成时，只有 `/` 占位首页和 `/admin` 占位。阶段 2 已经补上文章、标签、关于等页，见 [02](./02-阶段二-公开阅读.md)。 `/admin` 仍是占位，没有登录。

---

## 2. 目录地图（先认路）

```
Blog/
├── app/                    ← Next 只把这里当成「页面」
│   ├── layout.tsx          ← 全站根布局（html / body / 字体）
│   ├── globals.css         ← 全局样式和设计 token
│   ├── icon.svg            ← 浏览器标签图标
│   ├── (site)/             ← 路由组：括号不出现在 URL 里
│   │   ├── layout.tsx      ← 公开站的页眉页脚
│   │   └── page.tsx        ← 网址 `/`
│   └── admin/
│       └── page.tsx        ← 网址 `/admin`
├── components/             ← 可复用 UI，不是路由
│   ├── site-header.tsx
│   └── site-footer.tsx
├── lib/                    ← 非 UI 逻辑
│   └── site.ts             ← 读环境变量
├── content/                ← 以后放 Markdown（阶段 1 还没读）
├── public/uploads/         ← 以后放图片，URL 以 /uploads/... 开头
├── data/                   ← 以后放 SQLite
├── next.config.ts          ← Next 配置
├── postcss.config.mjs      ← 让 Tailwind 接到构建流程
├── tsconfig.json           ← `@/` 路径别名在这里
├── .env.example            ← 环境变量清单
├── Dockerfile / docker-compose.yml / Caddyfile
└── package.json            ← 依赖和 npm 脚本
```

三条硬规则（本项目约定）：

1. **只有 `app/` 里的 `page.tsx` 才会变成网址。** `components/`、`lib/` 不会。
2. **文章不会进 `app/`。** 以后从 `content/posts/` 读 Markdown，不用 `@next/mdx` 把 `.md` 塞进路由。
3. **站名、作者不要写死在组件里。** 走 `getSiteConfig()` / 环境变量。

`@/` 是什么：`tsconfig.json` 里 `"@/*": ["./*"]`，所以 `@/lib/site` 等于仓库根目录的 `lib/site.ts`。这是 TypeScript 路径别名，不是 npm 包。

---

## 3. App Router：文件名就是路由

记住两张表就够用。

### 3.1 特殊文件

| 文件 | 作用 |
|---|---|
| `layout.tsx` | 外壳，包住下面所有页面；切换子页面时外壳尽量保持 |
| `page.tsx` | 这个路径真正显示的内容 |
| `globals.css` | 任意名字的 CSS 都可以 import；本项目只在根 layout 引入一次 |

以后阶段还会见到 `loading.tsx`、`not-found.tsx`、`route.ts`，阶段 1 没有。

### 3.2 文件夹怎么变成网址

```
app/layout.tsx                 所有页面都包在里面
app/(site)/page.tsx            →  http://localhost:3000/
app/admin/page.tsx             →  http://localhost:3000/admin
```

`(site)` 叫**路由组**：文件夹名带括号，**不会**变成 `/site`。它只用来给「公开站」单独套一层带导航的 layout，后台不套这层。

以后阶段 2 会变成：

```
app/(site)/posts/page.tsx          →  /posts
app/(site)/posts/[slug]/page.tsx   →  /posts/hello-world
```

`[slug]` 是动态段，现在还没有。

---

## 4. 打开首页时，三层是怎么叠起来的

访问 `/` 时，Next 在服务器上按嵌套顺序渲染：

```
RootLayout          app/layout.tsx
  └─ SiteLayout     app/(site)/layout.tsx
       ├─ SiteHeader
       ├─ HomePage  app/(site)/page.tsx     ← children
       └─ SiteFooter
```

访问 `/admin` 时：

```
RootLayout          app/layout.tsx
  └─ AdminPlaceholderPage   app/admin/page.tsx
```

后台**没有**经过 `(site)/layout.tsx`，所以没有顶栏和页脚。这就是拆两个 layout 的原因：公开站要阅读外壳，后台以后要另一套界面。

对应代码：

根布局必须输出 `<html>` 和 `<body>`，全站只能有这一份：

```30:41:app/layout.tsx
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${sans.variable} ${serif.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh bg-paper font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
```

`children` 不是你自己传的。访问 `/` 时，它是「site layout + 首页」；访问 `/admin` 时，它是后台那一页。

公开站外壳把页眉、主区、页脚拼在一起：

```4:16:app/(site)/layout.tsx
export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
```

这里的 `children` 在首页就是 `app/(site)/page.tsx` 的输出。

---

## 5. 默认都是 Server Component（阶段 1 最重要的一点）

`app/` 和 `components/` 里这些文件**都没有**写 `"use client"`。在 App Router 里，没写这行的组件默认在**服务器**上执行。

这意味着：

- 可以直接读 `process.env.SITE_NAME`（见 `lib/site.ts`），不会把密钥打进浏览器 JS。
- **不能**用 `useState`、`onClick`、`useEffect`。所以「主题」按钮是 `disabled` 的占位，真正切换要等阶段 3 做一个带 `"use client"` 的小组件。
- 发给浏览器的首先是 HTML。不是「先下一个空 React 壳再慢慢填」。

`lib/site.ts` 就是典型的服务端读取：

```8:15:lib/site.ts
export function getSiteConfig(): SiteConfig {
  return {
    name: process.env.SITE_NAME ?? "个人博客",
    author: process.env.AUTHOR_NAME ?? "作者",
    url: process.env.SITE_URL ?? "http://localhost:3000",
    intro: "这里是公开笔记。精选与最新文章会在下一阶段接上。",
  };
}
```

本地开发时，这些值来自 **`.env.local`**（从 `.env.example` 复制）。改完环境变量要重启 `npm run dev` 才会生效。

注意：没有 `NEXT_PUBLIC_` 前缀的变量只在服务器可读。站名现在只用在 Server Component 里，所以 `SITE_NAME` 不必加这个前缀。以后如果客户端组件也要读，再考虑 `NEXT_PUBLIC_SITE_NAME`。

---

## 6. 几个你会在代码里反复见到的 Next API

### 6.1 `generateMetadata`：标签标题

```20:28:app/layout.tsx
export function generateMetadata(): Metadata {
  const site = getSiteConfig();
  return {
    title: {
      default: site.name,
      template: `%s · ${site.name}`,
    },
  };
}
```

- 首页没有自己的 `title`，就用 `default`（现在是「个人博客」或你的 `SITE_NAME`）。
- 以后某页 `export const metadata = { title: "文章" }`，浏览器标题会变成 `文章 · 个人博客`。这就是 PRD 要求的 `{页面} · {SITE_NAME}`。

这不是普通 React 函数，而是 Next 约定的导出。只有 `layout.tsx` / `page.tsx` 可以这样导出。

### 6.2 `next/font`：字体不靠 `<link>`

根布局顶部用 `Noto_Sans_SC`、`Noto_Serif_SC`。Next 会在构建时拉字体、生成 CSS 变量 `--font-noto-sans` / `--font-noto-serif`，挂到 `<html className=...>` 上。`globals.css` 的 `@theme inline` 再把它们接到 Tailwind 的 `font-sans`、`font-serif`。

好处：减少布局抖动，也不用在 HTML 里手写 Google Fonts 外链。

`display: "swap"` 表示字体没就绪时先用后备字体，避免文字长时间不可见。

`suppressHydrationWarning` 加在 `<html>` 上，是给阶段 3 暗色模式预留的：主题 class 可能在客户端才写上，避免服务端 HTML 和浏览器第一次对不上时报警告。阶段 1 还没有切换逻辑。

### 6.3 `next/link`：站内跳转

```1:1:components/site-header.tsx
import Link from "next/link";
```

站内用 `<Link href="/posts">`，不要用 `<a href="/posts">`。`Link` 会做客户端预取和局部切换，外壳 layout 尽量不卸掉。外链、文件下载才用普通 `<a>`。

阶段 2 已为导航补上对应 `page.tsx`。`Link` 的作用不变：站内跳转走客户端预取，外壳 layout 尽量不卸掉。

---

## 7. 样式：Tailwind v4 + 本项目的 token

构建链很短：

1. `postcss.config.mjs` 启用 `@tailwindcss/postcss`
2. `app/globals.css` 第一行 `@import "tailwindcss"`
3. 组件的 `className="mt-3 font-serif text-ink"` 在构建时被扫描，用到的工具类才打进 CSS

本项目没有 `tailwind.config.js`。自定义颜色写在 CSS 里：

```4:30:app/globals.css
:root {
  --paper: oklch(0.97 0.008 155);
  --ink: oklch(0.22 0.02 160);
  /* ... */
}

.dark {
  --paper: oklch(0.18 0.015 160);
  /* ... */
}

@theme inline {
  --color-paper: var(--paper);
  --color-ink: var(--ink);
  /* ... */
}
```

`@theme inline` 的作用：让你能写 `bg-paper`、`text-ink`、`border-rule`、`text-pine`，而不只是 `bg-gray-100`。

`@custom-variant dark (&:where(.dark, .dark *));` 表示：只有祖先带 class `dark` 时，`dark:` 前缀才生效。阶段 1 没有往 `<html>` 上加 `dark`，所以现在一直是浅色。阶段 3 会做切换。

首页左侧那条竖线是普通边框，不是 Next 特性：`border-l border-rule`。

---

## 8. `next.config.ts` 里两处配置

```1:20:next.config.ts
const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: "/:path*{/}?",
        headers: [
          { key: "X-Accel-Buffering", value: "no" },
        ],
      },
    ];
  },
};
```

- `output: "standalone"`：`npm run build` 后多出一个 `.next/standalone/`，里面带精简的 Node 服务（`server.js`）。Docker 镜像只拷这一份，不必把整个 `node_modules` 打进去。本地 `npm run dev` **不依赖**它。
- `X-Accel-Buffering: no`：告诉 Caddy / Nginx 不要把响应攒完再发给浏览器。Next 的流式渲染才不会被反向代理堵住。阶段 1 页面很轻，你暂时感觉不到，上线后有用。

---

## 9. 开发、构建、Docker 各管哪一段

`package.json` 四个脚本：

| 命令 | 做什么 |
|---|---|
| `npm run dev` | 开发服务器，改代码几乎立刻刷新，默认 `:3000` |
| `npm run build` | 生产构建，产出 `.next/`（含 standalone） |
| `npm start` | 用构建结果在本地起生产服务器（先 build） |
| `npm run lint` | ESLint，按 `eslint-config-next` 查 |

日常开发只用 `dev`。不要用 `dev` 的结果去理解 Docker：镜像里跑的是 `build` 之后的 `node server.js`。

请求在生产里怎么走：

```
浏览器
  → Caddy :80 / :443（Caddyfile 反代）
    → Next 容器 :3000（Dockerfile 最后一行 node server.js）
```

`docker-compose.yml` 把 `content/`、`public/uploads/`、`data/` 挂进容器，是为了以后改 Markdown、传图、写 SQLite 时数据还在宿主机上，删容器不会丢。阶段 1 这三个目录几乎是空的。

本地 Compose 的 `SITE_DOMAIN=:80` 表示 Caddy 在容器里监听所有网卡的 80 端口。不要写成 `localhost`，否则只绑容器内部环回地址，你的浏览器进不去。细节见根目录 [README.md](../../README.md)。

---

## 10. TypeScript 你现在需要知道的

阶段 1 几乎没有复杂类型。会看到的：

- `React.ReactNode`：任意可渲染内容，layout 的 `children` 用它。
- `Readonly<{ children: ... }>`：提示不要改 props。
- `Metadata`：Next 提供的标题 / SEO 类型。
- `SiteConfig`：我们自己在 `lib/site.ts` 里定义的对象形状。

`.tsx` = TypeScript + JSX。`page.tsx` 必须 `export default` 一个组件，Next 才认它是页面。

---

## 11. 建议亲手做的 5 个实验

每做完一项，看浏览器和终端，再改回去或留着都行。目的是建立「改文件 → 出页面」的直觉。

1. **改站名**  
   编辑 `.env.local` 的 `SITE_NAME`，重启 `npm run dev`，看首页标题和浏览器标签。

2. **改一句文案**  
   改 `lib/site.ts` 里的 `intro`，保存后首页应热更新。不必重启。

3. **加一个真正的页面**  
   新建 `app/(site)/hello/page.tsx`，默认导出一个组件，访问 `/hello`。它会自动带上导航，因为落在 `(site)` 路由组里。

4. **体会路由组**  
   把同一个文件放到 `app/hello/page.tsx`（不在 `(site)` 下），`/hello` 就没有页眉页脚。做完删掉，避免和以后阶段冲突。

5. **看草稿 404**  
   打开 `/posts/unfinished-draft`。有文件但 `draft: true`，对访客仍是 404。原理见 [02](./02-阶段二-公开阅读.md)。

阶段 1 的骨架代码仍以服务端为主。阶段 2 起，导航高亮和正文目录用了少量 `"use client"`，先读完 02 再模仿。

---

## 12. 和阶段二的衔接

阶段 2 已在现有外壳上增加公开阅读，说明见 [02-阶段二-公开阅读.md](./02-阶段二-公开阅读.md)。骨架侧需要记住的仍是：路由组、layout 嵌套、Server Component、环境变量、Tailwind token。

产品行为以 [docs/requirements/v1.md](../requirements/v1.md) 为准。实现清单见 [docs/todo-v1.md](../todo-v1.md)。

---

## 13. 官方文档对照（用到再查）

| 本仓库里碰到的 | 官方入口 |
|---|---|
| `app/` 目录约定 | [Project structure](https://nextjs.org/docs/app/getting-started/project-structure) |
| layout / page / 路由组 | [Layouts and pages](https://nextjs.org/docs/app/getting-started/layouts-and-pages) |
| 默认服务端组件 | [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) |
| `generateMetadata` | [Metadata](https://nextjs.org/docs/app/getting-started/metadata-and-og-images) |
| `next/font` | [Fonts](https://nextjs.org/docs/app/getting-started/fonts) |
| `next/link` | [Linking and navigating](https://nextjs.org/docs/app/getting-started/linking-and-navigating) |
| `output: "standalone"` | [Standalone output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output) |
| 环境变量 | [Environment variables](https://nextjs.org/docs/app/guides/environment-variables) |
