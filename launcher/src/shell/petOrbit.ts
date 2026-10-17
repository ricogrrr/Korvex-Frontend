import { Group } from 'three';
import type { SkinViewer } from 'skinview3d';
import { createMewModel } from './mewModel';

/* Real 3D Mew orbiting the skin preview - same Bedrock geo + idle animation
   as the in-game renderer (mewModel.ts), flying around the player model.
   Mirrors the in-game orbit state: position on a circle, yaw facing the
   direction of travel, gentle roll sway. */
const ORBIT_RADIUS = 18;
const ORBIT_SPEED = 0.7;   /* rad/s */
const BOB_SPEED = 1.6;
const BOB_RANGE = 3;
const BASE_HEIGHT = 14;    /* ~chest of a 32-unit player model */
const MODEL_SCALE = 1.0;   /* native geo units ≈ in-game proportions */
const SWAY_DEG = 6;

/**
 * Spawns the Mew model in the viewer's scene and animates its orbit.
 * Returns a detach function - call it on unmount or when the pet changes.
 */
export function attachPetOrbit(viewer: SkinViewer): () => void {
  const pet = new Group();
  const mew = createMewModel();
  mew.root.scale.setScalar(MODEL_SCALE);
  pet.add(mew.root);
  viewer.scene.add(pet);

  let disposed = false;
  let raf = 0;
  const t0 = performance.now();

  const tick = () => {
    if (disposed) return;
    const t = (performance.now() - t0) / 1000;
    const ang = t * ORBIT_SPEED;
    pet.position.set(
      Math.cos(ang) * ORBIT_RADIUS,
      BASE_HEIGHT + Math.sin(t * BOB_SPEED) * BOB_RANGE,
      Math.sin(ang) * ORBIT_RADIUS,
    );
    /* face travel direction - model front is -Z; tangent (-sin a, cos a)
       → yaw = atan2(sin a, -cos a) = π - a; plus gentle roll sway */
    pet.rotation.set(0, Math.PI - ang, Math.sin(t * 1.1) * SWAY_DEG * Math.PI / 180);
    mew.update(t);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
    viewer.scene.remove(pet);
    mew.dispose();
  };
}
