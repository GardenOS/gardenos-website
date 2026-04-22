"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  DepthTexture,
  HalfFloatType,
  LinearFilter,
  RGBAFormat,
  UnsignedIntType,
  DepthFormat,
  WebGLRenderTarget,
} from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { EdlPass } from "./EdlPass";

/** Renders the scene through EffectComposer (RenderPass + EDL). `useFrame(..., 1)` disables R3F default render. */
export function LasScanEdlComposer() {
  const { gl, scene, camera, size } = useThree();
  const composerRef = useRef<EffectComposer | null>(null);

  useLayoutEffect(() => {
    const dpr = gl.getPixelRatio();
    const rect = gl.domElement.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width * dpr));
    const h = Math.max(1, Math.floor(rect.height * dpr));

    const depthTexture = new DepthTexture(w, h);
    depthTexture.format = DepthFormat;
    depthTexture.type = UnsignedIntType;

    const rt = new WebGLRenderTarget(w, h, {
      type: HalfFloatType,
      format: RGBAFormat,
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      depthTexture,
    });

    const composer = new EffectComposer(gl, rt);
    composer.setPixelRatio(dpr);
    composer.setSize(size.width, size.height);
    composer.addPass(new RenderPass(scene, camera));
    const edl = new EdlPass();
    edl.needsSwap = false;
    composer.addPass(edl);

    composerRef.current = composer;

    return () => {
      composer.dispose();
      composerRef.current = null;
    };
  }, [gl, scene, camera, size.width, size.height]);

  useEffect(() => {
    const c = composerRef.current;
    if (!c) return;
    c.setSize(size.width, size.height);
    c.setPixelRatio(gl.getPixelRatio());
  }, [size.width, size.height, gl]);

  useFrame(() => {
    const c = composerRef.current;
    if (c) c.render();
  }, 1);

  return null;
}
