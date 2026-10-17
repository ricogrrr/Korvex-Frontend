/* Real 3D Mew for the skin preview - same Bedrock geo the in-game renderer
   parses (mods/korvex-legacy/resources/com/korvex/legacy/mew.geo.json),
   rebuilt as a Three.js hierarchy: T(pivot)Â·RÂ·T(-pivot) per bone and per
   cube, classic box-UV quad layout, the procedural 64Ã—32 texture from
   PetRenderer.buildTexture(), and the animFor() idle table. */

import {
  BufferAttribute, BufferGeometry, CanvasTexture, DoubleSide, Group,
  Mesh, MeshLambertMaterial, NearestFilter, SRGBColorSpace,
} from 'three';
import mewGeo from './mewGeometry';

type V3 = [number, number, number];
interface GeoCube {
  origin: V3; size: V3; uv: [number, number];
  inflate?: number; pivot?: V3; rotation?: V3;
}
interface GeoBone {
  name: string; parent?: string; pivot: V3; rotation?: V3; cubes?: GeoCube[];
}
interface Geo {
  'minecraft:geometry': [{
    description: { texture_width: number; texture_height: number };
    bones: GeoBone[];
  }];
}

const geo = (mewGeo as unknown as Geo)['minecraft:geometry'][0];
const TEXW = geo.description.texture_width;
const TEXH = geo.description.texture_height;
const D2R = Math.PI / 180;

/* ---------- procedural 64Ã—32 texture - 1:1 with PetRenderer.buildTexture() ---------- */

function paintMewTexture(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 32;
  const g = c.getContext('2d')!;
  g.fillStyle = '#f7a8c8'; g.fillRect(0, 0, 64, 32);          // Mew pink
  eye(g, 13, 13);                                            // eye_left
  eye(g, 0, 13);                                             // eye_right
  g.clearRect(56, 24, 8, 5);                                 // eyelid_left â†’ open
  g.clearRect(56, 19, 8, 5);                                 // eyelid_right â†’ open
  return c;
}
function eye(g: CanvasRenderingContext2D, u: number, v: number) {
  g.fillStyle = '#7fc4f0'; g.fillRect(u, v, 8, 5);           // eye region
  g.fillStyle = '#9fdcff'; g.fillRect(u + 2, v + 2, 2, 3);   // iris
  g.fillStyle = '#1c3a63'; g.fillRect(u + 2, v + 3, 1, 2);   // pupil
}

/* ---------- cube geometry - same quads + box-UV as PetRenderer.box() ---------- */

const FACE = [
  /* [normal, v0, v1, v2, v3] corners (in [0..1] cube space), uv rect */
  { n: [0, 1, 0],  q: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]] },   // top
  { n: [0, -1, 0], q: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },   // bottom
  { n: [-1, 0, 0], q: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]] },   // west
  { n: [0, 0, -1], q: [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]] },   // north (-z front)
  { n: [1, 0, 0],  q: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]] },   // east
  { n: [0, 0, 1],  q: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] },   // south
] as const;

/* classic box-UV strip: top [u+d,v] bottom [u+d+w,v], sides at v+d: w|n|e|s */
function boxGeometry(c: GeoCube): BufferGeometry {
  const inflate = c.inflate ?? 0;
  const x0 = c.origin[0] - inflate, y0 = c.origin[1] - inflate, z0 = c.origin[2] - inflate;
  const x1 = c.origin[0] + c.size[0] + inflate,
        y1 = c.origin[1] + c.size[1] + inflate,
        z1 = c.origin[2] + c.size[2] + inflate;
  const w = c.size[0], h = c.size[1], d = c.size[2];
  const u = c.uv[0], v = c.uv[1];

  /* per-face uv rects in atlas pixels - matches PetRenderer.box() order */
  const uvRects: Array<[number, number, number, number]> = [
    [u + d, v, u + d + w, v + d],                     // top
    [u + d + w, v, u + d + w + w, v + d],             // bottom
    [u, v + d, u + d, v + d + h],                     // west
    [u + d, v + d, u + d + w, v + d + h],             // north
    [u + d + w, v + d, u + d + w + d, v + d + h],     // east
    [u + d + w + d, v + d, u + d + w + d + w, v + d + h], // south
  ];

  const pos = new Float32Array(24 * 3);
  const nor = new Float32Array(24 * 3);
  const uvs = new Float32Array(24 * 2);
  const idx: number[] = [];
  const lo = [x0, y0, z0], hi = [x1, y1, z1];

  FACE.forEach((f, fi) => {
    f.q.forEach((p, vi) => {
      const i = (fi * 4 + vi) * 3;
      pos[i] = p[0] ? hi[0] : lo[0];
      pos[i + 1] = p[1] ? hi[1] : lo[1];
      pos[i + 2] = p[2] ? hi[2] : lo[2];
      nor[i] = f.n[0]; nor[i + 1] = f.n[1]; nor[i + 2] = f.n[2];
      const r = uvRects[fi];
      /* quad corners map: v0â†’(u0,v0) v1â†’(u1,v0) v2â†’(u1,v1) v3â†’(u0,v1) -
         but GL's south face uv runs (u+d+w+d)â†’+w over x0â†’x1, so per-face
         rect corners follow the same corner order as the positions */
      const j = (fi * 4 + vi) * 2;
      uvs[j] = (vi === 1 || vi === 2 ? r[2] : r[0]) / TEXW;
      uvs[j + 1] = (vi >= 2 ? r[3] : r[1]) / TEXH;
    });
    idx.push(fi * 4, fi * 4 + 1, fi * 4 + 2, fi * 4, fi * 4 + 2, fi * 4 + 3);
  });

  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(pos, 3));
  g.setAttribute('normal', new BufferAttribute(nor, 3));
  g.setAttribute('uv', new BufferAttribute(uvs, 2));
  g.setIndex(idx);
  return g;
}

/* ---------- idle animation - 1:1 port of PetRenderer.animFor() ---------- */

type Anim = [rx: number, ry: number, rz: number, dx: number, dy: number, dz: number];
function animFor(n: string, t: number): Anim {
  let rx = 0, ry = 0, rz = 0, dy = 0;
  if (n.startsWith('tail')) {
    const i = n.length > 4 ? parseInt(n.slice(4)) : 0;
    rx = Math.cos(t * 1.6 + i * 0.5) * 4;
    ry = Math.sin(t * 2.0 + i * 0.55) * 5;
  } else if (n === 'head') {
    ry = Math.sin(t * 0.7) * 4;
    rz = Math.sin(t * 1.3) * 3;
  } else if (n === 'ear_left') {
    rz = Math.sin(t * 2.9) * 4;
  } else if (n === 'ear_right') {
    rz = -Math.sin(t * 2.9) * 4;
  } else if (n === 'arm_left' || n === 'arm_right') {
    rx = Math.sin(t * 1.8 + (n.endsWith('right') ? Math.PI : 0)) * 7;
  } else if (n === 'leg_left' || n === 'leg_right') {
    rx = Math.sin(t * 1.8 + (n.endsWith('right') ? 0 : Math.PI)) * 6;
  } else if (n === 'torso2') {
    dy = Math.sin(t * 2.4) * 0.25; /* breathing */
  }
  return [rx, ry, rz, 0, dy, 0];
}

/* ---------- model assembly ---------- */

interface BoneNode { name: string; pivot: V3; animGroup: Group }

export interface MewModel {
  root: Group;
  update: (t: number) => void;
  dispose: () => void;
}

export function createMewModel(): MewModel {
  const tex = new CanvasTexture(paintMewTexture());
  tex.flipY = false;                  /* v=0 = painted top row, like GL */
  tex.magFilter = tex.minFilter = NearestFilter;
  tex.colorSpace = SRGBColorSpace;
  const mat = new MeshLambertMaterial({
    map: tex,
    side: DoubleSide,                 /* 0-thickness tails - GL_CULL_FACE off */
    alphaTest: 0.4,                   /* eyelid cutout - GL_ALPHA_TEST > 0.4 */
  });

  /* index bones, then wire parent â†’ child */
  const byName = new Map<string, GeoBone>();
  for (const b of geo.bones) byName.set(b.name, b);
  const nodes: BoneNode[] = [];
  const animGroups = new Map<string, Group>();
  const disposables: Array<{ dispose(): void }> = [mat, tex];

  const makeBone = (b: GeoBone): Group => {
    /* anim pivot group: position = pivot + animOffset, rotation = anim */
    const anim = new Group();
    anim.position.set(b.pivot[0], b.pivot[1], b.pivot[2]);
    animGroups.set(b.name, anim);
    nodes.push({ name: b.name, pivot: b.pivot, animGroup: anim });

    /* static rotation - Euler 'ZYX' = GL's RzÂ·RyÂ·Rx order */
    let parent = anim;
    if (b.rotation) {
      const stat = new Group();
      stat.rotation.set(b.rotation[0] * D2R, b.rotation[1] * D2R, b.rotation[2] * D2R, 'ZYX');
      anim.add(stat);
      parent = stat;
    }

    /* T(-pivot) - children + cubes hang here at model coords */
    const neg = new Group();
    neg.position.set(-b.pivot[0], -b.pivot[1], -b.pivot[2]);
    parent.add(neg);

    for (const c of b.cubes ?? []) {
      const cp = c.pivot ?? b.pivot;
      const cubePivot = new Group();
      cubePivot.position.set(cp[0], cp[1], cp[2]);
      if (c.rotation) {
        cubePivot.rotation.set(c.rotation[0] * D2R, c.rotation[1] * D2R, c.rotation[2] * D2R, 'ZYX');
      }
      const inner = new Group();
      inner.position.set(-cp[0], -cp[1], -cp[2]);
      const g = boxGeometry(c);
      disposables.push(g);
      inner.add(new Mesh(g, mat));
      cubePivot.add(inner);
      neg.add(cubePivot);
    }

    for (const child of geo.bones) {
      if (child.parent === b.name) neg.add(makeBone(child));
    }
    return anim;
  };

  const rootBone = geo.bones.find((b) => !b.parent);
  if (!rootBone) throw new Error('mew.geo.json has no root bone');
  const root = makeBone(rootBone);

  return {
    root,
    update(t: number) {
      for (const n of nodes) {
        const a = animFor(n.name, t);
        n.animGroup.position.set(n.pivot[0] + a[3], n.pivot[1] + a[4], n.pivot[2] + a[5]);
        n.animGroup.rotation.set(a[0] * D2R, a[1] * D2R, a[2] * D2R, 'ZYX');
      }
    },
    dispose() {
      for (const d of disposables) d.dispose();
    },
  };
}
