import localFont from "next/font/local";

const notoSans = localFont({
  src: "./files/noto-sans-sc.woff2",
  weight: "100 900",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  variable: "--font-noto-sans",
});

const notoSerif = localFont({
  src: "./files/noto-serif-sc.woff2",
  weight: "200 900",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  variable: "--font-noto-serif",
});

/**
 * 挂到 body 上的 next/font 变量类名。
 * fallback 关闭：打开后 Next 会把 Arial 或 Times 插进字体栈，汉字会被挡住。
 * 变量必须和 --font-sans、--font-serif 写在同一个 body 上，写在 :root 时它们是空的。
 */
export const fontVariableClassName = [notoSans, notoSerif]
  .map((font) => font.variable)
  .join(" ");
