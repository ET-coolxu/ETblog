function MarkdownImage({
  src,
  alt,
}: {
  src?: string;
  alt?: string;
}) {
  if (!src || src.startsWith("javascript:") || src.startsWith("data:")) {
    return null;
  }

  // Markdown 配图没有固定尺寸，不用 next/image
  return <img src={src} alt={alt ?? ""} />;
}

export { MarkdownImage };
