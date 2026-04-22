import type { WebGLRenderer } from "three";
import type { WebGLRenderTarget } from "three";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { EDLShader } from "./edlShader";

export class EdlPass extends ShaderPass {
  constructor() {
    super(EDLShader);
  }

  render(
    renderer: WebGLRenderer,
    writeBuffer: WebGLRenderTarget,
    readBuffer: WebGLRenderTarget,
    deltaTime?: number,
    maskActive?: boolean
  ): void {
    if (readBuffer.depthTexture) {
      this.uniforms.tDepth.value = readBuffer.depthTexture;
    }
    this.uniforms.resolution.value.set(readBuffer.width, readBuffer.height);
    super.render(
      renderer,
      writeBuffer,
      readBuffer,
      deltaTime ?? 0,
      maskActive ?? false
    );
  }
}
