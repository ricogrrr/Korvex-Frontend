import { useEffect, useRef, useState } from 'react';
import * as skinview3d from 'skinview3d';
import { attachPetOrbit } from './petOrbit';

/* Rotating 3D skin preview - texture comes through our own /skin/:uuid proxy;
   sessionserver has no CORS and third-party CDNs are flaky. */
function skinUrl(uuid: string): string {
  return `http://localhost:8787/skin/${uuid.replaceAll('-', '')}`;
}

export function SkinPreview({ uuid, username, width = 200, height = 260, cape, pet }: { uuid: string; username: string; width?: number; height?: number; cape?: string; pet?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<skinview3d.SkinViewer | undefined>(undefined);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    let disposed = false;
    let viewer: skinview3d.SkinViewer | undefined;

    void (async () => {
      if (disposed || !canvasRef.current) return;
      viewer = new skinview3d.SkinViewer({
        canvas: canvasRef.current,
        width,
        height,
        skin: skinUrl(uuid),
        cape,
      });
      viewer.animation = new skinview3d.IdleAnimation();
      viewer.autoRotate = true;
      viewer.autoRotateSpeed = 0.8;
      viewer.fov = 60;
      viewer.zoom = 0.72;
      viewerRef.current = viewer;
    })().catch(() => setFailed(true));

    return () => {
      disposed = true;
      viewerRef.current = undefined;
      viewer?.dispose();
    };
  }, [uuid, width, height]);

  /* pet sprite orbit - attach/detach when the equipped pet changes */
  useEffect(() => {
    const v = viewerRef.current;
    if (!v || !pet) return;
    return attachPetOrbit(v);
  }, [pet, uuid]);

  return (
    <div className="relative flex items-center justify-center overflow-hidden rounded-md bg-base" style={{ width, height }}>
      {failed ? (
        <span className="flex h-14 w-14 items-center justify-center rounded-md bg-accent-subtle text-lg font-semibold text-accent">
          {username.slice(0, 1).toUpperCase()}
        </span>
      ) : (
        <canvas ref={canvasRef} className="h-full w-full" />
      )}
    </div>
  );
}
