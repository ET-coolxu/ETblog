/**
 * 文章封面图。原生 img，避免为外链配置 next/image 远程域名。
 * no-referrer：部分图床按 Referer 防热链，带本站来源会 302 导致裂图。
 */
export function CoverImage({
  src,
  alt = "",
  className,
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} referrerPolicy="no-referrer" />
  );
}
