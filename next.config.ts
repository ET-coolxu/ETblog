import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel 自己做输出追踪；standalone 会让它去找不存在的 next-server.js.nft.json。
  // 未设置 VERCEL 时仍走 standalone，Docker / VPS 不变。
  output: process.env.VERCEL ? undefined : "standalone",
  serverExternalPackages: ["shiki", "@shikijs/rehype", "better-sqlite3"],
  async headers() {
    return [
      {
        source: "/:path*{/}?",
        headers: [
          {
            key: "X-Accel-Buffering",
            value: "no",
          },
          // 跨站资源不带 Referer：外链封面的 preload/img 才不会被图床热链保护 302
          {
            key: "Referrer-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
