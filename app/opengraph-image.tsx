import { ImageResponse } from "next/og";
import { getSiteConfig } from "@/lib/site";

export const alt = "站点封面";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

async function loadCnFont(): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(
      "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-sc@5.2.8/files/noto-sans-sc-chinese-simplified-700-normal.woff",
    );
    if (!response.ok) {
      return null;
    }

    return await response.arrayBuffer();
  } catch {
    return null;
  }
}

export default async function OpenGraphImage() {
  const site = getSiteConfig();
  const fontData = await loadCnFont();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          background: "#eef3ef",
          padding: "72px",
          fontFamily: fontData ? "Noto Sans SC" : "sans-serif",
        }}
      >
        <div
          style={{
            width: 8,
            height: 88,
            background: "#2f5d50",
            marginBottom: 28,
          }}
        />
        <div style={{ fontSize: 22, color: "#2f5d50", letterSpacing: 4 }}>笔记</div>
        <div
          style={{
            fontSize: 64,
            color: "#1c2e28",
            marginTop: 12,
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          {site.name}
        </div>
        <div style={{ fontSize: 26, color: "#5c6f68", marginTop: 20, maxWidth: 900 }}>
          {site.intro}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [
            {
              name: "Noto Sans SC",
              data: fontData,
              weight: 700,
              style: "normal",
            },
          ]
        : [],
    },
  );
}
