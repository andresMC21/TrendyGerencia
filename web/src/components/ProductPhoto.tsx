import { useState } from 'react';

export function ProductPhoto({ src, title, detail = false }: { src?: string | null; title: string; detail?: boolean }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  return src && failedSrc !== src ? (
    <img className={`product-photo${detail ? ' product-photo--detail' : ''}`} src={src} alt={title} loading={detail ? 'eager' : 'lazy'} decoding="async" onError={() => setFailedSrc(src)} />
  ) : <div className={`product-photo product-photo--empty${detail ? ' product-photo--detail' : ''}`}><span aria-hidden="true">▧</span><span>Sin fotografía</span></div>;
}
