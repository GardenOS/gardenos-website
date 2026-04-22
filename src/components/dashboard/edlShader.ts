import { Vector2 } from "three";

/**
 * Eye-Dome Lighting (EDL) fullscreen pass: darkens pixels where neighbors are closer
 * (depth discontinuities), similar in spirit to CloudCompare / Potree.
 */
export const EDLShader = {
  name: "EDLShader",
  uniforms: {
    tDiffuse: { value: null },
    tDepth: { value: null },
    resolution: { value: new Vector2(1, 1) },
    edlStrength: { value: 0.42 },
    neighborPx: { value: 1.35 },
    depthThreshold: { value: 0.99995 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform sampler2D tDepth;
    uniform vec2 resolution;
    uniform float edlStrength;
    uniform float neighborPx;
    uniform float depthThreshold;
    varying vec2 vUv;

    float sampleDepth(vec2 uv) {
      return texture2D(tDepth, uv).r;
    }

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float depth = sampleDepth(vUv);

      if (depth >= depthThreshold) {
        gl_FragColor = color;
        return;
      }

      vec2 px = neighborPx / resolution;
      float acc = 0.0;

      vec2 o1 = vec2(-1.0, -1.0) * px;
      vec2 o2 = vec2( 0.0, -1.0) * px;
      vec2 o3 = vec2( 1.0, -1.0) * px;
      vec2 o4 = vec2(-1.0,  0.0) * px;
      vec2 o5 = vec2( 1.0,  0.0) * px;
      vec2 o6 = vec2(-1.0,  1.0) * px;
      vec2 o7 = vec2( 0.0,  1.0) * px;
      vec2 o8 = vec2( 1.0,  1.0) * px;

      float d1 = sampleDepth(vUv + o1);
      float d2 = sampleDepth(vUv + o2);
      float d3 = sampleDepth(vUv + o3);
      float d4 = sampleDepth(vUv + o4);
      float d5 = sampleDepth(vUv + o5);
      float d6 = sampleDepth(vUv + o6);
      float d7 = sampleDepth(vUv + o7);
      float d8 = sampleDepth(vUv + o8);

      if (d1 < depth) acc += (depth - d1);
      if (d2 < depth) acc += (depth - d2);
      if (d3 < depth) acc += (depth - d3);
      if (d4 < depth) acc += (depth - d4);
      if (d5 < depth) acc += (depth - d5);
      if (d6 < depth) acc += (depth - d6);
      if (d7 < depth) acc += (depth - d7);
      if (d8 < depth) acc += (depth - d8);

      float shade = clamp(exp(-acc * edlStrength), 0.15, 1.0);
      gl_FragColor = vec4(color.rgb * shade, color.a);
    }
  `,
};
