import * as THREE from "three";

type PositionAttr = { value: ArrayBufferView; size: number };
type ColorAttr = { value: ArrayLike<number>; size: number };

function isPositionAttr(x: unknown): x is PositionAttr {
  if (!x || typeof x !== "object") return false;
  const o = x as PositionAttr;
  return ArrayBuffer.isView(o.value) && typeof o.size === "number" && o.size >= 3;
}

/** Build a centered THREE.BufferGeometry from a loaders.gl LAS mesh. */
export function lasMeshToBufferGeometry(mesh: {
  attributes: Record<string, unknown>;
}): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const posRaw = mesh.attributes.POSITION;
  if (!isPositionAttr(posRaw)) {
    throw new Error("LAS mesh missing POSITION attribute");
  }

  const src = posRaw.value as unknown as ArrayLike<number>;
  const count =
    "length" in src && typeof src.length === "number"
      ? src.length / posRaw.size
      : 0;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const o = i * posRaw.size;
    pos[i * 3] = Number(src[o]);
    pos[i * 3 + 1] = Number(src[o + 1]);
    pos[i * 3 + 2] = Number(src[o + 2]);
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));

  const colorRaw = mesh.attributes.COLOR_0 as ColorAttr | undefined;
  if (
    colorRaw &&
    colorRaw.value instanceof Uint8Array &&
    (colorRaw.size === 3 || colorRaw.size === 4)
  ) {
    const c = colorRaw.value;
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const o = i * colorRaw.size;
      colors[i * 3] = c[o] / 255;
      colors[i * 3 + 1] = c[o + 1] / 255;
      colors[i * 3 + 2] = c[o + 2] / 255;
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  }

  geometry.computeBoundingSphere();
  geometry.center();
  return geometry;
}
