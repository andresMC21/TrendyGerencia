import { useState } from 'react';

export function ProductPhoto({ src, title, detail = false, transitionId }: { src?: string | null; title: string; detail?: boolean; transitionId?: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  return src && failedSrc !== src ? (
    <img style={transitionId ? { viewTransitionName: `product-${transitionId.replace(/[^a-zA-Z0-9_-]/g, "-")}` , viewTransitionClass: "product-shared" } : undefined} data-transition-product={transitionId} className={`product-photo${detail ? ' product-photo--detail' : ''}`} src={src} alt={title} loading={detail ? 'eager' : 'lazy'} decoding="async" onError={() => setFailedSrc(src)} />
  ) : <div className={`product-photo product-photo--empty${detail ? ' product-photo--detail' : ''}`}><span aria-hidden="true">▧</span><span>Sin fotografía</span></div>;
}
