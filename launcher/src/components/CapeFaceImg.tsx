import { useEffect, useState } from 'react';

/* Stable per-load nonce - appends ?t= so the browser can't serve a copy
   cached under an old max-age entry (the pre-remap all-black PNG did this) */
const ASSET_NONCE = Date.now();
export const bustUrl = (url: string): string => `${url}?t=${ASSET_NONCE}`;

/** Renders only the cape's front-face artwork. The atlas face is x 1-11,
    y 1-17 in 64×32 units - we scan that region for the art's real bounding
    box and crop to it, so transparent padding never shows as a dark border. */
export function CapeFaceImg({ src, alt, w = 100, h = 160 }: { src: string; alt: string; w?: number; h?: number }) {
  const [st, setSt] = useState<{ left: number; top: number; width: number; height: number }>();

  useEffect(() => {
    let dead = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const W = img.naturalWidth, H = img.naturalHeight;
      const cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      const ctx = cv.getContext('2d', { willReadFrequently: true });
      if (!ctx || dead) return;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, W, H).data;
      const x0 = Math.floor(W / 64), x1 = Math.ceil((W * 11) / 64);
      const y0 = Math.floor(H / 32), y1 = Math.ceil((H * 17) / 32);
      let bx0 = x1, by0 = y1, bx1 = x0, by1 = y0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          if (data[(y * W + x) * 4 + 3] > 16) {
            if (x < bx0) bx0 = x;
            if (x > bx1) bx1 = x;
            if (y < by0) by0 = y;
            if (y > by1) by1 = y;
          }
        }
      }
      if (dead) return;
      const fw = bx1 > bx0 ? bx1 - bx0 + 1 : x1 - x0;
      const fh = by1 > by0 ? by1 - by0 + 1 : y1 - y0;
      const fx = bx1 > bx0 ? bx0 : x0;
      const fy = by1 > by0 ? by0 : y0;
      const scale = Math.max(w / fw, h / fh); /* cover the box */
      setSt({ left: -fx * scale, top: -fy * scale, width: W * scale, height: H * scale });
    };
    img.src = src;
    return () => { dead = true; };
  }, [src, w, h]);

  return (
    <span className="relative block overflow-hidden rounded-sm border border-border-subtle" style={{ width: w, height: h }}>
      {st && (
        <img
          src={src}
          alt={alt}
          style={{ position: 'absolute', left: st.left, top: st.top, width: st.width, height: st.height, imageRendering: 'pixelated', maxWidth: 'none' }}
        />
      )}
    </span>
  );
}
